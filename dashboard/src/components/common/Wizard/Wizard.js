import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'
import SubStepTabListContainer from "./SubStepTabList/SubStepTabListContainer"
import MultiPartStepContainer from './MultiPartStep/MultiPartStepContainer'

class Wizard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeStep: 0,
            activeSubStep: 0,
            validating: false,
            nextStep: -1,
            nextSubStep: -1
        };
        this.moveNext = this.moveNext.bind(this);
        this.moveBack = this.moveBack.bind(this);
        this.cancel = this.cancel.bind(this);
        this.finish = this.finish.bind(this);
        this.moveToStep = this.moveToStep.bind(this);
        this.validationCallBack = this.validationCallBack.bind(this);
        this.subStepValidationCallBack = this.subStepValidationCallBack.bind(this);
        this.handleActiveSubStepChange = this.handleActiveSubStepChange.bind(this);
    }
    componentDidMount() {
        $(ReactDOM.findDOMNode(this)).modal('show')
    }
    componentWillUnmount() {
        $(ReactDOM.findDOMNode(this)).modal('hide')
    }
    cancel() {
        this.props.onClose()
    }
    moveBack() {
        if (this.state.activeStep > 0) {
            this.moveToStep(this.state.activeStep - 1)
        }
    }
    moveNext() {
        if (this.state.activeStep < this.props.children.length - 1) {
            this.moveToStep(this.state.activeStep + 1)
        }
    }
    finish() {
        this.props.onFinish()
    }
    validationCallBack(isValid) {
        const newState = {
            validating: false,
            nextStep: -1,
        };

        if (isValid && this.state.nextStep > -1) {
            this.props.onStepChange(this.state.nextStep);
            newState.activeStep = this.state.nextStep;
            newState.activeSubStep = 0;
        }

        this.setState(newState)
    }
    subStepValidationCallBack(isValid) {
        const newState = {
            validating: false,
            nextSubStep: -1
        };

        if (isValid && this.state.nextSubStep > -1) {
            newState.activeSubStep = this.state.nextSubStep;
        }

        this.setState(newState)
    }
    moveToStep(step) {
        if (step < this.state.activeStep) {
            this.props.onStepChange(step);
            this.setState({ activeStep: step })
        } else {
            this.setState({
                validating: true,
                nextStep: step
            })
        }
    }
    handleActiveSubStepChange(subStep) {
        if (subStep < this.state.activeSubStep) {
            this.setState({activeSubStep: subStep });
        } else {
            this.setState({
                validating: true,
                nextSubStep: subStep
            });
        }
    }
    render() {
        const steps = [];
        const subStepLists = [];
        const that = this;

        this.props.children.forEach(function(step, index) {
                const stepElement = React.cloneElement(step, {
                    activeStep: that.state.activeStep,
                    activeSubStep: that.state.activeSubStep,
                    stepIndex: index,
                    validationCallBack: that.validationCallBack,
                    subStepValidationCallBack: that.subStepValidationCallBack,
                    validating: that.state.validating && index === that.state.activeStep
                });

                const comp = classNames(
                    { "hidden": index !== that.state.activeStep }
                );

                steps.push(
                    <div key={index} className={comp}>
                        {stepElement}
                    </div>);

                if (step.type === MultiPartStepContainer) {
                    const subStepTabList = <SubStepTabListContainer
                                            stepIndex={index}
                                            key={index}
                                            steps={step.props.children}
                                            activeStep={that.state.activeStep}
                                            activeSubStep={that.state.activeSubStep}
                                            handleActiveSubStepChange={that.handleActiveSubStepChange}/>;
                    subStepLists.push(subStepTabList);
                }
        });

        const wizardWidth = this.props.width ? {width: that.props.width} : {};

        return (
            <div className="modal" data-backdrop="static" role="dialog">
                <div className="modal-dialog modal-lg wizard-pf" style={wizardWidth}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button"
                                className="close wizard-pf-dismiss"
                                aria-label="Close" onClick={this.props.onClose}
                                data-dismiss="modal" aria-hidden="true"
                                >
                                <span className="pficon pficon-close" />
                            </button>
                            <dt className="modal-title">{this.props.title}</dt>
                        </div>
                        <div className="modal-body wizard-pf-body clearfix">
                            <WizardSteps steps={this.props.children}
                                activeStep={this.state.activeStep}
                                callBack={this.moveToStep}
                                />
                            <div className="wizard-pf-row">
                                <div className="wizard-pf-sidebar">
                                    {subStepLists}
                                </div>
                                <div className="wizard-pf-main gdeploy-wizard-row">
                                    <div className="wizard-pf-contents">
                                        {steps}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <WizardFooter activeStep={this.state.activeStep}
                            stepCount={this.props.children.length}
                            isDeploymentStarted={this.props.isDeploymentStarted}
                            moveBack={this.moveBack} moveNext={this.moveNext}
                            cancel={this.cancel} finish={this.finish}
                            close={this.props.onClose}
                            />
                    </div>
                </div>
            </div>
        )
    }
}

Wizard.propTypes = {
    title: React.PropTypes.string.isRequired,
    onClose: React.PropTypes.func.isRequired,
    onFinish: React.PropTypes.func.isRequired,
    onStepChange: React.PropTypes.func.isRequired,
    children: React.PropTypes.array.isRequired,
    isDeploymentStarted: React.PropTypes.bool.isRequired
}

const WizardSteps = ({steps, activeStep, callBack}) => {
    //Create the Navigation steps with active step
    const stepItems = []
    steps.forEach(function(step, index) {
        const stepClass = classNames(
            "wizard-pf-step",
            { "active": activeStep == index }
        )
        stepItems.push(
            <li className={stepClass} data-tabgroup={index}
                key={index} onClick={() => callBack(index)}>
                <a>
                    <span className="wizard-pf-step-number">{index + 1}</span>
                    <span className="wizard-pf-step-title">{step.props.stepName}</span>
                </a>
            </li>
        )
    })
    return (
        <div className="wizard-pf-steps">
            <ul className="wizard-pf-steps-indicator">
                {stepItems}
            </ul>
        </div>
    )
}

const WizardFooter = ({activeStep, stepCount, isDeploymentStarted,
    moveBack, moveNext, cancel, finish, close}) => {
    const backButton = classNames(
        "btn", "btn-default", "wizard-pf-back",
        { "disabled": activeStep == 0 || isDeploymentStarted}
    ),
        nextButton = classNames(
            "btn", "btn-primary", "wizard-pf-next",
            { "hidden": activeStep == stepCount - 1 }
        ),
        finishButton = classNames(
            "btn", "btn-primary", "wizard-pf-finish",
            { "hidden": ((activeStep != stepCount - 1) || isDeploymentStarted) }
        ),
        closeButton = classNames(
            "btn", "btn-primary", "wizard-pf-close", "wizard-pf-dismiss",
            { "hidden": ((activeStep != stepCount - 1) || !isDeploymentStarted) }
        )
    return (
        <div className="modal-footer wizard-pf-footer">
            <button type="button"
                className="btn btn-default btn-cancel wizard-pf-cancel wizard-pf-dismiss"
                onClick={cancel} data-dismiss="modal" aria-hidden="true">Cancel
            </button>
            <button type="button" className={backButton} onClick={moveBack}>
                <span className="i fa fa-angle-left"></span>Back
            </button>
            <button type="button" className={nextButton} onClick={moveNext}>
                Next<span className="i fa fa-angle-right"></span>
            </button>
            <button type="button" className={finishButton} onClick={finish}>
                Deploy
            </button>
            <button type="button" className={closeButton} onClick={close}
                data-dismiss="modal" aria-hidden="true">Close
            </button>
        </div>
    )
}
export default Wizard