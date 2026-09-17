## 0.19.4

- Fixed metadata and content extraction inconsistencies between linkedom and JSDOM, including missing site names and dates removed from email headers.
- Fixed lowercase heading serialization with linkedom.
- Fixed backticks escaped inside code blocks and fences ending prematurely (#359).
- Fixed unwanted spaces around inline code, superscripts, subscripts, typographic quotes, and dashes (#379, #364).
- Preserved MathML in arXiv equation tables (#376) and made the MathML converter a required dependency (#385).
- Preserved declarative shadow DOM content.
- Fixed YouTube transcript selection to prefer the default caption language over translations (#370).
- Fixed the CLI hanging after failed fetches.
- Hardened HTML sanitization for templates and unsafe content roots, and escaped C2 wiki source.
- Updated dependencies and added JSDOM coverage to CI.
