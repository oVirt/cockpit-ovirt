import React from "react";

const checkboxWithInfo = (props) => (
	<div className="form-group">
		<label className="col-md-3 control-label">
			{props.label}
			<i
				className="pficon pficon-info he-wizard-info-icon"
				rel="tooltip"
				id={props.idInfo}
				title={props.iconTitle}
			/>
		</label>
		<div className="col-md-5">
			<input
				type="checkbox"
				checked={props.checked}
				onChange={(e) =>
					props.handleVmConfigUpdate(
						props.propName,
						e.target.checked,
						props.configType
					)
				}
				id={props.idInput}
			/>
		</div>
	</div>
);

export default checkboxWithInfo;
