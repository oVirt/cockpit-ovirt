import React, { Component } from 'react'
import ReactDOM from 'react-dom'

export default class Management extends Component {
  constructor(props) {
    super(props)
    this.updateFrame =  this.updateFrame.bind(this)
  }
  updateFrame() {
    $('iframe').height($('iframe').contents().height())
  }
  render() {
    return (
      <div className="management">
        <iframe src='./vdsm/ovirt.html' width='100%' frameBorder="0"/>
      </div>
    )
  }
  componentDidMount() {
    $('iframe').load(function () {
      console.log("Changed")
      $('iframe').height($('iframe').contents().height())
    })

    this.interval = setInterval(this.updateFrame, 1000);
  }
}
