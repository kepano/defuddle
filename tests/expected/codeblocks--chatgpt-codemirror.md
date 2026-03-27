```json
{
  "title": "ChatGPT",
  "author": "",
  "site": "",
  "published": ""
}
```

## Fibonacci in Python

Here is a generator-based implementation:

```python
def fibonacci_generator(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

for num in fibonacci_generator(10):
    print(num)
```

This uses Python's `yield` keyword to lazily produce each number.
