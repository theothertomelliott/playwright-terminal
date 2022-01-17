const pty = require('node-pty');
const fs = require('fs');

class Terminal {
    page;
    url;
    logsEnabled;
    logDir;
    skipBrowser = false;

    constructor(page, { 
        logsEnabled = false, 
        logDir = ".",
    }) {

        if (page) {
            this.page = page;
        } else {
            this.skipBrowser = true;
        }

        this.url = `file://${__dirname}/test.html`;
        this.logsEnabled = logsEnabled;
        this.logDir = logDir;
    }

    // LoadPage navigates to the test page.
    // If that page is already loaded, this is a no-op.
    async LoadPage() {
        const curUrl = await this.page.url();
        if (curUrl != this.url) {
            await this.page.goto(this.url);
        }
    }

    async Execute(executable, args) {
        const self = this;

        if (this.logsEnabled && !fs.existsSync(this.logDir)){
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        if (!self.skipBrowser) {
            await self.LoadPage();
        }

        var command = executable;
        var logFile = `${Date.now()}_${command}`;
        var content = "";
        if (args) {
            var argText = args.join('_').replaceAll("/", "_").replaceAll("\\", "_");
            logFile = `${logFile}_${argText}.log`;
            command = `${command} ${args.join(' ')}`;
        }
        if (!self.skipBrowser) {
            await self.page.evaluate(item => { writeToConsole(item); }, `$ ${command}\r\n`);
        }

        return new Promise(function (resolve, reject) {
            var ptyProcess = pty.spawn(executable, args, {
                name: 'xterm-color',
                cols: 80,
                rows: 30,
                cwd: process.cwd(),
                env: process.env
            });

            ptyProcess.onData(async function(data) {
                content += `${data}`;
                if (!self.skipBrowser) {
                    await self.page.evaluate(item => { writeToConsole(item); }, data);
                }
            })

            ptyProcess.onExit(function(exitcode, signal){
                if (self.logsEnabled) {
                    fs.writeFile(`${self.logDir}/${logFile}`, handleAnsiEscapeCodes(content), err => {
                        if (err) {
                            console.error(err)
                            return
                        }
                    })                  
                }
                return resolve(exitcode);
            });
        });
    }

}

// Remove all ANSI Escape Codes from text.
// Codes that move the cursor are obeyed to avoid duplicated content.
function handleAnsiEscapeCodes(input) {
    var AU = require('ansi_up');
    var ansi_up = new AU.default;
    var html = ansi_up.ansi_to_html(input);
    return stripHTML(html);
}

function stripHTML(input) {
    var out = input.replace(/(<([^>]+)>)/gi, "")
    const htmlEntities = {
        "&amp;" : "&",
        "&lt;" : "<",
        "&gt;" : ">",
        "&quot;" : '"',
        "&apos;" : "'"
      };
    out = out.replace(/(&[a-z]+;)/g, match => htmlEntities[match]);
    return out;
}

exports.Terminal = Terminal;
