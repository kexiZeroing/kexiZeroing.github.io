export const isBrowser = globalThis.window?.document !== undefined;

export const isNode = globalThis.process?.versions?.node !== undefined;

export const isBun = globalThis.process?.versions?.bun !== undefined;

export const isDeno = globalThis.Deno?.version?.deno !== undefined;

export const isElectron = globalThis.process?.versions?.electron !== undefined;

export const isWebWorker = typeof WorkerGlobalScope !== 'undefined' && globalThis instanceof WorkerGlobalScope;

const platform = globalThis.navigator?.userAgentData?.platform;

export const isMacOs = platform === 'macOS'
	|| globalThis.navigator?.platform === 'MacIntel' // Even on Apple silicon Macs.
	|| globalThis.navigator?.userAgent?.includes(' Mac ') === true
	|| globalThis.process?.platform === 'darwin';

export const isWindows = platform === 'Windows'
	|| globalThis.navigator?.platform === 'Win32'
	|| globalThis.process?.platform === 'win32';
   