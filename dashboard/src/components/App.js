import React, { Component } from 'react'
import { Link, withRouter } from 'react-router-dom'
import { sidebarRoutes } from '../routes/routes'
import classNames from 'classnames'
import {renderRoutes} from "react-router-config";

class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="ovirt-sidebar">
          <Sidebar />
        </div>
        <div id="content">
          {renderRoutes(this.props.route.routes)}
        </div>
      </div>
        )
    }
}

class Sidebar extends Component {
  constructor(props) {
    super(props);
  }

  static get defaultProps() {
    return {
      routes: sidebarRoutes
    }
  }

  render() {
    const links = [];
    this.props.routes.forEach(function(link) {
      links.push(
        <SidebarItemWithRouter
          key={link.name}
          name={link.name}
          item={link}
        />
      )
    });

    return (
      <ul> {links} </ul>
    )
  }
}

class SidebarItem extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const itemClasses = classNames({
      'fa': true,
      'fa-fw': true,
      [`${this.props.item.icon}`]: true,
    });

    const isActive = this.props.location.pathname === this.props.item.path ||
      (this.props.item.name === "Dashboard" && this.props.location.pathname === "/");

    return (
      <li className={isActive ? "active" : ""}>
        <Link to={this.props.item.path}>
          <span className={itemClasses} />
          <br />
          {this.props.name}
        </Link>
      </li>
    )
  }
}

const SidebarItemWithRouter = withRouter(SidebarItem);

export default App;