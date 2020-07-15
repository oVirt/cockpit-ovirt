import React from 'react'
import { messages, resourceConstants } from "../../../constants";

const lunStatus = {
    USED: "used",
    FREE: "free"
};

const Lun = ({ handleLunSelection, lun, selectedLun, storageConfig }) => {

    function bytesToGiB(bytes) {
        return bytes / Math.pow(2, 30);
    }

    const minLunSizeInGiB = storageConfig.imgSizeGB.value + resourceConstants.LUN_STORAGE_OVERHEAD_GIB;
    const lunSizeInGiB = bytesToGiB(lun.size);
    const lunTooSmall = lunSizeInGiB < minLunSizeInGiB;
    const lunDirty = lun.status === lunStatus.USED;
    const disableLun = lunTooSmall || lunDirty;

    const disabledMsgArr = [];
    if (lunTooSmall) {
        disabledMsgArr.push(messages.LUN_IS_TOO_SMALL);
    }
    if (lunDirty) {
        disabledMsgArr.push(messages.LUN_IS_DIRTY);
    }
    const disabledMsg = disabledMsgArr.join("\n\n");

    return (
        <div className="form-group">
            <div className="col-md-12 lun">
                <div>
                    {disableLun &&
                        <i className="pficon pficon-warning-triangle-o he-warning-icon disabled-lun-warning-icon"
                            rel="tooltip"
                            title={disabledMsg} />
                    }

                    <input type="radio"
                        name="lun"
                        value={lun.guid}
                        disabled={disableLun}
                        checked={selectedLun === lun.guid}
                        onChange={(e) => handleLunSelection(e.target.value)} />
                    &nbsp;<span className="lun-prop-label">ID:</span> {lun.guid}
                </div>
                <div className="lun-prop"><span className="lun-prop-label">Size (GiB):</span> {lunSizeInGiB.toFixed(2)}</div>
                <div className="lun-prop"><span className="lun-prop-label">Description:</span> {lun.description}</div>
                <div className="lun-prop"><span className="lun-prop-label">Status:</span> {lun.status}</div>
                <div className="lun-prop"><span className="lun-prop-label">Number of Paths:</span> {lun.numPaths}</div>
            </div>
        </div>
    )
};

export default Lun;
