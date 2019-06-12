
export const CONFIG_FILES = {
    heCommonAnsFile: '/usr/share/cockpit/ovirt-dashboard/gdeploy-templates/he-common.conf',
    heAnsfileFile: '/var/lib/ovirt-hosted-engine-setup/answers/he-answer.conf',
    ansibleStatus: '/usr/share/cockpit/ovirt-dashboard/ansible/ansibleStatus.conf',
    ansibleConfigExample: '/usr/share/cockpit/ovirt-dashboard/ansible/hc_wizard_example_inventory.yml',
    ansibleInventoryFile: '/etc/ansible/hc_wizard_inventory.yml',
    ansibleExpandVolumeInventoryFile: '/etc/ansible/hc_expand_volume_inventory.yml',
    glusterInventory: '/usr/share/ovirt-hosted-engine-setup/gdeploy-inventory.yml',
    distVolumeOptions: {"storage.owner-uid": "36", "storage.owner-gid": "36", "features.shard": "on",
    "performance.low-prio-threads": "32", "performance.strict-o-direct": "on","network.remote-dio": "off", "network.ping-timeout": "30",
    "user.cifs": "off", "nfs.disable": "on", "performance.quick-read": "off", "performance.read-ahead": "off", "performance.io-cache": "off",
    "cluster.eager-lock": "enable"},
    glusterDeploymentLog: "/var/log/cockpit/ovirt-dashboard/gluster-deployment.log",
    glusterCleanupPlayBook: '/etc/ansible/roles/gluster.ansible/playbooks/hc-ansible-deployment/tasks/gluster_cleanup.yml',
    glusterDeploymentCleanUpLog: "/var/log/cockpit/ovirt-dashboard/gluster-deployment_cleanup.log",
}
