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

export PATH := /usr/share/ovirt-engine-nodejs/bin:../node_modules/.bin:$(PATH)

EXTRA_DIST = \
  README.md \
	.bowerrc \
	.eslintrc \
	src \
	static \
	package.json \
	webpack.config.js

DISTCLEANDIRS = node_modules \
  ovirt-dashboard

ovirt-dashboard:
	npm run build
	mv dist ovirt-dashboard

install-data-local:
	$(MKDIR_P) $(DESTDIR)/${cockpitdir}
	cp -rpv ovirt-dashboard $(DESTDIR)$(cockpitdir)

distclean-local:
	rm -rf ${DISTCLEANDIRS}

all: ovirt-dashboard

test:
	npm i
	npm test

#.PHONY: all

# vim: ts=2
