---
title: "Object-Oriented Patterns with TypeScript Generics"
description: ""
added: "Dec 11 2025"
tags: [other, js]
updatedDate: "Dec 14 2025"
---

Before we start, let's be clear: what we're learning here is Object-Oriented Programming. TypeScript is just the language expressing these ideas. The same patterns exist in Java, C#, C++, and many other languages.

The core OOP concepts are:
- Abstraction: Hiding complexity behind simple interfaces
- Polymorphism: Different objects responding to the same message in different ways
- Encapsulation: Objects managing their own internal state
- Dependency Inversion: Depending on abstractions, not concrete implementations

TypeScript's `interface` and generics (`<T>`) are tools to express these OOP concepts with type safety.

We'll build one complete example and evolve it step by step. Imagine we're designing software for a postal service that handles letters, packages, and fragile items.

## Abstraction — Defining "What" without "How"
Imagine you're a postal worker. Every day, you handle hundreds of items. Some are letters. Some are packages. Some are fragile antiques. But here's the thing: your job is the same regardless of what's inside. The process is identical. Only the content changes. This is the first insight of OOP: behavior can be separated from data.

In OOP, an interface (or abstract class) captures what something can do without specifying how it does it. (Defining capabilities without implementation details.)

```ts
// postal-system/deliverable.ts

interface Deliverable {
  getWeight(): number;
  getDestination(): Address;
  getTrackingId(): string;
}
```

Any item that "implements" this interface is promising: *"I can tell you my weight, destination, and tracking ID."*

## Polymorphism — Same Interface, Different Behavior
A letter weighs 20 grams. A package weighs 5 kilograms. A piano weighs 300 kilograms. When you call `getWeight()` on each of them, you get different results. But the code calling `getWeight()` doesn't need to know what type of item it is.

```ts
// postal-system/letter.ts

class Letter implements Deliverable {
  private content: string;
  private destination: Address;
  private id: string;

  getWeight(): number {
    return 0.02; // 20 grams
  }

  getDestination(): Address {
    return this.destination;
  }

  getTrackingId(): string {
    return this.id;
  }
}
```

```ts
// postal-system/package.ts

class Package implements Deliverable {
  private items: PhysicalItem[];
  private destination: Address;
  private id: string;

  getWeight(): number {
    return this.items.reduce((sum, item) => sum + item.weight, 0);
  }

  getDestination(): Address {
    return this.destination;
  }

  getTrackingId(): string {
    return this.id;
  }
}
```

The Letter and Package are completely different internally. But to the outside world, they look the same — they're both `Deliverable`. This is polymorphism: "many forms." Code that works with `Deliverable` works with ALL deliverable items.

## Generics — Parameterized Types
Now we encounter a new problem. Our postal service has warehouses. Some warehouses store letters. Some store packages. Some store frozen goods. We could create: `LetterWarehouse`, `PackageWarehouse`, and `FrozenGoodsWarehouse`. But that's repetitive. The warehouse behavior is identical, only the type of item changes.

This is where generics enter. A generic is a type parameter, a blank that gets filled in when you use the class.

```ts
// postal-system/warehouse.ts

interface Warehouse<ItemType> {
  store(item: ItemType): void;
  retrieve(id: string): ItemType | undefined;
  getInventory(): ItemType[];
}
```

The `<ItemType>` is not a real type, it's a placeholder. When you create an actual warehouse, you specify what goes in the blank. Why not just use `Warehouse<any>` or `Warehouse<Deliverable>`? Because type safety matters. If you have a `Warehouse<Letter>`, TypeScript will prevent you from accidentally storing a Package there.

Furthermore, not everything can go in a warehouse. Only items that are trackable (have an ID) can be stored and retrieved.
We need to say: *"This warehouse can store any type, as long as that type has a tracking ID."*

```ts
// postal-system/trackable.ts

interface Trackable {
  getTrackingId(): string;
}

// postal-system/warehouse.ts

interface Warehouse<ItemType extends Trackable> {
  store(item: ItemType): void;
  retrieve(id: string): ItemType | undefined;
  getInventory(): ItemType[];
}
```

This is bounded polymorphism: polymorphism with limits. Now the warehouse implementation can safely call `item.getTrackingId()` because TypeScript guarantees that any `ItemType` will have that method.

## Layered Abstractions — How real systems work
Real systems have layers of abstraction. Let's add a delivery truck to our system. A truck doesn't know about letters or packages directly. It just knows about loading and unloading from warehouses.

```ts
// postal-system/transport/delivery-truck.ts

class DeliveryTruck<CargoType extends Trackable> {
  private cargo: CargoType[] = [];
  
  constructor(
    private readonly sourceWarehouse: Warehouse<CargoType>,
    private readonly maxCapacity: number
  ) {}

  loadFromWarehouse(ids: string[]): void {
    for (const id of ids) {
      const item = this.sourceWarehouse.retrieve(id);
      if (item && this.cargo.length < this.maxCapacity) {
        this.cargo.push(item);
      }
    }
  }

  unloadTo(destination: Warehouse<CargoType>): void {
    for (const item of this.cargo) {
      destination.store(item);
    }
    this.cargo = [];
  }
}
```

Notice that `DeliveryTruck<CargoType>` doesn't know what `CargoType` is. It just knows `CargoType` is `Trackable` and it comes from a `Warehouse<CargoType>` and goes to another `Warehouse<CargoType>`. The truck is completely generic. It could carry letters, packages, frozen goods, or anything else, as long as the types match.

## The Translator Pattern — Converting between representations
Here's another pattern you'll see constantly: translators (also called adapters or mappers). Our postal system has a problem: the warehouse uses internal IDs like `WH-00001`, but the public tracking website shows codes like `TRACK-ABC-123`. We need something that translates between representations.

```ts
// postal-system/tracking/tracking-translator.ts

interface TrackingTranslator<InternalType, PublicType> {
  toPublic(internal: InternalType): PublicType;
  toInternal(public: PublicType): InternalType;
}
```

```ts
// postal-system/tracking/package-tracking-translator.ts

class PackageTrackingTranslator 
  implements TrackingTranslator<WarehousePackageRecord, PublicTrackingInfo> 
{
  toPublic(internal: WarehousePackageRecord): PublicTrackingInfo {
    return {
      trackingCode: this.encodeId(internal.warehouseId),
      status: this.mapStatus(internal.internalStatus),
      estimatedDelivery: internal.eta
    };
  }

  toInternal(public: PublicTrackingInfo): WarehousePackageRecord {
    return {
      warehouseId: this.decodeId(public.trackingCode),
      internalStatus: this.reverseMapStatus(public.status),
      eta: public.estimatedDelivery
    };
  }

  private encodeId(warehouseId: string): string {
    // WH-00001 -> TRACK-ABC-123
    // ... encoding logic
  }

  private decodeId(trackingCode: string): string {
    // TRACK-ABC-123 -> WH-00001
    // ... decoding logic
  }
}
```

## Composition Over Inheritance — Building complex objects
Real systems don't just have one interface. They compose multiple interfaces together. A delivery fulfillment center does many things:
- Receives items (from suppliers)
- Stores items (warehouse function)
- Dispatches items (to trucks)
- Tracks items (for customers)

```ts
interface ItemReceiver<T extends Trackable> {
  receive(item: T): void;
  getReceivedToday(): T[];
}

interface ItemDispatcher<T extends Trackable> {
  dispatchTo(items: T[], destination: Address): void;
  getPendingDispatches(): T[];
}
```

```ts
// postal-system/fulfillment/fulfillment-center.ts

class FulfillmentCenter<ItemType extends Deliverable>
  implements 
    ItemReceiver<ItemType>,
    Warehouse<ItemType>,
    ItemDispatcher<ItemType>
{
  private inventory: Map<string, ItemType> = new Map();
  private pendingDispatch: ItemType[] = [];

  // ItemReceiver implementation
  receive(item: ItemType): void {
    this.inventory.set(item.getTrackingId(), item);
  }

  getReceivedToday(): ItemType[] {
    // ... implementation
  }

  // Warehouse implementation
  store(item: ItemType): void {
    this.inventory.set(item.getTrackingId(), item);
  }

  retrieve(id: string): ItemType | undefined {
    return this.inventory.get(id);
  }

  getInventory(): ItemType[] {
    return Array.from(this.inventory.values());
  }

  // ItemDispatcher implementation
  dispatchTo(items: ItemType[], destination: Address): void {
    // ... implementation
  }

  getPendingDispatches(): ItemType[] {
    return this.pendingDispatch;
  }
}
```

The FulfillmentCenter implements three interfaces. It can be used anywhere that needs an `ItemReceiver`, or a `Warehouse`, or an `ItemDispatcher`. Different parts of the system only see the interface they need. The shipping department sees `ItemDispatcher`. The inventory team sees `Warehouse`. The receiving dock sees `ItemReceiver`.

## Dependency Injection
Instead of a class creating its own dependencies, they're passed in from outside.

```ts
// postal-system/delivery/delivery-coordinator.ts

class DeliveryCoordinator<ItemType extends Deliverable> {
  constructor(
    private readonly warehouse: Warehouse<ItemType>,
    private readonly translator: TrackingTranslator<ItemType, PublicTrackingInfo>,
    private readonly dispatcher: ItemDispatcher<ItemType>
  ) {}

  processDelivery(trackingCode: string): DeliveryResult {
    // Convert public tracking code to internal representation
    const internalInfo = this.translator.toInternal({ trackingCode, /* ... */ });
    
    // Get from warehouse
    const item = this.warehouse.retrieve(internalInfo.warehouseId);
    
    if (!item) {
      return { success: false, reason: 'Item not found' };
    }

    // Dispatch it
    this.dispatcher.dispatchTo([item], item.getDestination());
    
    return { success: true };
  }
}
```

The `DeliveryCoordinator` doesn't create a warehouse or translator. It receives them through its constructor. Why does this matter?
- Testability: In tests, you can pass in fake implementations
- Flexibility: You can swap implementations without changing the coordinator
- Decoupling: The coordinator doesn't know (or care) about concrete classes

The complexity exists to achieve flexibility, testability, and maintainability. This is why enterprise codebases look the way they do. It's not TypeScript being complex — it's OOP principles being applied rigorously.

### React Dependency Injection
Imagine our postal service needs a tracking dashboard. The dashboard needs a `TrackingController` to manage package lookups and status updates. But we don't want the UI to know how tracking works - just what it can do. Components depend on `TrackingController`, not `TrackingControllerImpl`. Tests provide fakes. Different environments provide different implementations.

```ts
// postal-system/tracking/tracking-controller.ts

export interface TrackingController {
  readonly currentPackage: Package | undefined;
  lookupPackage(trackingCode: string): Promise<void>;
  markAsDelivered(): Promise<void>;
}

export class TrackingControllerImpl implements TrackingController {
  constructor(
    private readonly warehouseService: WarehouseService,
    private readonly deliveryService: DeliveryService,
  ) {}

  async lookupPackage(trackingCode: string): Promise<void> {
    // Implementation details hidden from consumers
  }
  // ...
}
```

An "install function" creates a fully-wired service instance. It encapsulates how to construct something:

```ts
// postal-system/services/install.ts

function installTrackingController(): TrackingController {
  const warehouseService = installWarehouseService();
  const deliveryService = installDeliveryService();
  return new TrackingControllerImpl(warehouseService, deliveryService);
}
```

Components receive services at creation time. The factory `createTrackingPanel` receives dependencies and returns a component. The component itself has no idea where `TrackingController` comes from, but just uses it.

```ts
// postal-system/ui/tracking-panel/create.tsx

export function createTrackingPanel(opts: {
  trackingController: TrackingController;
  analytics: AnalyticsClient;
}) {
  return function TrackingPanel() {
    const { trackingController, analytics } = opts;
    
    const handleLookup = (code: string) => {
      analytics.track('package_lookup', { code });
      trackingController.lookupPackage(code);
    };
    
    return <TrackingPanelView controller={trackingController} onLookup={handleLookup} />;
  };
}
```

At app startup, install functions wire everything together:

```ts
// postal-system/app/bootstrap.ts

const trackingController = installTrackingController();
const analyticsService = installAnalyticsService();

const { TrackingPanel } = createTrackingPanel({
  trackingController,
  analytics: analyticsService,
});

// TrackingPanel is now ready to render, fully wired
```

Swap `installTrackingController` for a fake version, and the whole app uses fakes, no component changes required.
