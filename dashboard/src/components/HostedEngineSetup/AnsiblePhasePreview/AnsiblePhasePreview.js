import React from 'react'
import AnsiblePhaseExecutionContainer from "../AnsiblePhaseExecution/AnsiblePhaseExecutionContainer";

const AnsiblePhasePreview = ({abortCallBack, sections, executionStarted, heSetupModel, phase}) => {

    const outputRows = [];

    Object.getOwnPropertyNames(sections).forEach(
        function(sectionName) {
            outputRows.push(<PreviewSectionHeader title={sectionName}
                                                  firstHeader={true}
                                                  key={sectionName + "header"}/>);

            const rows = sections[sectionName];
            let idx = 0;
            rows.forEach(function(row) {
                outputRows.push(<PreviewRow property={row.property}
                                            value={row.value}
                                            key={row.property + idx++} />);
            });

        }, this);

    if (executionStarted) {
        return <AnsiblePhaseExecutionContainer abortCallBack={abortCallBack}
                                               heSetupModel={heSetupModel}
                                               phase={phase}/>
    } else {
        return <div>{ outputRows }</div>
    }


};

export default AnsiblePhasePreview;

const PreviewRow = ({property, value}) => {
    return (
        <div className="row">
            <label className="he-preview-field col-md-6">{property}</label>
            <label className="he-preview-value col-md-6">{value === "" ? <em>(None)</em> : value}</label>
        </div>
    )
};

const PreviewSectionHeader = ({title, firstHeader}) => {
    const firstHeaderClassNames = "he-first-preview-header col-sm-4";
    const headerClassNames = "he-preview-header col-sm-4";

    return (
        <div className={"row"}>
            <span className={"col-sm-4"} />
            <h3 className={firstHeader ? firstHeaderClassNames : headerClassNames}>{title}</h3>
            <span className={"col-sm-4"} />
        </div>
    )
};