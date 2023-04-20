import { log } from './log'

/**
 * See https://stackoverflow.com/a/30469297/3375765 for more information
 * about the implementation
 */
function isError(value: any): value is Error {
  return value && value.name && value.message
}

/**
 * Detect the 'AbortError' exception type to ignore such exceptions comletely
 * in exception handling code. Those are very normal and happens on canceled
 * operations, therefore they are not real exception, but rather cancelation
 * signal of asyncronous code.
 */
export function isAbortError(exception: Error): boolean {
  return exception.name === 'AbortError'
}

export function errorise(value: any): Error {
  if (isError(value)) {
    return value
  }
  return { name: 'unknown exception', message: JSON.stringify(value) }
}

export class MsgException<T extends object> extends Error {
  v: Omit<T, keyof Error>

  constructor(
    message: string,
    public readonly data: Omit<T, keyof Error> & {
      [K in keyof Error]: never
    }
  ) {
    super(message)
    this.name = 'Exception'
    this.v = data
  }
}

/**
 * @summary Set of tools to transport Error information across messaging boundaries.
 *
 * @description Certain parts of a JS application may communicate via
 * messages rather than direction function calls. A web extension's background
 * script that talks to extension's content script is one example. By default,
 * tools like 'webextension-polyfill' will suppress basic context of this error such as `Error.name`,
 * see https://github.com/mozilla/webextension-polyfill/blob/9398f8cc20ed7e1cc2b475180ed1bc4dee2ebae5/src/browser-polyfill.js#L482-L488
 * for more details.
 * Even if the originally thrown error does include meaningful error information,
 * any field of an Error object except `Error.message` will get lost which makes
 * error handling difficult.
 * These tools abuse the fact that `Error.message` *does* get transported
 * unaltered by packing all the original data into a JSON-encoded string and
 * then unpacking it into a new Error object on the receiving end.
 */
export namespace ErrorViaMessage {
  /**
   * Pack all meaningful data fields of an input error into `Error.message` field.
   * Reversable by @see pack()
   */
  export function pack<T extends Error>(error: T): Error {
    const data = Object.assign({}, error)
    // NOTE: for some reason `error.message` gets special treatment in
    // Object.assign and doesn't get copied, so it has to be copied manually
    data.message = error.message
    return new Error(ERROR_VIA_MESSAGE_PAYLOAD_PREFIX + JSON.stringify(data))
  }
  /** Reverse @see pack() */
  export function tryUnpack(input: Error): Error {
    if (!input.message.startsWith(ERROR_VIA_MESSAGE_PAYLOAD_PREFIX)) {
      // This is not an error packed via pack()
      return input
    }
    const packed = input.message
    const data = JSON.parse(
      packed.slice(ERROR_VIA_MESSAGE_PAYLOAD_PREFIX.length)
    )
    const error = new Error(data.message)
    Object.assign(error, data)
    error.name = data.name
    error.stack = data.stack
    return error
  }
  /**
   * Wrap input callable into a new callable which if any Error is thrown
   * will @see pack() it.
   */
  export function rethrow<R, T extends (...args: any[]) => Promise<R>>(
    callable: T
  ): (...args: Parameters<T>) => Promise<R> {
    return async (...args: Parameters<T>) => {
      try {
        return await callable(...args)
      } catch (error) {
        throw ErrorViaMessage.pack(errorise(error))
      }
    }
  }

  const ERROR_VIA_MESSAGE_PAYLOAD_PREFIX = 'ERROR_VIA_MESSAGE:'
}
