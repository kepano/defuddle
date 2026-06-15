```json
{
  "title": "Sample Chapter",
  "author": "",
  "site": "",
  "published": ""
}
```

## 2\. Sample Chapter

This chapter demonstrates a few language constructs. Numeric conversions from one representation to another are usually straightforward, although very large values can occasionally lose precision when widened to another numeric type.[^1] The compiler applies these conversions automatically where it is safe to do so.

Comparison operators normally return a boolean result, and it is uncommon to define them otherwise.[^2] Most code relies on the default behavior without any customization at all.

The `ref` modifier is essential in implementing a swap method (in ["Generics"](https://www.example.com/library/view/sample-book/ch03.html#generics), we show how to write a swap method that works with any type):

```
string x = "Penn";
string y = "Teller";
Swap (ref x, ref y);
Console.WriteLine (x);   // Teller
Console.WriteLine (y);   // Penn

static void Swap (ref string a, ref string b)
{
  string temp = a;
  a = b;
  b = temp;
}
```

After the swap completes, the two variables have exchanged their contents, which illustrates how arguments are passed by reference rather than by value in this example. This paragraph exists so the chapter body has enough surrounding prose for the content extractor to score it as the main content.

[^1]: A minor caveat is that very large values lose some precision when converted to another numeric type.

[^2]: An exception is when calling certain interop methods, discussed in a later chapter.