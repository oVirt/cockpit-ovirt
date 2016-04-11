import React, { Component } from 'react'
import { Link } from 'react-router'
var classNames = require('classnames')

class Sidebar extends Component {
  constructor(props) {
    super(props)
  }
  static get defaultProps() {
    return {
      links: {
        "Dashboard": {
          path: "/",
          icon: "fa-dashboard",
        },
        "Hosted Engine": {
          path: "/he",
          icon: "fa-cubes",
        },
        "Virtual Machines": {
          path: "/management",
          icon: "fa-database"
        }
      }
    }
  }
  render() {
    var links = []
    for (var link in this.props.links) {
      links.push(<SidebarItem
        key={link}
        name={link}
        item={this.props.links[link]}
        />)
    }
    return (
      <ul>
        {links}
      </ul>
    )
  }
}

class SidebarItem extends Component {
  constructor(props, context) {
    super(props, context)
  }
  render() {
    var itemClass = classNames({
      'fa': true,
      'fa-fw': true,
      [`${this.props.item.icon}`]: true,
    })
    var active = classNames({
      "active": this.context.router.isActive(this.props.item.path, true)
    })
    return (
      <li className={active}>
        <Link to={this.props.item.path}>
          <span className={itemClass}></span> <br /> {this.props.name}
        </Link>
      </li>
    )
  }
}
SidebarItem.contextTypes = {
  router: React.PropTypes.object.isRequired
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
