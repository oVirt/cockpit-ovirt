%global _plugindir cockpit/ovirt

Name:           cockpit-ovirt
Version:        0.2
Release:        1%{?dist}
Summary:        Virtual Machine Management plugin for Cockpit based on oVirt.
License:        MIT
URL:            https://github.com/mareklibra/%{name}
Source0:        https://github.com/mareklibra/%{name}/archive/v%{version}.tar.gz#/%{name}-%{version}.tar.gz
BuildArch:      noarch

BuildRequires: nodejs
Requires: cockpit
Requires: vdsm

%description
Virtual Machine Management plugin for Cockpit based on oVirt.

%prep
%setup -q -n %{name}-%{version}
echo PWD: `pwd`
npm i

%build
npm run build

%install
mkdir -p %{buildroot}%{_datadir}/%{_plugindir}
cp -r dist/* %{buildroot}%{_datadir}/%{_plugindir}
chmod a+x %{buildroot}%{_datadir}/%{_plugindir}/vdsm/vdsm

%files
%doc README.md 
%license LICENSE
%{_datadir}/%{_plugindir}

%changelog
* Fri Mar 11 2016 Marek Libra <mlibra@redhat.com> - 0.2
* Thu Mar 03 2016 Marek Libra <mlibra@redhat.com> - 0.1
- Initial packaging

