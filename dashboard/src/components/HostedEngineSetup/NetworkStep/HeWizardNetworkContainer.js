import React, { Component } from 'react'
import { getTaskData, pingGateway, isEmptyObject } from '../../../helpers/HostedEngineSetupUtil'
import { validatePropsForUiStage, getErrorMsgForProperty } from '../Validation'
import { messages, gatewayValidationState as gwState } from '../constants'
import HeWizardNetwork from './HeWizardNetwork'

export const defaultInterfaces = [
    { key: "None Found", title: "None Found" }
];

class HeWizardNetworkContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            networkConfig: props.heSetupModel.network,
            errorMsg: "",
            errorMsgs: {},
            gatewayState: gwState.EMPTY,
            interfaces: defaultInterfaces
        };

        this.setDefaultValues = this.setDefaultValues.bind(this);
        this.handleNetworkConfigUpdate = this.handleNetworkConfigUpdate.bind(this);
        this.checkGatewayPingability = this.checkGatewayPingability.bind(this);
    }

    componentWillMount() {
        this.setDefaultValues();
    }

    checkGatewayPingability(address) {
        let errorMsg = this.state.errorMsg;
        errorMsg = "";

        let errorMsgs = this.state.errorMsgs;
        errorMsgs.gateway = "";

        let gatewayState = this.state.gatewayState;
        gatewayState = gwState.POLLING;

        this.setState({ gatewayState, errorMsg, errorMsgs });

        let self = this;
        pingGateway(address)
            .done(function() {
                gatewayState = gwState.SUCCESS;
                self.setState({ errorMsg, gatewayState });
            })
            .fail(function() {
                errorMsg = messages.GENERAL_ERROR_MSG;
                errorMsgs.gateway = messages.IP_NOT_PINGABLE;
                gatewayState = gwState.FAILED;
                self.setState({ errorMsg, errorMsgs, gatewayState });
            });
    }

    setDefaultValues() {
        if (this.props.systemData === null) {
            return;
        }

        let systemData = getTaskData(this.props.systemData, "Gathering Facts");
        this.setInterfaces(systemData);

        const ipv4Data = systemData["ansible_facts"]["ansible_default_ipv4"];

        if (!isEmptyObject(ipv4Data)) {
            this.setDefaultInterface(ipv4Data, systemData);
            this.setGateway(ipv4Data);
        } else {
            const ipv6Data = systemData["ansible_facts"]["ansible_default_ipv6"];
            if (!isEmptyObject(ipv6Data)) {
                this.setDefaultInterface(ipv6Data, systemData);
                this.setGateway(ipv6Data);
            } else {
                this.setDefaultInterface("", systemData);
            }
        }
    }

    setInterfaces(ansibleData) {
        let interfaces = defaultInterfaces;

        const ansibleInterfaces = ansibleData["ansible_facts"]["ansible_interfaces"];

        if (typeof ansibleInterfaces !== "undefined" && ansibleInterfaces.length > 0) {
            let ifaceObjectsArray = [];
            ansibleInterfaces.forEach(function (iface) {
                ifaceObjectsArray.push({key: iface, title: iface});
            });

            interfaces = ifaceObjectsArray;
        }

        this.setState({ interfaces });
    }

    setDefaultInterface(defaultIpData, systemData) {
        let defaultInterface = defaultIpData["alias"];

        if (defaultInterface === "" || defaultInterface === "undefined") {
            const ansibleInterfaces = systemData["ansible_facts"]["ansible_interfaces"];
            defaultInterface = ansibleInterfaces[0];
        }

        this.handleNetworkConfigUpdate("bridgeName", defaultInterface);
    }

    setGateway(defaultIpData) {
        const gateway = defaultIpData["gateway"];
        this.handleNetworkConfigUpdate("gateway", gateway);
    }

    handleNetworkConfigUpdate(property, value) {
        const networkConfig = this.state.networkConfig;
        networkConfig[property].value = value;
        this.setState({ networkConfig });
        this.validateConfigUpdate(property, networkConfig);
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

        if (propName === "gateway" && propErrorMsg === "") {
            this.checkGatewayPingability(prop.value);
        }

        this.setState({ errorMsg, errorMsgs });
    }

    validateAllInputs() {
        let errorMsg = "";
        let errorMsgs = {};
        let propsAreValid = validatePropsForUiStage("Network", this.props.heSetupModel, errorMsgs) ||
            this.state.gatewayState === gwState.FAILED;

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
        return <HeWizardNetwork
                errorMsg={this.state.errorMsg}
                errorMsgs={this.state.errorMsgs}
                gatewayState={this.state.gatewayState}
                interfaces={this.state.interfaces}
                networkConfig={this.state.networkConfig}
                handleNetworkConfigUpdate={this.handleNetworkConfigUpdate}
                />
    }
}

HeWizardNetworkContainer.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heSetupModel: React.PropTypes.object.isRequired
};

export default HeWizardNetworkContainer