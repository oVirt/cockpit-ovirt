# cockpit-ovirt: oVirt plugin for Cockpit Project

[![Copr build status](https://copr.fedorainfracloud.org/coprs/ovirt/ovirt-master-snapshot/package/cockpit-ovirt/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/ovirt/ovirt-master-snapshot/package/cockpit-ovirt/)

Welcome to the oVirt plugin for [Cockpit Project](https://cockpit-project.org/) source repository.

## About Cockpit
[Cockpit](http://cockpit-project.org/) is easy-to-use sysadmin tool with web-based UI.

## About oVirt
[oVirt](https://ovirt.org/) manages Virtual Machines (VMs) in a data center/cluster.
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

Pull requests on github are welcome!

### Found a bug or documentation issue?
To submit a bug or suggest an enhancement for cockpit-ovirt please use
[GitHub issues](https://github.com/oVirt/cockpit-ovirt/issues).

If you find a documentation issue on the oVirt website please navigate and click "Report an issue on GitHub" in the page footer.


## Still need help?
If you have any other questions, please join [oVirt Users forum / mailing list](https://lists.ovirt.org/admin/lists/users.ovirt.org/) and ask there.


## How to build from source

### Prerequisites
  - Have packages `autoconf`, `automake` and `libtool` installed
  - Have `yarn` and `nodejs` installed
  - Not strictly required but **suggested**, use the `ovirt-engine-nodejs-modules` package
  - `git clone` the repository

For build you will need [Node.js](https://nodejs.org/) >= 10. If your OS repositories don't contain
required version you can always use Node Version Manager [nvm](https://github.com/creationix/nvm) to
install and manage multiple Node.js versions side by side.

A recent version of Node.js can be acquired via packages from [NodeSource](http://nodesource.com).
See the [installation instructions](https://nodejs.org/en/download/package-manager/#enterprise-linux-and-fedora)
on the Node.js website.

#### ovirt-engine packages
Install `ovirt-engine-nodejs-modules` from the `ovirt/tested` yum repo for your platform
to use the same packages that will be used by CI to build the app in offline mode.

    REPO=el8 # or the appropriate release and version for you
    dnf config-manager --add-repo http://resources.ovirt.org/repos/ovirt/tested/master/rpm/$REPO
    dnf install ovirt-engine-nodejs-modules

The `ovirt-engine-nodejs-modules` package provides `yarn`, and a yarn offline cache.  To
enable their use for development or building run:

    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh

If you want to stop using `yarn` offline, `yarn` will need to be reconfigured to remove
the offline mirror added by `setup-env.sh`:

    yarn config delete yarn-offline-mirror


### Building

Be sure to install the dependencies, then run:

  ./autogen.sh
  make

If you want to download required NodeJS libraries during the build instead of
providing them as system libraries, you can add --with-yarn-install flag to
the configure command:

  ./autogen.sh --with-yarn-install
  make


### Building RPMs
There are at least 2 easy ways to build the RPM for the project:

#### Manually with `make rpm`
Run the command and the RPMs will be available under `tmp.repos/`

    ./autogen.sh
    make rpm

#### mock_runner
Use [mock_runner](https://ovirt-infra-docs.readthedocs.io/en/latest/CI/Using_mock_runner/index.html)
to run CI build artifacts locally (this method is cleanest since it runs in a chroot).
When the build is complete, the RPMs will be available under `exported-artifacts/`.


## More Info
* About [oVirt](https://ovirt.org/)
* About [Cockpit](http://cockpit-project.org/)
