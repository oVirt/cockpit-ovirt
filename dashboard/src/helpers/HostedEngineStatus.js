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
