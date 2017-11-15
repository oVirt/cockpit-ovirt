import { CONFIG_FILES as constants } from '../components/gdeploy/constants'

class RunSetup {
  constructor(abortCallback, answerFiles) {
    this._outputCallback = null
    this._exitCallback = null
    this._manual_close = false
    this._found_question = false
    this._chomp_input = false
    this.abortCallback = abortCallback
    this.answerFiles = answerFiles
    this.confirm_otopi = false
    this.otopi_value = null
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
      "err": "out",
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
        if (/GPG_KEY/.test(message)) {
          if (/Response is/.test(message)) {
            let question = `${values.question.prompt.pop()} (yes,no)`
            values.question.prompt.push(question)
            values.question.suggested = "yes"
            values.question.complete = true
          } else {
            values.output.lines.push(message.replace(/^###\s/, ""));
          }
        } else if (!/CTRL-D/.test(message)) {
          values.output.lines.push(message.replace(/^###\s/, ""));
        }
      },
    }

    payload = payload.trim().split(/\n/)

    if (this._chomp_input) {
        payload.shift()
        this._chomp_input = false
    }

    let self = this

    payload.forEach(function(line) {
      if (actions[line.slice(0,4)]) {
        actions[line.slice(0,4)](line);
      } else if (line.indexOf('TERMINATE') > 0) {
        values.output.terminated = true
      } else {
        if (/###\s*$/.test(line)) {
        } else if (/\*\*\*CONFIRM/.test(line)) {
          let match = line.match(/CONFIRM\s(.*?)\s/)
          self.confirm_otopi = true
          self.otopi_value = match[1]

          values.question.prompt.push(line.replace(/\*\*\*CON.*?\s(GPG_KEY\s)?/, ""))
        } else {
          console.log("Found an unknown/blank line:");
          console.log(line);
        }
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
      if (this.confirm_otopi) {
        input = `CONFIRM ${this.otopi_value}=${input}`
      }
      this.channel.send(input + "\n")
      this.confirm_otopi = false
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
      let issuer = output.match(/.*^\s*Issuer:.*?CN=(.*?)\.\d+/m)
      issuer = issuer != null ? issuer[1] : null
      if (issuer == null) {
          callback(false, null)
      } else {
          callback(true, issuer)
      }
    })
    .fail(function() {
      callback(false, null)
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

export function checkForGdeployAnsFiles(callback) {
  const answerFile = cockpit.file(constants.heAnsfileFile);
  const commonAnsFile = cockpit.file(constants.heCommonAnsFile);

  answerFile.read()
      .done(function(output) {
        if (!output) {
            callback(false);
            console.log("Failed to read file " + constants.heAnsfileFile +
                ". Check that the file exists and is not empty");
        } else {
          commonAnsFile.read()
              .done(function(output) {
                if (output) {
                  callback(true);
                } else {
                  callback(false);
                    console.log("Failed to read file " + constants.heCommonAnsFile +
                        ". Check that the file exists and is not empty");
                }
              })
              .fail(function(error) {
                  callback(false);
                  console.log("Failed to read file " + constants.heCommonAnsFile + ". Error: " + error);
              })
              .always(function() {
                commonAnsFile.close();
              });
        }
      })
      .fail(function(error) {
        callback(false);
        console.log("Failed to read file " + constants.heAnsfileFile + ". Error: " + error);
      })
      .always(function() {
        answerFile.close();
      })
}

export default RunSetup
