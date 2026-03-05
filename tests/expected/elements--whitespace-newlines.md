```json
{
  "title": "Whitespace and newline handling",
  "author": "",
  "site": "",
  "published": ""
}
```

## Newlines in paragraphs

This is a paragraph with newlines between sentences. Browsers collapse these to spaces.

This paragraph has multiple blank lines that should also collapse to spaces.

## Whitespace-preserving code

```
/ip address
add address=192.168.88.1/24 interface=bridge1
add address=172.16.0.1/24 interface=ether1
```

The code above uses white-space: pre on a code element without a pre wrapper.

```
This is a normal pre+code block.
It should be preserved as-is.
  Including indentation.
```