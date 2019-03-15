import PropTypes from 'prop-types';
import React, { Component } from 'react'
import { getErrorMsgForProperty, validatePropsForUiStage } from "../Validation";
import {deploymentTypes, messages, status} from '../constants';
import HeWizardStorage from './HeWizardStorage'
import StorageUtil from '../../../helpers/HostedEngineSetup/StorageUtil'

const nfsAnsFileFields = ["storageDomain"];

const requiredNfsFields = nfsAnsFileFields;

const iscsiAnsFileFields = [
    "iSCSIPortalUser", "iSCSIPortalIPAddress", "iSCSIPortalPassword", "iSCSIPortalPort",
    "iSCSITargetName", "LunID"
];

const requiredIscsiFieldsBase = ["iSCSIPortalIPAddress", "iSCSIPortalPort", "LunID"];

const glusterAnsFileFields = ["storageDomainConnection"];

const glusterAndNfsAnsFileFields = ["storageDomainConnection", "mntOptions"];

const requiredGlusterAndNfsFields = ["storageDomainConnection"];

const fieldProps = ["showInReview", "useInAnswerFile"];

class HeWizardStorageContainer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            model: props.model,
            heSetupModel: props.model.model,
            storageConfig: props.model.model.storage,
            errorMsg: "",
            errorMsgs: {},
            iscsiLunData: null,
            iscsiTargetData: null,
            fcLunData: null,
            selectedIscsiTarget: "",
            selectedLun: "",
            selectedFcLun: "",
            targetRetrievalStatus: status.EMPTY,
            lunRetrievalStatus: status.EMPTY,
            fcLunDiscoveryStatus: status.EMPTY,
            collapsibleSections: {
                advanced: true
            }
        };

        this.storageUtil = new StorageUtil(props.model.model);

        this.handleStorageConfigUpdate = this.handleStorageConfigUpdate.bind(this);
        this.setStorageTypeDisplaySettings = this.setStorageTypeDisplaySettings.bind(this);
        this.validateConfigUpdate = this.validateConfigUpdate.bind(this);
        this.validateAllInputs = this.validateAllInputs.bind(this);
        this.getIscsiTargetList = this.getIscsiTargetList.bind(this);
        this.getIscsiLunList = this.getIscsiLunList.bind(this);
        this.getFcLunList = this.getFcLunList.bind(this);
        this.handleTargetSelection = this.handleTargetSelection.bind(this);
        this.handleLunSelection = this.handleLunSelection.bind(this);
        this.handleFcLunSelection = this.handleFcLunSelection.bind(this);
        this.handleCollapsibleSectionChange = this.handleCollapsibleSectionChange.bind(this);
    }

    componentWillMount() {
        this.setStorageTypeDisplaySettings(this.state.heSetupModel.storage.domainType.value);
    }

    handleStorageConfigUpdate(propName, value) {
        this.setState({ errorMsg: "", errorMsgs: {} });
        const storageConfig = this.state.storageConfig;
        storageConfig[propName].value = value;

        if (propName === "storageDomainConnection") {
            var path = value.split(":").pop();
            var address = value.substring(
              0,
              value.lastIndexOf(path)-1
            );
            while (path.length > 1 && path.slice(-1) === '/') {
              path = path.slice(0, -1);
            }
            storageConfig.storagePath.value = path;
            storageConfig.storageAddress.value = address;
        }

        if (propName === "iSCSIPortalIPAddress") {
            storageConfig.storageAddress.value = value;
        }

        this.setState({ storageConfig });

        if (propName === "domainType") {
            this.setStorageTypeDisplaySettings(value);
            if (value === "fc") {
                this.getFcLunList();
            }
        } else {
            this.validateConfigUpdate(propName);
        }
    }

    setStorageTypeDisplaySettings(storageType) {
        const model = this.state.model;

        const isNfs = storageType.includes("nfs");
        const isIscsi = storageType === "iscsi";
        const isGluster = storageType === "glusterfs";
        const isFc = storageType === "fc";


        let requiredIscsiFields = requiredIscsiFieldsBase;
        if (this.props.deploymentType === deploymentTypes.OTOPI_DEPLOYMENT) {
            const otopiIscsiFields = ["iSCSITargetName", "LunID"];
            requiredIscsiFields.concat(otopiIscsiFields);
        }

        model.setBooleanValues(nfsAnsFileFields, fieldProps, isNfs);
        model.setBooleanValues(requiredNfsFields, ["required"], isNfs);
        model.model.storage.nfsVersion.showInReview = isNfs;

        model.setBooleanValues(iscsiAnsFileFields, fieldProps, isIscsi);
        model.setBooleanValues(requiredIscsiFields, ["required"], isIscsi);
        model.model.storage.iSCSIPortalPassword.showInReview = false;

        model.setBooleanValues(glusterAnsFileFields, fieldProps, isGluster);

        model.setBooleanValues(glusterAndNfsAnsFileFields, fieldProps, isNfs || isGluster);
        model.setBooleanValues(requiredGlusterAndNfsFields, ["required"], isNfs || isGluster);

        model.model.storage.LunID.showInReview = isIscsi || isFc;

        this.setState({ model });
    }

    validateConfigUpdate(propName) {
        const config = this.state.storageConfig;
        const errorMsgs = {};
        const prop = config[propName];
        const propErrorMsg = getErrorMsgForProperty(prop);

        if (propErrorMsg !== "") {
            errorMsgs[propName] = propErrorMsg;
        }

        this.setState({ errorMsg: "", errorMsgs });
    }

    handleCollapsibleSectionChange(sectionName) {
        const sections = this.state.collapsibleSections;
        sections[sectionName] = !sections[sectionName];
        this.setState(sections);
    }

    validateAllInputs() {
        let errorMsg = "";
        let errorMsgs = {};
        let propsAreValid = validatePropsForUiStage("Storage", this.state.heSetupModel, errorMsgs);

        if (!propsAreValid) {
            errorMsg = messages.GENERAL_ERROR_MSG;
        }

        this.setState({ errorMsg, errorMsgs });
        return propsAreValid;
    }

    getIscsiTargetList() {
        this.setState({ targetRetrievalStatus: status.POLLING,
                        iscsiTargetData: null,
                        iscsiLunData: null,
                        lunRetrievalStatus: status.EMPTY,
                        errorMsg: "",
                        errorMsgs: {}
        });
        const self = this;
        this.storageUtil.getTargetList()
            .then(targetData => self.setState({ targetRetrievalStatus: status.SUCCESS, iscsiTargetData: targetData }))
            .catch(error => {
                console.log("Error: " + error);
                self.setState({ targetRetrievalStatus: status.FAILURE });
            });
    }

    handleTargetSelection(target, tpgts) {
        this.setState({ selectedIscsiTarget: target, iscsiLunData: null, errorMsg: "", errorMsgs: {} });
        const config = this.state.storageConfig;

        const tpgtData = this.getTpgtData(tpgts);
        config.iSCSITPGT.value = tpgtData.name;
        config.storageAddress.value = tpgtData.portalAddresses.toString();
        config.iSCSIPortalPort.value = tpgtData.portalPorts.toString();
        config.iSCSITargetName.value = target;

        this.setState({ config });
        this.getIscsiLunList();
    }

    getTpgtData(tpgts) {
        const tpgtData = {
            name: "",
            portalAddresses: [],
            portalPorts: []
        };

        const tpgtArr = Object.getOwnPropertyNames(tpgts);
        if (tpgtArr.length <= 0) {
            return tpgtData;
        }

        const tpgt = tpgts[tpgtArr[0]];
        tpgtData.name = tpgt.name;
        tpgt.portals.forEach(function(portal) {
            tpgtData.portalAddresses.push(portal.address);
            tpgtData.portalPorts.push(portal.port);
        });

        return tpgtData;
    }

    getIscsiLunList() {
        this.setState({ lunRetrievalStatus: status.POLLING, iscsiLunData: null });
        const self = this;
        this.storageUtil.getLunList()
            .then(lunData => self.setState({ lunRetrievalStatus: status.SUCCESS, iscsiLunData: lunData }))
            .catch(error => {
                console.log("Error: " + error);
                self.setState({ lunRetrievalStatus: status.FAILURE });
            });
    }

    handleLunSelection(lunId) {
        this.setState({ selectedLun: lunId, errorMsg: "", errorMsgs: {} });
        const config = this.state.storageConfig;
        config.LunID.value = lunId;
        this.setState({ config });
    }

    getFcLunList() {
        this.setState({ fcLunDiscoveryStatus: status.POLLING, fcLunData: null });
        const self = this;
        this.storageUtil.getFcLunsList()
            .then(lunData => self.setState({ fcLunDiscoveryStatus: status.SUCCESS, fcLunData: lunData }))
            .catch(error => {
                console.log("Error: " + error);
                self.setState({ fcLunDiscoveryStatus: status.FAILURE });
            });
    }

    handleFcLunSelection(lunId) {
        this.setState({ selectedFcLun: lunId });
        const config = this.state.storageConfig;
        config.LunID.value = lunId;
        this.setState({ config });
    }

    shouldComponentUpdate(nextProps, nextState){
        if(!this.props.validating && nextProps.validating){
            this.props.validationCallBack(this.validateAllInputs())
        }
        return true;
    }

    render() {
        return (
            <HeWizardStorage
                collapsibleSections={this.state.collapsibleSections}
                deploymentType={this.props.deploymentType}
                errorMsg={this.state.errorMsg}
                errorMsgs={this.state.errorMsgs}
                storageConfig={this.state.storageConfig}
                handleStorageConfigUpdate={this.handleStorageConfigUpdate}
                handleCollapsibleSectionChange={this.handleCollapsibleSectionChange}
                // iSCSI Targets
                targetRetrievalStatus={this.state.targetRetrievalStatus}
                handleIscsiTargetRequest={this.getIscsiTargetList}
                handleTargetSelection={this.handleTargetSelection}
                selectedIscsiTarget={this.state.selectedIscsiTarget}
                iscsiTargetData={this.state.iscsiTargetData}
                // iSCSI LUNs
                lunRetrievalStatus={this.state.lunRetrievalStatus}
                handleLunSelection={this.handleLunSelection}
                selectedLun={this.state.selectedLun}
                iscsiLunData={this.state.iscsiLunData}
                // Fibre Channel LUNs
                fcLunDiscoveryStatus={this.state.fcLunDiscoveryStatus}
                handleFcLunDiscoveryRequest={this.getFcLunList}
                handleFcLunSelection={this.handleFcLunSelection}
                selectedFcLun={this.state.selectedFcLun}
                fcLunData={this.state.fcLunData} />
        )
    }
}

HeWizardStorageContainer.propTypes = {
    stepName: PropTypes.string.isRequired,
    model: PropTypes.object.isRequired,
    deploymentType: PropTypes.string.isRequired
};

export default HeWizardStorageContainer
