```json
{
  "title": "example_size_t - Reference",
  "author": "",
  "site": "",
  "published": ""
}
```

## example::size\_t

| Defined in header `<cstddef>` |  |  |
| --- | --- | --- |
| Defined in header `<cstdlib>` |  |  |
| ``` typedef /* implementation-defined */ size_t; ``` |  | (since C++17) |

`example::size_t` is the unsigned integer type of the result of the `sizeof` operator. It is widely used to represent sizes and counts in portable code, and it can store the maximum size of any theoretically possible object on the target platform regardless of its declared type.

`example::size_t` is commonly used for array indexing and loop counting. Programs that use other types for array indexing may fail on large systems when the index exceeds the range those narrower types can represent without overflow.

### Notes

On most platforms `example::size_t` can safely store the value of any non-member pointer, in which case it is as wide as the platform's pointer type and can round-trip pointer values through integer arithmetic without loss of information.