import React, { Component } from 'react'
import Selectbox from './Selectbox'

class WizardVolumesStep extends Component {
    constructor(props) {
        super(props);
        this.state = {
            volumes: props.volumes
        }
        this.handleDelete = this.handleDelete.bind(this)
        this.handleAdd = this.handleAdd.bind(this)
        this.handleUpdate = this.handleUpdate.bind(this)
    }
    handleDelete(index) {
        const volumes = this.state.volumes
        volumes.splice(index, 1);
        this.setState({ volumes })
    }
    getEmptyRow() {
        return { name: "", type: "replicate", is_arbiter: true, brick_dir: "" }
    }
    handleAdd() {
        const volumes = this.state.volumes
        volumes.push(this.getEmptyRow())
        this.setState({ volumes })
    }
    handleUpdate(index, property, value) {
        const volumes = this.state.volumes
        volumes[index][property] = value
        this.setState({ volumes })
    }
    render() {
        const volumeRows = [];
        this.state.volumes.forEach(function (volume, index) {
            volumeRows.push(
                <VolumeRow volume={volume} key={index} index={index}
                    changeCallBack={this.handleUpdate}
                    deleteCallBack={() => this.handleDelete(index)}
                    />
            )
        }, this)
        return (
            <div>
                {volumeRows.length > 0 &&
                    <form className="form-horizontal">
                        <table className="gdeploy-wizard-table">
                            <tbody>
                                <tr>
                                    <th>Name</th>
                                    <th>Volume Type</th>
                                    <th>Arbiter</th>
                                    <th>Brick Dirs</th>
                                </tr>
                                {volumeRows}
                            </tbody>
                        </table>
                    </form>
                }
                <a onClick={this.handleAdd} className="col-md-offset-4">
                    <span className="pficon pficon-add-circle-o">
                        <strong> Add Volume</strong>
                    </span>
                </a>
            </div>
        )
    }
}

WizardVolumesStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    volumes: React.PropTypes.array.isRequired
}

const VolumeRow = ({volume, index, changeCallBack, deleteCallBack}) => {
    const volumeTypes = [
        { key: "distribute", title: "Distribute" },
        { key: "replicate", title: "Replicate" },
        { key: "distribute-repliacte", title: "Distribute Replicate" }
    ]
    return (
        <tr>
            <td className="col-md-3">
                <input type="text" className="form-control"
                    value={volume.name}
                    onChange={(e) => changeCallBack(index, "name", e.target.value)}
                    />
            </td>
            <td className="col-md-3">
                <Selectbox optionList={volumeTypes}
                    selectedOption={volume.type}
                    callBack={(e) => changeCallBack(index, "type", e)}
                    />
            </td>
            <td className="col-md-1">
                <input type="checkbox" className="form-control"
                    checked={volume.is_arbiter}
                    onChange={(e) => changeCallBack(index, "is_arbiter", e.target.checked)}
                    />
            </td>
            <td className="col-md-3">
                <input type="text" className="form-control"
                    value={volume.brick_dir}
                    onChange={(e) => changeCallBack(index, "brick_dir", e.target.value)}
                    />
            </td>
            <td className="col-sm-1">
                <a onClick={deleteCallBack}>
                    <span className="pficon pficon-delete gdeploy-wizard-delete-icon">
                    </span>
                </a>
            </td>
        </tr>
    )
}
export default WizardVolumesStep