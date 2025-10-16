#    Copyright 2016 Red Hat Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

OVIRT_CACHE_DIR	?= $(HOME)/ovirt-cache

SHELL := /bin/bash

SUBDIRS = \
	dashboard

EXTRA_DIST = \
	autogen.sh \
	cockpit-ovirt.spec \
	cockpit-ovirt.spec.in \
	README.md \
	LICENSE

DISTCLEANFILES = $(PACKAGE)-$(VERSION).tar.gz \
	aclocal.m4 \
	configure \
	install-sh \
	missing \
	Makefile.in \
	.bash_history \
	mocker-*.cfg

DISTCLEANDIRS = autom4te.cache \
	engine-plugin \
	tmp.repos \
	.node-gyp \
	exported-artifacts \
	rpmbuild

TMPREPOS = tmp.repos
RPMBUILD_ARGS :=
RPMBUILD_ARGS += --define="_topdir `pwd`/$(TMPREPOS)"
RPMBUILD_ARGS += $(if $(RELEASE_SUFFIX), --define="release_suffix ${RELEASE_SUFFIX}")

srpm:	dist
	rm -fr "$(TMPREPOS)"
	mkdir -p $(TMPREPOS)/{SPECS,RPMS,SRPMS,SOURCES}
	$(RPMBUILD) $(RPMBUILD_ARGS) -ts "$(PACKAGE_TARNAME)-$(PACKAGE_VERSION).tar.gz"
	@echo
	@echo "srpm available at '$(TMPREPOS)'"
	@echo

rpm:	srpm
	$(RPMBUILD) $(RPMBUILD_ARGS) --rebuild "$(TMPREPOS)"/SRPMS/*.src.rpm
	@echo
	@echo "rpm(s) available at '$(TMPREPOS)'"
	@echo

snapshot-rpm: SNAPSHOT_DATE = $(shell date --utc +%Y%m%d)
snapshot-rpm: SNAPSHOT_COMMIT ?= $(shell git rev-parse --short HEAD)
snapshot-rpm:
	make rpm RELEASE_SUFFIX=".$(SNAPSHOT_DATE).git$(SNAPSHOT_COMMIT)"

publish:
	mkdir -p $(OVIRT_CACHE_DIR)
	rsync -aq $(TMPREPOS)/ $(OVIRT_CACHE_DIR)/ovirt
	createrepo $(OVIRT_CACHE_DIR)/ovirt

distclean-local:
	rm -rf $(DISTCLEANDIRS)

.PHONY: srpm rpm snapshot-rpm publish

# vim: ts=2
