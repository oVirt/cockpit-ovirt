import React, { Component } from 'react'
import { getErrorMsgForProperty, validatePropsForUiStage } from "../Validation";
import {deploymentTypes, messages, status} from '../constants';
import HeWizardStorage from './HeWizardStorage'
import IscsiUtil from '../../../helpers/HostedEngineSetup/IscsiUtil'

const nfsAnsFileFields = ["storageDomainConnection", "storageDomain"];

const requiredNfsFields = nfsAnsFileFields;

const iscsiAnsFileFields = [
    "iSCSIPortalUser", "iSCSIPortalIPAddress", "iSCSIPortalPassword", "iSCSIPortalPort",
    "iSCSITargetName", "LunID"
];

const requiredIscsiFieldsBase = ["iSCSIPortalIPAddress", "iSCSIPortalPort"];

const glusterAnsFileFields = ["storageDomainConnection"];

const requiredGlusterFields = glusterAnsFileFields;

const glusterAndNfsAnsFileFields = ["storageDomainConnection", "mntOptions"];

const fieldProps = ["showInReview", "useInAnswerFile"];

class HeWizardStorageContainer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            model: props.model,
            heSetupModel: props.model.model,
            iscsiLunData: null,
            iscsiTargetData: null,
            selectedIscsiTarget: "",
            selectedLun: "",
            targetRetrievalStatus: status.EMPTY,
            lunRetrievalStatus: status.EMPTY,
            storageConfig: props.model.model.storage,
            errorMsg: "",
            errorMsgs: {},
            collapsibleSections: {
                advanced: true
            }
        };

        this.iscsiUtil = new IscsiUtil(props.model.model);

        this.handleStorageConfigUpdate = this.handleStorageConfigUpdate.bind(this);
        this.setStorageTypeDisplaySettings = this.setStorageTypeDisplaySettings.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateAllInputs = this.validateAllInputs.bind(this);
        this.getIscsiTargetList = this.getIscsiTargetList.bind(this);
        this.getIscsiLunList = this.getIscsiLunList.bind(this);
        this.handleTargetSelection = this.handleTargetSelection.bind(this);
        this.handleLunSelection = this.handleLunSelection.bind(this);
        this.handleCollapsibleSectionChange = this.handleCollapsibleSectionChange.bind(this);
    }

    componentWillMount() {
        this.setStorageTypeDisplaySettings(this.state.heSetupModel.storage.domainType.value);
    }

    handleStorageConfigUpdate(propName, value) {
        const storageConfig = this.state.storageConfig;
        storageConfig[propName].value = value;

        if (propName === "storageDomainConnection") {
            const storageConn = value.split(":");
            storageConfig.storageAddress.value = storageConn[0];
            storageConfig.storagePath.value = storageConn[1];
            storageConfig.storage.value = value;
        }

        if (propName === "iSCSIPortalIPAddress") {
            storageConfig.storageAddress.value = value;
        }

        this.setState({ storageConfig });

        if (propName === "domainType") {
            this.setStorageTypeDisplaySettings(value);
        } else {
            this.validateConfigUpdate(propName);
        }
    }

    setStorageTypeDisplaySettings(storageType) {
        const model = this.state.model;

        let isNfs = storageType.includes("nfs");
        let isIscsi = storageType === "iscsi";
        let isGluster = storageType === "glusterfs";

        let requiredIscsiFields = requiredIscsiFieldsBase;
        if (this.props.deploymentType === deploymentTypes.OTOPI_DEPLOYMENT) {
            const otopiIscsiFields = ["iSCSITargetName", "LunID"];
            requiredIscsiFields.concat(otopiIscsiFields);
        }

        model.setBooleanValues(nfsAnsFileFields, fieldProps, isNfs);
        model.setBooleanValues(requiredNfsFields, ["required"], isNfs);
        model.model.storage.nfsVersion.showInReview = isNfs;

        model.setBooleanValues(iscsiAnsFileFields, fieldProps, isIscsi);
        model.setBooleanValues(requiredIscsiFields, ["required"], isIscsi);

        model.setBooleanValues(glusterAnsFileFields, fieldProps, isGluster);
        model.setBooleanValues(requiredGlusterFields, ["required"], isGluster);

        model.setBooleanValues(glusterAndNfsAnsFileFields, fieldProps, isNfs || isGluster);

        this.setState({ model });
    }

    validateConfigUpdate(propName) {
        const config = this.state.storageConfig;
        let errorMsg = this.state.errorMsg;
        const errorMsgs = {};
        const prop = config[propName];
        const propErrorMsg = getErrorMsgForProperty(prop);

        if (propErrorMsg !== "") {
            errorMsgs[propName] = propErrorMsg;
        } else {
            errorMsg = "";
        }

        this.setState({ errorMsg, errorMsgs });
    }

    handleCollapsibleSectionChange(sectionName) {
        const sections = this.state.collapsibleSections;
        sections[sectionName] = !sections[sectionName];
        this.setState(sections);
    }

    validateAllInputs() {
        let errorMsg = "";
        let errorMsgs = {};
        let propsAreValid = validatePropsForUiStage("Storage", this.state.heSetupModel, errorMsgs);

        if (!propsAreValid) {
            errorMsg = messages.GENERAL_ERROR_MSG;
        }

        this.setState({ errorMsg, errorMsgs });
        return propsAreValid;
    }

    getIscsiTargetList() {
        this.setState({ targetRetrievalStatus: status.POLLING,
           lunRetrievalStatus: status.EMPTY });
        const self = this;
        this.iscsiUtil.getTargetList()
            .then(targetData => self.setState({ targetRetrievalStatus: status.SUCCESS, iscsiTargetData: targetData }))
            .catch(error => {
                console.log("Error: " + error);
                self.setState({ targetRetrievalStatus: status.FAILURE });
            });
    }

    handleTargetSelection(target) {
        this.setState({ selectedIscsiTarget: target });
        const config = this.state.storageConfig;
        config.iSCSITargetName.value = target;
        this.setState({ config });
        this.getIscsiLunList();
    }

    getIscsiLunList() {
        this.setState({ lunRetrievalStatus: status.POLLING });
        const self = this;
        this.iscsiUtil.getLunList()
            .then(lunData => self.setState({ lunRetrievalStatus: status.SUCCESS, iscsiLunData: lunData }))
            .catch(error => {
                console.log("Error: " + error);
                self.setState({ lunRetrievalStatus: status.FAILURE });
            });
    }

    handleLunSelection(lunId) {
        this.setState({ selectedLun: lunId });
        const config = this.state.storageConfig;
        config.LunID.value = lunId;
        this.setState({ config });
    }


    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validateAllInputs())
        }
        return true;
    }

    render() {
        return (
            <HeWizardStorage
                collapsibleSections={this.state.collapsibleSections}
                deploymentType={this.props.deploymentType}
                errorMsg={this.state.errorMsg}
                errorMsgs={this.state.errorMsgs}
                handleCollapsibleSectionChange={this.handleCollapsibleSectionChange}
                handleIscsiTargetRequest={this.getIscsiTargetList}
                handleLunSelection={this.handleLunSelection}
                handleTargetSelection={this.handleTargetSelection}
                handleStorageConfigUpdate={this.handleStorageConfigUpdate}
                iscsiLunData={this.state.iscsiLunData}
                iscsiTargetData={this.state.iscsiTargetData}
                lunRetrievalStatus={this.state.lunRetrievalStatus}
                selectedLun={this.state.selectedLun}
                selectedIscsiTarget={this.state.selectedIscsiTarget}
                storageConfig={this.state.storageConfig}
                targetRetrievalStatus={this.state.targetRetrievalStatus} />
        )
    }
}

HeWizardStorageContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    model: React.PropTypes.object.isRequired,
    deploymentType: React.PropTypes.string.isRequired
};

export default HeWizardStorageContainer
