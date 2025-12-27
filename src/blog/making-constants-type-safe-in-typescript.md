---
title: "Making constants type-safe in TypeScript"
description: ""
added: "Nov 3 2025"
tags: [js]
---

When working with a fixed set of string constants in TypeScript, there are a few ways to ensure type safety, IDE support, and clean code. This guide explains the differences and trade-offs for `const enum` and `as const`.

## The Scenario

You have a set of category IDs that are shared across multiple files:

```typescript
// Category IDs
PRESENTATION: 'cat_123',
POSTER: 'cat_456',
SOCIAL_POST: 'cat_789',
```

Your goals are:

1. Type safety
2. IDE autocomplete
3. Easy access via `Categories.PRESENTATION`
4. Compatibility for use as object keys or in records

## Understanding Index Signatures and Mapped Types

Before continuing, it helps to understand how TypeScript models object types, specifically the difference between **index signatures** and **mapped types**.

### Index Signature: `{ [key: Type]: Value }`

- `Type` must be `string`, `number`, or `symbol`
- Allow any number of keys, all optional

```typescript
const cache: { [key: string]: number } = {};
cache["item_1"] = 42;
```

### Mapped Type: `{ [K in Type]: Value }`

- `Type` can be a **union** or **enum**
- Keys are known and fixed, all required unless marked optional

```typescript
type CacheKey = "item_1" | "item_2";
type Cache = { [K in CacheKey]: number };

const cache: Cache = {
  item_1: 42,
  item_2: 99,
};
```

> The built-in `Record<K, T>` is just a shorthand for a mapped type using `[key in K]`. Use `Record` when you just want a clean key–value mapping. Use `[key in K]` form when you need more control (optional, readonly, etc.).

## Option 1: Object with `as const`

When you use `as const`, TypeScript makes the value deeply readonly and narrows all literals to their exact values.

```typescript
export const Categories = {
  PRESENTATION: "cat_123",
  POSTER: "cat_456",
  SOCIAL_POST: "cat_789",
} as const;

export type Category = (typeof Categories)[keyof typeof Categories];
// Type: 'cat_123' | 'cat_456' | 'cat_789'
```

### Usage Example

```typescript
// Accessing values
const id = Categories.PRESENTATION; // 'cat_123'

// Works with Record
const styles: Record<Category, string> = {
  [Categories.PRESENTATION]: "Professional",
  [Categories.POSTER]: "Creative",
  [Categories.SOCIAL_POST]: "Casual",
};
```

### Common Pitfall

```typescript
// This fails
const styles: { [key: Category]: string } = { ... };
// Error: An index signature parameter type cannot be a literal type
```

You cannot use a literal union type in an **index signature**. However, `Record<Category, string>` works because it is implemented as a **mapped type**, not an index signature.

## Option 2: `const enum`

```typescript
export const enum Categories {
  PRESENTATION = "cat_123",
  POSTER = "cat_456",
  SOCIAL_POST = "cat_789",
}
```

### Usage Example

```typescript
// Accessing values
const id = Categories.PRESENTATION; // 'cat_123'

// Works with Record
const styles1: Record<Categories, string> = { ... };

// Works with mapped types
const styles2: { [key in Categories]: string } = { ... };
```

You cannot use enums in **index signatures** either:

```typescript
// Invalid
const styles3: { [key: Categories]: string } = { ... };
// Error: An index signature parameter type cannot be an enum type
```

### Notes

- `as const` creates a plain JavaScript object at runtime.
- `const enum` is erased at compile time (no runtime object) and inlined by the compiler.
- `enum` (non-const) generates extra JavaScript code with reverse mappings.
- Both `as const` and `const enum` work with `Record` and mapped types, but not with index signatures.
- Modern TypeScript projects often prefer `as const` for simplicity and full runtime visibility.

> When you use a regular enum, TypeScript generates JavaScript code at runtime to represent it. A real object exists at runtime, and it holds both directions (forward and reverse mappings) for numeric enums, though for string enums only the forward mapping is generated.
>
> A `const enum` is different: it is completely erased at compile time. No runtime object is generated at all — the compiler inlines the values directly.

```typescript
export const enum Category {
  PRESENTATION = "cat_123",
  POSTER = "cat_456",
}

const id = Category.PRESENTATION;

// Compiles to:
const id = "cat_123";
```

So for a fixed set of string constants, the practical difference between `as const` and `const enum` is minimal. The main distinction isn’t what they can express, but how they behave at runtime and during compilation:

- `as const` creates a real JavaScript object. You can inspect, serialize, or iterate over it at runtime.
- `const enum` is compile-time only. It disappears after compilation and cannot be referenced dynamically.

## Bonus: Runtime Validation with Zod

There’s one area where TypeScript alone falls short: runtime validation. When data comes from external sources (API responses, form submissions or user inputs), TypeScript can’t guarantee that the data matches our expected types at runtime. This is where a library like Zod comes in.

Zod bridges the gap between compile-time type safety and runtime validation. It allows us to define schemas that not only validate data at runtime but also automatically infer TypeScript types, giving us the best of both worlds.

```js
interface User {
  name: string;
  email: string;
  age: number;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  // Type assertion - dangerous!
  return data as User;
}
```

```js
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().positive()
});

type User = z.infer<typeof UserSchema>;

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  
  // Validate and parse the data
  return UserSchema.parse(data); // Throws if validation fails
}
```
