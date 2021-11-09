.PHONY: installdeps srpm

installdeps:
	dnf -y install git make autoconf automake gcc
	dnf --repofrompath=ovirt-master-snapshot,https://download.copr.fedorainfracloud.org/results/ovirt/ovirt-master-snapshot/fedora-34-x86_64/ install -y ovirt-engine-nodejs-modules

srpm: installdeps
	./automation/build-artifacts.sh copr
	cp exported-artifacts/*.src.rpm $(outdir)
