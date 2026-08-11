```json
{
  "title": "Reading the resolver output",
  "author": "",
  "site": "",
  "published": ""
}
```

The transcript below shows a full session against the resolver, from the first query through to the summary line it prints on exit.

```shellsession
user@host:~$ resolve --zone example.com
blog.example.com has address 10.10.10.1
www.example.com has address 10.10.10.2
2 records resolved
```

Every line that reports an address can be fed straight into the next stage of the pipeline without any further parsing.
