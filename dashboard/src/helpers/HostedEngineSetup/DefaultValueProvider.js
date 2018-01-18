import { allIntelCpus, allowedIntelCpus, configValues, defaultInterfaces, filteredNetworkInterfaces,
         resourceConstants, status } from "../../components/HostedEngineSetup/constants"

export class DefaultValueProvider {
    constructor(registeredCallback) {
        this.systemData = null;
        this.registeredCallback = registeredCallback;
        this.ready = status.POLLING;

        this.getSystemData = this.getSystemData.bind(this);
        this.getTaskData = this.getTaskData.bind(this);
        this.getCpuArchitecture = this.getCpuArchitecture.bind(this);
        this.getCpuModel = this.getCpuModel.bind(this);
        this.getMaxMemAvailable = this.getMaxMemAvailable.bind(this);
        this.sufficientMemAvail = this.sufficientMemAvail.bind(this);
        this.getMaxVCpus = this.getMaxVCpus.bind(this);
        this.getApplianceFiles = this.getApplianceFiles.bind(this);
        this.cleanData = this.cleanData.bind(this);
        this.virtSupported = this.virtSupported.bind(this);
        this.getTimeZone = this.getTimeZone.bind(this);
        this.getNetworkInterfaces = this.getNetworkInterfaces.bind(this);
        this.getIpAddress = this.getIpAddress.bind(this);
        this.getIpData = this.getIpData.bind(this);
        this.getFQDN = this.getFQDN.bind(this);
        this.isEmptyObject = this.isEmptyObject.bind(this);

        this.getSystemData();
    }

    getSystemData() {
        const cmd = "ansible-playbook " + configValues.ANSIBLE_PLAYBOOK_PATH;
        const options = { "environ": ["ANSIBLE_STDOUT_CALLBACK=json"] };
        const self = this;

        cockpit.spawn(cmd.split(" "), options)
            .done(function(json) {
                let data = self.cleanData(json);
                self.systemData = JSON.parse(data);
                self.ready = status.SUCCESS;
                self.registeredCallback(true);
            })
            .fail(function(error) {
                console.log(error);
                self.ready = status.FAILURE;
                self.registeredCallback(false);
            });
    }

    cleanData(data) {
        if (!data.startsWith("{")) {
            let idx = data.indexOf("{");
            return data.replace(idx);
        }

        return data;
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

    getNetworkInterfaces() {
        let interfaces = defaultInterfaces;

        const ansibleInterfaces = this.getTaskData("Gathering Facts")["ansible_facts"]["ansible_interfaces"];

        if (typeof ansibleInterfaces !== "undefined" && ansibleInterfaces.length > 0) {
            const filteredInterfaces = ansibleInterfaces.filter(iface => !filteredNetworkInterfaces.includes(iface));
            const interfacesArray = [];
            filteredInterfaces.forEach(function (iface) {
                interfacesArray.push({key: iface, title: iface});
            });

            interfaces = interfacesArray;
        }

        return interfaces;
    }

    getDefaultInterface() {
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

        if (!this.isEmptyObject(ipv4Data)) {
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

    isEmptyObject(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }
}

export default DefaultValueProvider;