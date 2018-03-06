import { wizardSections as sectNames } from "../../components/HostedEngineSetup/constants";

class ReviewGenerator {
    constructor(model) {
        this.model = model;
        this.getDisplayValue = this.getDisplayValue.bind(this);
        this.generateReviewSections = this.generateReviewSections.bind(this);
        this.getReviewSections = this.getReviewSections.bind(this);
    }

    getDisplayValue(prop) {
        if (prop.name === "cpu") {
            return prop.value.replace("model_", "").trim();
        } else if (prop.name === "firewallManager") {
            return prop.value === "iptables" ? "yes" : "no";
        } else if (prop.name === "cloudinitVMStaticCIDR") {
            return prop.value + "/" + this.model.vm.cloudinitVMStaticCIDRPrefix.value;
        } else if (prop.name === "networkConfigType") {
            return prop.value === "static" ? "Static" : "DHCP";
        } else if (typeof prop.value === "boolean") {
            return prop.value ? "yes" : "no";
        } else {
            return prop.value.toString();
        }
    }

    generateReviewSections() {
        const sections = {};
        sections[sectNames.STORAGE] = {reviewItems: []};
        sections[sectNames.NETWORK] = {reviewItems: []};
        sections[sectNames.VM] = {reviewItems: []};
        sections[sectNames.ENGINE] = {reviewItems: []};

        Object.getOwnPropertyNames(this.model).forEach(
            function(sectionName) {
                let section = this.model[sectionName];
                Object.getOwnPropertyNames(section).forEach(
                    function(propName) {
                        let prop = section[propName];
                        const isAnsibleField = prop.hasOwnProperty("ansibleVarName");
                        const isInvisibleAnsibleField = isAnsibleField && prop.showInReview === false;
                        const isNetworkConfigField = prop.name === "networkConfigType";

                        if ((!isAnsibleField || isInvisibleAnsibleField) && !isNetworkConfigField) {
                            return;
                        }

                        sections[prop.uiStage].reviewItems.push({
                            itemLabel: prop.description,
                            itemValue: this.getDisplayValue(prop),
                            reviewOrder: prop.reviewOrder
                        });
                    }, this)
            }, this);

        Object.getOwnPropertyNames(sections).forEach(
            function(sectionName) {
                const reviewItems = sections[sectionName].reviewItems;
                reviewItems.sort((a, b) => a.reviewOrder - b.reviewOrder);
            }
        );

        return sections;
    }

    getReviewSections(sectionNames) {
        const requestedSections = { steps: [] };
        const sections = this.generateReviewSections();

        Object.getOwnPropertyNames(sections).forEach(
            function(sectionName) {
                if (sectionNames.includes(sectionName)) {
                    const sectionReviewItems = sections[sectionName].reviewItems;
                    const step = {stepName: sectionName, reviewItems: sectionReviewItems};
                    requestedSections.steps.push(step);
                }
            }
        );

        return requestedSections;
    }
}

export default ReviewGenerator;