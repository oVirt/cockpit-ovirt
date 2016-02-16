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
    * recently only **master** oVirt release is supported
    * Centos 7 (minimal):
        * have FQDN, DNS, DHCP set and working
        * yum install http://resources.ovirt.org/pub/yum-repo/ovirt-release-master.rpm
        * yum install vdsm

* Optional: Install [oVirt Engine](http://www.ovirt.org/Quick_Start_Guide)
    * recently only **master** oVirt release is supported
    * Centos 7 (minimal):
        * have FQDN, DNS, DHCP set and working
        * yum install http://resources.ovirt.org/pub/yum-repo/ovirt-release-master.rpm
        * yum install ovirt-engine
        * engine-setup

* Install [Cockpit](http://cockpit-project.org/running.html)
    * yum install cockpit
    * make sure cockpit is started/enabled:
        * systemctl enable cockpit.socket
        * systemctl start cockpit

### Install Plugin
* copy/git-clone sources to /root/.local/share/cockpit/ovirt/
    *  git clone https://github.com/mareklibra/cockpit-ovirt.git /root/.local/share/cockpit/ovirt/

* **Alternative:**
    * copy sources to /usr/share/cockpit/ovirt
    * change VDSM variable in ovirt.js to new location of vdsm/vdsm shell script
    
* Troubleshooting tips:
    * Installation instructions stated above should lead to successful setup on Centos 7. If not, following tips might help:
        * If VDSM is properly configured, following command should return without any error: 
        
            \# /root/.local/share/cockpit/ovirt/vdsm/vdsm getAllVmStats
    
    * As the plugin is in early development state, **PLEASE let author know about all issues you encounter during installation/use**, it will help in making the product better. 
    
### Verify
* Follow: https://YOUR_HOST:9090/ovirt/ovirt

## TODO 
Please note, the plugin is in early development state.

See TODO.txt for list of planed changes.

## More Info
* About [oVirt](http://www.ovirt.org/Home)
* oVirt [Quick Start Guide](http://www.ovirt.org/Quick_Start_Guide)
* About [Cockpit](http://cockpit-project.org/) 

