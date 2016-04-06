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

cockpitdir=$(datarootdir)/cockpit

export PATH := /usr/share/ovirt-engine-nodejs/bin:$(PATH)

EXTRA_DIST = \
  README.md \
  ovirt-node-dashboard

DISTCLEANDIRS = node_modules \
  ovirt-node-dashboard

ovirt-node-dashboard:
	npm i
	npm run build
	mv dist ovirt-node-dashboard

dist: ovirt-node-dashboard

install-data-local:
	$(MKDIR_P) $(DESTDIR)/${cockpitdir}
	cp -rpv ovirt-node-dashboard $(DESTDIR)$(cockpitdir)

distclean-local:
	rm -rf ${DISTCLEANDIRS}

test:
	npm i
	npm test

.PHONY: install

# vim: ts=2
