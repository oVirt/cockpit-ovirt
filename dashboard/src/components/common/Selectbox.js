import React from 'react'

const Selectbox = ({optionList, selectedOption, callBack}) => {
    const options = []
    let selected = null
    optionList.forEach(function (option, index) {
        options.push(
            <li value={option.key} key={option.key}
                onClick={() => callBack(option.key)}><a>{option.title}</a>
            </li>
        )
        if (option.key === selectedOption) {
            selected = option
        }
    }, this)
    return (
        <div className="btn-group bootstrap-select dropdown form-control">
            <button className="btn btn-default dropdown-toggle" type="button"
                data-toggle="dropdown" aria-expanded="false">
                <span className="pull-left">{selected.title}</span>
                <span className="caret"></span>
            </button>
            <ul className="dropdown-menu">{options}</ul>
        </div>
    )
}

export default Selectbox