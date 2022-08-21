import {
  extractSearchEngineQuery,
  isSearchEngineQueryUrl,
  SearchEngineName,
} from './searchEngineQuery'

type KnowSearchEngineCase = {
  name: SearchEngineName
  url: string
  phrase: string
}
const known: KnowSearchEngineCase[] = [
  {
    name: SearchEngineName.GITHUB,
    url: 'https://github.com/search?q=abc+abc',
    phrase: 'abc abc',
  },
  {
    name: SearchEngineName.GOOGLE,
    phrase: 'abc abc',
    url: 'https://www.google.com/search?q=abc+abc',
  },
  {
    name: SearchEngineName.DUCKDUCKGO,
    phrase: 'abc duckduckGO',
    url: 'https://duckduckgo.com/?q=abc+duckduckGO&va=b&t=hc&ia=web',
  },
  {
    name: SearchEngineName.BING,
    phrase: 'abc bing',
    url: 'https://www.bing.com/search?q=abc+bing',
  },
  {
    name: SearchEngineName.AMAZON,
    phrase: 'abc amazon',
    url: 'https://www.amazon.co.uk/s?k=abc+amazon&crid=1WXGHO7OKZF1T',
  },
  {
    name: SearchEngineName.WIKIPEDIA,
    phrase: 'abc WIKIPEDIA',
    url: 'https://en.wikipedia.org/w/index.php?search=abc+WIKIPEDIA',
  },
  {
    name: SearchEngineName.YANDEX,
    phrase: 'abc yandex алгоритм',
    url: 'https://yandex.ru/search/?text=abc+yandex+алгоритм',
  },
  {
    name: SearchEngineName.YOUTUBE,
    phrase: 'abc abc',
    url: 'https://www.youtube.com/results?search_query=abc+abc',
  },
]

test('Known search engines - extractSearchEngineQuery', () => {
  expect(extractSearchEngineQuery('')).toStrictEqual(null)
  known.forEach((knownCase) => {
    const query = extractSearchEngineQuery(knownCase.url)
    expect(query?.phrase).toStrictEqual(knownCase.phrase)
    expect(query?.name).toStrictEqual(knownCase.name)
  })
})

test('Known search engines - isSearchEngineQueryUrl', () => {
  known.forEach((knownCase) => {
    const query = isSearchEngineQueryUrl(knownCase.url)
    expect(query).toStrictEqual(true)
  })
})
