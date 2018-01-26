import {
    ansibleOutputTypes as outputTypes, ansiblePhases as phases, ansibleVarFilePaths,
    deploymentStatus as status, playbookOutputPaths as outputPaths, playbookPaths
} from "../../components/HostedEngineSetup/constants";
import AnsibleVarFilesGenerator from "./AnsibleVarFilesGenerator"

class AnsiblePhaseExecutor {
    constructor(abortCallback, heSetupModel, phase) {
        this._outputCallback = null;
        this._exitCallback = null;
        this._manual_close = false;
        this.abortCallback = abortCallback;
        this.heSetupModel = heSetupModel;
        this.phase = phase;
        this.result = null;

        this.generateVarFiles = this.generateVarFiles.bind(this);
        this.startSetup = this.startSetup.bind(this);
        this.runInitialClean = this.runInitialClean.bind(this);
        this.runFinalClean = this.runFinalClean.bind(this);
        this.readOutputFile = this.readOutputFile.bind(this);
        this.parseOutput = this.parseOutput.bind(this);
        this.processResult = this.processResult.bind(this);
    }

    startSetup(outputCallback, exitCallback) {
        this._outputCallback = outputCallback;
        this._exitCallback = exitCallback;

        const self = this;
        const cmd  = this.getPlaybookCommand();

        switch(this.phase) {
            case phases.BOOTSTRAP_VM:
                this.generateVarFiles()
                    .then(() => self.deleteOutputFiles([outputPaths.INITIAL_CLEAN, outputPaths.BOOTSTRAP_VM]))
                    .then(() => self.runInitialClean())
                    .then(() => self.executePlaybook(cmd))
                    .then((options) => self._exitCallback(options["exit-status"]))
                    .catch((options, denied) => self._exitCallback(options["exit-status"], denied));
                break;
            case phases.TARGET_VM:
                this.generateVarFiles()
                    .then(() => self.deleteOutputFiles([outputPaths.FINAL_CLEAN, outputPaths.TARGET_VM]))
                    .then(() => self.executePlaybook(cmd))
                    .then(() => self.runFinalClean())
                    .then((options) => self._exitCallback(options["exit-status"]))
                    .catch((options, denied) => self._exitCallback(options["exit-status"], denied));
                break;
            default:
                this.generateVarFiles()
                    .then(() => self.deleteOutputFiles([outputPaths[this.phase]]))
                    .then(() => self.executePlaybook(cmd))
                    .then((options) => self._exitCallback(options["exit-status"]))
                    .catch((options, denied) => self._exitCallback(options["exit-status"], denied));
        }
    }

    deleteOutputFiles(paths) {
        let promises = [];

        paths.forEach(function(filePath) {
            const file = cockpit.file(filePath);

            promises.push(file.replace(" ")
                .done(function() {
                    console.log("File " + filePath + " cleared.");
                })
                .fail(function(error) {
                    console.log("Problem clearing " + filePath + ". Error: " + error);
                })
                .always(function() {
                    file.close()
                })
            );
        });

        return Promise.all(promises);
    }

    runInitialClean() {
        return new Promise((resolve, reject) => {
            const cmd = "ansible-playbook -e @" + ansibleVarFilePaths.BOOTSTRAP_VM + " " +
                "/usr/share/ovirt-hosted-engine-setup/ansible/initial_clean.yml " +
                "--module-path=/usr/share/ovirt-hosted-engine-setup/ansible --inventory=localhost";

            const env = [
                "ANSIBLE_CALLBACK_WHITELIST=1_otopi_json",
                "ANSIBLE_STDOUT_CALLBACK=1_otopi_json",
                "OTOPI_CALLBACK_OF=" + outputPaths[phases.INITIAL_CLEAN]
            ];

            this.channel = cockpit.channel({
                "payload": "stream",
                "environ": [
                    "TERM=xterm-256color",
                    "PATH=/sbin:/bin:/usr/sbin:/usr/bin"
                ].concat(env),
                "spawn": cmd.split(" "),
                "pty": true,
                "err": "out",
                "superuser": "require",
            });

            const self = this;
            $(this.channel).on("close", function(ev, options) {
                let denied = false;
                if (!self._manual_close) {
                    if (options["problem"] === "access-denied") {
                        denied = true;
                        reject(options, denied);
                    } else if (options["exit-status"] === 0) {
                        console.log("Execution of " + playbookPaths[phases.INITIAL_CLEAN] + " completed successfully.");
                        resolve();
                    } else {
                        console.log("Execution of " + playbookPaths[phases.INITIAL_CLEAN] + " failed to complete.");
                        reject(options, denied);
                    }
                }
            });

            $(this.channel).on("ready", $.proxy(this.readOutputFile, this, outputPaths[phases.INITIAL_CLEAN]));
        })
    }

    runFinalClean() {
        return new Promise((resolve, reject) => {
            const cmd = "ansible-playbook -e @" + ansibleVarFilePaths.BOOTSTRAP_VM + " " +
                "/usr/share/ovirt-hosted-engine-setup/ansible/final_clean.yml " +
                "--module-path=/usr/share/ovirt-hosted-engine-setup/ansible --inventory=localhost";

            const env = [
                "ANSIBLE_CALLBACK_WHITELIST=1_otopi_json",
                "ANSIBLE_STDOUT_CALLBACK=1_otopi_json",
                "OTOPI_CALLBACK_OF=" + outputPaths[phases.FINAL_CLEAN]
            ];

            this.channel = cockpit.channel({
                "payload": "stream",
                "environ": [
                    "TERM=xterm-256color",
                    "PATH=/sbin:/bin:/usr/sbin:/usr/bin"
                ].concat(env),
                "spawn": cmd.split(" "),
                "pty": true,
                "err": "out",
                "superuser": "require",
            });

            const self = this;
            $(this.channel).on("close", function(ev, options) {
                let denied = false;
                if (!self._manual_close) {
                    if (options["problem"] === "access-denied") {
                        denied = true;
                        reject(options, denied);
                    } else if (options["exit-status"] === 0) {
                        console.log("Execution of " + playbookPaths[phases.FINAL_CLEAN] + " completed successfully.");
                        resolve();
                    } else {
                        console.log("Execution of " + playbookPaths[phases.FINAL_CLEAN] + " failed to complete.");
                        reject(options, denied);
                    }
                }
            });

            $(this.channel).on("ready", $.proxy(this.readOutputFile, this, outputPaths[phases.FINAL_CLEAN]));
        })
    }

    getPlaybookCommand() {
        const varFileParam = "@" + ansibleVarFilePaths[this.phase];
        const playbookParam = playbookPaths[this.phase];

        let cmd = ['ansible-playbook', '-e', varFileParam, playbookParam,
            '--module-path=/usr/share/ovirt-hosted-engine-setup/ansible',
            '--inventory=localhost'];

        let inv = '--inventory=localhost';
        if (this.phase === phases.BOOTSTRAP_VM) {
            inv += ',' + this.heSetupModel.network.fqdn.value;
        }

        cmd.push(inv);
        return cmd;
    }

    executePlaybook(cmd) {
        return new Promise((resolve, reject) => {
            const env = [
                "ANSIBLE_CALLBACK_WHITELIST=1_otopi_json",
                "ANSIBLE_STDOUT_CALLBACK=1_otopi_json",
                "OTOPI_CALLBACK_OF=" + outputPaths[this.phase]
            ];

            this.channel = cockpit.channel({
                "payload": "stream",
                "environ": [
                    "TERM=xterm-256color",
                    "PATH=/sbin:/bin:/usr/sbin:/usr/bin"
                ].concat(env),
                "spawn": cmd,
                "pty": true,
                "err": "out",
                "superuser": "require",
            });

            const self = this;
            $(this.channel).on("close", function (ev, options) {
                let denied = false;
                if (!self._manual_close) {
                    if (options["problem"] === "access-denied") {
                        denied = true;
                        reject(options, denied);
                    } else if (options["exit-status"] === 0) {
                        console.log("Execution of " + playbookPaths[self.phase] + " completed successfully.");
                        resolve();
                    } else {
                        console.log("Execution of " + playbookPaths[self.phase] + " failed to complete.");
                        reject(options, denied);
                    }
                }
                self.processResult();
                console.log("hosted-engine-setup exited");
                console.log(ev);
                console.log(options);
            });

            $(this.channel).on("ready", $.proxy(this.readOutputFile, this, outputPaths[this.phase]));
        });
    }

    readOutputFile(path) {
        console.log("Path: " + path);
        return new Promise((resolve, reject) => {
            const cmd = "tail -f " + path;
            console.log("cmd: " + cmd);

            this.channel = cockpit.channel({
                "payload": "stream",
                "environ": [
                    "TERM=xterm-256color",
                    "PATH=/sbin:/bin:/usr/sbin:/usr/bin"
                ],
                "spawn": cmd.split(" "),
                "pty": true,
                "err": "out",
                "superuser": "require",
            });

            const self = this;
            $(this.channel).on("close", function(ev, options) {
                if (!self._manual_close) {
                    if (options["exit-status"] === 0) {
                        console.log("Read of " + path + " completed successfully.");
                        resolve();
                    } else {
                        console.log(options);
                        reject("Read of " + path + " failed to complete.");
                    }
                }
            });

            $(this.channel).on("message", $.proxy(this.parseOutput, this));
        })
    }

    parseOutput(ev, payload) {
        const returnValue = { info: [], warnings: [], errors: [], debug: [], results: [], lines: [] };
        payload = payload.trim().split(/\n/);
        const self = this;

        payload.forEach(function(line) {
            try {
                const ln = JSON.parse(line);
                const type = ln["OVEHOSTED_AC/type"];
                const data = ln["OVEHOSTED_AC/body"];

                switch (type) {
                    case outputTypes.INFO:
                        returnValue.lines.push(line);
                        returnValue.info.push(data);
                        break;
                    case outputTypes.WARNING:
                        returnValue.lines.push(line);
                        returnValue.warnings.push(data);
                        break;
                    case outputTypes.ERROR:
                        returnValue.lines.push(line);
                        returnValue.errors.push(data);
                        break;
                    case outputTypes.DEBUG:
                        returnValue.debug.push(data);
                        break;
                    case outputTypes.RESULT:
                        self.result = data;
                        returnValue.results.push(data);
                        break;
                    default:
                        break;
                }
            } catch (e) {
                console.log("Error in Ansible JSON output. Error: " + e);
            }

        });

        this._outputCallback(returnValue);
    }

    processResult() {
        if (this.result === null || typeof this.result === "undefined") {
            return;
        }

        if (this.result.hasOwnProperty("otopi_localvm_dir")) {
            if (this.result["otopi_localvm_dir"].hasOwnProperty("path")) {
                this.heSetupModel.core.localVmDir.value = this.result["otopi_localvm_dir"].path;
            }
        }
    }

    generateVarFiles() {
        const varFileGenerator = new AnsibleVarFilesGenerator(this.heSetupModel);
        return varFileGenerator.writeVarFiles();
    }

    close() {
        console.log("Closing ovirt-hosted-engine-setup");
        this.manual_close = true;
        if (this.channel.valid) {
            this.channel.close()
        }
        this.abortCallback()
    }

    handleOutput(ev, payload) {
        const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
        const returnValue = { lines: [], terminated: false, status: status.RUNNING };

        payload = payload.replace(ansiRegex, ""); // Remove ANSI color codes
        payload = payload.trim().split(/\n/);

        payload.forEach(function(line) {
            returnValue.lines.push(line);
        });

        this._outputCallback(returnValue);
    }
}

export default AnsiblePhaseExecutor
