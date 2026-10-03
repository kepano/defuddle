```json
{
  "title": "Storage design",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

This article describes a storage system with separate paths for document updates and query requests. Each path has different requirements for latency, capacity, and recovery.

## Storage requirements

Document updates arrive continuously and must be recorded durably before they are published. Query requests read prepared records in batches and need a predictable response time.

### Separate workflows

Keeping the workflows separate allows updates to be retried without competing with active reads. The serving layer can then organize its caches around the records that readers request.

Prepared records are grouped into batches before delivery. Readers continue to use the available records while the next batch is processed in the background.
