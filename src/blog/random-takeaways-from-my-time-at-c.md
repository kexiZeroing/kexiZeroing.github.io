---
title: "Random takeaways from my time at C"
description: ""
added: "Nov 18 2026"
tags: [other]
---

### Experiments and feature flags

Experiments are not just about A/B testing on a feature flag; they are a comprehensive exploration of user interaction, product performance, and all the factors that influence success.

Start with an A/B test: a 50/50 split to compare variants and pick a winner. Once the decision is made (the split goes beyond 50% and becomes unequal), it becomes a feature flag rollout, ramping to 100% with no further statistical comparison.

The data already exists in the data warehouse. What an experiment controls is which slice of that data counts, based on the metric window.

- Control and treatment groups (variants)
- Cohorts (users are randomly bucketed 0-999), countries, devices, locales
- Guardrails, success metrics, support metrics
- Experiment / Staged rollout / Fully rollout

| Field          | What it means                 | Example                        |
| :------------- | :---------------------------- | :----------------------------- |
| Warehouse      | Where the data lives          | Snowflake                      |
| Subject type   | What you randomize/measure    | user_id                        |
| Comparison     | How variants compare          | Control (B vs A, C vs A)       |
| Running time   | Start/end dates               | Jun 1 - Jun 14                 |
| Variant split  | Expected ratio                | 33/33/33                       |
| Exposure event | When a user "enters" the test | xx tab opened                  |
| Metrics        | What you measure              | success / support / guardrails |

> - Success metrics: The 1–3 main behaviors you want to move. These decide ship / don't ship.
> - Support metrics: Extra context. Explains why a result happened, but doesn't decide.
> - Guardrails: Things that must not get worse (errors, performance, revenue, etc.)

#### featureFlag and configFlag

Feature Flags are short-lived, temporary switches used to control the release process of new features and should be removed once the feature is fully rolled out. It evaluates per request, with the user's identity and request context in scope.

Config Flags are long-lived (maybe not?), stable configurations that describe how a system behaves in a specific environment. It's a static JSON file served from S3 through the config service, which is then resolved into the page bootstrap. It's the right tool for kill switches, i.e. turn a broken feature off for everyone in prod right now, without a deploy.

The blessed way for long-lived config is Java properties files on the backend, and FE reads it from the bootstrap. They are committed with the code, environment-specific (`application-prod.properties`), and part of the system's contract.

> One way to think about the bootstrap is that it's the essential data required for the first render of the page. This is often things like feature flags or initial data needed for rendering. It's generated into the HTML sent over the wire in the initial request. By the time you call the function to get the flag value, that value has already been determined on the server.

### The big picture

```
Browser — GET /edit —> api-gateway
                           |
                           v
+-------------------------------------------------------------+
| foo_frontend (Java BFF)                                     |
|-------------------------------------------------------------|
| 1. parallel fans-out to N backend RPCs                      |
| 2. shapes responses into a Web2PageOptions proto            |
| 3. embeds the foo_bootstrap proto inside it                 |
+-------------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------------+
| page-assembly-rpc (Node SSR)                                |
|-------------------------------------------------------------|
| reads manifest.json (which lists all the CSS/JS assets),    |
| merges with Web2PageOptions,                                |
| streams HTML w/ inlined                                     |
| bootstrap JSON + <script> tags                              |
+-------------------------------------------------------------+
                           |
                           v
                      +---------+
                      | Browser |
                      +---------+
                           |
                           v
   React hydrates, reads bootstrap from window, and renders immediately
   the FE bundle is one of the last things to execute
```

`*_frontend` is a per-domain BFF layer and gets deployed like any other backend service. They're called "frontend services" only because their sole job is to talk to browsers - they sit at the frontier of the system and closest to the FE. They contain no business logic. Real domain logic lives in the actual backend services they fan out to. This is also the place where all config sources are resolved into a single flat set of flags in your bootstrap.

The FE <-> Java contract is defined by protos. There are two kinds and live in different places.

- Bootstrap proto `pages/<page>_bootstrap.proto`: lives next to the FE page because the FE team owns the question "what does this page need at first paint?". The Java side is forced to fulfil whatever contract the proto declares.
- AJAX endpoints proto `services/<service>/<service>_api.proto`: lives in the central `proto/` tree because they are shared resources so many pages can call the same endpoint.

### FE simple configuration pattern (DI)

```
Foo
├── features/
├── stories/
├── tests/
├── foo.css
├── foo.messages.ts
├── foo.tsx
├── install.tsx
├── tsconfig.json
├── BUILD.bazel
└── OWNERS
```

```ts
// install.tsx
export function installFoo(fruitService: FruitService) {
   const store = new Store();
   const presenter = new Presenter(fruitService);
   const Component = observer((props: {
      label: string,
      onSelect?: (option: Option) => void
   }) = <Foo {...props} options={store.options} />);

   return { Component, updateFruits: () = presenter.updateFruits(store) };
}

class Store {
   @observable.ref
   fruits: FruitIl = [];

   @computed
   get options(): Option[] {
      return this.fruits.map(fruit = ({ value: fruit.id, label: fruit.name }));
   }
}

class Presenter {
   constructor (private fruitService: FruitService) {
      this.fruitService = fruitService;
   }

   @action
   updateFruits(store: Store) {
      store.fruits = this.fruitService.getFruits();
   }
}
```

### Call the design gen service

1. User picks image → `RequestStateStore` built with `mediaContentld` and default Plog config.
2. Presenter calls `design.compositions_loader.ts` → hits `DesignCompositionService`:
   - `createDesignCompositionBatch` returns `{ resultsToken, sessionld }`.
   - Polls `getDesignCompositions (resultsToken)` (default ~90s timeout, ~2s poll delay; backend can override).
3. Results stream in via an `onPartially` callback → presenter dedupes by id and appends to store.
4. On click → `create_navigation.ts`: `DesignService.createDesign()` → `DocumentNavigationService` routes to the editor.

RPC 1: createDesignCompositionBatch(req)

```ts
CreateDesignCompositionsRequest {
   prompt: 'Use the uploaded image to create themed Plog designs...',
   categorylds: ['xxx'],  // 'Plog'
   themes: [],  // BE-configured
   targetCount: 10
   source: XX
   mediaContentld: <id of uploaded image>
   sessionld?: undefined  // unset on first call
}

// Happy path
DesignCompositionsAcceptedResponse {
   result: 'ACCEPTED'
   resultsToken: string  // poll key, valid for one poll only, gets refreshed each call
   pollPeriodMs: number  // how often to poll
   pollTimeoutMs: number // when to give up
   sessiond: string      // identifies this gen session, used for load-more
}

// Failure path
DesignCompositionsRejectedResponse {
   result: 'REJECTED'
   rejectedReason: UNKNOWN | QUOTA_EXCEEDED | NOT_ENABLED | REQUEST_MODERATION | INSUFFICIENT_PROMPT
}
```

RPC 2: getDesignCompositions ({ resultsToken })

```ts
// Polled by base/polling's poll() helper with the BE-controlled pollPeriodMs / pollTimeoutMs.
GetDesignCompositionsResponse {
   status: PENDING | PARTIALLY_COMPLETE | COMPLETE | ERROR | REJECTED
   resultsToken: string // new token for the next poll (rotates every call)
   results: DesignComposition[] // accumulated successes so far
   failureReasons: DesignCompositionFailureReason[]
}

// What you get back per design
DesignComposition {
   id: string // composition id, not a design id
   pageThumbnails: Thumbnail // for grid display
   content?: DocumentCententProto // the actual document - full editable content
   doctypeld?,
   categoryId?,
   templateAnnotationReference?: TemplateAnnotationReference // which base template was used
   compositionMetadata?: CompositionMetadata // BE state to iterate further
   debuginfo?
}
```

> Each doctype defines the dimensional requirements (e.g. 1920x1080 for Presentation) and includes a feature config that controls which editor features are enabled.
>
> A category is a logical grouping of content that helps users find what they're searching for. A user-facing category can have multiple format-specific doctypes underneath it.
