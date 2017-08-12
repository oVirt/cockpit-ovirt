import React, { Component } from 'react'
import Selectbox from '../common/Selectbox'
import { pingGateway } from '../../helpers/HostedEngineSetupUtil'
import { AnsibleUtil } from '../../helpers/HostedEngineSetupUtil'

class WizardHostNetworkStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            networkConfig: props.heSetupModel.network,
            errorMsg: "",
            errorMsgs: {},
            interfaces: []
        };

        this.ansible = new AnsibleUtil();
        this.setDefaultValues = this.setDefaultValues.bind(this);
    }

    componentWillMount() {
        this.setDefaultValues();
    }

    checkGatewayPingability(address) {
        pingGateway(address);
    }

    setDefaultValues() {
        if (this.props.systemData !== null) {
            let data = this.ansible.getTaskData(this.props.systemData, "Gathering Facts");
            this.setInterfaces(data);
            this.setGateway(data);
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

        this.handleNetworkConfigUpdate("bridgeName", interfaces[0].key);

        this.setState({ interfaces });
    }

    setGateway(ansibleData) {
        let gateway = "";
        const ipv4Data = ansibleData["ansible_facts"]["ansible_default_ipv4"];

        if (ipv4Data.hasOwnProperty("gateway")) {
            gateway = ipv4Data["gateway"];
        } else {
            const ipv6Data = ansibleData["ansible_facts"]["ansible_default_ipv6"];
            if (ipv6Data.hasOwnProperty("gateway")) {
                gateway = ipv6Data["gateway"];
            }
        }

        this.handleNetworkConfigUpdate("gateway", gateway);
    }

    handleNetworkConfigUpdate(property, value) {
        const networkConfig = this.state.networkConfig;
        networkConfig[property].value = value;
        const errorMsgs= this.state.errorMsgs;
        this.setState({ networkConfig, errorMsgs });
    }

    validate() {
        return true
    }

    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validate())
        }

        return true;
    }

    render() {
        return (
            <div>
                {this.state.errorMsg && <div className="alert alert-danger">
                    <span className="pficon pficon-error-circle-o"></span>
                    <strong>{this.state.errorMsg}</strong>
                </div>
                }
                <form className="form-horizontal he-form-container">
                    <div className="form-group">
                        <label className="col-md-3 control-label">Bridge Interface</label>
                        <div className="col-md-2">
                            <Selectbox optionList={this.state.interfaces}
                                       selectedOption={this.state.networkConfig.bridgeName.value}
                                       callBack={(e) => this.handleNetworkConfigUpdate("bridgeName", e)}
                            />
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

                    <div className="form-group">
                        <label className="col-md-3 control-label">Gateway Address</label>
                        <div className="col-md-3">
                            <input type="text"
                                   title="Enter a pingable gateway address."
                                   className="form-control"
                                   value={this.state.networkConfig.gateway.value}
                                   onChange={(e) => this.handleNetworkConfigUpdate("gateway", e.target.value)}
                                   onBlur={(e) => this.checkGatewayPingability(e.target.value)}
                            />
                            {this.errorMsg && this.errorMsg.length > 0 && <span className="help-block">{this.errorMsg}</span>}
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