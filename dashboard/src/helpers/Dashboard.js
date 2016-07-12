const wait_valid = (proxy, callback) => {
  proxy.wait(function() {
    if (proxy.valid) {
      callback();
    }
  });
}

export function SshHostKey(type, callback) {
  let path = `/etc/ssh/ssh_host_${type}_key`
  let host_key = cockpit.file(path, {superuser: 'try'})
  host_key.read()
    .done(function(resp) {
      resp = resp.split('\n').join('<br />')
      callback(resp)
    })
    .fail(function(error) {
      console.log(`Error opening ${path}`)
      console.log(error)
    })
    .always(function() {
      host_key.close()
    })
}

export class VirtualMachines {
  constructor() {
    var client = cockpit.dbus('org.freedesktop.machine1')
    this.proxy = client.proxy('org.freedesktop.machine1.Manager',
                              '/org/freedesktop/machine1');
  }
  getVms(callback) {
    var proxy = this.proxy
    wait_valid(proxy, function() {
      proxy.ListMachines().done(function(result) {
        callback(result)
      })
    })
  }
}

export class NodeStatus {
  constructor() {
  }
  call(callback, args, failOnly = false) {
    let cmd = ["/usr/sbin/nodectl",
               "--machine-readable"]
    cmd = cmd.concat(args)
    let proc = cockpit.spawn(
       cmd,
       {err: "message",
        superuser: "require"}
    )
    .done(function(json) {
      if (!failOnly) {
        callback(JSON.parse(json))
      } else {
        callback({"success": true})
      }
    })
    .fail(function(err, resp) {
      let msg = `Failed to check "nodectl ${args}"`
      let ret = {
        failure: err.message
      }
      callback(ret)
    })
  }
  checkPermissions(callback) {
    this.call(callback, ["--version"], true)
  }
  info(callback) {
    this.call(callback, ["info"])
  }
  check(callback) {
    this.call(callback, ["check"])
  }
  rollback(callback, layer) {
    this.call(callback,
      ["rollback",
       "--nvr",
        layer
      ]
    )
  }
}

export class NetworkInterfaces {
  constructor() {
    this.client = cockpit.dbus('org.freedesktop.NetworkManager')
    this.model = {}
    this.seen = {}
    this.refresh()
    this.promises = {}
  }
  call(iface, prop, method, args, callback) {
    this.client.call(iface, prop, method, args)
      .done(function(reply, options) {
        if (method === "Get") {
          callback(reply.pop().v)
        } else {
          console.log()
          callback(reply)
        }
      })
      .fail(function(reason) {
        console.log("Failed: " + reason)
      })
  }
  refresh() {
    var self = this
    this.call('/org/freedesktop/NetworkManager',
              'org.freedesktop.DBus.Properties', 'Get',
              ['org.freedesktop.NetworkManager', 'ActiveConnections'],
              function(reply) {
                self.buildModel(reply)
              })
    return this.model
  }
  getAll(path, type, callback) {
    this.call(path, 'org.freedesktop.DBus.Properties',
              'GetAll', [type], callback)
  }
  buildModel(active_nics) {
    var self = this
    active_nics.forEach(function (nic) {
      var obj = self.buildObject(nic)
      obj.then((val) => {
        self.model[val.Id] = val
      })
    })
  }
  buildObject(path) {
    var self = this
    var obj = {}
    var base = 'org.freedesktop.NetworkManager.'
    var types = {
      '/AccessPoint': 'AccessPoint',
      '/ActiveConnection': 'Connection.Active',
      '/DHCP4Config': 'DHCP4Config',
      '/Devices': 'Device',
      '/IP4Config': 'IP4Config',
      '/IP6Config': 'IP6Config',
      '/Settings': 'Settings.Connection'
    }
    var iface
    for (var key in types) {
      if (path.indexOf(key) >= 0) {
        iface = `${base}${types[key]}`
      }
    }
    var prom = new Promise(function(resolve, reject) {
      self.getAll(path, iface, function(reply) {
        reply = reply.pop()
        for (let key in reply) {
          let val = reply[key].v
          if (key === 'Devices') {
            var devices = {}
            val.forEach(function(dev) {
              let dfd = self.buildObject(dev)
              dfd.then((res) => devices[res.IpInterface] = res)
            })
            obj['Devices'] = devices
          } else if (typeof val === 'string' &&
              val.indexOf("/org/freedesktop") >=0) {
            if (!(val in self.seen)) {
              let dfd = self.buildObject(val)
              dfd.then(function(res) {
                obj[key] = res
              })
            }
          } else {
            obj[key] = val
          }
        }
        self.seen[path] = obj
        resolve(obj)
      })
    })
    return prom
  }
  listNics() {
    return this.model
  }
}
