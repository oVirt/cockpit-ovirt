import { ansibleOutputTypes as outputTypes, configValues }
    from "../../components/HostedEngineSetup/constants"
import { getAnsibleLogPath } from "../HostedEngineSetupUtil"

class PlaybookUtil {
    constructor() {
        this.runPlaybook = this.runPlaybook.bind(this);
        this.readOutputFile = this.readOutputFile.bind(this);
        this.getResultsData = this.getResultsData.bind(this);
    }

    runPlaybook(varFilePath, playbookPath, activityDescription, outputPath) {
        const self = this;
        return new Promise((resolve, reject) => {
            console.log(activityDescription + " started.");
            let cmd = [];
            cmd.push("ansible-playbook");
            if (varFilePath !== "") {
                cmd.push("-e");
                cmd.push("@" + varFilePath);
            }
            cmd = cmd.concat([
                playbookPath,
                "--module-path=/usr/share/ovirt-hosted-engine-setup/ansible",
                "--inventory=localhost"
            ]);

            const env = [
                `${configValues.ANSIBLE_CALLBACK_WHITELIST}`,
                `ANSIBLE_CALLBACK_WHITELIST=${configValues.ANSIBLE_CALLBACK_WHITELIST}`,
                "HE_ANSIBLE_LOG_PATH=" + getAnsibleLogPath(playbookPath),
                "ANSIBLE_STDOUT_CALLBACK=1_otopi_json",
                "OTOPI_CALLBACK_OF=" + outputPath
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
