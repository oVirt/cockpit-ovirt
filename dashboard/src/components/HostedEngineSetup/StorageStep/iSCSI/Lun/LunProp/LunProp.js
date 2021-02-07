import React from "react";

const lunProp = (props) => (
	<div className="lun-prop">
		<span className="lun-prop-label">
			{props.label}
			{": "}
		</span>
		{props.info}
	</div>
);

export default lunProp;
