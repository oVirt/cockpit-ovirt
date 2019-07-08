export function checkDeployed(callback) {
  let proc = cockpit.spawn(
    ["/usr/sbin/hosted-engine",
    "--check-deployed"]
  )
  .done(function() {
    callback(true)
  })
  .fail(function() {
    callback(false)
  })
}

export function checkInstalled(callback) {
  let cmd = ["which",
            "hosted-engine"]
  let proc = cockpit.spawn(
     cmd,
     {err: "message"}
  )
  .done(function() {
      callback(true)
  })
  .fail(function(err, resp) {
    console.log("hosted-engine is not installed. Disabling functionality")
    callback(false)
  })
}


export function getMetrics(callback) {
  let proc = cockpit.spawn(
    ["/usr/sbin/hosted-engine",
     "--vm-status",
     "--json"]
  )
  .done(function(json) {
    callback(JSON.parse(json))
  })
  .fail(function() {
    console.log("Failed to check hosted-engine --vm-status")
    console.log("even though engine is deployed")
  })
}

export function getHostid(callback) {
  let proc = cockpit.spawn(
    ["/bin/grep",
     'host_id',
     "/etc/ovirt-hosted-engine/hosted-engine.conf"]
  )
  .done(function(host_id) {
    var res = host_id.split("=");
    if (res.length > 1) {
       callback(res[1].trim());
    } else {
       console.log(
         "Failed parsing host_id from /etc/ovirt-hosted-engine/hosted-engine.conf"
       );
    }
  })
  .fail(function(err) {
    console.log(
      "Failed to get hosted-engine host_id even though engine is deployed:" + err
    );
  })
}

export function setMaintenance(mode) {
  let proc = cockpit.spawn(
    ["/usr/sbin/hosted-engine",
     "--set-maintenance",
     `--mode=${mode}`,
     ]
  )
  .done(function() {
    console.log(`Set hosted engine maintenance level to ${mode}`)
  })
  .fail(function() {
    console.log(`Failed to set hosted engine maintenance level to ${mode}`)
  })
}

export function getHostname(callback) {
  var client = cockpit.dbus('org.freedesktop.hostname1')
  var proxy = client.proxy('org.freedesktop.hostname1',
                           '/org/freedesktop/hostname1')
  proxy.wait(function() {
    if (proxy.valid) {
        var system_hostname = proxy.Hostname
        callback(system_hostname)
    }
  })
}
