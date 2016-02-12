# Cockpit-oVirt plugin
Virtual Machine Management plugin for Cockpit based on oVirt. 

Features in recent release:

* list of VMs running on a host
* single VM detail
* VM statistics (monitoring)
* basic VM operations
* plugin's components are embeddable to other tools/dashboard, like VM detail

* With optional Engine login available
    * list of VMs administered by the oVirt Engine in a cluster
    * VM details


The plugin requires Virtual Desktop Server Manager [VDSM](http://www.ovirt.org/Installing_VDSM_from_rpm), part of the oVirt project.

With **optional** [oVirt Engine](http://www.ovirt.org/Quick_Start_Guide) installed, the plugin allows basic monitoring/management of VMs administered by the engine beyond the scope of the single host running the cockpit. 

### About Cockpit
[Cockpit](http://cockpit-project.org/) is easy-to-use sysadmin tool with web-based UI.
 
### About oVirt
[oVirt](http://www.ovirt.org/Home) manages Virtual Machines (VMs) in a datacenter/cluster. 
Scales easily from tens to tens of thousands VMs running on multiple KVM hypervisor hosts.

The oVirt deals with
* VM definition, monitoring and tuning
* (automatic|manual) migration
* storage or network management
* SLA
* security
* easy to use web UI
* and more (see [website](http://www.ovirt.org/Home))
  

## How to Install
### Prerequisites 
* Install [VDSM](http://www.ovirt.org/Installing_VDSM_from_rpm)
* Optional: Install [oVirt Engine](http://www.ovirt.org/Quick_Start_Guide)
* Install [Cockpit](http://cockpit-project.org/running.html)
    * make sure cockpit is started/enabled
        * systemctl enable cockpit.socket
        * systemctl start cockpit

### Install Plugin
* copy/git-clone sources to /root/.local/share/cockpit/ovirt/

* **Alternative:**
    * copy sources to /usr/share/cockpit/ovirt
    * change VDSM variable in ovirt.js to new location of vdsm/vdsm shell script
    
### Verify
* Follow: https://<YOUR_HOST>:9090/ovirt/ovirt

## TODO 
Please note, the plugin is in early development state.

To Be Done:
* VMs list
    * sorting
* VM Detail
    * refine displayed VM data relevant for the user
* General
    * autorefresh (5-10 seconds interval)
    * event driven (continuous) data refresh? Based on DBus
    * patternfly to unify look&feel
        * widgets
        * icons
        * layout?
    * i18n
    * JS project build infrastructure
    * plugin config outside the main ovirt.js script
    * packaging
    * testing for non-root users
* Engine VMs tab
    * link to VM detail to remote cockpit
    * VM list limited to a single cluster 
* Engine integration
    * SSO to log in Engine 
* VDSM tab
    * link to VDSM service in cockpit (for restart, status, log, etc.)
    * editor for vdsm.conf


## More Info
* About [oVirt](http://www.ovirt.org/Home)
* oVirt [Quick Start Guide](http://www.ovirt.org/Quick_Start_Guide)
* About [Cockpit](http://cockpit-project.org/) 

