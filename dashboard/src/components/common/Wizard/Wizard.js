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
            nextSubStep: -1,
            customActionBtnData: {}
        };
        this.moveNext = this.moveNext.bind(this);
        this.moveBack = this.moveBack.bind(this);
        this.cancel = this.cancel.bind(this);
        this.finish = this.finish.bind(this);
        this.moveToStep = this.moveToStep.bind(this);
        this.validationCallBack = this.validationCallBack.bind(this);
        this.subStepValidationCallBack = this.subStepValidationCallBack.bind(this);
        this.handleActiveSubStepChange = this.handleActiveSubStepChange.bind(this);
        this.registerCustomActionBtnStateCallback = this.registerCustomActionBtnStateCallback.bind(this);

        this.subStepCounts = [];
        this.hasSubSteps = false;
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
        if (this.state.activeSubStep > 0) {
            this.handleActiveSubStepChange(this.state.activeSubStep - 1);
        } else if (this.state.activeStep > 0) {
            this.moveToStep(this.state.activeStep - 1);
            const prevStep = this.props.children[this.state.activeStep - 1];
            const prevStepHasSubSteps = typeof prevStep.props.children !== "undefined";
            if (prevStepHasSubSteps) {
                const numSubStepsInPrevStep = prevStep.props.children.length;
                this.handleActiveSubStepChange(numSubStepsInPrevStep - 1);
            }
        }
    }
    moveNext() {
        const isNotLastStep = this.state.activeStep < this.props.children.length - 1;

        const currStep = this.props.children[this.state.activeStep];
        const currStepHasSubSteps = typeof currStep.props.children !== "undefined";
        const isNotLastSubStep = currStepHasSubSteps && (this.state.activeSubStep < currStep.props.children.length - 1);

        if (isNotLastSubStep) {
            this.handleActiveSubStepChange(this.state.activeSubStep + 1);
        } else if (isNotLastStep) {
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
            this.setState({
                activeStep: step,
                activeSubStep: 0
            })
        } else {
            this.setState({
                validating: true,
                nextStep: step
            })
        }
    }
    handleActiveSubStepChange(subStep) {
        if (subStep < this.state.activeSubStep) {
            this.setState({
                activeSubStep: subStep,
                nextButtonState: {}
            });
        } else {
            this.setState({
                validating: true,
                nextSubStep: subStep
            });
        }
    }
    registerCustomActionBtnStateCallback(buttonState, stepIndex, subStepIndex = -1) {
        const customActionBtnData = this.state.customActionBtnData;
        if (typeof customActionBtnData[stepIndex] === "undefined") {
            customActionBtnData[stepIndex] = {};
        }

        if (subStepIndex >= 0) {
            customActionBtnData[stepIndex][subStepIndex] = buttonState;
        } else {
            customActionBtnData[stepIndex] = buttonState;
        }
        this.setState({ customActionBtnData });
    }
    render() {
        const activeStep = this.state.activeStep;
        const activeSubStep = this.state.activeSubStep;
        const steps = [];
        const subStepLists = [];
        const self = this;

        this.props.children.forEach(function(step, index) {
                const isActiveStep = index === activeStep;

                const stepElement = React.cloneElement(step, {
                    activeStep: activeStep,
                    activeSubStep: activeSubStep,
                    stepIndex: index,
                    stepCount: self.props.children.length,
                    validationCallBack: self.validationCallBack,
                    subStepValidationCallBack: self.subStepValidationCallBack,
                    validating: self.state.validating && isActiveStep,
                    registerCustomActionBtnStateCallback: self.registerCustomActionBtnStateCallback
                });

                const comp = classNames(
                    { "hidden": !isActiveStep }
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
                                            activeStep={self.state.activeStep}
                                            activeSubStep={self.state.activeSubStep}
                                            handleActiveSubStepChange={self.handleActiveSubStepChange}/>;
                    subStepLists.push(subStepTabList);

                    self.subStepCounts.push(step.props.children.length);
                    self.hasSubSteps = true;
                }
        });

        const wizardWidth = this.props.width ? {width: this.props.width} : {};
        const hasSidebar = subStepLists.length > 0;
        const wizardMainClasses = hasSidebar ? "wizard-pf-main" : "wizard-pf-main no-sidebar";
        // The data-dismiss attribute must be suppressed when toggling the wizard's visibility using the close button;
        // otherwise, the dialog is closed and has to be reloaded
        const dataDismissValue = this.props.suppressDataDismissAttribute ? "" : "modal";

        let customActionBtnState = {};
        const stepData = this.state.customActionBtnData[activeStep];
        const stepDataExists = typeof stepData !== "undefined";
        if (this.hasSubSteps && stepDataExists && typeof stepData[activeSubStep] !== "undefined") {
            customActionBtnState = stepData[activeSubStep];
        } else if (!this.hasSubSteps && stepDataExists) {
            customActionBtnState = stepData;
        }

        return (
            <div id="wizard-modal" className="modal" data-backdrop="static" role="dialog">
                <div className="modal-dialog modal-lg wizard-pf" style={wizardWidth}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button"
                                className="close wizard-pf-dismiss"
                                aria-label="Close" onClick={this.props.onClose}
                                data-dismiss={dataDismissValue} aria-hidden="true"
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
                            <div className="wizard-pf-row wizard-pf-row-fix">
                                {subStepLists}
                                <div className={wizardMainClasses}>
                                    <div className="wizard-pf-contents">
                                        {steps}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <WizardFooter activeStep={this.state.activeStep}
                                      activeSubStep={this.state.activeSubStep}
                                      stepCount={this.props.children.length}
                                      subStepCounts={this.subStepCounts}
                                      isDeploymentStarted={this.props.isDeploymentStarted}
                                      moveBack={this.moveBack} moveNext={this.moveNext}
                                      cancel={this.cancel} finish={this.finish}
                                      close={this.props.onClose}
                                      customActionBtnState={customActionBtnState}
                                      dataDismissValue={dataDismissValue} />
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
    isDeploymentStarted: React.PropTypes.bool.isRequired,
    suppressDataDismissAttribute: React.PropTypes.bool
};

const WizardSteps = ({steps, activeStep, callBack}) => {
    //Create the Navigation steps with active step
    const stepItems = [];
    steps.forEach(function(step, index) {
        const stepClass = classNames(
            "wizard-pf-step",
            { "active": activeStep === index }
        );
        stepItems.push(
            <li className={stepClass} data-tabgroup={index}
                key={index} onClick={() => callBack(index)}>
                <a>
                    <span className="wizard-pf-step-number">{index + 1}</span>
                    <span className="wizard-pf-step-title">{step.props.stepName}</span>
                </a>
            </li>
        )
    });
    return (
        <div className="wizard-pf-steps">
            <ul className="wizard-pf-steps-indicator">
                {stepItems}
            </ul>
        </div>
    )
};

const WizardFooter = ({activeStep, activeSubStep, stepCount, subStepCounts, isDeploymentStarted,
    moveBack, moveNext, cancel, finish, close, customActionBtnState, dataDismissValue}) => {
    const hasSubSteps = subStepCounts.length > 1;
    const btnState = customActionBtnState;
    const isLastStep = activeStep === stepCount - 1;
    const isLastSubStep = activeSubStep === (subStepCounts[activeStep] - 1);
    let backBtnClasses = classNames(
            "btn", "btn-default", "wizard-pf-back",
            { "disabled": (activeStep === 0 && activeSubStep === 0) || isDeploymentStarted }
        ),
        finishBtnClasses = classNames(
            "btn", "btn-primary", "wizard-pf-finish",
            { "hidden": !isLastStep || (hasSubSteps && !isLastSubStep) || isDeploymentStarted }
        ),
        closeBtnClasses = classNames(
            "btn", "btn-primary", "wizard-pf-close", "wizard-pf-dismiss",
            { "hidden": (!isLastStep || !isDeploymentStarted) }
        ),
        cancelBtnClasses = classNames(
            "btn", "btn-default", "btn-cancel", "wizard-pf-cancel", "wizard-pf-dismiss",
            { "disabled": (isLastStep && isDeploymentStarted) }
        ),
        nextBtnClasses = classNames(
            "btn", "btn-primary", "wizard-pf-next",
            { "hidden": (!hasSubSteps && isLastStep) || (hasSubSteps && isLastStep && isLastSubStep) }
        );

    let customActionBtnClasses = "hidden";
    let customActionBtnText = "";
    let customActionBtnCallback = null;
    const renderCustomActionBtn = typeof btnState !== "undefined"
        && Object.keys(btnState).length !== 0 && btnState.constructor === Object;

    if (renderCustomActionBtn) {
        customActionBtnText = typeof btnState.buttonText === "string" ? btnState.buttonText : "Deploy";
        customActionBtnClasses = classNames(
            "btn", "btn-primary", "wizard-pf-next",
            { "hidden": customActionBtnState.hidden },
            { "disabled": customActionBtnState.disabled }
        );

        const disableList = typeof btnState.disableBtnsList !== "undefined" ? btnState.disableBtnsList : [];
        const hideList = typeof btnState.hideBtnsList !== "undefined" ? btnState.hideBtnsList : [];

        backBtnClasses += disableList.includes(footerButtons.BACK) ? " disabled" : "";
        backBtnClasses += hideList.includes(footerButtons.BACK) ? " hidden" : "";

        nextBtnClasses += disableList.includes(footerButtons.NEXT) ? " disabled" : "";
        nextBtnClasses += hideList.includes(footerButtons.NEXT) ? " hidden" : "";

        finishBtnClasses += disableList.includes(footerButtons.FINISH) ? " disabled" : "";
        finishBtnClasses += hideList.includes(footerButtons.FINISH) ? " hidden" : "";

        closeBtnClasses += disableList.includes(footerButtons.CLOSE) ? " disabled" : "";
        closeBtnClasses += hideList.includes(footerButtons.CLOSE) ? " hidden" : "";

        cancelBtnClasses += disableList.includes(footerButtons.CANCEL) ? " disabled" : "";
        cancelBtnClasses += hideList.includes(footerButtons.CANCEL) ? " hidden" : "";

        if (typeof btnState.buttonCallBack === "function") {
            customActionBtnCallback = btnState.buttonCallBack;
        }
    }

    return (
        <div className="modal-footer wizard-pf-footer">
            <button type="button"
                className={cancelBtnClasses}
                onClick={cancel} data-dismiss={dataDismissValue} aria-hidden="true">Cancel
            </button>
            <button type="button" className={backBtnClasses} onClick={moveBack}>
                <span className="i fa fa-angle-left"/>Back
            </button>
            <button type="button" className={nextBtnClasses} onClick={moveNext}>
                Next
                <span className="i fa fa-angle-right"/>
            </button>
            {renderCustomActionBtn &&
                <button type="button" className={customActionBtnClasses} onClick={customActionBtnCallback}>
                    {customActionBtnText}
                </button>
            }
            <button type="button" className={finishBtnClasses} onClick={finish}>
                Deploy
            </button>
            <button type="button" className={closeBtnClasses} onClick={close}
                    data-dismiss={dataDismissValue} aria-hidden="true">
                Close
            </button>
        </div>
    )
};

export const footerButtons = {
    BACK: "BACK",
    NEXT: "NEXT",
    CANCEL: "CANCEL",
    FINISH: "FINISH",
    CLOSE: "CLOSE"
};

export default Wizard
