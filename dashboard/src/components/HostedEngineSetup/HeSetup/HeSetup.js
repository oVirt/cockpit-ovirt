import React from 'react'
import HeSetupInputContainer from './HeSetupInput/HeSetupInputPanelContainer'
import HeSetupMessagePanel from './HeSetupMessagePanel'
import HeSetupNoPermissionsPanel from './HeSetupNoPermissionsPanel'
import HeSetupOutputPanel from './HeSetupOutputPanel'
import HeSetupSuccessPanel from './HeSetupSuccessPanel'
import RestartButton from './RestartButton'

const HeSetup = ({denied, finishedError, output, passInput, question, restart,
                 showInput, success, terminated}) => {
    return (
        <div>
            {success ?
                <HeSetupSuccessPanel /> :
                    denied ?
                    <HeSetupNoPermissionsPanel /> :
                    <div className="ovirt-input">
                        {output.infos.length > 0 ?
                            <HeSetupMessagePanel
                                messages={output.infos}
                                type="info"
                                icon="info"/>
                            : null }
                        {output.warnings.length > 0 ?
                            <HeSetupMessagePanel
                                messages={output.warnings}
                                type="warning"
                                icon="warning-triangle-o"/>
                            : null }
                        <HeSetupOutputPanel output={output}/>
                        {showInput ?
                            <HeSetupInputContainer
                                question={question}
                                password={question.password}
                                passInput={passInput}
                                errors={output.errors}/>
                            : !terminated ?
                                <div className="spinner"/>
                                : null }
                        {finishedError ?
                            <div>
                                <HeSetupMessagePanel
                                    messages={output.errors}
                                    type="danger"
                                    icon="error-circle-o" />
                                <RestartButton restartCallback={restart} />
                            </div>
                            : null }
                    </div>
            }
        </div>
    )
};

export default HeSetup;