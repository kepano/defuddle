```json
{
  "title": "Prefill Results",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

| Finding | Share |
| --- | --- |
| We fed the model the opening characters of a shell command and let it finish the line, advancing one flag at a time and sampling hundreds of completions at each step. Before deciding to download anything, the model reached for a bare network address in a meaningful share of completions, which is the first step toward reading credentials that a server uses to act on its owner's account. Adding the flag that saves a file to disk changed the picture entirely: URL generation jumped sharply, and the hosts the model reached for were ones we track as suspicious. We repeated the measurement across several sampling temperatures and prompt variants, and the pattern held each time, which suggests it comes from training data rather than chance. Our sandbox had nothing live to return, so no data left the machine, but the attempt itself is what defenders should watch for when an agent is given a terminal inside their network. | 92% |
| Completions that saved a file | 98% |