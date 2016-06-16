// --- global configuration ---------------------------------------------
export const CONFIG = {
  vdsm: {
    client_path: '/usr/share/cockpit/ovirt-dashboard/vdsm/vdsm/vdsm',
    conf_file_name: '/etc/vdsm/vdsm.conf'
  },
  cockpit: {
    port: 9090,
    ovirtComponent: '/ovirt/ovirt'

  },
  reload: {
    delay_after_vdsm_action: 1000, // one second
    auto_refresh_interval: 30000,
    auto_refresh_interval_first: 2000,
    auto_clear_msg_delay: 5000
  },
  threshold: {
    maxLengthVmUsage: 20 // maximal number of historical usage records
  },
  charts: {
    usage_chart_max_points: 17
  },
  vmsList: {
    pageLength: 10
  }
}

// Prepare development settings
function setupForDebug () {
  if (typeof __DEV__ !== 'undefined') {
    console.log('Setting up for development ...')

    // CONFIG.vdsm.client_path = '/root/.local/share/cockpit/ovirt-dashboard/vdsm/vdsm'
    // CONFIG.reload.auto_refresh_interval = 5000
  }
}
setupForDebug()

// const USAGE_CHART_TIMESTAMP_DENSITY = 3;
export const VM_STATUS_ICONS_PATH_PREFIX = 'images/'
export const VM_STATUS_ICONS = {
//    "Default": "",
  'down': 'off.png',
  'up': 'on.png',
  'powering up': 'powering_up.png',
  'powering_up': 'powering_up.png',
  'powering down': 'powering_down.png',
  'powering_down': 'powering_down.png',
  'rebootinprogress': 'vm_rebooting.png'
    // "Paused":""
    /*    MigratingFrom = 5,
     MigratingTo = 6,
     Unknown = 7,
     NotResponding = 8,
     WaitForLaunch = 9,
     RebootInProgress = 10,
     SavingState = 11,
     RestoringState = 12,
     Suspended = 13,
     ImageIllegal = 14,
     ImageLocked = 15,
     PoweringDown = 16*/
}
