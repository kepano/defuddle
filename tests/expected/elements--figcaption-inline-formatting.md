```json
{
  "title": "Figcaption Inline Formatting",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

This article tests that links and inline formatting inside image captions survive figure standardization.

![A chart](https://www.example.com/images/chart.png)

Figure 1: A chart of the results. You can find the source code [here](https://www.example.com/code/notebook).

Paragraph of text between the images to separate content sections properly for the parser to work with.

![A diagram](https://www.example.com/images/diagram.png)

Figure 2: The *encoder* passes `hidden_state` to the [decoder](https://www.example.com/glossary/decoder).

More article text here with enough words for the content detection scoring algorithm to work properly.

![A photo](https://www.example.com/images/photo.jpg)

A photo of the venue. Photo credit: Example Studio

Another paragraph of text so that each figure is separated by regular body content in the article.

![Code sample](https://www.example.com/images/code.png)

Figure 4: Rendering \<img src=x> as text, not as an element.

One more paragraph of text so the last figure is also surrounded by regular body content.

![Warning](https://www.example.com/images/warning.png)

Figure 5: A dangerous link stays plain text.

Final paragraph of the article with some concluding text for the content parser.
