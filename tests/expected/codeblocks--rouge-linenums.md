```json
{
  "title": "Sample C++ Post",
  "author": "",
  "site": "",
  "published": ""
}
```

### User-friendly assert in C++26

Here is a code example using the new assert features:

```cpp
// https://godbolt.org/z/9sqM7PvWh
using Int = int;
int x = 1, y = 2;

assert(std::is_same<int, Int>::value);
assert([x, y]() { return x < y; }() == 1);
assert(std::vector<int>{1, 2, 3}.size() == 3);
```

The assert macro now provides better diagnostics.
