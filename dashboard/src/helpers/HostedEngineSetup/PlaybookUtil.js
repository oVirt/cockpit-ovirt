import { ansibleOutputTypes as outputTypes, configValues }
    from "../../components/HostedEngineSetup/constants"
import { getAnsibleLogPath } from "../HostedEngineSetupUtil"

class PlaybookUtil {
    constructor() {
        this.runPlaybookWithVarFiles = this.runPlaybookWithVarFiles.bind(this);
        this.runPlaybookWithVars = this.runPlaybookWithVars.bind(this);
        this.runPlaybook = this.runPlaybook.bind(this);
        this.readOutputFile = this.readOutputFile.bind(this);
        this.getResultsData = this.getResultsData.bind(this);
    }

    runPlaybook(playbookPath, activityDescription, outputPath, options = "") {
        const self = this;
        return new Promise((resolve, reject) => {
            console.log(activityDescription + " started.");

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
                        console.log(activityDescription + " completed successfully.");
                        resolve();
                    } else {
                        console.log(options);
                        reject(activityDescription + " failed to complete.");
                    }
                } else {
                    console.log("Channel closed.");
                    console.log(options);
                    resolve();
                }
            });
        });
    }

    runPlaybookWithVarFiles(playbookPath, activityDescription, outputPath, varFiles) {
        const varFilesArr = [];

        varFiles.forEach(function(varFile) {
            varFilesArr.push(`@${varFile}`);
        });

        let options = [];
        if (varFilesArr.length !== 0) {
            options.push("-e");
            options = options.concat(varFilesArr);
        }

        return this.runPlaybook(playbookPath, activityDescription, outputPath, options);
    }

    runPlaybookWithVars(playbookPath, activityDescription, outputPath, vars) {
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

        return this.runPlaybook(playbookPath, activityDescription, outputPath, options);
    }

    readOutputFile(path) {
        return new Promise((resolve, reject) => {
            cockpit.file(path).read()
                .done(output => resolve(output))
                .fail(function(error) {
                    console.log("Error: " + error);
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
}

export default PlaybookUtil
