// Detect lock files to know the current package manage

import fsPromises from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const LOCKS = {
  'bun.lockb': 'bun',
  'deno.lock': 'deno',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'package-lock.json': 'npm',
  'npm-shrinkwrap.json': 'npm',
}

async function detect(options = {}) {
  const { cwd } = options

  for (const directory of lookup(cwd)) {
    // Look up for lock files
    for (const lock of Object.keys(LOCKS)) {
      if (await fileExists(path.join(directory, lock))) {
        const name = LOCKS[lock]
        console.log('detect: ', name)
        // return name
      }
    }
  }
}

detect()

function * lookup(cwd = process.cwd()) {
  let directory = path.resolve(cwd)
  const { root } = path.parse(directory)

  while (directory && directory !== root) {
    yield directory

    directory = path.dirname(directory)
  }
}

async function fileExists(filePath) {
  try {
    const stats = await fsPromises.stat(filePath)
    if (stats.isFile()) {
      return true
    }
  }
  catch {}
  return false
}
