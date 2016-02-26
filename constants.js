// --- global configuration ---------------------------------------------
var CONFIG = {
    isDebug: true,
    vdsm : {
        client_path: "/root/.local/share/cockpit/ovirt/vdsm/vdsm",
        conf_file_name: "/etc/vdsm/vdsm.conf"
    },
    reload : {
        delay_after_vdsm_action: 1000,// one second
        auto_refresh_interval: 3000,
        auto_clear_msg_delay: 5000
    },
    charts : {
        usage_chart_max_points: 17
    }
};

//var USAGE_CHART_TIMESTAMP_DENSITY = 3;
