/**
 * This is patched version of library `normalize-url`
 * https://github.com/sindresorhus/normalize-url#readme
 *
 * [@akidyakov] There is a problem with original library that I can not fix
 * properly. The way they removed searchParams by array using `.keys()` method
 * of `URLSearchParams` doesn't work in all browsers (e.g. Firefox). More
 * portable and cheaper way to do it is to use `.forEach()` instead. And this is
 * the main part of the patch, everything else is about small neglectable fixes
 * migraion to TS and style fixes.
 */
export interface Options {
  /**
  @default 'http:'
  */
  readonly defaultProtocol?: string

  /**
  Prepends `defaultProtocol` to the URL if it's protocol-relative.

  @default true

  @example
  ```
  normalizeUrl('//sindresorhus.com:80/')
  //=> 'http://sindresorhus.com'

  normalizeUrl('//sindresorhus.com:80/', {normalizeProtocol: false})
  //=> '//sindresorhus.com'
  ```
  */
  readonly normalizeProtocol?: boolean

  /**
  Normalizes `https:` URLs to `http:`.

  @default false

  @example
  ```
  normalizeUrl('https://sindresorhus.com:80/')
  //=> 'https://sindresorhus.com'

  normalizeUrl('https://sindresorhus.com:80/', {forceHttp: true})
  //=> 'http://sindresorhus.com'
  ```
  */
  readonly forceHttp?: boolean

  /**
  Normalizes `http:` URLs to `https:`.

  This option can't be used with the `forceHttp` option at the same time.

  @default false

  @example
  ```
  normalizeUrl('https://sindresorhus.com:80/')
  //=> 'https://sindresorhus.com'

  normalizeUrl('http://sindresorhus.com:80/', {forceHttps: true})
  //=> 'https://sindresorhus.com'
  ```
  */
  readonly forceHttps?: boolean

  /**
  Strip the [authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) part of a URL.

  @default true

  @example
  ```
  normalizeUrl('user:password@sindresorhus.com')
  //=> 'https://sindresorhus.com'

  normalizeUrl('user:password@sindresorhus.com', {stripAuthentication: false})
  //=> 'https://user:password@sindresorhus.com'
  ```
  */
  readonly stripAuthentication?: boolean

  /**
  Removes hash from the URL.

  @default false

  @example
  ```
  normalizeUrl('sindresorhus.com/about.html#contact')
  //=> 'http://sindresorhus.com/about.html#contact'

  normalizeUrl('sindresorhus.com/about.html#contact', {stripHash: true})
  //=> 'http://sindresorhus.com/about.html'
  ```
  */
  readonly stripHash?: boolean

  /**
  Removes HTTP(S) protocol from an URL `http://sindresorhus.com` → `sindresorhus.com`.

  @default false

  @example
  ```
  normalizeUrl('https://sindresorhus.com')
  //=> 'https://sindresorhus.com'

  normalizeUrl('sindresorhus.com', {stripProtocol: true})
  //=> 'sindresorhus.com'
  ```
  */
  readonly stripProtocol?: boolean

  /**
  Strip the [text fragment](https://web.dev/text-fragments/) part of the URL

  __Note:__ The text fragment will always be removed if the `stripHash` option is set to `true`, as the hash contains the text fragment.

  @default true

  @example
  ```
  normalizeUrl('http://sindresorhus.com/about.html#:~:text=hello')
  //=> 'http://sindresorhus.com/about.html#'

  normalizeUrl('http://sindresorhus.com/about.html#section:~:text=hello')
  //=> 'http://sindresorhus.com/about.html#section'

  normalizeUrl('http://sindresorhus.com/about.html#:~:text=hello', {stripTextFragment: false})
  //=> 'http://sindresorhus.com/about.html#:~:text=hello'

  normalizeUrl('http://sindresorhus.com/about.html#section:~:text=hello', {stripTextFragment: false})
  //=> 'http://sindresorhus.com/about.html#section:~:text=hello'
  ```
  */
  readonly stripTextFragment?: boolean

  /**
  Removes `www.` from the URL.

  @default true

  @example
  ```
  normalizeUrl('http://www.sindresorhus.com')
  //=> 'http://sindresorhus.com'

  normalizeUrl('http://www.sindresorhus.com', {stripWWW: false})
  //=> 'http://www.sindresorhus.com'
  ```
  */
  readonly stripWWW?: boolean

  /**
  Removes query parameters that matches any of the provided strings or regexes.

  @default [/^utm_\w+/i]

  @example
  ```
  normalizeUrl('www.sindresorhus.com?foo=bar&ref=test_ref', {
    removeQueryParameters: ['ref']
  })
  //=> 'http://sindresorhus.com/?foo=bar'
  ```

  If a boolean is provided, `true` will remove all the query parameters.

  ```
  normalizeUrl('www.sindresorhus.com?foo=bar', {
    removeQueryParameters: true
  })
  //=> 'http://sindresorhus.com'
  ```

  `false` will not remove any query parameter.

  ```
  normalizeUrl('www.sindresorhus.com?foo=bar&utm_medium=test&ref=test_ref', {
    removeQueryParameters: false
  })
  //=> 'http://www.sindresorhus.com/?foo=bar&ref=test_ref&utm_medium=test'
  ```
  */
  readonly removeQueryParameters?: ReadonlyArray<RegExp | string> | boolean

  /**
  Removes trailing slash.

  __Note__: Trailing slash is always removed if the URL doesn't have a pathname unless the `removeSingleSlash` option is set to `false`.

  @default true

  @example
  ```
  normalizeUrl('http://sindresorhus.com/redirect/')
  //=> 'http://sindresorhus.com/redirect'

  normalizeUrl('http://sindresorhus.com/redirect/', {removeTrailingSlash: false})
  //=> 'http://sindresorhus.com/redirect/'

  normalizeUrl('http://sindresorhus.com/', {removeTrailingSlash: false})
  //=> 'http://sindresorhus.com'
  ```
  */
  readonly removeTrailingSlash?: boolean

  /**
  Remove a sole `/` pathname in the output. This option is independant of `removeTrailingSlash`.

  @default true

  @example
  ```
  normalizeUrl('https://sindresorhus.com/')
  //=> 'https://sindresorhus.com'

  normalizeUrl('https://sindresorhus.com/', {removeSingleSlash: false})
  //=> 'https://sindresorhus.com/'
  ```
  */
  readonly removeSingleSlash?: boolean

  /**
  Removes the default directory index file from path that matches any of the provided strings or regexes.
  When `true`, the regex `/^index\.[a-z]+$/` is used.

  @default false

  @example
  ```
  normalizeUrl('www.sindresorhus.com/foo/default.php', {
    removeDirectoryIndex: [/^default\.[a-z]+$/]
  })
  //=> 'http://sindresorhus.com/foo'
  ```
  */
  readonly removeDirectoryIndex?: boolean | ReadonlyArray<RegExp | string>

  /**
  Sorts the query parameters alphabetically by key.

  @default true

  @example
  ```
  normalizeUrl('www.sindresorhus.com?b=two&a=one&c=three', {
    sortQueryParameters: false
  })
  //=> 'http://sindresorhus.com/?b=two&a=one&c=three'
  ```
  */
  readonly sortQueryParameters?: boolean
}

const testParameter = (name: string, filters: ReadonlyArray<RegExp | string>) =>
  filters.some((filter) =>
    filter instanceof RegExp ? filter.test(name) : filter === name
  )

/**
[Normalize](https://en.wikipedia.org/wiki/URL_normalization) a URL.

@param url - URL to normalize, including [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs).

@example
```
import normalizeUrl from 'normalize-url'

normalizeUrl('sindresorhus.com')
//=> 'http://sindresorhus.com'

normalizeUrl('//www.sindresorhus.com:80/../baz?b=bar&a=foo')
//=> 'http://sindresorhus.com/baz?a=foo&b=bar'
```
*/
export function normalizeUrl(urlString: string, options?: Options): string {
  const defaultProtocol = options?.defaultProtocol ?? 'http:'
  const normalizeProtocol = options?.normalizeProtocol ?? true
  const forceHttp = options?.forceHttp ?? false
  const forceHttps = options?.forceHttps ?? false
  const stripAuthentication = options?.stripAuthentication ?? true
  const stripHash = options?.stripHash ?? false
  const stripTextFragment = options?.stripTextFragment ?? true
  const stripWWW = options?.stripWWW ?? true
  const stripProtocol = options?.stripProtocol ?? false
  const sortQueryParameters = options?.sortQueryParameters ?? true
  const removeQueryParameters = options?.removeQueryParameters ?? [/^utm_\w+/i]
  const removeTrailingSlash = options?.removeTrailingSlash ?? true
  const removeSingleSlash = options?.removeSingleSlash ?? true
  let removeDirectoryIndex = options?.removeDirectoryIndex ?? false

  urlString = urlString.trim()

  // Data URL
  if (/^data:/i.test(urlString)) {
    throw new Error("Can't normalize data URL - not implemented")
  }

  if (/^view-source:/i.test(urlString)) {
    throw new Error(
      '`view-source:` is not supported as it is a non-standard protocol'
    )
  }

  const hasRelativeProtocol = urlString.startsWith('//')
  const isRelativeUrl = !hasRelativeProtocol && /^\.*\//.test(urlString)

  // Prepend protocol
  if (!isRelativeUrl) {
    urlString = urlString.replace(/^(?!(?:\w+:)?\/\/)|^\/\//, defaultProtocol + '//')
  }

  const urlObject = new URL(urlString)

  if (forceHttp && forceHttps) {
    throw new Error(
      'The `forceHttp` and `forceHttps` options cannot be used together'
    )
  }

  if (forceHttp && urlObject.protocol === 'https:') {
    urlObject.protocol = 'http:'
  }

  if (forceHttps && urlObject.protocol === 'http:') {
    urlObject.protocol = 'https:'
  }

  // Remove auth
  if (stripAuthentication) {
    urlObject.username = ''
    urlObject.password = ''
  }

  // Remove hash
  if (stripHash) {
    urlObject.hash = ''
  } else if (stripTextFragment) {
    urlObject.hash = urlObject.hash.replace(/#?:~:text.*?$/i, '')
  }

  // Remove duplicate slashes if not preceded by a protocol
  // NOTE: This could be implemented using a single negative lookbehind
  // regex, but we avoid that to maintain compatibility with older js engines
  // which do not have support for that feature.
  if (urlObject.pathname) {
    // TODO: Replace everything below with `urlObject.pathname = urlObject.pathname.replace(/(?<!\b[a-z][a-z\d+\-.]{1,50}:)\/{2,}/g, '/');` when Safari supports negative lookbehind.

    // Split the string by occurrences of this protocol regex, and perform
    // duplicate-slash replacement on the strings between those occurrences
    // (if any).
    const protocolRegex = /\b[a-z][a-z\d+\-.]{1,50}:\/\//g

    let lastIndex = 0
    let result = ''
    for (;;) {
      const match = protocolRegex.exec(urlObject.pathname)
      if (!match) {
        break
      }

      const protocol = match[0]
      const protocolAtIndex = match.index
      const intermediate = urlObject.pathname.slice(lastIndex, protocolAtIndex)

      result += intermediate.replace(/\/{2,}/g, '/')
      result += protocol
      lastIndex = protocolAtIndex + protocol.length
    }

    const remnant = urlObject.pathname.slice(
      lastIndex,
      urlObject.pathname.length
    )
    result += remnant.replace(/\/{2,}/g, '/')

    urlObject.pathname = result
  }

  // Decode URI octets
  if (urlObject.pathname) {
    try {
      urlObject.pathname = decodeURI(urlObject.pathname)
    } catch {}
  }

  // Remove directory index
  if (removeDirectoryIndex === true) {
    removeDirectoryIndex = [/^index\.[a-z]+$/]
  }

  if (Array.isArray(removeDirectoryIndex) && removeDirectoryIndex.length > 0) {
    let pathComponents = urlObject.pathname.split('/')
    const lastComponent = pathComponents[pathComponents.length - 1]

    if (testParameter(lastComponent, removeDirectoryIndex)) {
      pathComponents = pathComponents.slice(0, -1)
      urlObject.pathname = `${pathComponents.slice(1).join('/')}/`
    }
  }

  if (urlObject.hostname) {
    // Remove trailing dot
    urlObject.hostname = urlObject.hostname.replace(/\.$/, '')

    // Remove `www.`
    if (
      stripWWW &&
      /^www\.(?!www\.)[a-z\-\d]{1,63}\.[a-z.\-\d]{2,63}$/.test(
        urlObject.hostname
      )
    ) {
      // Each label should be max 63 at length (min: 1).
      // Source: https://en.wikipedia.org/wiki/Hostname#Restrictions_on_valid_host_names
      // Each TLD should be up to 63 characters long (min: 2).
      // It is technically possible to have a single character TLD, but none currently exist.
      urlObject.hostname = urlObject.hostname.replace(/^www\./, '')
    }
  }

  // Remove query unwanted parameters
  if (Array.isArray(removeQueryParameters)) {
    const keysToDelete: string[] = []
    urlObject.searchParams.forEach(
      (_value: string, key: string) => {
        if (testParameter(key, removeQueryParameters)) {
          keysToDelete.push(key)
        }
      }
    )
    keysToDelete.forEach((key: string) => urlObject.searchParams.delete(key))
  }

  if (removeQueryParameters === true) {
    urlObject.search = ''
  }

  // Sort query parameters
  if (sortQueryParameters) {
    urlObject.searchParams.sort()

    // Calling `.sort()` encodes the search parameters, so we need to decode them again.
    try {
      urlObject.search = decodeURIComponent(urlObject.search)
    } catch {}
  }

  if (removeTrailingSlash) {
    urlObject.pathname = urlObject.pathname.replace(/\/$/, '')
  }

  const oldUrlString = urlString

  // Take advantage of many of the Node `url` normalizations
  urlString = urlObject.toString()

  if (
    !removeSingleSlash &&
    urlObject.pathname === '/' &&
    !oldUrlString.endsWith('/') &&
    urlObject.hash === ''
  ) {
    urlString = urlString.replace(/\/$/, '')
  }

  // Remove ending `/` unless removeSingleSlash is false
  if (
    (removeTrailingSlash || urlObject.pathname === '/') &&
    urlObject.hash === '' &&
    removeSingleSlash
  ) {
    urlString = urlString.replace(/\/$/, '')
  }

  // Restore relative protocol, if applicable
  if (hasRelativeProtocol && !normalizeProtocol) {
    urlString = urlString.replace(/^http:\/\//, '//')
  }

  // Remove http/https
  if (stripProtocol) {
    urlString = urlString.replace(/^(?:https?:)?\/\//, '')
  }

  return urlString
}
