import React from 'react'
import Selectbox from '../../common/Selectbox'
import { status as gwState } from '../constants'
import { getClassNames } from '../../../helpers/HostedEngineSetupUtil'

const HeWizardNetwork = ({deploymentType, errorMsg, errorMsgs, gatewayState, interfaces, networkConfig,
                             handleNetworkConfigUpdate}) => {
    const gatewayPingPending = gatewayState === gwState.POLLING;

    return (
        <div>
            <form className="form-horizontal he-form-container">
                {errorMsg &&
                <div className="row" style={{marginLeft: "40px"}}>
                    <div className="alert alert-danger col-sm-8">
                        <span className="pficon pficon-error-circle-o" />
                        <strong>{errorMsg}</strong>
                    </div>
                </div>
                }

                <div className="form-group">
                    <label className="col-md-3 control-label">Bridge Interface</label>
                    <div className="col-md-6">
                        <div style={{width: "120px"}}>
                            <Selectbox optionList={interfaces}
                                       selectedOption={networkConfig.bridgeIf.value}
                                       callBack={(e) => handleNetworkConfigUpdate("bridgeIf", e)}
                            />
                        </div>
                    </div>
                </div>

                <div className={getClassNames("bridgeName", errorMsgs)}>
                    <label className="col-md-3 control-label">Bridge Name</label>
                    <div className="col-md-6">
                        <input type="text" style={{width: "110px"}}
                               title="Enter the bridge name."
                               className="form-control"
                               value={networkConfig.bridgeName.value}
                               onChange={(e) => handleNetworkConfigUpdate("bridgeName", e.target.value)}
                        />
                        {errorMsgs.bridgeName && <span className="help-block">{errorMsgs.bridgeName}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label className="col-md-3 control-label">Configure iptables</label>
                    <div className="col-md-5">
                        <input type="checkbox"
                               checked={networkConfig.firewallManager.value === "iptables"}
                               onChange={(e) => handleNetworkConfigUpdate("firewallManager", e.target.checked)}
                        />
                    </div>
                </div>

                <div className={getClassNames("gateway", errorMsgs)}>
                    <label className="col-md-3 control-label">Gateway Address</label>
                    <div className="col-md-6">
                        <input type="text" style={{width: "110px"}}
                               title="Enter a pingable gateway address."
                               className="form-control"
                               value={networkConfig.gateway.value}
                               onChange={(e) => handleNetworkConfigUpdate("gateway", e.target.value)}
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
};

export default HeWizardNetwork;