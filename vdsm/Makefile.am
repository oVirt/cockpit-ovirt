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

plugindir=$(datarootdir)/cockpit/ovirt-dashboard

export PATH := /usr/share/ovirt-engine-nodejs/bin:../node_modules/.bin:$(PATH)

EXTRA_DIST = \
	README.md \
	.eslintrc \
	package.json \
	webpack.config.js \
	GenerateI18N.js \
	src \
	static \
	po

DISTCLEANDIRS = node_modules \
	vdsm

vdsm:
	test -z "$(NPMINSTALL)" || $(NPM) i
	$(NPM) run build
	chmod a+x dist/vdsm/vdsm
	mv dist vdsm

all-local: vdsm

install-data-local:
	$(MKDIR_P) $(DESTDIR)/${plugindir}
	cp -rpv vdsm $(DESTDIR)$(plugindir)

distclean-local:
	rm -rf ${DISTCLEANDIRS}

check-local:
	$(NPM) test

.PHONY: all

# vim: ts=2
