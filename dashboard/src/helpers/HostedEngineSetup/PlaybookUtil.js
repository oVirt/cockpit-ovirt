import { ansibleOutputTypes as outputTypes, configValues }
    from "../../components/HostedEngineSetup/constants"
import { generateRandomString, getAnsibleLogPath } from "../HostedEngineSetupUtil"

class PlaybookUtil {
    constructor() {
        this.runPlaybookWithVarFiles = this.runPlaybookWithVarFiles.bind(this);
        this.runPlaybookWithVars = this.runPlaybookWithVars.bind(this);
        this.runPlaybook = this.runPlaybook.bind(this);
        this._runPlaybook = this._runPlaybook.bind(this);
        this.readOutputFile = this.readOutputFile.bind(this);
        this.getResultsData = this.getResultsData.bind(this);
        this.getTimeStamp = this.getTimeStamp.bind(this);
        this.createOutputFileDir = this.createOutputFileDir.bind(this);
        this.getSecurePipe = this.getSecurePipe.bind(this);
    }

    runPlaybook(playbookPath, outputPath, options = "", tags = "", skipTags = "") {
        const self = this;
        return this.createOutputFileDir()
            .then(() => {
                return self._runPlaybook(playbookPath, outputPath, options, tags, skipTags);
            });
    }

    _runPlaybook(playbookPath, outputPath, options = "", tags = "", skipTags = "") {
        const self = this;
        const tag_msg = tags ? " with tags " + tags : "";
        return new Promise((resolve, reject) => {
            console.log(`Execution of ${playbookPath}${tag_msg} started`);

            const settings = [
                "--module-path=/usr/share/ovirt-hosted-engine-setup/ansible",
                "--inventory=localhost,"
            ];
            let cmd = [];
            cmd.push("ansible-playbook");
            cmd.push(playbookPath);
            cmd = (tags.length !== 0) ? cmd.concat(`--tags=${tags}`) : cmd
            cmd = (skipTags.length !== 0) ? cmd.concat(`--skip-tags=${skipTags}`) : cmd
            cmd = (options.length !== 0) ? cmd.concat(options).concat(settings) : cmd.concat(settings);

            const log_name = tags ? tags.split(',')[0] : playbookPath;

            const env = [
                `ANSIBLE_CALLBACK_WHITELIST=${configValues.ANSIBLE_CALLBACK_WHITELIST}`,
                "ANSIBLE_STDOUT_CALLBACK=1_otopi_json",
                `HE_ANSIBLE_LOG_PATH=${getAnsibleLogPath(log_name)}`,
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

            $(this.channel).on("close", function (ev, options) {
                if (!self._manual_close) {
                    if (options["exit-status"] === 0) {
                        console.log(`Execution of ${playbookPath}${tag_msg} completed successfully`);
                        resolve();
                    } else {
                        console.log(options);
                        reject(`Execution of ${playbookPath}${tag_msg} failed`);
                    }
                } else {
                    console.log("Channel closed.");
                    console.log(options);
                    resolve();
                }
            });
        });
    }

    runPlaybookWithVarFiles(playbookPath, outputPath, varFiles, tags = "", skipTags = "", sensitiveData = "") {
        let options = [];

        if (sensitiveData) {
            const pipe = this.getSecurePipe("playbook");
            options = options.concat(["-e", "@" + pipe])
            this.writeSensitiveDataToNamedPipe(pipe, sensitiveData)
        }
        varFiles.forEach((varFile) => {
            options = options.concat(["-e", "@" + varFile]);
        });

        return this.runPlaybook(playbookPath, outputPath, options, tags, skipTags);
    }

    runPlaybookWithVars(playbookPath, outputPath, vars, tags = "", skipTags = "") {
        const varsArr = [];

        Object.getOwnPropertyNames(vars).forEach(
            function (varName) {
                let option = `-e ${varName}=${vars[varName]}`;
                varsArr.push(option);
            }, this);

        let options = [];
        if (varsArr.length !== 0) {
            options = options.concat(varsArr);
        }

        return this.runPlaybook(playbookPath, outputPath, options, tags, skipTags);
    }

    readOutputFile(path) {
        return new Promise((resolve, reject) => {
            cockpit.file(path).read()
                .done(output => {
                    // cockpit.file().read() returns null instead of failing if file can't be read
                    if (output) {
                        resolve(output);
                    } else {
                        console.error("Error: Unable to read file " + path);
                        reject("Unable to read file");
                    }
                })
                .fail(function (error) {
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

        lines.forEach(function (line) {
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
                .done(function () {
                    console.log("Ansible output file directory created successfully.");
                    resolve();
                })
                .fail(function (error) {
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

    getSecurePipe(baseName) {
        const playbookName = baseName.toLowerCase();
        const timeStamp = this.getTimeStamp();
        const pipe = `${configValues.ANSIBLE_OUTPUT_DIR}${playbookName}-${timeStamp}-${generateRandomString()}.pipe`;
        cockpit.spawn(["mkfifo", "-m", "0600", pipe]);
        return pipe;
    }

    writeSensitiveDataToNamedPipe(pipe, sensitiveData) {
        return cockpit.spawn(["/bin/bash", "-c", "cp /dev/stdin " + pipe])
            .input(sensitiveData)
            .done()
            .fail((e) => { console.log(e) })

    }
}

export default PlaybookUtil
