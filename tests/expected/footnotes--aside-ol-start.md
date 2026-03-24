```json
{
  "title": "Article with Aside Footnotes",
  "author": "",
  "site": "",
  "published": ""
}
```

We built a new library.[^1]

If that was enough of a pitch, [check it out here](https://example.com/docs).

If not, let me explain why it matters.

## What is property-based testing?

The main [^2] benefits are:

- High-quality generators for building test inputs.
- Automatic shrinking to minimal failing examples.[^3]
- A test database that replays failures fast.

Shrinking is remarkably useful in practice.

[^1]: It's a philosophy joke.

[^2]: There are other benefits too, but these are the ones you notice first.

[^3]: Shrinking finds the smallest input that triggers the bug. See [this post](https://example.com/shrinking) for details.