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
        this.handleEngineConfigUpdate = this.handleEngineConfigUpdate.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateAdminPasswordMatch = this.validateAdminPasswordMatch.bind(this);
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

    handleEngineConfigUpdate(propName, value, configType) {
        const heSetupModel = this.state.heSetupModel;

        heSetupModel[configType][propName].value = value;

        if (propName === "adminPassword") {
            if (value === "") {
                heSetupModel.engine.adminPassword.useInAnswerFile = false;
                heSetupModel.engine.confirmAdminPortalPassword.value = "";
            } else {
                heSetupModel.engine.adminPassword.useInAnswerFile = true;
            }
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

        if (propName === "confirmAdminPortalPassword") {
            this.validateAdminPasswordMatch(errorMsgs);
        }

        this.setState({ errorMsg, errorMsgs });
    }

    validateAdminPasswordMatch(errorMsgs) {
        const engineConfig = this.state.heSetupModel.engine;
        let passwordsMatch = engineConfig.adminPassword.value === engineConfig.confirmAdminPortalPassword.value;

        if (!passwordsMatch) {
            errorMsgs.confirmAdminPortalPassword = messages.PASSWORD_MISMATCH;
        }

        return passwordsMatch;
    }

    validateAllInputs() {
        let errorMsg = "";
        let errorMsgs = {};
        let propsAreValid = validatePropsForUiStage("Engine", this.props.heSetupModel, errorMsgs);
        let passwordsMatch = this.validateAdminPasswordMatch(errorMsgs);

        if (!propsAreValid || !passwordsMatch) {
            errorMsg = messages.GENERAL_ERROR_MSG;
        }

        this.setState({ errorMsg, errorMsgs });
        return propsAreValid && passwordsMatch;
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
                heSetupModel={this.state.heSetupModel}
                errorMsg={this.state.errorMsg}
                errorMsgs={this.state.errorMsgs}
                handleEngineConfigUpdate={this.handleEngineConfigUpdate}
                handleRecipientAddressUpdate={this.handleRecipientAddressUpdate}
                handleRecipientAddressDelete={this.handleRecipientAddressDelete}
            />
        )
    }
}

HeWizardEngineContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heSetupModel: React.PropTypes.object.isRequired
};

export default HeWizardEngineContainer