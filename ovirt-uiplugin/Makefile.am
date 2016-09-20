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

plugindir=$(datarootdir)/ovirt-engine/ui-plugins

#export PATH := /usr/share/ovirt-engine-nodejs/bin:../node_modules/.bin:$(PATH)

pluginfiles = cockpit.json \
	cockpit-resources

EXTRA_DIST = \
	README.cockpit \
	$(pluginfiles)

DISTCLEANDIRS = 

all:

install-data-local:
	$(MKDIR_P) $(DESTDIR)/${plugindir}
	cp -rpv $(pluginfiles) $(DESTDIR)$(plugindir)

distclean-local:
	rm -rf ${DISTCLEANDIRS}

.PHONY: all

# vim: ts=2
