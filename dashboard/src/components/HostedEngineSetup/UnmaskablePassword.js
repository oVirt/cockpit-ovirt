import PropTypes from 'prop-types';
import React, { Component } from 'react'

const masked = "password-mask-icon fa fa-eye";
const unmasked = "password-mask-icon fa fa-eye-slash";

class UnmaskablePasswordContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            maskIconClasses: masked,
            inputType: "password",
            value: props.value
        };

        this.toggleMask = this.toggleMask.bind(this);
    }

    toggleMask () {
        const iconClasses = this.state.maskIconClasses === masked ? unmasked : masked;
        const type = this.state.inputType === "password" ? "text" : "password";
        this.setState({ maskIconClasses: iconClasses, inputType: type });
    }

    changeHandler(e) {
        this.props.onChangeHandler(e.target.value);
    }

    render() {
        return (
            <span>
                <input type={this.state.inputType}
                       value={this.props.value}
                       onChange={e => this.changeHandler(e)}
                       className="form-control" />

                <a onClick={() => this.toggleMask()}>
                    <i className={this.state.maskIconClasses} aria-hidden="true" />
                </a>
            </span>
        )

    }
}

UnmaskablePasswordContainer.propTypes = {
    value: PropTypes.string.isRequired,
    onChangeHandler: PropTypes.func.isRequired
};

export default UnmaskablePasswordContainer;