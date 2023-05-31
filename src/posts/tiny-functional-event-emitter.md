---
layout: "../layouts/BlogPost.astro"
title: "A tiny functional event emitter"
slug: tiny-functional-event-emitter
description: ""
added: "May 31 2023"
tags: [code]
---

[Mitt](https://github.com/developit/mitt) is a tiny 200b functional event emitter / pubsub.

> Compared with `CustomEvent`, mitt is not coupled with DOM. So that when writing unit tests for event-related logic, you don't have to involve DOM in the tests. Also, firing DOM events is generally slower than mitt.

```js
export default function mitt(all = new Map()) {

	return {
    /**
     * A Map of event names to registered handler functions.
     */
    all,

    /**
     * Register an event handler for the given type.
     * @param {string|symbol} type Type of event to listen for, or `'*'` for all events
     * @param {Function} handler Function to call in response to given event
     */
    on(type, handler) {
      const handlers = all.get(type);
      if (handlers) {
        handlers.push(handler);
      }
      else {
        all.set(type, [handler]);
      }
    },

    /**
     * Remove an event handler for the given type.
     * If `handler` is omitted, all handlers of the given type are removed.
     * @param {string|symbol} type Type of event to unregister `handler` from (`'*'` to remove a wildcard handler)
     * @param {Function} [handler] Handler function to remove
     */
    off(type, handler) {
      const handlers = all.get(type);
      if (handlers) {
        if (handler) {
          // Using `>>> 0` ensures you get an integer between 0 and 0xFFFFFFFF.
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        }
        else {
          all.set(type, []);
        }
      }
    },

    /**
     * Invoke all handlers for the given type.
     * If present, `'*'` handlers are invoked after type-matched handlers.
     *
     * Note: Manually firing '*' handlers is not supported.
     *
     * @param {string|symbol} type The event type to invoke
     * @param {Any} [evt] Any value, passed to each handler
     */
    emit(type, evt) {
      let handlers = all.get(type);
      if (handlers) {
        handlers.slice().map((handler) => {
          handler(evt);
        });
      }

      handlers = all.get('*');
      if (handlers) {
        handlers.slice().map((handler) => {
          handler(type, evt);
        });
      }
    }
	};
}


// Usage (should use a signleton)
const emitter = mitt()

// listen to an event
emitter.on('foo', e => console.log('foo', e) )

// listen to all events
emitter.on('*', (type, e) => console.log(type, e) )

// fire an event
emitter.emit('foo', { a: 'b' })

// clearing all events
emitter.all.clear()
```
