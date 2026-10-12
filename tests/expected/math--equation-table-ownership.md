```json
{
  "title": "Equation table ownership",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Equations may use tables to arrange a whole expression, individual fragments, operators and labels. Extraction must not confuse a second representation with an independent equation.

## Single equation

$$
a
$$

## Label

$$
b
$$

## Rows and operators

$$
x
$$

$$
y
$$

$$
z
$$

$$
w
$$

## Native source without annotation

$$
c
$$

$$
d
$$

## Header and mixed content

$$
g
$$

## Nested table

$$
h
$$

$$
i
$$

## Ordinary data table

| Item | Value |
| --- | --- |
| Sample | 10 |

## Sanitized label

$$
j
$$

The single standalone equation retains the existing promotion policy. Tables containing fragments retain their cell boundaries rather than implying that every fragment is a complete display equation.