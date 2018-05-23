import React from 'react'

const Selectbox = ({optionList, selectedOption, callBack, gdeployWizardType = "none"}) => {
    const options = [];
    let selected = null;

    optionList.forEach(function (option, index) {
        if(gdeployWizardType === "create_volume") {
          options.push(
              <li value={option.key} key={option.key}
                  onClick={() => callBack(option.key)}>
                  <textarea rows="1" cols="50" id="textArea" type="submit"
                  onKeyDown={() => {
                    if(event.code === "Enter" || event.code === "Tab") {
                      callBack(document.getElementById("textArea").value)
                    }
                  }}
                  onBlur={() => callBack(document.getElementById("textArea").value)}>
                    {option.key}
                  </textarea>
              </li>
          );
        } else {
          options.push(
              <li value={option.key} key={option.key}
                  onClick={() => callBack(option.key)}>
                  <a>
                    {option.title}
                  </a>
              </li>
          );
        }
        if (option.key === selectedOption) {
            selected = option
        }
    }, this);

    if (selected === null) {
        selected = optionList[0];
    }
    return (
      <div className="btn-group bootstrap-select dropdown form-control">
          <button className="btn btn-default dropdown-toggle" type="button"
              data-toggle="dropdown" aria-expanded="false">
              <span className="pull-left">{selected.title}</span>
              <span className="caret" />
          </button>
          <ul className="dropdown-menu">{options}</ul>
      </div>
    )
};

export default Selectbox
