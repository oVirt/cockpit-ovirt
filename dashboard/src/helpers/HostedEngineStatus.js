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
