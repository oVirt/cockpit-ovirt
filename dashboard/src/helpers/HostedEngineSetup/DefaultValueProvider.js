import { configValues, defaultInterfaces, resourceConstants, status } from "../../components/HostedEngineSetup/constants"

export class DefaultValueProvider {
    constructor(registeredCallback) {
        this.systemData = null;
        this.registeredCallback = registeredCallback;
        this.ready = status.POLLING;

        this.getSystemData = this.getSystemData.bind(this);
        this.getTaskData = this.getTaskData.bind(this);
        this.getCpuArchitecture = this.getCpuArchitecture.bind(this);
        this.getMaxMemAvailable = this.getMaxMemAvailable.bind(this);
        this.getMaxVCpus = this.getMaxVCpus.bind(this);
        this.getApplianceFiles = this.getApplianceFiles.bind(this);
        this.cleanData = this.cleanData.bind(this);
        this.virtSupported = this.virtSupported.bind(this);
        this.getTimeZone = this.getTimeZone.bind(this);
        this.getNetworkInterfaces = this.getNetworkInterfaces.bind(this);
        this.getIpData = this.getIpData.bind(this);
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
                self.registeredCallback(status.SUCCESS);
            })
            .fail(function(error) {
                console.log(error);
                self.ready = status.FAILURE;
                self.registeredCallback(status.FAILURE);
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
        const modelData = this.getTaskData("Get CPU model")["stdout"];
        const cpuModelPrefix = "model_";
        const cpuModel = cpuModelPrefix + modelData.replace("\<model\>", "").replace("\</model\>", "").trim();

        const vendorData = this.getTaskData("Get CPU vendor")["stdout"];
        const cpuVendor = vendorData.replace("\<vendor\>", "").replace("\</vendor\>", "").trim();

        return {
            model: cpuModel,
            vendor: cpuVendor
        };
    }

    getMaxMemAvailable() {
        const ansibleFacts = this.getTaskData("Gathering Facts")["ansible_facts"];
        let totalMemMb = ansibleFacts["ansible_memtotal_mb"];
        let availMemMb = ansibleFacts["ansible_memfree_mb"];

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

    getNetworkInterfaces() {
        let interfaces = defaultInterfaces;

        const ansibleInterfaces = this.getTaskData("Gathering Facts")["ansible_facts"]["ansible_interfaces"];

        if (typeof ansibleInterfaces !== "undefined" && ansibleInterfaces.length > 0) {
            const interfacesArray = [];
            ansibleInterfaces.forEach(function (iface) {
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
        return ipData !== null ? this.getIpData()["gateway"] : "";
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

    isEmptyObject(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }
}

export default DefaultValueProvider;