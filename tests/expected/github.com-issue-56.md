```json
{
  "title": "Defuddle on Cloudflare Workers · Issue #56 · kepano/defuddle",
  "author": "jmorrell",
  "site": "GitHub",
  "published": "2025-05-25T20:35:48.000Z"
}
```

**jmorrell** opened this issue on 5/25/2025

Example repo here: [https://github.com/jmorrell/defuddle-cloudflare-example](https://github.com/jmorrell/defuddle-cloudflare-example)

I was looking forward to ditching my tenuous `readbilityjs` fork in my workers project. Defuddle ultimately does run to completion, but I ran into a couple of issues. Supporting this environment fully is likely challenging since `JSDOM` does not work within the Worker environment. I suspect the same will be true of the deno and bun runtimes.

I was able to work around this by using the browser version along with [linkedom](https://github.com/WebReflection/linkedom), however this is not an exact replacement for JSDOM and doesn't implement all the CSS functionality.

Since defuddle relies on these style heuristics, **I'm not sure there is a great path to supporting the full functionality in this environment**, but I wanted to open an issue for discussion and to document these issues for anyone else who might hit this.

When running I get two errors:

```
Defuddle: Error evaluating media queries: TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))
```

This is due to linkedom not implementing `doc.styleSheets`:

[defuddle/src/defuddle.ts](https://github.com/kepano/defuddle/blob/cb4291db0f24cac0d0674d9e35fc0089338da2da/src/defuddle.ts#L213)

Line 213 in [cb4291d](/kepano/defuddle/commit/cb4291db0f24cac0d0674d9e35fc0089338da2da)

|  | const sheets \= Array.from(doc.styleSheets).filter(sheet \=> { |
| --- | --- |

This could be silenced by falling back to `[]` if `doc.styleSheets` isn't present, however that may not be the desired behavior.

const sheets \= Array.from(doc.styleSheets ?? \[\])

The second issue is due to `getComputedStyle` not being supported by linkedom.

```
Defuddle Error processing document: TypeError: e3.getComputedStyle is not a function
```

If you feel like there's nothing to do, or supporting Workers is out-of-scope for the project, feel free to close the issue

**jmorrell** commented on 5/26/2025

For my use-case, I'm already running a headless [browser rendering worker](https://developers.cloudflare.com/browser-rendering/) to load the page anyway. Instead of downloading the HTML content from the browser and then trying to process it in the worker, I can load defuddle in the browser itself with the page loaded and execute it there. This is a little more awkward but seems to work pretty well!

For anyone who might be going down the same path I've created a minimal example here: [https://github.com/jmorrell/defuddle-browser-worker-example](https://github.com/jmorrell/defuddle-browser-worker-example)

**masylum** commented on 6/2/2025

it would be great to replace the dom calls to cheerio. I've done something similar porting readability to cheerio here: [https://jsr.io/@paoramen/cheer-reader](https://jsr.io/@paoramen/cheer-reader). [@kepano](https://github.com/kepano) would you be interested on merging this or should I just maintain my own fork if I do?

**nbbaier** commented on 6/8/2025

Thanks for this [@jmorrell](https://github.com/jmorrell). I'm also trying to use linkedom and was running into the same issues. Hope workers can be supported!

**nbbaier** commented on 6/8/2025

I actually decided to see if I could use a coding agent to implement `doc.styleSheets` and `getComputedStyle`. I used [opencode](https://github.com/sst/opencode) with Claude 4 Sonnet to do so and, at least in a small test in Bun (not on workers), it's working well. My fork of linkedom is [here](https://github.com/nbbaier/linkedom).

**masylum** commented on 6/17/2025

wrong link to fork

**nbbaier** commented on 6/17/2025

Oops! Yes, fixed in the original post. Thanks, [@masylum](https://github.com/masylum)