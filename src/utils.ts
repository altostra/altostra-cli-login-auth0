import crypto from 'crypto'

export
function isNonEmptyString(s: unknown): s is string {
  return typeof s === 'string' && s.length > 0
}

export 
type Deferred<T> = {
  resolve: (value?: T) => void
  reject: (error?: unknown) => void
  promise: Promise<T>
}

export 
function mkDeferred<T>(): Deferred<T> {
  let resolvePromise: (value?: T) => void
  let rejectPromise: (error?: unknown) => void
  
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })

  return {
    resolve: (value?: T) => resolvePromise(value),
    reject: (error?: unknown) => rejectPromise(error),
    promise
  }
}

export
function genRandom(size: number): Buffer {
  return crypto.randomBytes(size)
}

export
function genRandomString(size: number): string {
  return genRandom(size).toString('hex')
}

export
function sha256(value: Buffer): Buffer {
  return crypto.createHash('sha256').update(value).digest()
}

export
function encodeBase64(value: Buffer): string {
  return value
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}


export
type Timeout<T> = {
  cancel: () => void
  promise: Promise<T>
}
/**
 * Returns a promise that ALWAYS REJECTS after `duration`.
 */
export
function startTimeout<T = unknown>(duration: number): Timeout<T> {
  let cancel: () => void 

  const promise = new Promise<T>((_, reject) => {
    const timeout = setTimeout(reject, duration)

    cancel = () => { clearTimeout(timeout) }
  })

  return {
    cancel: () => cancel(),
    promise
  }
}

export type Key = keyof any

export
  function isObject(val: unknown): val is Record<Key, unknown> {
  return !!val &&
    (typeof val === 'object' || typeof val === 'function')
}