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

test:

.PHONY: all

# vim: ts=2
