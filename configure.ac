dnl
dnl   Copyright 2016 Red Hat Inc.
dnl
dnl   Licensed under the Apache License, Version 2.0 (the "License");
dnl   you may not use this file except in compliance with the License.
dnl   You may obtain a copy of the License at
dnl
dnl       http://www.apache.org/licenses/LICENSE-2.0
dnl
dnl   Unless required by applicable law or agreed to in writing, software
dnl   distributed under the License is distributed on an "AS IS" BASIS,
dnl   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
dnl   See the License for the specific language governing permissions and
dnl   limitations under the License.
dnl

AC_PREREQ(2.60)

define([VERSION_MAJOR], [0])
define([VERSION_MINOR], [11])
define([VERSION_FIX], [0])
define([VERSION_NUMBER], VERSION_MAJOR[.]VERSION_MINOR[.]VERSION_FIX)
define([VERSION_RELEASE], [0.1])
define([VERSION_SUFFIX],[master])

AC_INIT([cockpit-ovirt], VERSION_NUMBER, [devel@ovirt.org])
PACKAGE_RPM_VERSION="VERSION_NUMBER"
PACKAGE_RPM_RELEASE="VERSION_RELEASE.VERSION_SUFFIX"
AC_SUBST([PACKAGE_RPM_VERSION])
AC_SUBST([PACKAGE_RPM_RELEASE])
AC_SUBST([PLUGINNAME], ['oVirt Cockpit Plugin'])

AC_SUBST([COMMIT],
         [$( git ls-remote http://gerrit.ovirt.org/cockpit-ovirt.git |
             grep $PACKAGE_TARNAME-$PACKAGE_VERSION |
             awk '{print $1}' )])

AC_ARG_WITH([rhev], [AC_HELP_STRING([--with-rhev],
            [Build cockpit-ovirt for RHEV])],
            [RHEV=""], [RHEV="//"])

AC_ARG_WITH([npm-install], [AC_HELP_STRING([--with-npm-install],
            [enable the installation of needed dependencies using npm])],
            [NPMINSTALL="//"], [NPMINSTALL=""])

AC_SUBST([NPMINSTALL])

AC_SUBST([RHEV])
AM_CONDITIONAL([RHEV], [test -z "$RHEV"])

AM_INIT_AUTOMAKE([-Wall -Werror foreign -Wno-portability tar-pax])

AC_ARG_VAR([RPMBUILD], [path to rpmbuild utility])
AC_CHECK_PROGS([RPMBUILD], [rpmbuild])

AM_PATH_PYTHON

AC_ARG_VAR([NPM], [path to npm utility])
AC_CHECK_PROGS([NPM], [npm])
test -z "${NPM}" && AC_MSG_ERROR([NodeJS npm program not found])

AC_ARG_ENABLE(
	[python-syntax-check],
	[AS_HELP_STRING([--disable-python-syntax-check], [disable python syntax check @<:@default=enabled@:>@])],
	,
	[enable_python_syntax_check="yes"]
)
AM_CONDITIONAL([PYTHON_SYNTAX_CHECK], [test "${enable_python_syntax_check}" = "yes"])

AC_ARG_VAR([PYFLAKES], [path to pyflakes utility])
AC_CHECK_PROGS([PYFLAKES], [pyflakes])
AC_ARG_VAR([PEP8], [path to pep8 utility])
AC_CHECK_PROGS([PEP8], [pep8])

AC_CONFIG_FILES([
	Makefile
	dashboard/Makefile
	dashboard/src/routes/routes.js
	cockpit-ovirt.spec
])


AC_OUTPUT
