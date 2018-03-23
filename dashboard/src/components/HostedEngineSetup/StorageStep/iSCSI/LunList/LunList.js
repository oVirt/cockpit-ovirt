import React from 'react'
import LunContainer from '../Lun/LunContainer'

const LunList = ({handleLunSelection, lunList, selectedLun, storageConfig}) => {
    const luns = [];

    lunList.forEach(function(lun, idx) {
        luns.push(<LunContainer lun={lun}
                                handleLunSelection={handleLunSelection}
                                selectedLun={selectedLun}
                                storageConfig={storageConfig}
                                key={idx} />);
    });

    return (
        <div className="form-group">
            <div className="col-md-12">The following luns have been found on the requested target:</div>
            { luns }
        </div>
    )
};

export default LunList;
