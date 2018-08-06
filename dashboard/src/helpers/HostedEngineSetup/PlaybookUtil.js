import { ansibleOutputTypes as outputTypes, configValues }
    from "../../components/HostedEngineSetup/constants"
import {generateRandomString, getAnsibleLogPath} from "../HostedEngineSetupUtil"

class PlaybookUtil {
    constructor() {
        this.runPlaybookWithVarFiles = this.runPlaybookWithVarFiles.bind(this);
        this.runPlaybookWithVars = this.runPlaybookWithVars.bind(this);
        this.runPlaybook = this.runPlaybook.bind(this);
        this._runPlaybook = this._runPlaybook.bind(this);
        this.runPlaybookWithVarFiles = this.runPlaybookWithVarFiles.bind(this);
        this.runPlaybookWithVars = this.runPlaybookWithVars.bind(this);
        this.readOutputFile = this.readOutputFile.bind(this);
        this.getResultsData = this.getResultsData.bind(this);
        this.getTimeStamp = this.getTimeStamp.bind(this);
        this.createOutputFileDir = this.createOutputFileDir.bind(this);
    }

    runPlaybook(playbookPath, outputPath, options = "") {
        const self = this;
        return this.createOutputFileDir()
            .then(() => {
                return self._runPlaybook(playbookPath, outputPath, options);
            });
    }

    _runPlaybook(playbookPath, outputPath, options = "") {
        const self = this;
        return new Promise((resolve, reject) => {
            console.log(`Execution of ${playbookPath} started`);

            const settings = [
                "--module-path=/usr/share/ovirt-hosted-engine-setup/ansible",
                "--inventory=localhost,"
            ];
            let cmd = [];
            cmd.push("ansible-playbook");
            cmd.push(playbookPath);
            cmd = (options.length !== 0) ? cmd.concat(options).concat(settings) : cmd.concat(settings);

            const env = [
                `ANSIBLE_CALLBACK_WHITELIST=${configValues.ANSIBLE_CALLBACK_WHITELIST}`,
                "ANSIBLE_STDOUT_CALLBACK=1_otopi_json",
                `HE_ANSIBLE_LOG_PATH=${getAnsibleLogPath(playbookPath)}`,
                `OTOPI_CALLBACK_OF=${outputPath}`
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

            $(this.channel).on("close", function(ev, options) {
                if (!self._manual_close) {
                    if (options["exit-status"] === 0) {
                        console.log(`Execution of ${playbookPath} completed successfully`);
                        resolve();
                    } else {
                        console.log(options);
                        reject(`Execution of ${playbookPath} failed`);
                    }
                } else {
                    console.log("Channel closed.");
                    console.log(options);
                    resolve();
                }
            });
        });
    }

    runPlaybookWithVarFiles(playbookPath, outputPath, varFiles) {
        const varFilesArr = [];

        varFiles.forEach(function(varFile) {
            varFilesArr.push(`@${varFile}`);
        });

        let options = [];
        if (varFilesArr.length !== 0) {
            options.push("-e");
            options = options.concat(varFilesArr);
        }

        return this.runPlaybook(playbookPath, outputPath, options);
    }

    runPlaybookWithVars(playbookPath, outputPath, vars) {
        const varsArr = [];

        Object.getOwnPropertyNames(vars).forEach(
            function(varName) {
                let option = `${varName}=${vars[varName]}`;
                varsArr.push(option);
            }, this);

        let options = [];
        if (varsArr.length !== 0) {
            options.push("-e");
            options = options.concat(varsArr);
        }

        return this.runPlaybook(playbookPath, outputPath, options);
    }

    readOutputFile(path) {
        return new Promise((resolve, reject) => {
            cockpit.file(path).read()
                .done(output => {
                    // cockpit.file().read() returns null instead of failing if file can't be read
                    if (output) {
                        resolve(output);
                    } else {
                        console.error(`Error: Unable to read file ${path}`);
                        reject("Unable to read file");
                    }
                })
                .fail(function(error) {
                    console.error("Error: " + error);
                    reject(error);
                });
        });
    }

    getResultsData(fileContents) {
        let lines = fileContents.split('\n');
        // Filter blank lines
        lines = lines.filter(n => n);
        let results = null;

        lines.forEach(function(line) {
            try {
                const json = JSON.parse(line);
                if (json["OVEHOSTED_AC/type"] === outputTypes.RESULT) {
                    results = json["OVEHOSTED_AC/body"];
                }
            } catch (error) {
                console.log(error);
            }
        });
        return results;
    }

    createOutputFileDir() {
        return new Promise((resolve, reject) => {
            cockpit.spawn(["mkdir", "-p", configValues.ANSIBLE_OUTPUT_DIR], { "superuser": "require" })
                .done(function() {
                    console.log("Ansible output file directory created successfully.");
                    resolve();
                })
                .fail(function(error) {
                    console.log("There was an error while creating the ansible output file directory. Error: " + error);
                    reject(error);
                })
        });
    }

    getAnsibleOutputPath(playbookType) {
        const playbookName = playbookType.toLowerCase();
        const timeStamp = this.getTimeStamp();
        return `${configValues.ANSIBLE_OUTPUT_DIR}${playbookName}-${timeStamp}-${generateRandomString()}.json`;
    }

    getTimeStamp() {
        const d = new Date();
        return [
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            d.getHours(),
            d.getMinutes(),
            d.getSeconds()
        ].join("");
    }
}

export default PlaybookUtil
