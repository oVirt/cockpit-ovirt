import React, { Component } from "react";
import HostedEngineSetup from "./HostedEngineSetup";
import GlusterManagement from "./GlusterManagement";
import {
	checkDeployed,
	checkInstalled,
	getHostid,
	getMetrics,
	getHostname,
	setMaintenance,
} from "../helpers/HostedEngineStatus";
var classNames = require("classnames");

class HostedEngine extends Component {
	constructor(props) {
		super(props);
		this.state = {
			deployed: null,
			manageGluster: false,
		};
		this.manageGluster = this.manageGluster.bind(this);
		this.deployedCallback = this.deployedCallback.bind(this);
		this.determineComponent = this.determineComponent.bind(this);
		this.installedCallback = this.installedCallback.bind(this);
	}
	deployedCallback(value) {
		this.setState({ deployed: value });
	}
	installedCallback(value) {
		this.setState({ installed: value });
	}
	determineComponent() {
		if (this.state.installed == null || this.state.deployed == null) {
			return <div className="spinner" />;
		} else if (!this.state.installed) {
			return <NotInstalled />;
		} else {
			if (!this.state.deployed) {
				return (
					<HostedEngineSetup
						isDeployed={() => checkDeployed(this.deployedCallback)}
					/>
				);
			} else {
				if (this.state.manageGluster === true) {
					return <GlusterManagement />;
				} else {
					return <Status handleManageGluster={this.manageGluster} />;
				}
			}
		}
	}
	UNSAFE_componentWillMount() {
		checkDeployed(this.deployedCallback);
		checkInstalled(this.installedCallback);
	}
	manageGluster() {
		this.setState({
			manageGluster: true,
		});
	}

	render() {
		return <div>{this.determineComponent()}</div>;
	}
}

class Status extends Component {
	constructor(props) {
		super(props);
		this.state = {
			status: null,
			host_id: null,
			globalMaintenance: false,
			is_running_engine_vm: false,
			vm: null,
		};
		this.updateStatus = this.updateStatus.bind(this);
		this.onClick = this.onClick.bind(this);
		this.hostidCallback = this.hostidCallback.bind(this);
	}
	onClick() {
		this.setState({ expanded: !this.state.expanded });
	}
	updateStatus(status) {
		this.setState({ globalMaintenance: status.global_maintenance });
		delete status.global_maintenance;

		this.setState({ status: status });

		let found_running = false;
		let running_host = {};
		for (var key in status) {
			if (status[key]["engine-status"]["vm"] === "up") {
				running_host = { hostname: status[key]["hostname"] };
				found_running = true;
				if (this.state.host_id !== null && this.state.host_id === key) {
					this.setState({ is_running_engine_vm: true });
				} else {
					this.setState({ is_running_engine_vm: false });
				}
			}
		}
		this.setState({ vm: found_running ? running_host : false });
	}
	hostidCallback(value) {
		this.setState({ host_id: value });
	}
	UNSAFE_componentWillMount() {
		var self = this;
		getHostid(self.hostidCallback);
		var interval = setInterval(function () {
			getMetrics(self.updateStatus);
		}, 1000);
		this.setState({ intervalId: interval });
	}
	componentWillUnmount() {
		clearInterval(this.state.intervalId);
	}
	render() {
		let hosts = [];
		for (let id in this.state.status) {
			let host = this.state.status[id];
			hosts.push(<HostDetail host={host} />);
		}
		let split = (arr, n) => {
			let tmp = [];
			while (arr.length) {
				let chunk = arr.splice(0, n).map(function (host, i) {
					return (
						<div className="col-md-6" key={i}>
							{host}
						</div>
					);
				});
				let row = <div className="row">{chunk}</div>;
				tmp.push(row);
			}
			return tmp;
		};
		var rows = split(hosts, 2);
		return (
			<div className="container-fluid">
				<Engine status={this.state.vm} />
				<Buttons running_engine_vm={this.state.is_running_engine_vm} />
				<div className="panel panel-default">
					<div className="panel-heading">
						<h3 className="panel-title">
							<span>Hosts in this cluster</span>
							<button
								className="manageGlusterButton"
								onClick={this.props.handleManageGluster}
							>
								Manage Gluster
							</button>
						</h3>
					</div>
					<div className="panel-body">
						{this.state.globalMaintenance ? (
							<div className="alert alert-warning">
								<span className="pficon pficon-warning-triangle-o" />
								The cluster is in global maintenance mode!
							</div>
						) : null}
						{rows}
					</div>
				</div>
			</div>
		);
	}
}

class Buttons extends Component {
	constructor(props) {
		super(props);
		this.state = {
			hostname: "",
		};
	}
	UNSAFE_componentWillMount() {
		var self = this;
		getHostname(function (ret) {
			self.setState({ hostname: ret });
		});
	}
	onClick(mode) {
		setMaintenance(mode);
	}
	render() {
		let actions = {
			"Put this host into local maintenance": "local",
			"Remove this host from maintenance": "none",
			"Put this cluster into global maintenance": "global",
		};
		if (!this.props.running_engine_vm) {
			actions["Put this host into local maintenance"] = "local";
		}
		let buttons = [];
		let i = 0;
		for (let action in actions) {
			let disabled =
				actions[action] == "local" && this.props.running_engine_vm
					? true
					: false;
			if (disabled) {
				buttons.push(
					<div className="alert alert-warning">
						Local maintenance cannot be set when running the engine VM, please
						migrate it from the engine first if needed.
					</div>
				);
			}
			buttons.push(
				<button
					key={i}
					disabled={disabled}
					className="btn btn-default"
					onClick={() => this.onClick(actions[action])}
				>
					{action}
				</button>
			);
			i++;
		}
		return (
			<div className="panel panel-default">
				<div className="panel-heading">
					<h3 className="panel-title">
						Status of this host ({this.state.hostname})
					</h3>
				</div>
				<div className="panel-body">
					<p>
						{this.state.hostname}{" "}
						<span
							className="pficon
              pficon-med pficon-ok"
						/>
					</p>
					<div className="btn-group">{buttons}</div>
				</div>
			</div>
		);
	}
}

const Engine = ({ status }) => {
	let hostname = "Not running";
	if (status != null) {
		hostname = status.hostname;
	}
	return (
		<div>
			{status == null ? (
				<div className="spinner" />
			) : status != false ? (
				<Running host={status.hostname} />
			) : (
				<NotRunning />
			)}
		</div>
	);
};

const NotInstalled = () => {
	return (
		<div className="curtains curtains-ct blank-slate-pf">
			<div className="container-center">
				<div className="blank-slate-pf-icon">
					<i className="pficon-error-circle-o" />
				</div>
				<h1>
					Hosted Engine is not installed. Please install to enable Cockpit-based
					setup and management of Hosted Engine.
				</h1>
			</div>
		</div>
	);
};

// There's an annoying amount of duplication here, because
// patternfly doesn't seem to like classless <div> inside
// list-groups, so we can't shove the boilerplate up to Engine
const NotRunning = () => {
	return (
		<div className="row pad-header">
			<div className="col-md-3 list-view-pf-left">
				<span
					className="pficon pficon-error-circle-o
          list-view-pf-icon-lg"
				/>
			</div>
			<div className="col-md-6">
				<div className="vcenter">Hosted Engine is not running!</div>
			</div>
		</div>
	);
};

const Running = ({ host }) => {
	return (
		<div className="row pad-header">
			<div className="col-md-3 list-view-pf-left">
				<span
					className="pficon pficon-ok list-view-pf-icon-lg
          list-view-pf-icon-success"
				/>
			</div>
			<div className="col-md-4">
				<div className="vcenter">Hosted Engine is up!</div>
			</div>
			<div className="col-md-4">
				<div className="vcenter">
					<p>
						Hosted Engine is running on <strong>{host}</strong>
					</p>
				</div>
			</div>
		</div>
	);
};

const HostDetail = ({ host }) => {
	return (
		<div>
			<div className="list-group list-view-pf">
				<div className="list-group-item list-view-pf-stacked">
					<div className="list-view-pf-main-info">
						<div className="list-view-pf-body">
							<div className="list-view-pf-description">
								<div className="list-group-item-heading">{host.hostname}</div>
								<div className="list-group-item-text">
									Agent stopped: {host.stopped.toString()}
									<br />
									Local Maintenance: {host.maintenance.toString()}
								</div>
							</div>
							<div className="list-view-pf-additional-info">
								<div
									className="list-view-pf-additional-info-item
                  list-view-pf-additional-info-item-stacked"
								>
									<strong>VM Status</strong>
									<div>State: {host["engine-status"].vm}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

/*
<div className="list-view-pf-additional-info-item
  list-view-pf-additional-info-item-stacked">
  <strong>Live Data</strong> {host["live-data"].toString()}
</div>
<div className="list-view-pf-additional-info-item
  list-view-pf-additional-info-item-stacked">
  <strong>Host ID</strong> {host["host-id"]}
</div>
<div>Health: {host["engine-status"].health}</div>
{("reason" in host["engine-status"]) ?
  <div>Reason: {host["engine-status"].reason}</div> :
  null
}
*/

export default HostedEngine;
