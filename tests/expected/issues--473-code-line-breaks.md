```json
{
  "title": "Code examples",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

A code example can use explicit line breaks without a preformatted wrapper.

```
agent = Agent(
    model="example",
    tools=[search_tool]
)
result = agent.run(query)
```

Highlighted code should keep its language, indentation, and empty lines.

```python
if ready:
    run()

finish()
```

Existing preformatted code still works.

```
first()
second()
```

Ordinary inline code such as `agent.run(query)` stays in its sentence.
