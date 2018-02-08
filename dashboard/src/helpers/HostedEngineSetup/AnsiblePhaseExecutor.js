import {
    ansibleOutputTypes as outputTypes, ansiblePhases as phases, configValues as configValue,
    deploymentStatus as status, playbookOutputPaths as outputPaths, playbookPaths
} from "../../components/HostedEngineSetup/constants";
import AnsibleVarFilesGenerator from "./AnsibleVarFilesGenerator"

class AnsiblePhaseExecutor {
    constructor(abortCallback, heSetupModel) {
        this._outputCallback = null;
        this._exitCallback = null;
        this._manual_close = false;
        this.abortCallback = abortCallback;
        this.heSetupModel = heSetupModel;
        this.result = null;
        this.varFileGenerator = new AnsibleVarFilesGenerator(this.heSetupModel);
        this.varFilePaths = [];
        this.seenOutputLines = []

        this.startSetup = this.startSetup.bind(this);
        this.deleteVarFiles = this.deleteVarFiles.bind(this);
        this.deleteFile = this.deleteFile.bind(this);
        this.performSetupJobs = this.performSetupJobs.bind(this);
        this.createVarFileDir = this.createVarFileDir.bind(this);
        this.readOutputFile = this.readOutputFile.bind(this);
        this.parseOutput = this.parseOutput.bind(this);
        this.processResult = this.processResult.bind(this);
        this.close = this.close.bind(this);
        this.handleOutput = this.handleOutput.bind(this);
    }

    startSetup(phase, outputCallback, exitCallback) {
        this._outputCallback = outputCallback;
        this._exitCallback = exitCallback;

        const self = this;

        switch(phase) {
            case phases.BOOTSTRAP_VM:
                this.performSetupJobs([outputPaths.INITIAL_CLEAN, outputPaths.BOOTSTRAP_VM])
                    .then(() => self.varFileGenerator.writeVarFileForPhase(phases.INITIAL_CLEAN))
                    .then(varFilePath => self.executePlaybook(phases.INITIAL_CLEAN, varFilePath))
                    .then(() => self.varFileGenerator.writeVarFileForPhase(phases.BOOTSTRAP_VM))
                    .then(varFilePath => self.executePlaybook(phase, varFilePath))
                    .then(options => self._exitCallback(options["exit-status"]))
                    .then(() => self.deleteVarFiles())
                    .catch((options, denied) => {
                        self.deleteVarFiles();
                        self._exitCallback(options["exit-status"], denied);
                    });
                break;
            case phases.TARGET_VM:
                self.performSetupJobs([outputPaths.FINAL_CLEAN, outputPaths.TARGET_VM])
                    .then(() => self.varFileGenerator.writeVarFileForPhase(phases.TARGET_VM))
                    .then(varFilePath => self.executePlaybook(phase, varFilePath))
                    .then(() => self.varFileGenerator.writeVarFileForPhase(phases.FINAL_CLEAN))
                    .then(varFilePath => self.executePlaybook(phases.FINAL_CLEAN, varFilePath))
                    .then(options => self._exitCallback(options["exit-status"]))
                    .then(() => self.deleteVarFiles())
                    .catch((options, denied) => {
                        self.deleteVarFiles();
                        self._exitCallback(options["exit-status"], denied);
                    });
                break;
            default:
                self.performSetupJobs([outputPaths[phase]])
                    .then(() => self.varFileGenerator.writeVarFileForPhase(phase))
                    .then(varFilePath => self.executePlaybook(phase, varFilePath))
                    .then(options => self._exitCallback(options["exit-status"]))
                    .then(() => self.deleteVarFiles())
                    .catch((options, denied) => {
                        self.deleteVarFiles();
                        self._exitCallback(options["exit-status"], denied);
                    });
        }
    }

    deleteVarFiles() {
        const proms = [];

        const self = this;
        this.varFilePaths.forEach(function(filePath) {
            proms.push(self.deleteFile(filePath));
        });

        this.varFilePaths = [];
        return Promise.all(proms);
    }

    deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            cockpit.spawn(["rm", "-f", filePath], { "superuser": "require" })
                .done(function() {
                    console.log("File " + filePath + " deleted.");
                    resolve();
                })
                .fail(function(error) {
                    console.log("Problem deleting " + filePath + ". Error: " + error);
                    reject(error);
                })
        });
    }

    performSetupJobs(paths) {
        const promises = [];
        promises.concat(this.clearOutputFiles(paths));
        promises.push(this.createVarFileDir());
        return Promise.all(promises);
    }

    clearOutputFiles(paths) {
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

        return promises;
    }

    createVarFileDir() {
        return new Promise((resolve, reject) => {
            cockpit.spawn(["mkdir", "-p", configValue.ANSIBLE_VAR_FILE_PATH_PREFIX], { "superuser": "require" })
                .done(function() {
                    console.log("Var file directory created successfully.");
                    resolve();
                })
                .fail(function(error) {
                    console.log("There was an error while creating the var file directory. Error: " + error);
                    reject(error);
                })
        });
    }

    getPlaybookCommand(phase, varFilePath) {
        const varFileParam = "@" + varFilePath;
        const playbookParam = playbookPaths[phase];

        let cmd = ['ansible-playbook', '-e', varFileParam, playbookParam,
            '--module-path=/usr/share/ovirt-hosted-engine-setup/ansible',
            '--inventory=localhost'];

        let inv = '--inventory=localhost';
        if (phase === phases.BOOTSTRAP_VM) {
            inv += ',' + this.heSetupModel.network.fqdn.value;
        }

        cmd.push(inv);
        return cmd;
    }

    executePlaybook(phase, varFilePath) {
        this.varFilePaths.push(varFilePath);
        return new Promise((resolve, reject) => {
            const cmd = this.getPlaybookCommand(phase, varFilePath);
            const env = [
                "ANSIBLE_CALLBACK_WHITELIST=1_otopi_json",
                "ANSIBLE_STDOUT_CALLBACK=1_otopi_json",
                "OTOPI_CALLBACK_OF=" + outputPaths[phase]
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
                let accessDenied = options["problem"] === "access-denied";
                if (!self._manual_close) {
                    if (accessDenied) {
                        reject(options, accessDenied);
                    } else if (options["exit-status"] === 0) {
                        console.log("Execution of " + playbookPaths[phase] + " completed successfully.");
                        resolve({options: options, varFilePath: varFilePath});
                    } else {
                        console.log("Execution of " + playbookPaths[phase] + " failed to complete.");
                        reject(options, accessDenied);
                    }
                } else if (options["exit-status"] === 0) {
                    console.log("Execution of " + playbookPaths[phase] + " completed successfully.");
                    self.processResult();
                    resolve({options: options, varFilePath: varFilePath});
                } else {
                    console.log("hosted-engine-setup exited");
                    console.log(ev);
                    console.log(options);
                    reject(options, options["problem"] === "access-denied");
                }
            });

            $(this.channel).on("ready", $.proxy(this.readOutputFile, this, outputPaths[phase]));
        });
    }

    readOutputFile(path) {
        return new Promise((resolve, reject) => {
            let path = "/tmp/out.json";
            const self = this

            const f = cockpit.file(path).watch(function(content, tag) {
                if (!content) {
                    return
                }
                let lines = content.trim().split(/\n/)
                let payload = []
                for (let i = 0; i < lines.length; i++) {
                    if (self.seenOutputLines.indexOf(lines[i]) == -1) {
                        self.seenOutputLines.push(lines[i])
                        payload.push(lines[i])
                    }
                }
                self.parseOutput(payload)
            })
        })
    }

    parseOutput(payload) {
        const returnValue = { info: [], warnings: [], errors: [], debug: [], results: [], lines: [] };
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

    close() {
        console.log("Closing ovirt-hosted-engine-setup");
        this._manual_close = true;
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
