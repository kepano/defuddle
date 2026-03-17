```json
{
  "title": "Defuddle on Cloudflare Workers · Issue #56",
  "author": "jmorrell",
  "site": "GitHub",
  "published": "2025-05-25T20:35:48.000Z"
}
```

[jmorrell](https://github.com/jmorrell)

Contributor

Example repo here: [https://github.com/jmorrell/defuddle-cloudflare-example](https://github.com/jmorrell/defuddle-cloudflare-example)

I was looking forward to ditching my tenuous `readbilityjs` fork in my workers project. Defuddle ultimately does run to completion, but I ran into a couple of issues. Supporting this environment fully is likely challenging since `JSDOM` does not work within the Worker environment. I suspect the same will be true of the deno and bun runtimes.

I was able to work around this by using the browser version along with [linkedom](https://github.com/WebReflection/linkedom), however this is not an exact replacement for JSDOM and doesn't implement all the CSS functionality.

Since defuddle relies on these style heuristics, **I'm not sure there is a great path to supporting the full functionality in this environment**, but I wanted to open an issue for discussion and to document these issues for anyone else who might hit this.

When running I get two errors:

```
Defuddle: Error evaluating media queries: TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))
```

This is due to linkedom not implementing `doc.styleSheets`:

```
const sheets = Array.from(doc.styleSheets).filter(sheet => {
```

This could be silenced by falling back to `[]` if `doc.styleSheets` isn't present, however that may not be the desired behavior.

```
const sheets = Array.from(doc.styleSheets ?? [])
```

The second issue is due to `getComputedStyle` not being supported by linkedom.

```
Defuddle Error processing document: TypeError: e3.getComputedStyle is not a function
```

If you feel like there's nothing to do, or supporting Workers is out-of-scope for the project, feel free to close the issue