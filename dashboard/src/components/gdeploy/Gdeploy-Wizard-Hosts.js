import React, { Component } from 'react'

class WizardHostStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hosts: props.hosts
        }
        this.handleDelete = this.handleDelete.bind(this)
        this.handleAdd = this.handleAdd.bind(this)
        this.updateHost = this.updateHost.bind(this);
    }
    handleDelete(index) {
        const hosts = this.state.hosts
        hosts.splice(index, 1);
        this.setState({ hosts })
    }
    handleAdd() {
        const hosts = this.state.hosts
        hosts.push("")
        this.setState({ hosts })
    }
    updateHost(index, hostaddress) {
        const hosts = this.state.hosts;
        hosts[index] = hostaddress
        this.setState({ hosts })
    }
    render() {
        const hostRows = [];
        this.state.hosts.forEach(function (host, index) {
            hostRows.push(
                <HostRow host={host} key={index} hostNo={index+1}
                    deleteCallBack={() => this.handleDelete(index)}
                    changeCallBack={(e) => this.updateHost(index, e.target.value)}
                    />
            )
        }, this)
        return (
            <form className="form-horizontal">
                {hostRows}
                <a onClick={this.handleAdd} className="col-md-offset-3">
                    <span className="pficon pficon-add-circle-o">
                        <strong> Add Host</strong>
                    </span>
                </a>
            </form>
        )
    }
}

WizardHostStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    hosts: React.PropTypes.array.isRequired
}

const HostRow = ({host, hostNo, changeCallBack, deleteCallBack}) => {
    return (
        <div>
            <div className="form-group">
                <label className="col-md-2 control-label">Host{hostNo}</label>
                <div className="col-md-6">
                    <input type="text" className="form-control"
                        value={host}
                        onChange={changeCallBack}
                        />
                </div>
                <a onClick={deleteCallBack}>
                    <span className="pficon pficon-delete gdeploy-wizard-delete-icon">
                    </span>
                </a>
            </div>
        </div>
    )
}
export default WizardHostStep