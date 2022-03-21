dnl
dnl   Copyright 2016-2021 Red Hat Inc.
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
define([VERSION_MINOR], [16])
define([VERSION_FIX], [0])
define([VERSION_NUMBER], VERSION_MAJOR[.]VERSION_MINOR[.]VERSION_FIX)
define([VERSION_RELEASE], [1])
define([VERSION_SUFFIX],[])

AC_INIT([cockpit-ovirt], VERSION_NUMBER[]VERSION_SUFFIX, [devel@ovirt.org])
PACKAGE_RPM_VERSION="VERSION_NUMBER"
PACKAGE_RPM_RELEASE="VERSION_RELEASE"
AC_SUBST([VERSION_NUMBER])
AC_SUBST([PACKAGE_RPM_VERSION])
AC_SUBST([PACKAGE_RPM_RELEASE])
AC_SUBST([PLUGINNAME], ['oVirt Cockpit Plugin'])

AC_SUBST([COMMIT],
         [$( git ls-remote http://gerrit.ovirt.org/cockpit-ovirt.git |
             grep $PACKAGE_TARNAME-$PACKAGE_RPM_VERSION-$PACKAGE_RPM_RELEASE |
             awk '{print $1}' )])

AC_ARG_WITH([rhev],
            [AC_HELP_STRING([--with-rhev],
            [Build cockpit-ovirt for RHEV])])

if test -z "$with_rhev"; then
    RHEV="oVirt"
    INSTALL_GUIDE_LINK="https://ovirt.org/documentation/installing_ovirt_as_a_self-hosted_engine_using_the_cockpit_web_interface/"
    MORE_INFO_LINK="https://www.ovirt.org/"
    MORE_INFO_LINK_TEXT="oVirt Homepage"
else
    RHEV=""
    INSTALL_GUIDE_LINK="https://access.redhat.com/documentation/en-us/red_hat_virtualization/4.4/html/installing_red_hat_virtualization_as_a_self-hosted_engine_using_the_cockpit_web_interface/index"
    MORE_INFO_LINK="https://access.redhat.com/documentation/en-us/red_hat_virtualization/4.4"
    MORE_INFO_LINK_TEXT="RHV Documentation"
fi

AC_SUBST(INSTALL_GUIDE_LINK)
AC_SUBST(MORE_INFO_LINK)
AC_SUBST(MORE_INFO_LINK_TEXT)

AC_ARG_WITH([yarn-install],
            [AC_HELP_STRING([--with-yarn-install],
            [enable the online installation of needed dependencies using yarn])],
            [YARNINSTALL="yes"],
            [YARNINSTALL="no"])

AC_SUBST([YARNINSTALL])

AC_SUBST([RHEV])
AM_CONDITIONAL([RHEV], [test -z "$RHEV"])

AM_INIT_AUTOMAKE([-Wall -Werror foreign -Wno-portability tar-pax])

AC_ARG_VAR([RPMBUILD], [path to rpmbuild utility])
AC_CHECK_PROGS([RPMBUILD], [rpmbuild])

AC_ARG_VAR([YARN], [path to yarn utility])
AC_CHECK_PROGS([YARN], [yarn])
test -z "${YARN}" && AC_MSG_ERROR([yarn nodejs package manager not found])

AC_CONFIG_FILES([
	Makefile
	dashboard/Makefile
	dashboard/src/routes/routes.js
	dashboard/src/components/HeSetupFooter.js
	cockpit-ovirt.spec
])


AC_OUTPUT
