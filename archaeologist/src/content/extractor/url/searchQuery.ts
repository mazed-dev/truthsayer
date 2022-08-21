// https://github.com/search?q=abc
// https://www.google.com/search?q=http
// https://duckduckgo.com/?q=abc&va=b&t=hc&ia=web
// https://www.bing.com/search?q=abc
// https://www.amazon.co.uk/s?k=dfd&crid=1WXGHO7OKZF1T
// https://en.wikipedia.org/w/index.php?search=adfasdfasdfasdf
// https://www.ebay.co.uk/sch/i.html?campid=5819208&kw=asdf
// https://yandex.ru/search/?text=abc
// https://www.youtube.com/results?search_query=abc
// https://www.linkedin.com/search/results/all/?keywords=abc&sid=uGw

export function isSearchQuery(url: string): boolean {
  return false
}
export function extractQuery(url: string): string | null {
  return null
}
