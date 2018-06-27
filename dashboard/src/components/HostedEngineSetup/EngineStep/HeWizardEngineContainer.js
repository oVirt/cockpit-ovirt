import PropTypes from 'prop-types';
import React, { Component } from 'react'
import { getErrorMsgForProperty, validatePropsForUiStage } from '../Validation'
import { messages } from '../constants'
import HeWizardEngine from './HeWizardEngine'

class HeWizardEngineContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            heSetupModel: props.heSetupModel,
            errorMsg: "",
            errorMsgs: {}
        };

        this.handleRecipientAddressDelete = this.handleRecipientAddressDelete.bind(this);
        this.handleRecipientAddressUpdate = this.handleRecipientAddressUpdate.bind(this);
        this.handleAdminPortalPwdUpdate = this.handleAdminPortalPwdUpdate.bind(this);
        this.handleEngineConfigUpdate = this.handleEngineConfigUpdate.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateAllInputs = this.validateAllInputs.bind(this);
    }

    handleRecipientAddressDelete(index) {
        const addresses = this.state.heSetupModel.notifications.destEmail.value;
        addresses.splice(index, 1);
        this.setState({ addresses, errorMsgs: {} });
    }

    handleRecipientAddressUpdate(index, address) {
        const addresses = this.state.heSetupModel.notifications.destEmail.value;
        addresses[index] = address;
        const errorMsgs= this.state.errorMsgs;
        this.setState({ addresses, errorMsgs });
    }

    handleAdminPortalPwdUpdate(pwd) {
        const config = this.state.heSetupModel.engine;
        config.adminPassword.value = pwd;
        this.setState({ config });
    }

    handleEngineConfigUpdate(propName, value, configType) {
        const heSetupModel = this.state.heSetupModel;

        heSetupModel[configType][propName].value = value;

        if (propName === "adminPassword") {
            heSetupModel.engine.adminPassword.useInAnswerFile = value !== "";
        }

        this.validateConfigUpdate(propName, heSetupModel[configType]);
        this.setState({ heSetupModel });
    }

    validateConfigUpdate(propName, config) {
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
        let propsAreValid = validatePropsForUiStage("Engine", this.props.heSetupModel, errorMsgs);

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
            <HeWizardEngine
                deploymentType={this.props.deploymentType}
                heSetupModel={this.state.heSetupModel}
                errorMsg={this.state.errorMsg}
                errorMsgs={this.state.errorMsgs}
                handleEngineConfigUpdate={this.handleEngineConfigUpdate}
                handleRecipientAddressUpdate={this.handleRecipientAddressUpdate}
                handleRecipientAddressDelete={this.handleRecipientAddressDelete}
                handleAdminPortalPwdUpdate={this.handleAdminPortalPwdUpdate} />
        )
    }
}

HeWizardEngineContainer.propTypes = {
    stepName: PropTypes.string.isRequired,
    heSetupModel: PropTypes.object.isRequired,
    deploymentType: PropTypes.string.isRequired
};

export default HeWizardEngineContainer