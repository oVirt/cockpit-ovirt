# Cockpit-oVirt plugins
This repository holds the oVirt Node cockpit dashboard and the oVirt Cockpit VDSM plugin.

See the [VDSM plugin README](vdsm/README.md) for more information about the features provided by the VDSM plugin.

### About Cockpit
[Cockpit](http://cockpit-project.org/) is easy-to-use sysadmin tool with web-based UI.

### About oVirt
[oVirt](http://www.ovirt.org/Home) manages Virtual Machines (VMs) in a datacenter/cluster.
Scales easily from tens to tens of thousands VMs running on multiple KVM hypervisor hosts.

oVirt deals with:
* VM definition, monitoring and tuning
* (automatic|manual) migration
* storage or network management
* SLA
* security
* easy to use web UI
* and more (see [website](http://www.ovirt.org/Home))


## How to Install
### Install build RPMs from source
#### Dependencies
For build you will need [Node.js](https://nodejs.org/) v4 (LTS). If your OS repositories don't contain
required version you can always use Node Version Manager [nvm](https://github.com/creationix/nvm) to
install and manage multiple Node.js versions side by side.

A recent version of Node.js can be acquired via packages from [NodeSource](http://nodesource.com). See the [installation instructions](https://nodejs.org/en/download/package-manager/#enterprise-linux-and-fedora) on the Node.js website.


#### Building

Be sure to install nodejs package as it will be required by the build, then run

./configure && make

If you want to downlod required NodeJS libraries during the build instead of
providing them as system libraries, you can add --with-npm-install flag to
the configure command. 


#### Building RPMs
./autogen.sh && make rpm

The RPMs will be available under tmp.repos


## More Info
* About [oVirt](http://www.ovirt.org/Home)
* oVirt [Quick Start Guide](http://www.ovirt.org/Quick_Start_Guide)
* About [Cockpit](http://cockpit-project.org/)
