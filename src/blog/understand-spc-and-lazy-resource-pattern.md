---
title: "Understand SPC pattern and lazy resource pattern"
description: ""
added: "Dec 26 2025"
tags: [js, react]
updatedDate: "Mar 9 2026"
---

## Store-Presenter-Component (SPC) Pattern

SPC is a frontend architecture — a variant of Model-View-Presenter where:

- Store: Observable data container. `@observable.ref` fields, `@computed` getters. No logic, no actions, no side effects.
- Presenter: All business logic. `@action` methods mutate stores. Handles API calls, analytics, derived state. Dependencies injected via constructor.
- Component: Pure functional React component. Receives data and callbacks as props. No MobX, no store/presenter awareness.
- Factory (`create.tsx`): Wires store + presenter + component together. Wraps in `mobxReactLite.observer`.

Data flow is unidirectional:

1. User interacts with Component (clicks, types, etc.)
2. Component calls a callback (provided by Factory from Presenter)
3. Presenter executes logic
4. Presenter mutates Store via `@action` methods
5. MobX notifies the `observer`-wrapped Component
6. Component re-renders with new Store values

### Stores, Presenters, and Components

Stores are pure data containers. They hold `@observable` state and optional `@computed` getters. They contain NO business logic, NO side effects, NO actions. Stores don't need their own unit tests — they're purely declarative. Test the Presenter that mutates them instead.

Presenters contain all business logic. They mutate stores via @action methods, derive data via @computed getters, and perform side effects like API calls and analytics. Presenters receive all dependencies through the constructor.

Components are "dumb" functional React components. They receive data and callbacks as plain props and have NO knowledge of presenters, stores, or MobX. No direct imports of stores, presenters, or MobX. No API calls or analytics tracking.

### Factories

Factories wire everything together. They instantiate stores and presenters, map store values and presenter methods to component props, and wrap in `mobxReactLite.observer`. Factories contain ONLY wiring logic. No business logic, no conditional rendering, no data fetching.

Install Functions vs. Create Functions:

- Install functions have side effects and are called once. They might mutate configuration objects, register event listeners, or set up singletons.
- Create functions are pure factories, callable multiple times. They instantiate objects without side effects.

### Calling Backend RPCs from Frontend Code

Use bootstrap when:
- Data is needed at initial page load
- Data is the same for all users of a page variant
- Data is small and doesn't change during the session

Use /_ajax when:
- Data is loaded after initial page render
- Data depends on user interaction (search, pagination)
- Data changes during the session (save, update)
- Data is large and should be loaded on demand

What a frontend service does during page load:
1. Receives the route from api-gateway
2. Calls multiple backend RPCs in parallel
3. Builds a `Web2PageOptions` protobuf message containing all the aggregated data
4. Returns `Web2PageOptions` to api-gateway for page assembly

Adding a new /_ajax endpoint:
1. Define the API in proto
2. Implement the handler in the frontend service
3. Run Protogen to generate the TypeScript client
4. Use the generated client in your presenter

## Lazy Resource

As frontend applications grow, the bundle size and initial load time can become significant issues. Standard import statements are eager; they pull code into your bundle and execute it immediately, even if the user never visits that specific tab or opens that modal. To solve this, senior engineers often use the Lazy Resource Pattern. It allows you to define how to build your application’s components without actually building them until they are needed.

Think of a Resource as a "Lazy Box."
1. The box starts empty.
2. It has a `load()` button.
3. Only when you press the button does the box fetch its contents (code, data, services).
4. Once the box is full, it stays full (caching).

```ts
export interface Resource<T> {
  /** Returns the resource, loading it if it hasn't been loaded yet. */
  load(): Promise<T>;
}
```

`LazyResource` implements the "Lazy Box" logic. It ensures that no matter how many times you call `load()`, the expensive work only happens once.

```ts
class LazyResource<T> implements Resource<T> {
  private active: Promise<T> | undefined;

  constructor(private recipe: () => Promise<T>) {}

  async load(): Promise<T> {
    if (!this.active) {
      // Execute the "recipe" and cache the resulting promise
      this.active = this.recipe().catch((err) => {
        this.active = undefined; // Clear cache on error to allow retries
        throw err;
      });
    }
    return this.active;
  }
}
```

### Using Factory

Instead of creating resources manually, we use a `ResourceFactory`. It acts as the authorized creator that wraps the `LazyResource` engine with infrastructure metadata.

```ts
interface ResourceFactory {
  /** Creates a named Resource with built-in tracing */
  create<T>(args: { 
    name: string; 
    load: () => Promise<T> 
  }): Resource<T>;
}
```

> The factory returns the interface `Resource` rather than the concrete class `LazyResource`. The consumer doesn't need to know how the box works; they only need to know that it has a `.load()` button.

Think of the `LazyResource` as the "engine" that handles the state of your "Lazy Box" and the `ResourceFactory` as the "manager" that builds it. When you call `.create()`, the factory doesn't just return a raw engine; it returns one that has been pre-configured with tracing tied to your resource name. This delegation means the `LazyResource` is responsible for ensuring the work only happens once, while the factory is responsible for making sure that work is visible to your monitoring system.

### The Pattern in Action

In a large app, you often have a bootload file. This is the "Composition Root" where you map out your feature's dependencies.
Instead of passing real objects around, you pass Resources.

We start by defining resources. Notice the use of dynamic `import()`, which ensures the code isn't even downloaded until `load()` is called.

```ts
// The Factory creates the LazyResource and injects the 'api_client' trace
const apiClientResource = resourceFactory.create({
  name: 'api_client',
  load: async () => {
    const { ApiClient } = await import('./api/client');
    return new ApiClient();
  },
});

const authServiceResource = resourceFactory.create({
  name: 'auth_service',
  load: async () => {
    const [{ AuthService }, api] = await Promise.all([
      import('./auth/service'),
      apiClientResource.load(), // Depend on another resource
    ]);
    return new AuthService(api);
  },
});
```

Each block is now named and traceable. Every resource is guaranteed to follow the same infrastructure rules (caching, logging, tracing) defined by the factory.

This pattern creates a "pay-as-you-go" architecture where application startup is virtually free. By loading only lightweight `Resource` definitions, you can define hundreds of features without downloading their code or running their logic until they are actually needed.

- You can define 100 features in your bootload file. If the user only ever uses the "Home" tab, the code for the other 99 features is never downloaded, and their initialization logic is never run.
- If your Sidebar, Header, and Main Content all need the `authServiceResource`, they all call `.load()`. The first one starts the engine; the other two simply "wait" on the same promise.
- If a network glitch causes a resource to fail, the catch block resets the cache. The next time the user tries to open that feature, the app will try to download the code again automatically.
