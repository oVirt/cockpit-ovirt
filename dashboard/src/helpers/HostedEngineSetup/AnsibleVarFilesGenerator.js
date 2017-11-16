import { configValues } from "../../components/HostedEngineSetup/constants"

class AnsibleVarFilesGenerator {
    constructor(heSetupModel) {
        this.model = heSetupModel;

        this.getAnswerFileStrings = this.getAnswerFileStrings.bind(this);
        this.addLineToVarStrings = this.addLineToVarStrings.bind(this);
        this.writeVarFiles = this.writeVarFiles.bind(this);
    }

    getAnswerFileStrings() {
        const varStrings = ["", "", ""];
        const separator = ": ";
        const sectionNames = Object.getOwnPropertyNames(this.model);

        let self = this;
        sectionNames.forEach(
            function(sectionName) {
                let section = this.model[sectionName];
                let propNames = Object.getOwnPropertyNames(section);

                propNames.forEach(
                    function(propName) {
                        const prop = section[propName];

                        if (prop.hasOwnProperty("ansibleVarName")) {
                            const varLine = prop.ansibleVarName + separator + prop.value + '\n';
                            self.addLineToVarStrings(varLine, varStrings, prop.ansiblePhasesUsed);

                        }
                    }, this)
            }, this);

        return varStrings;
    }

    addLineToVarStrings(varLine, varStrings, phasesUsed) {
        phasesUsed.forEach(
            function(phase) {
                varStrings[phase - 1] += varLine;
            }
        )
    }

    writeVarFiles() {
        const varStrings = this.getAnswerFileStrings();

        const filePaths = [
            configValues.ANSIBLE_PHASE_1_VAR_FILE_PATH,
            configValues.ANSIBLE_PHASE_2_VAR_FILE_PATH,
            configValues.ANSIBLE_PHASE_3_VAR_FILE_PATH
        ];

        let promises = [];

        for (let phase = 1; phase <= 3; phase++) {
            const filePath = filePaths[phase - 1];
            const file = cockpit.file(filePath);
            const varString = varStrings[phase - 1];

            promises.push(file.replace(varString)
                .done(function() {
                    console.log("Phase " + phase + " variable file successfully written to " + filePath);
                })
                .fail(function(error) {
                    console.log("Problem writing variable file file. " + error);
                })
                .always(function() {
                    file.close()
                })
            );
        }

        return Promise.all(promises);
    }
}

export default AnsibleVarFilesGenerator;