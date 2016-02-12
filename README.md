# Cockpit-oVirt plugin
The plugin for Cockpit is a host-based management tool for Virtual Machines.

Recent release features:

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
TBD

### Before
### Install
### Verify


## TODO: The plugin is in early development state.

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

