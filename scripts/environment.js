export const isBrowser = globalThis.window?.document !== undefined;

export const isNode = globalThis.process?.versions?.node !== undefined;

export const isBun = globalThis.process?.versions?.bun !== undefined;

export const isDeno = globalThis.Deno?.version?.deno !== undefined;

export const isElectron = globalThis.process?.versions?.electron !== undefined;

export const isWebWorker = typeof WorkerGlobalScope !== 'undefined' && globalThis instanceof WorkerGlobalScope;
