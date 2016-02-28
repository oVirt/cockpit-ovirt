// --- global configuration ---------------------------------------------
var CONFIG = {
    isDebug: true,
    vdsm: {
        client_path: "/root/.local/share/cockpit/ovirt/vdsm/vdsm",
        conf_file_name: "/etc/vdsm/vdsm.conf"
    },
    cockpit: {
        port: 9090,
        ovirtComponent : "/ovirt/ovirt"

    },
    reload: {
        delay_after_vdsm_action: 1000,// one second
        auto_refresh_interval: 3000,
        auto_clear_msg_delay: 5000
    },
    threshold: {
       maxLengthVmUsage: 20 // maximal number of historical usage records
    },
    charts: {
        usage_chart_max_points: 17
    }
};

//var USAGE_CHART_TIMESTAMP_DENSITY = 3;
var VM_STATUS_ICONS_PATH_PREFIX = "external/images/";
var VM_STATUS_ICONS = {
//    "Default": "",
    "down": "off.png",
    "up": "on.png",
    "powering up":"powering_up.png",
    "powering down": "powering_down.png"
    //"Paused":""
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
};
