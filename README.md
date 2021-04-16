# cockpit-ovirt: oVirt plugin for Cockpit Project

Welcome to the oVirt plugin for [Cockpit Project](https://cockpit-project.org/) source repository.

This repository is hosted on [gerrit.ovirt.org:cockpit-ovirt](https://gerrit.ovirt.org/#/admin/projects/cockpit-ovirt)
and a **backup** of it is hosted on [GitHub:cockpit-ovirt](https://github.com/oVirt/cockpit-ovirt)

## About Cockpit
[Cockpit](http://cockpit-project.org/) is easy-to-use sysadmin tool with web-based UI.

## About oVirt
[oVirt](https://ovirt.org/) manages Virtual Machines (VMs) in a datacenter/cluster.
Scales easily from tens to tens of thousands VMs running on multiple KVM hypervisor hosts.

oVirt deals with:
* VM definition, monitoring and tuning
* (automatic|manual) migration
* storage or network management
* SLA
* security
* easy to use web UI
* and more (see [website](https://ovirt.org/))


## How to contribute

### Submitting patches

Patches are welcome!

Please submit patches to [gerrit.ovirt.org:cockpit-ovirt](https://gerrit.ovirt.org/#/admin/projects/cockpit-ovirt).
If you are not familiar with the review process for Gerritt patches you can read about [Working with oVirt Gerrit](https://ovirt.org/develop/dev-process/working-with-gerrit.html)
on the [oVirt](https://ovirt.org/) website.

**NOTE**: We might not notice pull requests that you create on Github, because we only use Github for backups.


### Found a bug or documentation issue?
To submit a bug or suggest an enhancement for cockpit-ovirt please use
[oVirt Bugzilla for cockpit-ovirt product](https://bugzilla.redhat.com/enter_bug.cgi?product=cockpit-ovirt).

If you find a documentation issue on the oVirt website please navigate and click "Report an issue on GitHub" in the page footer.


## Still need help?
If you have any other questions, please join [oVirt Users forum / mailing list](https://lists.ovirt.org/admin/lists/users.ovirt.org/) and ask there.


## How to Install
### Install build RPMs from source
#### Dependencies
For build you will need [Node.js](https://nodejs.org/) v4 (LTS). If your OS repositories don't contain
required version you can always use Node Version Manager [nvm](https://github.com/creationix/nvm) to
install and manage multiple Node.js versions side by side.

A recent version of Node.js can be acquired via packages from [NodeSource](http://nodesource.com).
See the [installation instructions](https://nodejs.org/en/download/package-manager/#enterprise-linux-and-fedora) on the Node.js website.


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
* About [oVirt](https://ovirt.org/)
* About [Cockpit](http://cockpit-project.org/)
