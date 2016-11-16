import React, { Component } from 'react'

class WizardBricksStep extends Component {

    constructor(props) {
        super(props)
        this.state = {
            bricks: props.bricks
        }
        this.handleDelete = this.handleDelete.bind(this)
        this.handleAdd = this.handleAdd.bind(this)
        this.handleUpdate = this.handleUpdate.bind(this)
    }
    handleDelete(index) {
        const bricks = this.state.bricks
        bricks.splice(index, 1)
        this.setState({ bricks })
    }
    getEmptyRow() {
        return { name: "", device: "", brick_dir: "", size:"1" }
    }
    handleAdd() {
        const bricks = this.state.bricks
        bricks.push(this.getEmptyRow())
        this.setState({ bricks })
    }
    handleUpdate(index, property, value) {
        const bricks = this.state.bricks
        bricks[index][property] = value
        this.setState({ bricks })
    }
    render() {
        const bricksRow = []
        this.state.bricks.forEach(function (brick, index) {
            bricksRow.push(
                <BrickRow brick={brick} key={index} index={index}
                    changeCallBack={this.handleUpdate}
                    deleteCallBack={() => this.handleDelete(index)}
                    />
            )
        }, this)
        return (
            <div>
                {bricksRow.length > 0 &&
                    <form className="form-horizontal">
                        <table className="gdeploy-wizard-table">
                            <tbody>
                                <tr className="gdeploy-wizard-bricks-row">
                                    <th>LV Name</th>
                                    <th>Device</th>
                                    <th>Size</th>
                                    <th>Mount Point</th>
                                    <th>Thinp</th>
                                    <th>RAID</th>
                                    <th>Strip Size</th>
                                    <th>Disk Count</th>
                                </tr>
                                {bricksRow}
                            </tbody>
                        </table>
                    </form>
                }
                <a onClick={this.handleAdd} className="col-md-offset-4">
                    <span className="pficon pficon-add-circle-o">
                        <strong> Add Bricks</strong>
                    </span>
                </a>
            </div>
        )
    }
}

WizardBricksStep.propTypes = {
    stepName: React.PropTypes.string.isRequired,
    bricks: React.PropTypes.array.isRequired
}

const BrickRow = ({brick, index, changeCallBack, deleteCallBack}) => {
    return (
        <tr className="gdeploy-wizard-bricks-row">
            <td className="col-md-1">
                <input type="text" className="form-control"
                    value={brick.name}
                    onChange={(e) => changeCallBack(index, "name", e.target.value)}
                    />
            </td>
            <td className="col-md-2">
                <input type="text" className="form-control"
                    value={brick.device}
                    onChange={(e) => changeCallBack(index, "device", e.target.value)}
                    />
            </td>
            <td className="col-md-1">
                <input type="text" className="form-control"
                    value={brick.size}
                    onChange={(e) => changeCallBack(index, "size", e.target.value)}
                    />
            </td>
            <td className="col-md-3">
                <input type="text" className="form-control"
                    value={brick.brick_dir}
                    onChange={(e) => changeCallBack(index, "brick_dir", e.target.value)}
                    />
            </td>
            <td className="col-md-1">
                <input type="checkbox" className="form-control"
                    checked={brick.thinp}
                    onChange={(e) => changeCallBack(index, "thinp", e.target.checked)}
                    />
            </td>
            <td className="col-md-1">
                <input type="text" className="form-control"
                    value={brick.raidType}
                    onChange={(e) => changeCallBack(index, "raidType", e.target.value)}
                    />
            </td>
            <td className="col-md-1">
                <input type="text" className="form-control"
                    value={brick.stripSize}
                    onChange={(e) => changeCallBack(index, "stripSize", e.target.value)}
                    />
            </td>
            <td className="col-md-1">
                <input type="text" className="form-control"
                    value={brick.diskCount}
                    onChange={(e) => changeCallBack(index, "diskCount", e.target.value)}
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

export default WizardBricksStep