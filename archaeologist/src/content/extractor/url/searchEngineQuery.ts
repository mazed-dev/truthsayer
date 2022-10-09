import { parse } from 'query-string'

export enum SearchEngineName {
  AMAZON = 'amazon',
  BING = 'bing',
  DUCKDUCKGO = 'duckduckgo',
  GITHUB = 'github',
  GOOGLE = 'google',
  WIKIPEDIA = 'wikipedia',
  YOUTUBE = 'youtube',
  SPOTIFY = 'spotify',
  OTHER = 'other',
}

type Engine = {
  name: SearchEngineName
  logo?: string
  re: RegExp
  // Options for search phrase key, they are tried one by one until phrase is found
  queryKeys: string[]
  queryRe?: RegExp[]
}
const _kEngines: Engine[] = [
  {
    name: SearchEngineName.GITHUB,
    queryKeys: ['q'],
    // https://github.com/search?q=abc
    re: /:\/\/github.com\/search/,
  },
  {
    name: SearchEngineName.GOOGLE,
    queryKeys: ['q'],
    // https://www.google.com/search?q=abc
    re: /\.?google\.com\/search\?/,
  },
  {
    name: SearchEngineName.DUCKDUCKGO,
    queryKeys: ['q'],
    // https://duckduckgo.com/?q=abc&va=b&t=hc&ia=web
    re: /duckduckgo\.com\//,
  },
  {
    name: SearchEngineName.BING,
    queryKeys: ['q'],
    // https://www.bing.com/search?q=abc
    re: /\.?bing\.com\/search\?/,
  },
  {
    name: SearchEngineName.AMAZON,
    queryKeys: ['k'],
    // https://www.amazon.co.uk/s?k=abc&crid=1WXGHO7OKZF1T
    re: /\.?amazon\.[.\w]+\/s\?/,
  },
  {
    name: SearchEngineName.WIKIPEDIA,
    queryKeys: ['search'],
    // https://en.wikipedia.org/w/index.php?search=abc
    re: /\.wikipedia\.org\/w\/index.php\?.*search=.+/,
  },
  {
    name: SearchEngineName.YOUTUBE,
    queryKeys: ['search_query'],
    // https://www.youtube.com/results?search_query=abc
    re: /\.?youtube\.com\/results\?.*search_query=.+/,
  },
  {
    name: SearchEngineName.SPOTIFY,
    queryKeys: [],
    queryRe: [/\/search\/([^/]+)/],
    // 'https://open.spotify.com/search/u2'
    re: /\.spotify\.com\/search\//,
  },
  {
    name: SearchEngineName.OTHER,
    queryKeys: ['p', 'q', 'text', 'keywords'],
    re: /\/search[/?]/,
  },
]

export function isSearchEngineQueryUrl(url: string): boolean {
  return _kEngines.find((engine: Engine) => engine.re.test(url)) != null
}

type SearchEngineQuery = Engine & {
  phrase?: string
}
export function extractSearchEngineQuery(
  url: string
): SearchEngineQuery | null {
  const engine = _kEngines.find((engine: Engine) => engine.re.test(url))
  if (engine == null) {
    return null
  }
  const obj = new URL(url)
  const query = parse(obj.search)
  for (const key of engine.queryKeys) {
    let phrase = query[key]
    if (phrase != null) {
      if (Array.isArray(phrase)) {
        phrase = phrase.join(' ')
      }
      return {
        ...engine,
        phrase,
      }
    }
  }
  if (engine.queryRe) {
    for (const r of engine.queryRe) {
      const result = r.exec(url)
      if (result?.length === 2) {
        const phrase = decodeURI(result[1])
        return { ...engine, phrase }
      }
    }
  }
  return { ...engine }
}
