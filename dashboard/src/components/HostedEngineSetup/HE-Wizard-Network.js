import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import { AnsibleUtil, pingGateway, isEmptyObject, getClassNames } from '../../helpers/HostedEngineSetupUtil'
import { validatePropsForUiStage, getErrorMsgForProperty } from './Validation'
import { messages, gatewayValidationState as gwState } from './constants'

const interfaces = [
    { key: "loopback", title: "loopback" }
];

class WizardHostNetworkStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            networkConfig: props.heSetupModel.network,
            errorMsg: "",
            errorMsgs: {},
            gatewayState: gwState.EMPTY,
            interfaces: interfaces
        };

        this.ansible = new AnsibleUtil();
        this.setDefaultValues = this.setDefaultValues.bind(this);
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

        let systemData = this.ansible.getTaskData(this.props.systemData, "Gathering Facts");
        this.setInterfaces(systemData);

        const ipv4Data = systemData["ansible_facts"]["ansible_default_ipv4"];

        if (!isEmptyObject(ipv4Data)) {
            this.setDefaultInterface(ipv4Data);
            this.setGateway(ipv4Data);
        } else {
            const ipv6Data = systemData["ansible_facts"]["ansible_default_ipv6"];
            if (!isEmptyObject(ipv6Data)) {
                this.setDefaultInterface(ipv6Data);
                this.setGateway(ipv6Data);
            } else {
                this.setDefaultInterface("");
            }
        }
    }

    setInterfaces(ansibleData) {
        let interfaces = [{ key: "None Found", title: "None Found" }];

        const ansibleInterfaces = ansibleData["ansible_facts"]["ansible_interfaces"];

        if (typeof ansibleInterfaces !== 'undefined' && ansibleInterfaces.length > 0) {
            let ifaceObjectsArray = [];
            ansibleInterfaces.forEach(function (iface) {
                ifaceObjectsArray.push({key: iface, title: iface});
            });

            interfaces = ifaceObjectsArray;
        }

        this.setState({ interfaces });
    }

    setDefaultInterface(defaultIpData) {
        const defaultInterface = defaultIpData["alias"];
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

        debugger;
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
        const errorMsgs = this.state.errorMsgs;
        const gatewayPingPending = this.state.gatewayState === gwState.POLLING;

        return (
            <div>
                <form className="form-horizontal he-form-container">
                    {this.state.errorMsg &&
                        <div className="row" style={{marginLeft: "40px"}}>
                            <div className="alert alert-danger col-sm-8">
                                <span className="pficon pficon-error-circle-o" />
                                <strong>{this.state.errorMsg}</strong>
                            </div>
                        </div>
                    }

                    <div className="form-group">
                        <label className="col-md-3 control-label">Bridge Interface</label>
                        <div className="col-md-6">
                            <div style={{width: "120px"}}>
                                <Selectbox optionList={this.state.interfaces}
                                           selectedOption={this.state.networkConfig.bridgeName.value}
                                           callBack={(e) => this.handleNetworkConfigUpdate("bridgeName", e)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                            <label className="col-md-3 control-label">Firewall</label>
                            <div className="col-md-5">
                                <input type="checkbox"
                                       checked={this.state.networkConfig.firewallManager.value}
                                       onChange={(e) => this.handleNetworkConfigUpdate("firewallManager", e.target.checked)}
                                />
                                <label className="control-label he-input-label">Configure IPTables</label>
                            </div>
                    </div>

                    <div className={getClassNames("gateway", errorMsgs)}>
                        <label className="col-md-3 control-label">Gateway Address</label>
                        <div className="col-md-6">
                            <input type="text" style={{width: "110px"}}
                                   title="Enter a pingable gateway address."
                                   className="form-control"
                                   value={this.state.networkConfig.gateway.value}
                                   onChange={(e) => this.handleNetworkConfigUpdate("gateway", e.target.value)}
                                   // onBlur={(e) => this.checkGatewayPingability(e.target.value)}
                            />
                            {errorMsgs.gateway && <span className="help-block">{errorMsgs.gateway}</span>}
                            {gatewayPingPending &&
                                <div className="gateway-message-container">
                                    <span><div className="spinner" /></span>
                                    <span className="gateway-message">Verifying IP address...</span>
                                </div>
                            }
                        </div>
                    </div>
                </form>


            </div>
        )
    }
}

WizardHostNetworkStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    heSetupModel: React.PropTypes.object.isRequired
};

export default WizardHostNetworkStep