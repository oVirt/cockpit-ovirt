import {
    allIntelCpus, allowedIntelCpus, configValues, defaultValueProviderTasks as tasks, defaultInterfaces,
    filteredNetworkInterfaces, playbookOutputPaths as outputPaths, playbookPaths, resourceConstants, status
} from "../../components/HostedEngineSetup/constants"
import PlaybookUtil from './PlaybookUtil'
import { isEmptyObject } from "../HostedEngineSetupUtil";

export class DefaultValueProvider {
    constructor(registeredCallback) {
        this.systemData = null;
        this.networkInterfaces = null;
        this.registeredCallback = registeredCallback;
        this.ready = status.POLLING;

        this.init = this.init.bind(this);
        this.processResults = this.processResults.bind(this);
        this.getSystemData = this.getSystemData.bind(this);
        this.retrieveNetworkInterfaces = this.retrieveNetworkInterfaces.bind(this);
        this.getTaskData = this.getTaskData.bind(this);
        this.getCpuArchitecture = this.getCpuArchitecture.bind(this);
        this.getCpuModel = this.getCpuModel.bind(this);
        this.getMaxMemAvailable = this.getMaxMemAvailable.bind(this);
        this.sufficientMemAvail = this.sufficientMemAvail.bind(this);
        this.getMaxVCpus = this.getMaxVCpus.bind(this);
        this.getApplianceFiles = this.getApplianceFiles.bind(this);
        this.cleanData = this.cleanData.bind(this);
        this.libvirtRunning = this.libvirtRunning.bind(this);
        this.virtSupported = this.virtSupported.bind(this);
        this.getTimeZone = this.getTimeZone.bind(this);
        this.getNetworkInterfaces = this.getNetworkInterfaces.bind(this);
        this.setNetworkInterfaces = this.setNetworkInterfaces.bind(this);
        this.getIpAddress = this.getIpAddress.bind(this);
        this.getIpData = this.getIpData.bind(this);
        this.getFQDN = this.getFQDN.bind(this);

        this.init();
    }

    init() {
        const sysDataProm = this.getSystemData();
        const netIfaceProm = this.retrieveNetworkInterfaces();
        const proms = [sysDataProm, netIfaceProm];

        const successHandler = result => ({ payload: result, resolved: true, task: result.task });
        const catchHandler = error => ({ payload: error.error, resolved: false, task: error.task });

        const self = this;
        Promise.all(proms.map(result => result.then(successHandler).catch(catchHandler)))
            .then(results => {
                self.ready = status.SUCCESS;
                self.registeredCallback(self.processResults(results));
            })
            .catch(error => {
                console.log('Promise.all failed');
                console.log(error);
                self.ready = status.FAILURE;
                self.registeredCallback({});
            });
    }

    processResults(results) {
        const retVal = {};
        results.forEach(
            function(initTask) {
                retVal[initTask.task] = initTask.resolved;
            });
        return retVal;
    }

    getSystemData() {
        const cmd = "ansible-playbook " + configValues.ANSIBLE_PLAYBOOK_PATH;
        const options = { "environ": ["ANSIBLE_STDOUT_CALLBACK=json"] };
        const self = this;

        return new Promise((resolve, reject) => {
            cockpit.spawn(cmd.split(" "), options)
                .done(function(json) {
                    console.log("System data retrieved successfully");
                    let data = self.cleanData(json);
                    self.systemData = JSON.parse(data);
                    resolve({task: tasks.GET_SYSTEM_DATA, error: null});
                })
                .fail(function(error) {
                    console.log("System data retrieval failed");
                    console.log(error);
                    reject({task: tasks.GET_SYSTEM_DATA, error: error});
                });
        });
    }

    cleanData(data) {
        if (!data.startsWith("{")) {
            let idx = data.indexOf("{");
            return data.replace(idx);
        }

        return data;
    }

    retrieveNetworkInterfaces() {
        const playbookUtil = new PlaybookUtil();
        const playbookPath = playbookPaths.GET_NETWORK_INTERFACES;
        const outputPath = outputPaths.GET_NETWORK_INTERFACES;
        const self = this;

        return new Promise((resolve, reject) => {
            playbookUtil.runPlaybook("", playbookPath, "Get network interfaces", outputPath)
                .then(() => playbookUtil.readOutputFile(outputPath))
                .then(output => self.setNetworkInterfaces(output))
                .then(() => {
                    console.log("Network interfaces retrieved successfully");
                    resolve({task: tasks.RETRIEVE_NETWORK_INTERFACES, error: null});
                })
                .catch(error => {
                    console.log("Network interfaces retrieval failed");
                    reject({task: tasks.RETRIEVE_NETWORK_INTERFACES, error: error});
                });
        });
    }

    setNetworkInterfaces(output) {
        return new Promise((resolve, reject) => {
            const playbookUtil = new PlaybookUtil();
            const data = playbookUtil.getResultsData(output);
            const interfaces = data.otopi_host_net.ansible_facts.otopi_host_net;
            const interfacesArray = [];

            if (typeof interfaces !== "undefined" && interfaces.length > 0) {
                interfaces.forEach(function (iface) {
                    interfacesArray.push({key: iface, title: iface});
                });
            } else {
                reject(new Error("Unable to retrieve valid network interfaces data"));
            }

            this.networkInterfaces = interfacesArray;
            resolve();
        })

    }

    getNetworkInterfaces() {
        return this.networkInterfaces;
    }

    getTaskData(taskName) {
        let tasks = this.systemData["plays"][0]["tasks"];
        let data = null;

        tasks.forEach(function (task) {
            if (task["task"]["name"] === taskName) {
                if (task["hosts"].hasOwnProperty("127.0.0.1")) {
                    data = task["hosts"]["127.0.0.1"];
                } else if (task["hosts"].hasOwnProperty("localhost")) {
                    data = task["hosts"]["localhost"];
                }
            }
        });

        return data;
    }

    getTimeZone() {
        let tz = this.getTaskData("Get time zone")["stdout"];
        tz = tz.replace("       Time zone: ", "");
        let idx = tz.indexOf("(");
        return tz.substr(0, idx);
    }

    getCpuArchitecture() {
        const vendorData = this.getTaskData("Get CPU vendor")["stdout"];
        const cpuVendor = vendorData.replace("\<vendor\>", "").replace("\</vendor\>", "").trim();

        const modelData = this.getTaskData("Get CPU model")["stdout"];
        const cpuModelPrefix = "model_";
        const detectedModel = cpuModelPrefix + modelData.replace("\<model\>", "").replace("\</model\>", "").trim();
        let cpuModel = detectedModel;

        if (cpuVendor === "Intel") {
            cpuModel = this.getCpuModel(detectedModel);
        }

        return {
            detectedModel: detectedModel,
            model: cpuModel,
            vendor: cpuVendor
        };
    }

    getCpuModel(detectedCpu) {
        let cpu = allowedIntelCpus[allowedIntelCpus.length - 1];
        let currIdx = allIntelCpus.indexOf(detectedCpu);

        if (currIdx !== -1) {
            for (currIdx; currIdx <= allIntelCpus.length; currIdx++) {
                const currCpu = allIntelCpus[currIdx];
                if (allowedIntelCpus.includes(currCpu)) {
                    cpu = currCpu;
                    break;
                }
            }
        }

        return cpu;
    }

    getMaxMemAvailable() {
        const ansibleFacts = this.getTaskData("Gathering Facts")["ansible_facts"];
        const totalMemMb = ansibleFacts["ansible_memtotal_mb"];
        const availMemMb = ansibleFacts["ansible_memory_mb"]["nocache"]["free"];

        let calc1 = totalMemMb - resourceConstants.VDSM_HOST_OVERHEAD_MB - resourceConstants.VDSM_VM_OVERHEAD_MB;
        let calc2 = availMemMb - resourceConstants.VDSM_VM_OVERHEAD_MB;

        return Math.min(calc1, calc2);
    }

    getMaxVCpus() {
        return this.getTaskData("Gathering Facts")["ansible_facts"]["ansible_processor_vcpus"];
    }

    getApplianceFiles() {
        const appliances = [
            { key: "Manually Select", title: "Manually Select" }
        ];
        const applList = this.getTaskData("Get appliance files")["stdout_lines"];

        if (typeof applList !== 'undefined' && applList.length > 0) {
            applList.forEach(function (appliance) {
                appliances.push({key: appliance, title: appliance});
            });
        }

        return appliances;
    }

    libvirtRunning() {
        return this.getTaskData("Get CPU vendor")["stderr"] === "";
    }

    virtSupported() {
        return this.getTaskData("Get virt support")["stdout"] !== "";
    }

    sufficientMemAvail() {
        const maxAvailMem = this.getMaxMemAvailable();
        const minMemReqd = resourceConstants.VM_MEM_MIN_MB;
        const sufficientMemAvail = maxAvailMem >= minMemReqd;

        if (!sufficientMemAvail) {
            console.log("Insufficient memory available to create HE VM. Available: " + maxAvailMem +
                ", Required: " + minMemReqd);
        }

        return sufficientMemAvail;
    }

    getDefaultInterface() {
        if (typeof this.networkInterfaces !== "undefined" && this.networkInterfaces.length === 1) {
            return this.networkInterfaces[0].key;
        }

        let defaultInterface = "";
        const ipData = this.getIpData();

        if (ipData !== null) {
            defaultInterface = ipData["alias"];
        }

        if (defaultInterface === "" || typeof defaultInterface === "undefined") {
            defaultInterface = this.getNetworkInterfaces()[0];
        }

        return defaultInterface;
    }

    getDefaultGateway() {
        const ipData = this.getIpData();
        return ipData !== null ? ipData["gateway"] : "";
    }

    getIpAddress() {
        const ipData = this.getIpData();
        return ipData !== null ? ipData["address"] : "";
    }

    getIpData() {
        let ipData = null;
        const ansibleFacts = this.getTaskData("Gathering Facts")["ansible_facts"];
        const ipv4Data = ansibleFacts["ansible_default_ipv4"];
        const ipv6Data = ansibleFacts["ansible_default_ipv6"];

        if (!isEmptyObject(ipv4Data)) {
            ipData = ipv4Data;
        } else if (!this.isEmptyObject(ipv6Data)) {
            ipData = ipv6Data;
        }

        return ipData;
    }

    getFQDN() {
        const fqdnData = this.getTaskData("Get FQDN");
        let fqdn = "";
        if (typeof fqdnData !== "undefined") {
            fqdn = fqdnData["stdout"];
        }
        return fqdn;
    }
}

export default DefaultValueProvider;
