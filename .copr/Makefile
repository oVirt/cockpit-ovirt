.PHONY: installdeps srpm git_config_pre

installdeps:
	dnf -y install git make autoconf automake gcc
	dnf --repofrompath=ovirt-master-snapshot,https://download.copr.fedorainfracloud.org/results/ovirt/ovirt-master-snapshot/fedora-35-x86_64/ install -y ovirt-engine-nodejs-modules

git_config_pre:
	# From git 2.35.2 we need to mark temporary directory, where the project is cloned to, as safe, otherwise
	# git commands won't work
	$(eval REPO_DIR=$(shell pwd))
	git config --global --add safe.directory ${REPO_DIR}

srpm: installdeps git_config_pre
	./automation/build-artifacts.sh copr
	cp exported-artifacts/*.src.rpm $(outdir)
