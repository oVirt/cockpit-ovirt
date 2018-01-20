import React from 'react'

const Lun = ({handleLunSelection, lun, selectedLun}) => {

    return (
        <div className="form-group">
            <div className="col-md-6 lun">
                <div>
                    <input type="radio"
                           name="lun"
                           value={lun.guid}
                           checked={selectedLun === lun.guid}
                           onChange={(e) => handleLunSelection(e.target.value)} />
                    &nbsp;<span className="lun-prop-label">ID:</span> { lun.guid }
                </div>
                <div className="lun-prop"><span className="lun-prop-label">Size:</span> { lun.size }</div>
                <div className="lun-prop"><span className="lun-prop-label">Description:</span> { lun.description }</div>
                <div className="lun-prop"><span className="lun-prop-label">Status:</span> { lun.status }</div>
                <div className="lun-prop"><span className="lun-prop-label">Number of Paths:</span> { lun.numPaths }</div>
            </div>
        </div>
    )
};

export default Lun;