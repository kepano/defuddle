```json
{
  "title": "Tasks",
  "author": "",
  "site": "488-sphinx-cross-references",
  "published": ""
}
```

Coroutines are scheduled as tasks on the running event loop. Each task wraps a coroutine and runs it to completion.

The signature matches that of [`example.create_task()`](#example.create_task). See [Scheduling](#scheduling) for details.

Tasks can also be cancelled.