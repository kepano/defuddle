```json
{
  "title": "Loops",
  "author": "Pat Example",
  "site": "Example Guide",
  "published": "2004-05-06"
}
```

A *loop* is a block of code that repeats a list of commands as long as the loop control condition is true. Loops are one of the oldest ideas in programming, and every shell has several kinds of them.

The simplest kind walks through a list of words and runs the same commands for each one. See [the chapter on branches](https://www.example.com/guide/branches.html#CASE) for a way to choose between commands instead of repeating them.

![Diagram of a loop](https://www.example.com/images/loop-diagram.png)

A second kind keeps running while a test succeeds. It is useful when the number of repetitions is not known beforehand, for example when reading a file line by line until it ends.

A third kind runs until a test succeeds, which is the same idea turned around. Most scripts only need the first two kinds, but all three are worth knowing.
