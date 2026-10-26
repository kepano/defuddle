```json
{
  "title": "Measuring Command Completions",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

We fed the model the opening characters of a shell command and let it finish the line, advancing one flag at a time and sampling hundreds of completions at each step.

| Prefill ends after | Writes a URL | Most common host |
| --- | --- | --- |
| ; fetch -s | 4% | example.com |
| ; fetch -s -o | 92% | files.example.net |
| ; fetch -s -o /tmp/ | 98% | example.org |

*Share of sampled completions at each prefill point.*

Saving a download to disk is what triggers the behavior. The runs we reviewed are listed below, each linking to its full log.

Run

Date

[First run 2026-01-01](https://example.com/runs/1) [Second run 2026-01-02](https://example.com/runs/2)

Two observations stood out from those runs.

The model reaches for a network address before deciding to download anything.

Adding the output flag makes URL generation jump from 4 to 92 percent.

Both patterns repeated across every sampling temperature we tried, which suggests they come from training rather than chance.

Longer prefills made the behavior more consistent.

Shorter prefills mostly produced harmless commands.

We are publishing the prompts so others can reproduce these measurements.