import React from "react";
import { messages, resourceConstants } from "../../../constants";
import LunProp from "./LunProp/LunProp";

const lunStatus = {
	USED: "used",
	FREE: "free",
};

const Lun = ({ handleLunSelection, lun, selectedLun, storageConfig }) => {
	function bytesToGiB(bytes) {
		return bytes / Math.pow(2, 30);
	}

	const minLunSizeInGiB =
		storageConfig.imgSizeGB.value + resourceConstants.LUN_STORAGE_OVERHEAD_GIB;
	const lunSizeInGiB = bytesToGiB(lun.size);
	const lunTooSmall = lunSizeInGiB < minLunSizeInGiB;
	const lunDirty = lun.status === lunStatus.USED;
	const disableLun = lunTooSmall || lunDirty;
	const lunProps = [
		{ key: "size", label: "Size (GiB)", info: lunSizeInGiB.toFixed(2) },
		{ key: "description", label: "Description", info: lun.description },
		{ key: "status", label: "Status", info: lun.status },
		{ key: "numPaths", label: "Number of Paths", info: lun.numPaths },
	];

	return (
		<div className="form-group">
			<div className="col-md-12 lun">
				<div>
					{disableLun && (
						<i
							className="pficon pficon-warning-triangle-o he-warning-icon disabled-lun-warning-icon"
							rel="tooltip"
						/>
					)}
					<input
						type="radio"
						name="lun"
						value={lun.guid}
						disabled={disableLun}
						checked={disableLun ? false : selectedLun === lun.guid}
						onChange={(e) => handleLunSelection(e.target.value)}
					/>
					&nbsp;<span className="lun-prop-label">ID:</span> {lun.guid}
				</div>
				{lunTooSmall ? (
					<LunProp label="Error" info={messages.LUN_IS_TOO_SMALL} />
				) : null}
				{lunDirty ? (
					<LunProp label="Error" info={messages.LUN_IS_DIRTY} />
				) : null}
				{lunProps.map((lunProp) => {
					return (
						<LunProp
							key={lunProp.key}
							label={lunProp.label}
							info={lunProp.info}
						/>
					);
				})}
			</div>
		</div>
	);
};

export default Lun;
