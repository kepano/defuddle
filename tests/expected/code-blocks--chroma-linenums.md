```json
{
  "title": "Sample Technical Post",
  "author": "",
  "site": "",
  "published": ""
}
```

### A typical solution

Here is a function that processes an array:

```cpp
auto process_values(const std::vector<uint8_t> &vec)
{
    return std::count_if(
        vec.begin(),
        vec.end(),
         { return x % 2 == 0; }
    );
}
```

Let's look at the generated assembly:

```nasm
process_values():
    vpbroadcastb    xmm1, byte ptr [rip + .LCPI0_1]
    vmovd   xmm2, dword ptr [rsi + rax]
    vpandn  xmm2, xmm2, xmm1
    add     rax, 4
    cmp     r8, rax
    jne     .LBB0_6
```

The compiler generates vectorized code that processes four values at a time.