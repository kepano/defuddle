```json
{
  "title": "Footnotes in Wrapper Spans",
  "author": "",
  "site": "",
  "published": ""
}
```

First paragraph with enough content to ensure stable extraction. This text discusses various topics and provides a baseline for the content scoring algorithm to work with.

Some sites wrap line-break hints around footnote-adjacent text. The word before the footnote is inside the same wrapper span as the reference.[^1] This continues after the footnote.

Additional paragraph for content scoring stability. The algorithm needs sufficient text to correctly identify this as the main content area of the page.

Another example where the wrapped word should be preserved.[^2] More text follows here.

Final paragraph to ensure there is enough content for reliable extraction and to help the scoring algorithm identify the article body correctly.

[^1]: First footnote content.

[^2]: Second footnote content.
