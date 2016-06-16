dnl
dnl Licensed to the Apache Software Foundation (ASF) under one or more
dnl contributor license agreements.  See the NOTICE file distributed with
dnl this work for additional information regarding copyright ownership.
dnl The ASF licenses this file to You under the Apache License, Version 2.0
dnl (the "License"); you may not use this file except in compliance with
dnl the License.  You may obtain a copy of the License at
dnl
dnl     http://www.apache.org/licenses/LICENSE-2.0
dnl
dnl Unless required by applicable law or agreed to in writing, software
dnl distributed under the License is distributed on an "AS IS" BASIS,
dnl WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
dnl See the License for the specific language governing permissions and
dnl limitations under the License.
dnl

AC_PREREQ(2.60)

define([VERSION_MAJOR], [0])
define([VERSION_MINOR], [10])
define([VERSION_FIX], [5])
define([VERSION_NUMBER], VERSION_MAJOR[.]VERSION_MINOR[.]VERSION_FIX)
define([VERSION_RELEASE], [1.0])
define([VERSION_SUFFIX],[0])

AC_INIT([cockpit-ovirt], VERSION_NUMBER[-]VERSION_RELEASE[.]VERSION_SUFFIX, [devel@ovirt.org])
PACKAGE_RPM_VERSION="VERSION_NUMBER"
PACKAGE_RPM_RELEASE="VERSION_RELEASE.VERSION_SUFFIX"
AC_SUBST([PACKAGE_RPM_VERSION])
AC_SUBST([PACKAGE_RPM_RELEASE])
AC_SUBST([PLUGINNAME], ['oVirt Cockpit Plugin'])

AC_ARG_WITH([vdsm], [AC_HELP_STRING([--with-vdsm],
            [enable the VDSM plugin for the dashboard])],
            [VDSM=""], [VDSM="//"])
AC_SUBST([VDSM])
AM_CONDITIONAL([VDSM], [test -z "$VDSM"])

AM_INIT_AUTOMAKE([-Wall -Werror foreign -Wno-portability tar-pax])

AC_ARG_VAR([RPMBUILD], [path to rpmbuild utility])
AC_CHECK_PROGS([RPMBUILD], [rpmbuild])

AM_PATH_PYTHON

AM_COND_IF([VDSM],
           AC_CONFIG_FILES([vdsm/Makefile]))

AC_CONFIG_FILES([Makefile
                 dashboard/Makefile
                 dashboard/src/routes/routes.js
                 cockpit-ovirt.spec
                 ovirt-uiplugin/Makefile])

dnl AM_COND_IF([VDSM],
dnl            [AC_CONFIG_FILES([vdsm/Makefile])])

AC_OUTPUT
