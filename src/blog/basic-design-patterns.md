---
title: "Basic design pattern examples in JavaScript"
description: ""
added: "Mar 15 2025"
tags: [other]
---

Design patterns are typical solutions to commonly occurring problems in software design. They help developers write more efficient and maintainable code.

The Gang of Four Design Patterns is the collection of 23 design patterns from the book “Design Patterns: Elements of Reusable Object-Oriented Software”. This book was first published in 1994 and it’s one of the most popular books to learn design patterns.

I found this collection of essential design patterns explained at https://github.com/AllThingsSmitty/basic-design-patterns, and I’ve extracted some useful examples and shared them here.

### Factory Method Pattern

```js
class Car {
  constructor({ doors = 4, state = "brand new", color = "silver" } = {}) {
    this.doors = doors;
    this.state = state;
    this.color = color;
  }
}

class Truck {
  constructor({ doors = 2, state = "used", color = "blue" } = {}) {
    this.doors = doors;
    this.state = state;
    this.color = color;
  }
}

class VehicleFactory {
  createVehicle(options) {
    switch (options.vehicleType) {
      case "car":
        return new Car(options);
      case "truck":
        return new Truck(options);
      default:
        return null;
    }
  }
}
```

### Singleton Pattern

```js
class Singleton {
  constructor() {
    if (!Singleton.instance) {
      Singleton.instance = this;
    }
    return Singleton.instance;
  }

  someMethod() {
    console.log("Singleton method called");
  }
}
```

### Adapter Pattern

```js
class OldCalculator {
  constructor() {
    this.operations = function (term1, term2, operation) {
      switch (operation) {
        case "add":
          return term1 + term2;
        case "sub":
          return term1 - term2;
        default:
          return NaN;
      }
    };
  }
}

class NewCalculator {
  add(term1, term2) {
    return term1 + term2;
  }
  sub(term1, term2) {
    return term1 - term2;
  }
}

// Adapter allows incompatible interfaces to work together
// by roviding a wrapper that translates calls from one interface to another.
class CalculatorAdapter {
  constructor() {
    this.newCalculator = new NewCalculator();
  }

  operations(term1, term2, operation) {
    switch (operation) {
      case "add":
        return this.newCalculator.add(term1, term2);
      case "sub":
        return this.newCalculator.sub(term1, term2);
      default:
        return NaN;
    }
  }
}
```

### Decorator Pattern

```js
class Coffee {
  cost() {
    return 5;
  }
}

// Decorator allows behavior to be added to individual objects dynamically. 
class CoffeeDecorator {
  constructor(coffee) {
    this.coffee = coffee;
  }

  cost() {
    return this.coffee.cost();
  }
}

class MilkDecorator extends CoffeeDecorator {
  cost() {
    return this.coffee.cost() + 1;
  }
}

class SugarDecorator extends CoffeeDecorator {
  cost() {
    return this.coffee.cost() + 0.5;
  }
}
```

### Facade Pattern

```js
class CPU {
  freeze() {
    console.log("Freezing CPU...");
  }
  jump(position) {
    console.log(`Jumping to position ${position}...`);
  }
  execute() {
    console.log("Executing instructions...");
  }
}

class Memory {
  load(position, data) {
    console.log(`Loading data '${data}' at position ${position}...`);
  }
}

class HardDrive {
  read(lba, size) {
    console.log(`Reading ${size} bytes from LBA ${lba}...`);
    return "data";
  }
}

// Facade class to simplify the interaction with the subsystems.
class ComputerFacade {
  constructor() {
    this.cpu = new CPU();
    this.memory = new Memory();
    this.hardDrive = new HardDrive();
  }

  start() {
    this.cpu.freeze();
    this.memory.load(0, this.hardDrive.read(0, 1024));
    this.cpu.jump(0);
    this.cpu.execute();
  }
}
```

### Strategy Pattern

```js
class Strategy {
  execute(a, b) {
    throw new Error("This method should be overridden!");
  }
}

// Strategy allows you to define a family of algorithms and make them interchangeable, 
// allowing for flexible and dynamic changes to the algorithm used at runtime.
class AddStrategy extends Strategy {
  execute(a, b) {
    return a + b;
  }
}

class SubtractStrategy extends Strategy {
  execute(a, b) {
    return a - b;
  }
}

class MultiplyStrategy extends Strategy {
  execute(a, b) {
    return a * b;
  }
}

class Calculator {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  executeStrategy(a, b) {
    return this.strategy.execute(a, b);
  }
}
```

### Command Pattern

```js
class Command {
  execute() {}
  undo() {}
}

class LightOnCommand extends Command {
  constructor(light) {
    super();
    this.light = light;
  }
  execute() {
    this.light.on();
  }
  undo() {
    this.light.off();
  }
}

class LightOffCommand extends Command {
  constructor(light) {
    super();
    this.light = light;
  }
  execute() {
    this.light.off();
  }
  undo() {
    this.light.on();
  }
}

class Light {
  on() {
    console.log("The light is on");
  }
  off() {
    console.log("The light is off");
  }
}

class RemoteControl {
  setCommand(command) {
    this.command = command;
  }

  pressButton() {
    this.command.execute();
  }

  pressUndo() {
    this.command.undo();
  }
}
```

### Observer Pattern

```js
class Subject {
  constructor() {
    this.observers = [];
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notify(data) {
    this.observers.forEach((observer) => observer.update(data));
  }
}

class Observer {
  update(data) {
    console.log(`Observer received data: ${data}`);
  }
}
```

### Visitor Pattern

```js
class Visitor {
  visitConcreteElementA(element) {}
  visitConcreteElementB(element) {}
}

// Visitor allows you to define new operations on objects, 
// without changing the classes of the elements on which it operates.
class ConcreteVisitor1 extends Visitor {
  visitConcreteElementA(element) {
    console.log(`ConcreteVisitor1: ${element.operationA()}`);
  }
  visitConcreteElementB(element) {
    console.log(`ConcreteVisitor1: ${element.operationB()}`);
  }
}

class ConcreteVisitor2 extends Visitor {
  visitConcreteElementA(element) {
    console.log(`ConcreteVisitor2: ${element.operationA()}`);
  }
  visitConcreteElementB(element) {
    console.log(`ConcreteVisitor2: ${element.operationB()}`);
  }
}

class Element {
  accept(visitor) {}
}

class ConcreteElementA extends Element {
  accept(visitor) {
    visitor.visitConcreteElementA(this);
  }
  operationA() {
    return "ConcreteElementA";
  }
}

class ConcreteElementB extends Element {
  accept(visitor) {
    visitor.visitConcreteElementB(this);
  }
  operationB() {
    return "ConcreteElementB";
  }
}
```
