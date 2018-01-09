import React, { Component } from 'react'
import { getErrorMsgForProperty, validatePropsForUiStage } from "../Validation";
import { messages } from '../constants';
import HeWizardStorage from './HeWizardStorage'

const nfsAnsFileFields = ["storageDomainConnection", "storageDomain"];

const requiredNfsFields = nfsAnsFileFields;

const iscsiAnsFileFields = [
    "iSCSIPortalUser", "iSCSIPortalIPAddress", "iSCSIPortalPassword", "iSCSIPortalPort",
    "iSCSITargetName", "LunID"
];

const requiredIscsiFields = [
    "iSCSIPortalIPAddress", "iSCSIPortalPort",
    "iSCSITargetName", "LunID"
];

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
            storageConfig: props.model.model.storage,
            errorMsg: "",
            errorMsgs: {}
        };

        this.handleStorageConfigUpdate = this.handleStorageConfigUpdate.bind(this);
        this.setStorageTypeDisplaySettings = this.setStorageTypeDisplaySettings.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateAllInputs = this.validateAllInputs.bind(this);
    }

    componentWillMount() {
        this.setStorageTypeDisplaySettings(this.state.heSetupModel.storage.domainType.value);
    }

    handleStorageConfigUpdate(propName, value) {
        const storageConfig = this.state.storageConfig;
        storageConfig[propName].value = value;
        this.setState({ storageConfig });

        if (propName === "domainType") {
            this.setStorageTypeDisplaySettings(value);
        } else {
            this.validateConfigUpdate(propName);
        }
    }

    setStorageTypeDisplaySettings(storageType) {
        const model = this.state.model;

        let isNfs = storageType === "nfs3" || storageType === "nfs4";
        let isIscsi = storageType === "iscsi";
        let isGluster = storageType === "glusterfs";

        model.setBooleanValues(nfsAnsFileFields, fieldProps, isNfs);
        model.setBooleanValues(requiredNfsFields, ["required"], isNfs);

        model.setBooleanValues(iscsiAnsFileFields, fieldProps, isIscsi);
        model.setBooleanValues(requiredIscsiFields, ["required"], isIscsi);

        model.setBooleanValues(glusterAnsFileFields, fieldProps, isGluster);
        model.setBooleanValues(requiredGlusterFields, ["required"], isGluster);

        model.setBooleanValues(glusterAndNfsAnsFileFields, fieldProps, isNfs || isGluster);
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

    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validateAllInputs())
        }
        return true;
    }

    render() {
        return (
            <HeWizardStorage
                deploymentType={this.props.deploymentType}
                errorMsg={this.state.errorMsg}
                errorMsgs={this.state.errorMsgs}
                handleStorageConfigUpdate={this.handleStorageConfigUpdate}
                storageConfig={this.state.storageConfig}/>
        )
    }
}

HeWizardStorageContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    model: React.PropTypes.object.isRequired,
    deploymentType: React.PropTypes.string.isRequired
};

export default HeWizardStorageContainer