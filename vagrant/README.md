# Cockpit-oVirt Development Environment with Vagrant

## Goal

Provide consistent development environment for cockpit-ovirt plugin developers.

## Prerequisites

* Required packages installed on the host:
  * For all distros:

    ```yum install libvirt libvirt-nss vagrant nfs-utils```
    * libvirt-nss is used for NSS VM name resolution
    * nfs-utils is used for:
      * Synchronizing Local folder with VM.
      * VM Hosted Engine NFS Storage

  * For fedora:

    ```yum install vagrant-libvirt```
  * For centos/rhel:

    ```bash
    yum groups install -y "Development Tools"
    yum -y install qemu-kvm libvirt virt-install bridge-utils libvirt-devel libxslt-devel libxml2-devel libvirt-devel libguestfs-tools-c
    vagrant plugin install vagrant-libvirt
    ```

    For more information see: <https://gist.github.com/kmassada/f3d635fb1d4b8219778d>

* Optional: Enable libvirt NSS name resolution,
  when using libvirt NATed network it's dnsmasq (spawned by libvirt)
  who assigns ip addresses to domains.

  For more information see: <https://libvirt.org/nss.html>

  * Steps:
    * Open file:

      `sudo vi /etc/nsswitch.conf`
    * Add libvirt libvirt_guest to "hosts" after file,
      for example:

      ```bash
      hosts:      files libvirt libvirt_guest ..
      ```

* NFS configuration for Vagrant
  * Install nfs server:

    `yum install nfs-utils`
  * Change nfs type to UDP in file /etc/nfs.conf, append: `udp=y`
  * Restart nfs daemon

    `systemctl restart nfs-server`

* Firewall rules allowing NFS/udp:  (assuming public zone is active)

  ```bash
  systemctl stop iptables
  firewall-cmd --permanent --service=nfs --add-port=2049/udp
  firewall-cmd --permanent --service=nfs3 --add-port=2049/udp
  firewall-cmd --permanent --zone=public --add-service=nfs
  firewall-cmd --permanent --zone=public --add-service=nfs3
  firewall-cmd --permanent --zone=public --add-service=mountd
  firewall-cmd --permanent --zone=public --add-service=rpc-bind
  firewall-cmd --reload
  ```

* Verify that nested Virtualization is enabled:

  ```bash
    $ cat /sys/module/kvm_intel/parameters/nested
    Y
  ```

  * If its "N" then enable nested virtualization on the host:

    ```bash
    $ vi /etc/modprobe.d/kvm-nested.conf
    options kvm-intel nested=1
    options kvm-intel enable_shadow_vmcs=1
    options kvm-intel enable_apicv=1
    options kvm-intel ept=1
    ```

     For more information see: <https://www.linuxtechi.com/enable-nested-virtualization-kvm-centos-7-rhel-7/>

## Configuration

* Create libvirt networks
  * Change folder to vagrant home folder:

    ```bash
    cd <cockpit-ovirt-home>/vagrant
    ```

  * Configure the parameters in vagrant.env,
    these parameters suffice for creating isolated Vagrant virtual environment.

    ```bash
    cat <<__EOF__ >vagrant.env
    export bridge_name=virbr1
    export network_name=localvms
    export network_dhcp_pool_start=192.168.100.128
    export network_dhcp_pool_end=192.168.100.160
    export bridge_ip_address=192.168.100.1
    export bridge_ip_mask=255.255.255.0
    export network_address=192.168.100.0/24
    export domain_name=es.localvms.com
    #Host VM Configuration
    export hosted_engine_mac=52:54:00:45:ca:90
    export hosted_engine_ip=192.168.100.101
    export hosted_engine_vm_name=hosted-engine
    export hosted_engine_memory_in_mb=6096
    export hosted_engine_cpus=2
    #Engine VM Configuration
    export engine_vm_mac=52:54:00:45:ca:91
    export engine_vm_ip=192.168.100.102
    export engine_vm_name=engine
    export ovirt_release=master
    export nfs_export_path=$(realpath ../)
    __EOF__
    ```

  * Apply the new env:

    ```bash
    source vagrant.env
    ```

  * Create Libvirt network XML configuration file.

    ```xml
    cat << __EOF__ | envsubst >localvms.xml
    <network>
        <name>$network_name</name>
        <forward mode='nat'>
            <nat>
                <port start='1024' end='65535'/>
            </nat>
        </forward>
        <domain name='$domain_name' localOnly='yes'/>
        <dns>
            <host ip='$hosted_engine_ip'>
                <hostname>$hosted_engine_vm_name</hostname>
            </host>
            <host ip='$engine_vm_ip'>
                <hostname>$engine_vm_name</hostname>
            </host>
        </dns>

        <bridge name="$bridge_name" stp='on' delay='0' />
        <forward mode="nat" />
        <ip address='$bridge_ip_address' netmask='$bridge_ip_mask'>
            <dhcp>
              <range start='$network_dhcp_pool_start' end='$network_dhcp_pool_end'/>
              <host mac='$hosted_engine_mac' name='$hosted_engine_vm_name' ip='$hosted_engine_ip'/>
              <host mac='$engine_vm_mac' name='$engine_vm_name' ip='$engine_vm_ip'/>
            </dhcp>
        </ip>
    </network>
    __EOF__
    ```

  * Create the virtual network based on the new XML:

    ```bash
    sudo virsh net-define localvms.xml
    ```

## Starting the Hosted-Engine ENV

* Start Vagrant

  ```bash
  cd vagrant/
  source vagrant.env && sudo -E vagrant up
  ```

## Preparing the build env for Cockpit

* On the local host, run these commands from cockit repo root folder:

  ```bash
  ./autogen.sh --with-npm-install
  make
  cd dashboard
  npm run dev
  ```

## Hosted Engine Cockpit deployment

* Access the cockpit UI: `http://<hosted-engine-fqdn>:9090`
  * Username/Password: `root/vagrant`
* Use the values that you used in the vagrant.env file:
  * Host FQDN: `$host_name.$domain_name`
  * Engine VM FQDN: `$vm_name.$domain_name`
  * MAC Address: `$engine_vm_mac` (this is the engine's vm MAC)
  * Network Configuration: DHCP
  * Memory Size (MiB): 4096 MB

* Local NFS Storage:
  Local vagrant NFS storage can be used for the Engine deployment.

* Type NFS:

  ```bash
  Storage Connection: $bridge_ip_address:$nfs_export_path
  ```
## Cleaning the build environment
* Cleaning vagrant resources

  ```bash
  cd vagrant/
  source vagrant.env && sudo -E vagrant destroy
  ```