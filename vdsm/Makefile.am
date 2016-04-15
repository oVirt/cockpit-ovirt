# Copyright (C) 2016 Red Hat, Inc.
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; version 3 of the License.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
# MA  02110-1301, USA.  A copy of the GNU General Public License is
# also available at http://www.gnu.org/copyleft/gpl.html.

plugindir=$(datarootdir)/cockpit/ovirt-dashboard

export PATH := /usr/share/ovirt-engine-nodejs/bin:$(PATH)

EXTRA_DIST = \
	README.md \
	vdsm

DISTCLEANDIRS = node_modules \
	vdsm

vdsm:
	npm i
	npm run build
	chmod a+x dist/vdsm/vdsm
	mv dist vdsm

all: vdsm

install-data-local:
	$(MKDIR_P) $(DESTDIR)/${plugindir}
	cp -rpv vdsm $(DESTDIR)$(plugindir)

distclean-local:
	rm -rf ${DISTCLEANDIRS}

all: vdsm

test:
	npm i
	npm test

.PHONY: all

# vim: ts=2
