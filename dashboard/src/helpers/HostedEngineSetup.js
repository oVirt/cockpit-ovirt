class RunSetup {
  constructor() {
    this._callback = null
    this._found_question = false
    this._chomp_input = false
  }

  start(callback) {
    this._callback = callback

    this.channel = cockpit.channel({
      "payload": "stream",
      "environ": [
          "TERM=xterm-256color",
          "PATH=/sbin:/bin:/usr/sbin:/usr/bin"
      ],
      //"spawn": ['/home/rbarry/hosted-engine',
      "spawn": ['hosted-engine', '--deploy',
                '--otopi-environment="DIALOG/dialect=str:machine"'],
      "pty": true
    })

    $(this.channel).on("close", function(ev, options) {
      console.log("hosted-engine-setup exited")
    })
    $(this.channel).on("message", $.proxy(this.handleOutput, this))
  }

  close() {
    console.log("Closing ovirt-hosted-engine-setup")
    if (this.channel.valid) {
      this.channel.close()
    }
  }

  handleOutput(ev, payload) {
    this._callback(this.getValues(payload))
  }

  getValues(payload) {
    var values = {
      question: {
        prompt: [],
        suggested: ''
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
    if (/\*\*\*Q/.test(payload)) {
      this._found_question = true
      var parts = payload.split(/\*\*\*Q:.*/)
      if (parts.length > 1) {
        values = this.getQuestion(parts.pop(), values)
      }
      values = this.parseOutput(parts[0], values)
    } else if (this._found_question) {
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
        values.output.lines.push(message.replace(/^###\s/, ""));
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
      values.question.prompt.push(line.replace(/###/, ""))

      var match = line.match(/\[(.*)\]/)
      values.question.suggested = match ? match[1] : ""
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

export default RunSetup
