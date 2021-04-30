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

cockpitdir=$(datarootdir)/cockpit

EXTRA_DIST = \
	src \
	static \
	.babelrc.js \
	.eslintrc \
	package.json \
	README.md \
	webpack.config.js \
	yarn.lock

DISTCLEANDIRS = \
	node_modules \
	ovirt-dashboard

DISTCLEANFILES = \
	Makefile.in

yarn-install:
	[[ "$(YARNINSTALL)" != "yes" ]] || $(YARN) install

ovirt-dashboard: yarn-install
	sed -i "s/\"version\":.*$$/\"version\": \"$(VERSION_NUMBER)\",/" package.json
	$(YARN) run build

install-data-local:
	$(MKDIR_P) $(DESTDIR)/$(cockpitdir)
	cp -rpv ovirt-dashboard $(DESTDIR)$(cockpitdir)

distclean-local:
	rm -rf $(DISTCLEANDIRS)

all: ovirt-dashboard

check-local: yarn-install
	$(YARN) test

.PHONY: ovirt-dashboard yarn-install

# vim: ts=2
