```json
{
  "title": "Example DB: Documentation: 4.2. Range Types",
  "author": "",
  "site": "example.org",
  "published": ""
}
```

## 4.2. Range Types

Range types are data types representing a range of values of some element type. For instance, ranges of timestamps might be used to represent the ranges of time that a meeting room is reserved.

Every range has a lower bound and an upper bound. Either bound can be inclusive or exclusive, and either can be omitted to make the range unbounded on that side.

**Table 4.4. Range Bound Notation**

| Notation | Previous value | Next value |
| --- | --- | --- |
| `[1,5)` | includes 1 | excludes 5 |
| `(1,5]` | excludes 1 | includes 5 |

The constructor function for each range type accepts the two bounds and an optional string that states which of them are inclusive.