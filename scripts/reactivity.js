// https://github.com/tesla3327/reactivity-from-scratch

let activeEffect;
const targetMap = new Map();

function isObject(val) {
  return val !== null && typeof val === 'object';
}

function isRef(value) {
  return !!(value && value.__v_isRef);
}

function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = new Set()));
    }
    dep.add(activeEffect);
  }
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach((effect) => queueJob(effect));
  }
}

function reactive(target) {
  if (!isObject(target)) {
    return target;
  }

  const handler = {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      if (isRef(result)) {
        return result.value;
      }
      track(target, key);
      return isObject(result) ? reactive(result) : result;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      } else {
        const result = Reflect.set(
          target,
          key,
          value,
          receiver
        );
        if (result && oldValue !== value) {
          trigger(target, key);
        }
        return result;
      }
    },
  };

  return new Proxy(target, handler);
}

function ref(initialValue) {
  return reactive({
    __v_isRef: true,
    value: initialValue,
  });
}

const queue = new Set();
let isFlushPending = false;
const effectStack = [];

function queueJob(job) {
  queue.add(job);
  if (!isFlushPending) {
    isFlushPending = true;
    // Schedules the flushJobs function to run in the next microtask,
    // allowing us to batch multiple effect triggers that
    // occur within the same synchronous code block.
    Promise.resolve().then(flushJobs);
  }
}

// Execute all queued jobs
function flushJobs() {
  for (const job of queue) {
    job();
  }
  queue.clear();
  isFlushPending = false;
}

function pushEffect(effect) {
  effectStack.push(effect);
  activeEffect = effect;
}

function popEffect() {
  effectStack.pop();
  activeEffect = effectStack[effectStack.length - 1];
}

function watchEffect(effect) {
  let cleanup;
  const wrappedEffect = () => {
    if (cleanup) {
      cleanup();
    }
    pushEffect(wrappedEffect);
    cleanup = undefined;
    const registerCleanup = (fn) => {
      cleanup = fn;
    };
    try {
      effect(registerCleanup);
    } finally {
      popEffect();
    }
  };

  queueJob(wrappedEffect);

  return () => {
    queue.delete(wrappedEffect);
    if (cleanup) cleanup();
    removeEffect(wrappedEffect);
  };
}

function computed(getter) {
  let value;
  let dirty = true;

  const computedRef = {
    get value() {
      if (dirty) {
        pushEffect(computedEffect);
        value = getter();
        popEffect();
        dirty = false;
      }
      track(computedRef, 'value');
      return value;
    },
  };

  const computedEffect = () => {
    dirty = true;
    trigger(computedRef, 'value');
  };

  return computedRef;
}
