# playwright-terminal

Run terminal commands during a Playwright test with video-friendly output.

Some user flows include a combination of web and terminal interaction. playwright-terminal allows you to
combine the two in end-to-end tests.

When run with a `page` object from Playwright, a page will be opened that displays all terminal output, which can be monitored during debugging, or included in video or screenshot output.

Terminal output may also be logged to file.

## Usage

```
import { Terminal } from 'playwright-terminal';

test('ls', async ({ page }) => {
    var terminal = new Terminal(page, { logsEnabled: true, logDir: "."});
    await terminal.Execute("ls", ["-la"])
});
```

