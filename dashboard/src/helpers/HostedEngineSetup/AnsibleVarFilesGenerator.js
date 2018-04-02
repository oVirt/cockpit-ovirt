import { configValues as configValue, ansiblePhases, ansibleVarFilePaths } from "../../components/HostedEngineSetup/constants"

class AnsibleVarFilesGenerator {
    constructor(heSetupModel) {
        this.model = heSetupModel;

        this.checkValue = this.checkValue.bind(this);
        this.formatValue = this.formatValue.bind(this);
        this.getAnswerFileStringForPhase = this.getAnswerFileStringForPhase.bind(this);
        this.writeVarFileForPhase = this.writeVarFileForPhase.bind(this);
        this.writeVarFile = this.writeVarFile.bind(this);
        this.generateRandomString = this.generateRandomString.bind(this);
        this.readAnswerFile = this.readAnswerFile.bind(this);
    }

    checkValue(propName, value) {
        let retVal = value;

        if (propName === "domainType" && value.includes("nfs")) {
            retVal = "nfs";
        }

        if (propName === "nfsVersion" && !this.model.storage.domainType.value.includes("nfs")) {
            retVal = "";
        }

        return retVal;
    }

    formatValue(propName, value) {
        let cleanedValue = this.checkValue(propName, value);

        if (value === "") {
            cleanedValue = "null";
        }

        if (value === "yes" || value === "no") {
            cleanedValue = "\"" + value + "\"";
        }

        return cleanedValue;
    }

    getAnswerFileStringForPhase(phase) {
        let varString = "";
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

                        if (prop.hasOwnProperty("ansibleVarName") && prop.hasOwnProperty("ansiblePhasesUsed")) {
                            if (prop.ansiblePhasesUsed.includes(phase)) {
                                varString += prop.ansibleVarName + separator + self.formatValue(propName, prop.value) + '\n';
                            }
                        }
                    }, this)
            }, this);

        return varString;
    }

    writeVarFileForPhase(phase) {
        const varString = this.getAnswerFileStringForPhase(phase);
        return this.writeVarFile(varString, phase);
    }

    writeVarFile(varString, phase) {
        const filePath = configValue.ANSIBLE_VAR_FILE_PATH_PREFIX + "ansibleVarFile" + this.generateRandomString() + ".var";
        const file = cockpit.file(filePath);

        return new Promise((resolve, reject) => {
            file.replace(varString)
                .done(function () {
                    console.log("Phase " + phase + " variable file successfully created.");
                    resolve(filePath);
                })
                .fail(function (error) {
                    console.log("Problem creating variable file. Error: " + error);
                    reject(error);
                })
                .always(function () {
                    file.close()
                });
        });
    }

    generateRandomString() {
        let str = "";
        const strLength = 6;
        const possChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for(let i = 0; i < strLength; i++) {
            str += possChars.charAt(Math.floor(Math.random() * possChars.length));
        }

        return str;
    }

    readAnswerFile(callback) {
        let result = [];
        let count = 0
        cockpit.file(configValues.ANSWER_FILE_PATH).read()
          .done(function (content, tag){
            if(content != null) {
            var ansFile = content.split("\n")
            ansFile.forEach(function(eachLine, arrIndex){
              count++
              if(eachLine.indexOf("OVEHOSTED_NETWORK/fqdn") != -1){
                result.push(eachLine.split(":")[1])

              }
              if(eachLine.indexOf("OVEHOSTED_ENGINE/adminPassword") != -1){
                result.push(eachLine.split(":")[1])
              }
              if(count == ansFile.length){
                callback(result)
              }
           })
         } else {
           console.log("Failed to read answer file: ", configValues.ANSWER_FILE_PATH);
         }
        })
        .fail(function (error) {
          console.log("error: ",error);
          callback([])
        })
    }
}

export default AnsibleVarFilesGenerator;
