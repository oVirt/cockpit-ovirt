import React, { Component } from 'react'

class RestartButton extends Component {
    constructor(props) {
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        this.props.restartCallback()
    }

    render() {
        return (
            <div>
                <button className="btn btn-primary btn-spacer"
                        onClick={this.onClick}>
                    Restart Setup
                </button>
            </div>
        )
    }
}

export default RestartButton;