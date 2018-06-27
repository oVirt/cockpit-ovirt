import React, { Component } from 'react'

class GlusterManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedVolumes: {},
      hostList: null,
      volumeBricks: null,
      volumeInfo: null,
      volumeStatus: null,
      gdeployState: "",
      gdeployWizardType: ""
    };
    //Binding "this" of the function to "this" of the component.
    //However, when nesting calls, it seems best to use "let that = this;"
    // and use  "that" in the inner nested calls.
    this.updateVolumeInfo = this.updateVolumeInfo.bind(this);
    this.updateHostInfo = this.updateHostInfo.bind(this);
    this.getHostInfo = this.getHostInfo.bind(this);
    this.getVolumeInfo = this.getVolumeInfo.bind(this);
    this.getVolumeStatus= this.getVolumeStatus.bind(this);
    this.handleVolumeRowClick= this.handleVolumeRowClick.bind(this);
  }

  componentDidMount(){
    this.updateHostInfo();
    this.updateVolumeInfo();
  }

  updateHostInfo(){
    let that = this;
    that.getHostInfo(
      function (hostList){
        that.setState({hostList:hostList});
      }
    );
  }

  updateVolumeInfo(){
    let that = this;
    that.getVolumeInfo(
      function (volumeInfo){
        that.setState({volumeInfo:volumeInfo});
      }
    );
  }

  getHostInfo(callback){
    cockpit.spawn([ "vdsm-client", "--gluster-enabled", "GlusterHost", "list" ])
    .done(
      function (hostListJson){
        let hostList = JSON.parse(hostListJson).hosts;
        callback(hostList);
      }
    )
    .fail(
      function(err){
        console.log("Error while fetching host info: ", err);
        callback(null);
      }
    );
  }

  getVolumeInfo(callback){
    let that = this;
    cockpit.spawn(["vdsm-client", "--gluster-enabled", "GlusterVolume", "list"])
    .done(
      function (volumeInfoJson){
        var volumeInfo = JSON.parse(volumeInfoJson);
        callback(volumeInfo.volumes);
      }
    )
    .fail(
      function(err){
        console.log("Error while fetching volume info: ", err);
        callback(null);
      }
    );
  }

  getVolumeStatus(volumeName,callback){
    cockpit.spawn(["vdsm-client", "--gluster-enabled", "GlusterVolume", "status", "volumeName="+volumeName])
    .done(
      (volumeStatusJson) => callback(JSON.parse(volumeStatusJson).volumeStatus)
    )
    .fail(
      function(err){
        console.log("Error while fetching volume status for ",volumeName, " status: ", err);
        callback(null);
      }
    );
  }

  handleVolumeRowClick(volumeName){
    let that = this;
    this.setState(function(prevState, props){
      if(prevState.selectedVolumes.hasOwnProperty(volumeName)){
        delete prevState.selectedVolumes[volumeName];
        return {selectedVolumes:prevState.selectedVolumes}
      }
      else{
        prevState.selectedVolumes[volumeName]="fetching";
        that.getVolumeStatus(volumeName, function(volumeStatus){
          that.setState(function(prevState,props){
            if(prevState.volumeStatus == null){
              prevState.volumeStatus = {};
            }
            prevState.volumeStatus[volumeName]= volumeStatus;
            prevState.selectedVolumes[volumeName]="";
            return {volumeStatus:prevState.volumeStatus,selectedVolumes:prevState.selectedVolumes};
          });
        });

        return {selectedVolumes:prevState.selectedVolumes}
      }
    });
  }

  render(){
    return(
      <div>
        <div className="container-fluid gluster-management">
          <h2 className="title">Gluster Management</h2>
          <div className="row">
            <div className="col-12">
              {
                this.state.hostList !== null &&
                <HostsTable hostList={this.state.hostList}
                  handleRefresh={this.updateHostInfo} />
              }
              {
                this.state.hostList == null &&
                <InlineAlert
                  message="We were unable to fetch host data! Open the browser console for more info." />
              }
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              {
                this.state.volumeInfo !== null &&
                <VolumeTable volumeInfo={this.state.volumeInfo}
                  selectedVolumes={this.state.selectedVolumes}
                  volumeStatus={this.state.volumeStatus}
                  handleRefresh={this.updateVolumeInfo}
                  handleVolumeRowClick={this.handleVolumeRowClick}/>
              }
              {
                this.state.hostList == null &&
                <InlineAlert
                  message="We were unable to fetch volume data! Open the browser console for more info." />
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

class HostsTable extends Component{
  constructor(props){
    super(props);
  }

  generateTable(){
    this.hostTableRows = [];
    this.hostTableHeadings =[];
    for (let heading of ["Name","Peer status","UUID"]){
      this.hostTableHeadings.push(
        <th key={heading}>{heading}</th>
      )
    }
    for(let host of this.props.hostList){
      this.hostTableRows.push(
        <tr key={host.uuid}>
          <td>{host.hostname}</td>
          <td>{host.status}</td>
          <td>{host.uuid}</td>
        </tr>);
    }
  }

  render(){
    this.generateTable();
    return(
      <div className="panel panel-default">
        <div className="panel-heading">
          Hosts
          <button className="btn btn-default refresh-btn"
            onClick={this.props.handleRefresh}>
            <span className="fa fa-refresh"/>
          </button>
          <span className="pull-right">
            <button className="btn btn-default action-btn"
              onClick={()=>{cockpit.jump('/ovirt-dashboard#/expand_cluster')}}>
              Expand Cluster
            </button>
          </span>
        </div>
        <table className="table">
          <thead>
            <tr>{this.hostTableHeadings}</tr>
          </thead>
          <tbody>
            {this.hostTableRows}
          </tbody>
        </table>
      </div>
    )
  }
}

class VolumeBricksTable extends Component{
  constructor(props){
    super(props);
  }

  generateTable(){
    this.volumeBricksTableRows = [];
    this.brickMoreInfoModals = [];
    let modalCounter = 0;
    for(let brick of this.props.volumeBrickList){
      modalCounter++;
      this.volumeBricksTableRows.push(
        <tr key={brick.brick}>
          <td>{brick.brick}</td>
          <td>{brick.hostuuid}</td>
          <td>
            {brick.status == 'ONLINE' ? <span className="fa fa-arrow-circle-o-up status-icon" ></span>:<span className="fa fa-arrow-circle-o-down status-icon"></span> }
            {brick.status}
          </td>
          <td><ObjectModalButton modalId={"brick-"+modalCounter}/></td>
        </tr>);
        this.brickMoreInfoModals.push(
          <ObjectModal key={brick.brick} title={"More info: "+brick.brick}  modalId={"brick-"+modalCounter} modalObject={brick} />
        );
    }
  }

  render(){
    this.generateTable()
    return(
      <div className="panel panel-default volume-bricks-table">
        <table className="table">
          <thead>
            <tr>
              <th>Brick</th>
              <th>Host UUID</th>
              <th>Status</th>
              <th>More Info</th>
            </tr>
          </thead>
          <tbody>
            {this.volumeBricksTableRows}
          </tbody>
        </table>
        {this.brickMoreInfoModals}
      </div>
    )
  }
}

class VolumeTable extends Component{
  constructor(props){
    super(props);
  }

  generateTable(){
    this.volumeTableRows = [];
    this.moreInfoModals=[];
    for(let volumeName in this.props.volumeInfo){
      let volume = this.props.volumeInfo[volumeName];
      let expanded = this.props.selectedVolumes.hasOwnProperty(volumeName) && this.props.volumeStatus !== null && this.props.volumeStatus[volumeName] !== null && this.props.volumeStatus[volumeName] !== undefined;
      this.volumeTableRows.push(
          <tr key={volume.uuid} onClick={()=>{this.props.handleVolumeRowClick(volumeName)}}>
            <td className="volume-expando">{expanded && <span className="fa fa-angle-down volume-expando"></span>}{!expanded && <span className="fa fa-angle-right volume-expando"></span>}</td>
            <td>{volumeName}</td>
            <td>{volume.volumeType}{volume.isArbiter && " (ARBITER)"}</td>
            <td>
              {volume.volumeStatus == 'ONLINE' ? <span className="fa fa-arrow-circle-o-up status-icon" ></span>:<span className="fa fa-arrow-circle-o-down status-icon"></span> }
              {volume.volumeStatus}
            </td>
            <td><ObjectModalButton modalId={volume.uuid}/></td>
          </tr>
      );
      this.moreInfoModals.push(
        <ObjectModal key={volume.uuid} modalObject={volume} title={"More Info: "+volumeName} modalId={volume.uuid}/>
      );
      if(expanded){
        //TODO: pass the volume.bricksInfo brickinfo so it can be displayed in the modal
        this.volumeTableRows.push(
          <tr className="no-highlight" key={volumeName+"-brick-status"}>
            <td className="no-highlight" colSpan="100">
              <VolumeBricksTable volumeBrickList={this.props.volumeStatus[volumeName].bricks} />
            </td>
          </tr>
        );
      }
    }
  }

  render(){
    this.generateTable();
    return(
      <div className="panel panel-default">
        <div className="panel-heading">
          Volumes
          <button
            className="btn btn-default refresh-btn"
            onClick={this.props.handleRefresh}>
            <span className="fa fa-refresh"/>
          </button>
          <span className="pull-right">
            <button className="btn btn-default action-btn"
              onClick={()=>{cockpit.jump('/ovirt-dashboard#/create_gluster_volume')}}>
              Create Volume
            </button>
          </span>
        </div>
        <table className="table table-hover">
          <thead>
            <tr>
              <th className="volume-expando"></th>
              <th>Name</th>
              <th>Volume Type</th>
              <th>Status</th>
              <th>More Info</th>
            </tr>
          </thead>
          <tbody>
            {this.volumeTableRows}
          </tbody>
        </table>
        {this.moreInfoModals}
      </div>
    )
  }
}

class ObjectModal extends Component {
  constructor(props){
    super(props);
    //required props: title,id,modalObject
  }

  generateTable(){
    this.rowList = [];
    for(let key in this.props.modalObject){
      var value = this.props.modalObject[key];
      if (Array.isArray(value) && value.every((value)=> {return typeof(value) ==='string'})){
        value = value.join(", ");
      }
      else if (typeof(value) === 'object') {
        break;
      }
      else if (typeof(value.toString) === 'function'){
        value = value.toString();
      }
      this.rowList.push(
        <tr key={key}>
          <td>{key}</td>
          <td>{value}</td>
        </tr>
      );
    }
  }

  render(){
    this.generateTable();
    return(
      <div>
        <div className="modal fade object-modal" id={this.props.modalId} tabIndex="-1" role="dialog" aria-labelledby={this.props.title}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{this.props.title} <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></h4>

              </div>
              <div className="modal-body object-modal" >
                <table>
                  <tbody>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                    </tr>
                    {this.rowList}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function ObjectModalButton(props){
  function handleClick(event){
    event.stopPropagation();
    $("#"+props.modalId).modal({show:true,keyboard:true});
  }
  return (
    <button className="btn btn-find btn-link object-modal-btn" title="More Info" type="button" onClick={handleClick}>
      <span className="fa fa-lg fa-info-circle"></span>
    </button>
  );
}

function InlineAlert(props){
  return(
    <div className="alert alert-warning">
      <span className="pficon pficon-warning-triangle-o"></span>
      {props.message}
    </div>

  )
}
export default GlusterManagement
