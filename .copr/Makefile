.PHONY: installdeps srpm git_config_pre

installdeps:
	dnf -y install git make autoconf automake python3-devel rpm-build gettext-devel

git_config_pre:
	# From git 2.35.2 we need to mark temporary directory, where the project is cloned to, as safe, otherwise
	# git commands won't work
	git config --global --add safe.directory "$(shell pwd)"

srpm: installdeps git_config_pre
	./automation/build-artifacts.sh copr
	cp exported-artifacts/*.src.rpm $(outdir)
