import React, { Component } from 'react'
import HeSetupInputPanel from './HeSetupInputPanel'

class HeSetupInputPanelContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            input: ''
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleInput(e) {
        this.setState({input: e.target.value})
    }

    handleKeyPress(e) {
        if (e.key === "Enter") {
            this.handleSubmit(e)
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        this.props.passInput(this.state.input)
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const suggested = nextProps.question.suggested;
        this.setState({input: suggested})
    }

    render() {
        const prompt = this.props.question.prompt.map(function(line, i) {
            return (
                <span key={i}>
                    {line}<br />
                </span>
            )
        });

        const hasErrors = this.props.errors.length > 0;

        let errorText = null;

        if (hasErrors) {
            errorText = this.props.errors.map(function(err, i) {
                return <span key={i} className="help-block">{err}</span>
            })
        }

        const type = this.props.password ? 'password' : 'text';

        return (
            <HeSetupInputPanel
                errorText={errorText}
                handleInput={this.handleInput}
                handleKeyPress={this.handleKeyPress}
                handleSubmit={this.handleSubmit}
                hasErrors={hasErrors}
                input={this.state.input}
                prompt={prompt}
                type={type}
            />
        )
    }
}

export default HeSetupInputPanelContainer;