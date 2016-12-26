import React, { Component } from 'react'
import { CONFIG_FILES } from './constants'

class WizardPackageStep extends Component {
    constructor(props) {
        super(props)
        this.state = {
            subscription: props.subscription
        }
        this.handleUpdate = this.handleUpdate.bind(this)
    }
    handleUpdate(property, value) {
        const subscription = this.state.subscription
        subscription[property] = value
        this.setState({ subscription })
    }
    render() {
        return (
            <form className="form-horizontal">
                {CONFIG_FILES.showCDN && <Subscription subscription={this.state.subscription} onUpdate={this.handleUpdate} />}
                <div className="form-group">
                    <label className="col-md-2 control-label">Yum Repos</label>
                    <div className="col-md-6">
                        <input type="text" className="form-control"
                            value={this.state.subscription.repos}
                            onChange={(e) => this.handleUpdate("repos", e.target.value)}
                            />
                    </div>
                </div>
                <div className="form-group">
                    <label className="col-md-2 control-label">Packages</label>
                    <div className="col-md-6">
                        <input type="text" className="form-control"
                            value={this.state.subscription.rpms}
                            onChange={(e) => this.handleUpdate("rpms", e.target.value)}
                            />
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-md-offset-2 col-md-4">
                        <input type="checkbox"
                            checked={this.state.subscription.yumUpdate}
                            onChange={(e) => this.handleUpdate("yumUpdate", e.target.checked)}
                            />
                        <label className="control-label">Yum Update</label>
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-md-offset-2 col-md-2">
                        <input type="checkbox"
                            checked={this.state.subscription.gpgCheck}
                            onChange={(e) => this.handleUpdate("gpgCheck", e.target.checked)}
                            />
                        <label className="control-label">GPG Check</label>
                    </div>
                </div>
            </form>
        )
    }
}
WizardPackageStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    subscription: React.PropTypes.object.isRequired
}

const Subscription = ({subscription, onUpdate}) => {
    return (
        <div>
            <div className="form-group">
                <label className="col-md-2 control-label">CDN Username</label>
                <div className="col-md-6">
                    <input type="text" className="form-control"
                        value={subscription.username}
                        onChange={(e) => onUpdate("username", e.target.value)}
                        />
                </div>
            </div>
            <div className="form-group">
                <label className="col-md-2 control-label">CDN Password</label>
                <div className="col-md-6">
                    <input type="password" className="form-control"
                        value={subscription.password}
                        onChange={(e) => onUpdate("password", e.target.value)}
                        />
                </div>
            </div>
            <div className="form-group">
                <label className="col-md-2 control-label">Pool ID</label>
                <div className="col-md-6">
                    <input type="text" className="form-control"
                        value={subscription.poolId}
                        onChange={(e) => onUpdate("poolId", e.target.value)}
                        />
                </div>
            </div>
        </div>
    )
}

export default WizardPackageStep
