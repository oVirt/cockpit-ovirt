import React, { Component } from 'react'
import { Link } from 'react-router'

const Sidebar = () => {
  return (
    <ul className="menu">
      <li><Link to="/" onlyActiveOnIndex>
        <span className="fa fa-dashboard fa-fw"></span> Dashboard
      </Link></li>
      <li><Link to="/he">
        <span className="fa fa-cubes fa-fw"></span> Hosted Engine
      </Link></li>
    </ul>
  )
}

export default class App extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div>
        <div className="ovirt-sidebar">
          <Sidebar></Sidebar>
        </div>
        <div id="content">
          {this.props.children}
        </div>
      </div>
    )
  }
}
