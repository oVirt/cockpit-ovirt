import { wizardSections as sectNames } from "../../components/HostedEngineSetup/constants";

class PreviewGenerator {
    constructor(model) {
        this.model = model;
        this.getDisplayValue = this.getDisplayValue.bind(this);
        this.generatePreviewSections = this.generatePreviewSections.bind(this);
        this.getPreviewSections = this.getPreviewSections.bind(this);
    }

    getDisplayValue(prop) {
        if (prop.name === "cpu") {
            return prop.value.replace("model_", "").trim();
        } else if (prop.name === "firewallManager") {
            return prop.value === "iptables" ? "yes" : "no";
        } else if (typeof prop.value === "boolean") {
            return prop.value ? "yes" : "no";
        } else {
            return prop.value.toString();
        }
    }

    generatePreviewSections() {
        const sections = {};
        sections[sectNames.STORAGE] = [];
        sections[sectNames.NETWORK] = [];
        sections[sectNames.VM] = [];
        sections[sectNames.ENGINE] = [];

        Object.getOwnPropertyNames(this.model).forEach(
            function(sectionName) {
                let section = this.model[sectionName];
                Object.getOwnPropertyNames(section).forEach(
                    function(propName) {
                        let prop = section[propName];

                        if (!prop.showInReview) {
                            return;
                        }

                        sections[prop.uiStage].push({property: prop.description, value: this.getDisplayValue(prop)});
                    }, this)
            }, this);

        return sections;
    }

    getPreviewSections(sectionNames) {
        const requestedSections = {};
        const sections = this.generatePreviewSections();

        sectionNames.forEach(function(name) {
            if (sections.hasOwnProperty(name)) {
                requestedSections[name] = sections[name];
            }
        });

        return requestedSections;
    }
}

export default PreviewGenerator;