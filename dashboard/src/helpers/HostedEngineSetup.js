class RunSetup {
  constructor(abortCallback, answerFiles) {
    this._outputCallback = null
    this._exitCallback = null
    this._manual_close = false
    this._found_question = false
    this._chomp_input = false
    this.abortCallback = abortCallback
    this.answerFiles = answerFiles
  }

  start(outputCallback, exitCallback) {
    this._outputCallback = outputCallback
    this._exitCallback = exitCallback
    var cmd = ['hosted-engine', '--deploy',
               '--otopi-environment="DIALOG/dialect=str:machine"']
    if (this.answerFiles != null){
      this.answerFiles.forEach(function(file){
        cmd.push(`--config-append=${file}`)
      })
    }
    this.channel = cockpit.channel({
      "payload": "stream",
      "environ": [
          "TERM=xterm-256color",
          "PATH=/sbin:/bin:/usr/sbin:/usr/bin"
      ],
      "spawn": cmd,
      "pty": true,
      "superuser": "require",
    })

    var self = this
    $(this.channel).on("close", function(ev, options) {
      let denied = false
      if (!self._manual_close) {
        if (options["problem"] == "access-denied") {
          denied = true
        }
        self._exitCallback(options["exit-status"], denied)
      }
      console.log("hosted-engine-setup exited")
      console.log(ev)
      console.log(options)
    })
    $(this.channel).on("message", $.proxy(this.handleOutput, this))
  }

  close() {
    console.log("Closing ovirt-hosted-engine-setup")
    this.manual_close = true
    if (this.channel.valid) {
      this.channel.close()
    }
    this.abortCallback()
  }

  handleOutput(ev, payload) {
    this._outputCallback(this.getValues(payload))
  }

  getValues(payload) {
    var values = {
      question: {
        prompt: [],
        suggested: '',
        password: false,
        complete: false
      },
      output: {
        infos: [],
        warnings: [],
        errors: [],
        lines: [],
        terminated: false
      }
    }

    // This is quite annoying, but the cockpit channel buffers in unpredictable
    // ways, so split off parts after the question and track them separately
    if (/\*\*%QStart/.test(payload)) {
      this._found_question = true
    }
    if (this._found_question) {
      values = this.getQuestion(payload, values)
    } else {
      values = this.parseOutput(payload, values)
    }
    return values
  }

  parseOutput(payload, values) {
    var actions = {
      "***L": function(message) {
        function test(message) {
          switch  (true) {
            case /^INFO/.test(message):
              values.output.infos.push(message.replace(/^INFO/, ""));
              break;
            case /^WARNING/.test(message):
              values.output.warnings.push(message.replace(/^WARNING/, ""));
              break;
            case /^ERROR/.test(message):
              values.output.errors.push(message.replace(/^ERROR/, ""));
              break;
            default:
              console.log("Found an unknown otopi type!");
              console.log(message);
          }
        }
        test(message.replace(/^\*+L:/, ""));
      },
      "### ": function(message) {
        if (!/CTRL-D/.test(message)) {
          values.output.lines.push(message.replace(/^###\s/, ""));
        }
      },
    }

    payload = payload.trim().split(/\n/)

    if (this._chomp_input) {
        payload.shift()
        this._chomp_input = false
    }

    payload.forEach(function(line) {
      if (actions[line.slice(0,4)]) {
        actions[line.slice(0,4)](line);
      } else if (line.indexOf('TERMINATE') > 0) {
        values.output.terminated = true
      } else {
        console.log("Found an unknown/blank line:");
        console.log(line);
      }
    })

    return values;
  }

  getQuestion(payload, values) {
    payload = payload.trim().split(/\n/)
    payload.forEach(function(line) {
      // Strip off the beginning
      if (/^###/.test(line)) {
        values.question.prompt.push(line.replace(/###/, ""))
      }

      if (/\*\*%QHidden:\s*TRUE/.test(line)) {
        values.question.password = true
      }

      if (/\*\*%QEnd/.test(line)) {
        values.question.complete = true
      }

      if (/\*\*%QDefault/.test(line)) {
        var match = line.match(/\*\*%QDefault: (.*)/)
        values.question.suggested = match[1] != "False" ? match[1] : ""
      }
    })
    return values
  }

  handleInput(input) {
    if (this.channel && this.channel.valid) {
      this.channel.send(input + "\n")
      this._found_question = false
      this._chomp_input = true
    }
  }
}

export function CheckIfRegistered(callback) {
  let path = "/etc/pki/vdsm/certs/cacert.pem"
  let cert = cockpit.file(path, {superuser: 'try'})

  cert.read()
  .done(function() {
    let cmd = ["openssl", "x509",
      "-in", path,
      "-noout", "-text"]

    let proc = cockpit.spawn(
      cmd,
      {err: "message"}
    )
    .done(function(output) {
      let issuer = output.match(/.*^\s*Issuer:.*?CN=(.*?)\.\d+/m)[1]
      callback(true, issuer)
    })
    .fail(function() {
      console.log("Failed to read certificate")
    })
  })
  .fail(function(error) {
    console.log(`${path} does not exist. Not registered?`)
    console.log(error)
    callback(false, "")
  })
  .always(function() {
    cert.close()
  })
}

export default RunSetup
