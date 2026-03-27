```json
{
  "title": "We Rewrote Example Tool with AI",
  "author": "Jane Smith",
  "site": "Example Blog",
  "published": ""
}
```

A few weeks ago, a major cloud provider published a post about rewriting a popular framework with AI in one week. One engineer and an AI model reimplemented the full API surface. Cost about $1,100 in tokens.

The implementation details were interesting, but the methodology was more compelling. They took the existing spec and test suite, then pointed AI at it and had it implement code until every test passed.

## The background

At our company, we have a policy engine that evaluates transformation expressions against every message in our data pipeline — billions of events. The reference implementation is in JavaScript, but our pipeline is in Go.

So for years we ran a fleet of JavaScript pods on Kubernetes — Node.js processes that our Go services called over RPC. That meant for every event we had to serialize, send over the network, evaluate, serialize the result, and forward the response.

## The approach

We took the same methodology and ran with it. We fed the existing spec and the full test suite to an AI model and had it write a Go implementation until every test passed.

The result was a pure-Go implementation. Seven hours, $400 in tokens, a 1,000x speedup on common expressions.

## The outcome

Removing the RPC layer and running expressions in-process eliminated network overhead entirely. We decommissioned the JavaScript pod fleet and saved significant infrastructure costs.

The new implementation handles the full expression language and passes the complete test suite. It also enabled further optimizations that compound the savings.