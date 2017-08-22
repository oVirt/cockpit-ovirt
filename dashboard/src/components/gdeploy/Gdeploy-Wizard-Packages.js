import React, { Component } from 'react'
import GdeployUtil from '../../helpers/GdeployUtil'

class WizardPackageStep extends Component {
    constructor(props) {
        super(props)
        this.state = {
            subscription: props.subscription,
            isRhelSystem: false
        }
        this.handleUpdate = this.handleUpdate.bind(this)
    }
    componentDidMount() {
        const that = this
        GdeployUtil.isRhelSystem(function (isAvailable) {
            that.setState({ isRhelSystem: isAvailable })
        })
    }
    handleUpdate(property, value) {
        const subscription = this.state.subscription
        subscription[property] = value
        this.setState({ subscription })
    }
    // Trim "Repositories" and "Packages" values
    trimPackageProperties(){
      if(this.state.subscription.repos.indexOf(",") != -1){
        const inRepos = this.state.subscription.repos.split(",")
        for(var i=0; i<inRepos.length; i++){
          inRepos[i] = inRepos[i].trim()
        }
        this.state.subscription.repos = inRepos.join(",")
      }else{
        this.state.subscription.repos = this.state.subscription.repos.trim()
      }
      if(this.state.subscription.rpms.indexOf(",") != -1){
        const inRpms = this.state.subscription.rpms.split(",")
        for(var i=0; i<inRpms.length; i++){
          inRpms[i] = inRpms[i].trim()
        }
        this.state.subscription.rpms = inRpms.join(",")
      }else{
        this.state.subscription.rpms = this.state.subscription.rpms.trim()
      }
    }
    validate(){
        this.trimPackageProperties()
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
            <form className="form-horizontal">
                {this.state.isRhelSystem && <Subscription subscription={this.state.subscription} onUpdate={this.handleUpdate} />}
                <div className="form-group">
                    <label className="col-md-2 control-label">Repositories</label>
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
                        <label className="control-label">Update Hosts</label>
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
