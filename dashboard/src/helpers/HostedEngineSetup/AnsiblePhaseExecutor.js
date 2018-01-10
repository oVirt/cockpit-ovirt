import { ansibleVarFilePaths, deploymentStatus as status, playbookPaths } from "../../components/HostedEngineSetup/constants";
import AnsibleVarFilesGenerator from "./AnsibleVarFilesGenerator"

class AnsiblePhaseExecutor {
    constructor(abortCallback, heSetupModel, phase) {
        this._outputCallback = null;
        this._exitCallback = null;
        this._manual_close = false;
        this.abortCallback = abortCallback;
        this.heSetupModel = heSetupModel;
        this.phase = phase;

        this.generateVarFiles = this.generateVarFiles.bind(this);
        this.startSetup = this.startSetup.bind(this);
    }

    startSetup(outputCallback, exitCallback) {
        this._outputCallback = outputCallback;
        this._exitCallback = exitCallback;

        const self = this;
        this.generateVarFiles()
            .then(function() {
                self.execute();
            });
    }

    execute() {
        const varFileParam = "\"@" + ansibleVarFilePaths[this.phase] + "\"";
        const playbookParam = playbookPaths[this.phase];

        let cmd = ['ansible-playbook', '-e', varFileParam, playbookParam,
            '--module-path=/usr/share/ovirt-hosted-engine-setup/ansible',
            '--inventory=localhost'];

        console.log(cmd);

        this.channel = cockpit.channel({
            "payload": "stream",
            "environ": [
                "TERM=xterm-256color",
                "PATH=/sbin:/bin:/usr/sbin:/usr/bin"
            ],
            "spawn": cmd,
            "pty": true,
            "err": "out",
            "superuser": "require",
        });

        let self = this;
        $(this.channel).on("close", function(ev, options) {
            let denied = false;
            if (!self._manual_close) {
                if (options["problem"] === "access-denied") {
                    denied = true
                }
                self._exitCallback(options["exit-status"], denied)
            }
            console.log("hosted-engine-setup exited");
            console.log(ev);
            console.log(options);
        });
        $(this.channel).on("message", $.proxy(this.handleOutput, this));
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
