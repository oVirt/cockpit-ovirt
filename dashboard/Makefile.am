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

export PATH := /usr/share/ovirt-engine-nodejs/bin:../node_modules/.bin:$(PATH)

EXTRA_DIST = \
	README.md \
	.bowerrc \
	.eslintrc \
	src \
	static \
	package.json \
	yarn.lock \
	webpack.config.js

DISTCLEANDIRS = \
	node_modules \
	ovirt-dashboard

ovirt-dashboard:
	sed -i "s/\"version\":.*$$/\"version\": \"${VERSION_NUMBER}\",/" package.json
	test -z "$(NPMINSTALL)" || $(NPM) i
	$(NPM) run build
	mv dist ovirt-dashboard

install-data-local:
	$(MKDIR_P) $(DESTDIR)/${cockpitdir}
	cp -rpv ovirt-dashboard $(DESTDIR)$(cockpitdir)

distclean-local:
	rm -rf ${DISTCLEANDIRS}

all-local: ovirt-dashboard

check-local:
	$(NPM) test


# vim: ts=2
