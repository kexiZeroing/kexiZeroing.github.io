---
layout: "../layouts/BlogPost.astro"
title: "Bitwise operations"
slug: bitwise-operations
description: ""
added: "Sep 5 2020"
tags: [other]
---

### Two's complement
```
0000    0
0001    1
0010    2
0011    3
0100    4
0101    5
0110    6
0111    7
1000   -8
1001   -7
1010   -6
1011   -5
1100   -4
1101   -3
1110   -2
1111   -1
```

> I'm curious if there's a reason -1 is represented by 1111 (two's complement) rather than 1001 which is binary 1 with first bit as negative flag.

Say you have two numbers, 2 and -1. In your "intuitive" way of representing numbers, they would be `0010` and `1001`, respectively. In the two's complement way, they are `0010` and `1111`. Now, let's say I want to add them.

Two's complement addition is very simple. You add numbers normally and **any carry bit at the end is discarded**. So they're added as follows:

```
   0010
+  1111
= 10001
=  0001 (discard the carry)
```

`0001` is 1, which is the expected result of `2 + (-1)`. But in the "intuitive" method, adding is more complicated:

```
   0010
+  1001
=  1011
```

Which is -3. Simple addition doesn't work in this case. You need to note that one of the numbers is negative and use a different algorithm if that's the case. But two's complement is a clever way of storing integers so that common math problems are very simple to implement. Try adding 2 (`0010`) and -2 (`1110`) together and you get `10000`. The most significant bit is overflow, so the result is actually `0000`.

Additionally, in the "intuitive" storage method, there are two zeroes `0000` and `1000` and we need to take extra steps to make sure that non-zero values are also not negative zero.

There's another bonus that when you need to extend the width of the register the value is being stored in. With two's complement, storing a 4-bit number in an 8-bit register is only a matter of repeating its most significant bit until it pads the width of the bigger register.

```
    0001 (one, in 4 bits)
00000001 (one, in 8 bits)
    1110 (negative two, in 4 bits)
11111110 (negative two, in 8 bits)
```

### Left shift and Right shift
In an arithmetic shift (`<<` and `>>`), the bits that are shifted out of either end are discarded. In a **left arithmetic shift**, zeros are shifted in on the right; in a **right arithmetic shift**, the sign bit is shifted in on the left, thus preserving the sign of the operand. A left arithmetic shift by `n` is equivalent to multiplying by `2^n` **(provided the value does not overflow)**, while a right arithmetic shift by `n` is equivalent to dividing by `2^n`.

In a logical shift, zeros are shifted in to replace the discarded bits. Therefore, the logical and arithmetic left-shifts are exactly the same, so we **only have `>>>` don't have `<<<`**. The logical right-shift inserts zeros into the most significant bit instead of copying the sign bit, so it is ideal for unsigned binary numbers, while the arithmetic right-shift is ideal for signed two's complement binary numbers.

An example of replacing if-branch with some bitwise operations.
```java
// the data is 32-bit int array between 0 and 255
if (data[c] >= 128)
  sum += data[c];

// be replaced with
int t = (data[c] - 128) >> 31;
sum += ~t & data[c];
```

Arithmetically shift right by 31, it becomes either all ones if it is smaller than 128 or all zeros if it is greater or equal to 128. (0111 -> 0011 -> 0001 -> 0000 or 1000 -> 1100 -> 1110 -> 1111). The the second line adds to the sum either `0xFFFFFFFF & data[c]` (so `data[c]`) in the case that `data[c] >= 128`, or `0 & data[c]` (so zero) in the case that `data[c] < 128`.
