```json
{
  "title": "Google Docs footnotes: ftnt/ftnt_ref pattern",
  "author": "",
  "site": "",
  "published": ""
}
```

These capabilities have emerged very quickly. Our internal evaluations showed that the model generally had a near-0% success rate at autonomous exploit development. But the new preview is in a different league. The previous model turned vulnerabilities into shell exploits only two times out of several hundred attempts. We re-ran this experiment as a benchmark for the preview, which developed working exploits 181 times, and achieved register control on 29 more.[^1]

Separately, we found that it could chain together multiple vulnerability classes to achieve full remote code execution in controlled test environments.[^2]

[^1]: These exploits target a testing harness mimicking a content process, without the browser's process sandbox or other defense-in-depth mitigations.

[^2]: This testing was conducted in isolated environments with no connection to production systems.
