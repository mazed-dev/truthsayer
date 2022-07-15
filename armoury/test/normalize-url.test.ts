import { normalizeUrl } from '../src/normalize-url'

function _assertEqual<Arg>(value: Arg, expected: Arg): void {
  expect(value).toStrictEqual(expected)
}

test('main', () => {
  _assertEqual(normalizeUrl('abc.com'), 'http://abc.com')
  _assertEqual(normalizeUrl('abc.com '), 'http://abc.com')
  _assertEqual(normalizeUrl('abc.com.'), 'http://abc.com')
  _assertEqual(normalizeUrl('abc.com'), 'http://abc.com')
  _assertEqual(
    normalizeUrl('abc.com', { defaultProtocol: 'https:' }),
    'https://abc.com'
  )
  _assertEqual(normalizeUrl('HTTP://abc.com'), 'http://abc.com')
  _assertEqual(normalizeUrl('//abc.com'), 'http://abc.com')
  _assertEqual(normalizeUrl('http://abc.com'), 'http://abc.com')
  _assertEqual(normalizeUrl('http://abc.com:80'), 'http://abc.com')
  _assertEqual(normalizeUrl('https://abc.com:443'), 'https://abc.com')
  _assertEqual(normalizeUrl('ftp://abc.com:21'), 'ftp://abc.com')
  _assertEqual(normalizeUrl('http://www.abc.com'), 'http://abc.com')
  _assertEqual(normalizeUrl('www.com'), 'http://www.com')
  _assertEqual(normalizeUrl('http://www.www.abc.com'), 'http://www.www.abc.com')
  _assertEqual(normalizeUrl('www.abc.com'), 'http://abc.com')
  _assertEqual(normalizeUrl('http://abc.com/foo/'), 'http://abc.com/foo')
  _assertEqual(
    normalizeUrl('abc.com/?foo=bar baz'),
    'http://abc.com/?foo=bar+baz'
  )
  _assertEqual(
    normalizeUrl('https://foo.com/https://bar.com'),
    'https://foo.com/https://bar.com'
  )
  _assertEqual(
    normalizeUrl('https://foo.com/https://bar.com/foo//bar'),
    'https://foo.com/https://bar.com/foo/bar'
  )
  _assertEqual(
    normalizeUrl('https://foo.com/http://bar.com'),
    'https://foo.com/http://bar.com'
  )
  _assertEqual(
    normalizeUrl('https://foo.com/http://bar.com/foo//bar'),
    'https://foo.com/http://bar.com/foo/bar'
  )
  _assertEqual(normalizeUrl('http://abc.com/%7Efoo/'), 'http://abc.com/~foo')
  _assertEqual(
    normalizeUrl('https://foo.com/%FAIL%/07/94/ca/55.jpg'),
    'https://foo.com/%FAIL%/07/94/ca/55.jpg'
  )
  _assertEqual(normalizeUrl('http://abc.com/?'), 'http://abc.com')
  _assertEqual(normalizeUrl('êxample.com'), 'http://xn--xample-hva.com')
  _assertEqual(
    normalizeUrl('http://abc.com/?b=bar&a=foo'),
    'http://abc.com/?a=foo&b=bar'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/?foo=bar*|<>:"'),
    'http://abc.com/?foo=bar*|%3C%3E:%22'
  )
  _assertEqual(normalizeUrl('http://abc.com:5000'), 'http://abc.com:5000')
  _assertEqual(
    normalizeUrl('//abc.com/', { normalizeProtocol: false }),
    '//abc.com'
  )
  _assertEqual(
    normalizeUrl('//abc.com:80/', { normalizeProtocol: false }),
    '//abc.com'
  )
  _assertEqual(normalizeUrl('http://abc.com/foo#bar'), 'http://abc.com/foo#bar')
  _assertEqual(
    normalizeUrl('http://abc.com/foo#bar', { stripHash: true }),
    'http://abc.com/foo'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/foo#bar:~:text=hello%20world', {
      stripHash: true,
    }),
    'http://abc.com/foo'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/foo/bar/../baz'),
    'http://abc.com/foo/baz'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/foo/bar/./baz'),
    'http://abc.com/foo/bar/baz'
  )
  _assertEqual(normalizeUrl('sindre://www.sorhus.com'), 'sindre://sorhus.com')
  _assertEqual(normalizeUrl('sindre://www.sorhus.com/'), 'sindre://sorhus.com')
  _assertEqual(
    normalizeUrl('sindre://www.sorhus.com/foo/bar'),
    'sindre://sorhus.com/foo/bar'
  )
  _assertEqual(
    normalizeUrl(
      'https://i.vimeocdn.com/filter/overlay?src0=https://i.vimeocdn.com/video/598160082_1280x720.jpg&src1=https://f.vimeocdn.com/images_v6/share/play_icon_overlay.png'
    ),
    'https://i.vimeocdn.com/filter/overlay?src0=https://i.vimeocdn.com/video/598160082_1280x720.jpg&src1=https://f.vimeocdn.com/images_v6/share/play_icon_overlay.png'
  )
})

test('stripAuthentication option', () => {
  _assertEqual(
    normalizeUrl('http://user:password@www.abc.com'),
    'http://abc.com'
  )
  _assertEqual(
    normalizeUrl('https://user:password@www.abc.com'),
    'https://abc.com'
  )
  _assertEqual(
    normalizeUrl('https://user:password@www.abc.com/@user'),
    'https://abc.com/@user'
  )
  _assertEqual(normalizeUrl('user:password@abc.com'), 'http://abc.com')
  _assertEqual(
    normalizeUrl('http://user:password@www.êxample.com'),
    'http://xn--xample-hva.com'
  )
  _assertEqual(
    normalizeUrl('sindre://user:password@www.sorhus.com'),
    'sindre://sorhus.com'
  )

  const options = { stripAuthentication: false }
  _assertEqual(
    normalizeUrl('http://user:password@www.abc.com', options),
    'http://user:password@abc.com'
  )
  _assertEqual(
    normalizeUrl('https://user:password@www.abc.com', options),
    'https://user:password@abc.com'
  )
  _assertEqual(
    normalizeUrl('https://user:password@www.abc.com/@user', options),
    'https://user:password@abc.com/@user'
  )
  _assertEqual(
    normalizeUrl('user:password@abc.com', options),
    'http://user:password@abc.com'
  )
  _assertEqual(
    normalizeUrl('http://user:password@www.êxample.com', options),
    'http://user:password@xn--xample-hva.com'
  )
  _assertEqual(
    normalizeUrl('sindre://user:password@www.sorhus.com', options),
    'sindre://user:password@sorhus.com'
  )
})

test('stripProtocol option', () => {
  const options = { stripProtocol: true }
  _assertEqual(normalizeUrl('http://www.abc.com', options), 'abc.com')
  _assertEqual(normalizeUrl('http://abc.com', options), 'abc.com')
  _assertEqual(normalizeUrl('https://www.abc.com', options), 'abc.com')
  _assertEqual(normalizeUrl('//www.abc.com', options), 'abc.com')
  _assertEqual(
    normalizeUrl('sindre://user:password@www.sorhus.com', options),
    'sindre://sorhus.com'
  )
  _assertEqual(
    normalizeUrl('sindre://www.sorhus.com', options),
    'sindre://sorhus.com'
  )
})

test('stripTextFragment option', () => {
  _assertEqual(normalizeUrl('http://abc.com'), 'http://abc.com')
  _assertEqual(normalizeUrl('http://abc.com/about#'), 'http://abc.com/about')
  _assertEqual(
    normalizeUrl('http://abc.com/about#:~:text=hello'),
    'http://abc.com/about'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/about#main'),
    'http://abc.com/about#main'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/about#main:~:text=hello'),
    'http://abc.com/about#main'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/about#main:~:text=hello%20world'),
    'http://abc.com/about#main'
  )

  const options = { stripTextFragment: false }
  _assertEqual(normalizeUrl('http://abc.com', options), 'http://abc.com')
  _assertEqual(
    normalizeUrl('http://abc.com/about#:~:text=hello', options),
    'http://abc.com/about#:~:text=hello'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/about#main', options),
    'http://abc.com/about#main'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/about#main:~:text=hello', options),
    'http://abc.com/about#main:~:text=hello'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/about#main:~:text=hello%20world', options),
    'http://abc.com/about#main:~:text=hello%20world'
  )

  const options2 = { stripHash: true, stripTextFragment: false }
  _assertEqual(normalizeUrl('http://abc.com', options2), 'http://abc.com')
  _assertEqual(
    normalizeUrl('http://abc.com/about#:~:text=hello', options2),
    'http://abc.com/about'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/about#main', options2),
    'http://abc.com/about'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/about#main:~:text=hello', options2),
    'http://abc.com/about'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/about#main:~:text=hello%20world', options2),
    'http://abc.com/about'
  )
})

test('stripWWW option', () => {
  const options = { stripWWW: false }
  _assertEqual(
    normalizeUrl('http://www.abc.com', options),
    'http://www.abc.com'
  )
  _assertEqual(normalizeUrl('www.abc.com', options), 'http://www.abc.com')
  _assertEqual(
    normalizeUrl('http://www.êxample.com', options),
    'http://www.xn--xample-hva.com'
  )
  _assertEqual(
    normalizeUrl('sindre://www.sorhus.com', options),
    'sindre://www.sorhus.com'
  )

  const options2 = { stripWWW: true }
  _assertEqual(
    normalizeUrl('http://www.vue.amsterdam', options2),
    'http://vue.amsterdam'
  )
  _assertEqual(
    normalizeUrl('http://www.sorhus.xx--bck1b9a5dre4c', options2),
    'http://sorhus.xx--bck1b9a5dre4c'
  )

  const tooLongTLDURL = 'http://www.sorhus.' + ''.padEnd(64, 'a')
  _assertEqual(normalizeUrl(tooLongTLDURL, options2), tooLongTLDURL)
})

test('removeQueryParameters option', () => {
  const options = {
    stripWWW: false,
    removeQueryParameters: [/^utm_\w+/i, 'ref'],
  }
  _assertEqual(
    normalizeUrl('www.abc.com?foo=bar&utm_medium=test'),
    'http://abc.com/?foo=bar'
  )
  _assertEqual(
    normalizeUrl('http://www.abc.com', options),
    'http://www.abc.com'
  )
  _assertEqual(
    normalizeUrl('www.abc.com?foo=bar', options),
    'http://www.abc.com/?foo=bar'
  )
  _assertEqual(
    normalizeUrl('www.abc.com?foo=bar&utm_medium=test&ref=test_ref', options),
    'http://www.abc.com/?foo=bar'
  )
})

test('removeQueryParameters boolean `true` option', () => {
  const options = {
    stripWWW: false,
    removeQueryParameters: true,
  }

  _assertEqual(
    normalizeUrl('http://www.abc.com', options),
    'http://www.abc.com'
  )
  _assertEqual(
    normalizeUrl('www.abc.com?foo=bar', options),
    'http://www.abc.com'
  )
  _assertEqual(
    normalizeUrl('www.abc.com?foo=bar&utm_medium=test&ref=test_ref', options),
    'http://www.abc.com'
  )
})

test('removeQueryParameters boolean `false` option', () => {
  const options = {
    stripWWW: false,
    removeQueryParameters: false,
  }

  _assertEqual(
    normalizeUrl('http://www.abc.com', options),
    'http://www.abc.com'
  )
  _assertEqual(
    normalizeUrl('www.abc.com?foo=bar', options),
    'http://www.abc.com/?foo=bar'
  )
  _assertEqual(
    normalizeUrl('www.abc.com?foo=bar&utm_medium=test&ref=test_ref', options),
    'http://www.abc.com/?foo=bar&ref=test_ref&utm_medium=test'
  )
})

test('forceHttp option', () => {
  const options = { forceHttp: true }
  _assertEqual(normalizeUrl('https://abc.com'), 'https://abc.com')
  _assertEqual(normalizeUrl('http://abc.com', options), 'http://abc.com')
  _assertEqual(normalizeUrl('https://www.abc.com', options), 'http://abc.com')
  _assertEqual(normalizeUrl('//abc.com', options), 'http://abc.com')
})

test('forceHttp option with forceHttps', () => {
  expect(() => {
    normalizeUrl('https://www.abc.com', { forceHttp: true, forceHttps: true })
  }).toThrow('The `forceHttp` and `forceHttps` options cannot be used together')
})

test('forceHttps option', () => {
  const options = { forceHttps: true }
  _assertEqual(normalizeUrl('https://abc.com'), 'https://abc.com')
  _assertEqual(normalizeUrl('http://abc.com', options), 'https://abc.com')
  _assertEqual(normalizeUrl('https://www.abc.com', options), 'https://abc.com')
  _assertEqual(normalizeUrl('//abc.com', options), 'https://abc.com')
})

test('removeTrailingSlash option', () => {
  const options = { removeTrailingSlash: false }
  _assertEqual(normalizeUrl('http://abc.com'), 'http://abc.com')
  _assertEqual(normalizeUrl('http://abc.com/'), 'http://abc.com')
  _assertEqual(normalizeUrl('http://abc.com', options), 'http://abc.com')
  _assertEqual(normalizeUrl('http://abc.com/', options), 'http://abc.com')
  _assertEqual(
    normalizeUrl('http://abc.com/redirect'),
    'http://abc.com/redirect'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/redirect/'),
    'http://abc.com/redirect'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/redirect/', options),
    'http://abc.com/redirect/'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/redirect/', options),
    'http://abc.com/redirect/'
  )
  _assertEqual(normalizeUrl('http://abc.com/#/'), 'http://abc.com/#/')
  _assertEqual(normalizeUrl('http://abc.com/#/', options), 'http://abc.com/#/')
  _assertEqual(
    normalizeUrl('http://abc.com/?unicorns=true'),
    'http://abc.com/?unicorns=true'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/?unicorns=true', options),
    'http://abc.com/?unicorns=true'
  )
})

test('removeSingleSlash option', () => {
  const options = { removeSingleSlash: false }
  _assertEqual(normalizeUrl('https://abc.com', options), 'https://abc.com')
  _assertEqual(normalizeUrl('https://abc.com/', options), 'https://abc.com/')
  _assertEqual(
    normalizeUrl('https://abc.com/redirect', options),
    'https://abc.com/redirect'
  )
  _assertEqual(
    normalizeUrl('https://abc.com/redirect/', options),
    'https://abc.com/redirect'
  )
  _assertEqual(
    normalizeUrl('https://abc.com/#/', options),
    'https://abc.com/#/'
  )
  _assertEqual(
    normalizeUrl('https://abc.com/?unicorns=true', options),
    'https://abc.com/?unicorns=true'
  )
})

test('removeSingleSlash option combined with removeTrailingSlash option', () => {
  const options = { removeTrailingSlash: false, removeSingleSlash: false }
  _assertEqual(normalizeUrl('https://abc.com', options), 'https://abc.com')
  _assertEqual(normalizeUrl('https://abc.com/', options), 'https://abc.com/')
  _assertEqual(
    normalizeUrl('https://abc.com/redirect', options),
    'https://abc.com/redirect'
  )
  _assertEqual(
    normalizeUrl('https://abc.com/redirect/', options),
    'https://abc.com/redirect/'
  )
  _assertEqual(
    normalizeUrl('https://abc.com/#/', options),
    'https://abc.com/#/'
  )
  _assertEqual(
    normalizeUrl('https://abc.com/?unicorns=true', options),
    'https://abc.com/?unicorns=true'
  )
})

test('removeDirectoryIndex option', () => {
  const options1 = { removeDirectoryIndex: ['index.html', 'index.php'] }
  _assertEqual(
    normalizeUrl('http://abc.com/index.html'),
    'http://abc.com/index.html'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/index.html', options1),
    'http://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/index.htm', options1),
    'http://abc.com/index.htm'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/index.php', options1),
    'http://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/path/index.html'),
    'http://abc.com/path/index.html'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/path/index.html', options1),
    'http://abc.com/path'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/path/index.htm', options1),
    'http://abc.com/path/index.htm'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/path/index.php', options1),
    'http://abc.com/path'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/foo/bar/index.html', options1),
    'http://abc.com/foo/bar'
  )

  const options2 = { removeDirectoryIndex: [/^index\.[a-z]+$/, 'remove.html'] }
  _assertEqual(
    normalizeUrl('http://abc.com/index.html'),
    'http://abc.com/index.html'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/index.html', options2),
    'http://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/index/index.html', options2),
    'http://abc.com/index'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/remove.html', options2),
    'http://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/default.htm', options2),
    'http://abc.com/default.htm'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/index.php', options2),
    'http://abc.com'
  )

  const options3 = { removeDirectoryIndex: true }
  _assertEqual(
    normalizeUrl('http://abc.com/index.html'),
    'http://abc.com/index.html'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/index.html', options3),
    'http://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/index.htm', options3),
    'http://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/index.php', options3),
    'http://abc.com'
  )
})

test('removeTrailingSlash and removeDirectoryIndex options)', () => {
  const options1 = {
    removeTrailingSlash: true,
    removeDirectoryIndex: true,
  }
  _assertEqual(
    normalizeUrl('http://abc.com/path/', options1),
    'http://abc.com/path'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/path/index.html', options1),
    'http://abc.com/path'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/#/path/', options1),
    'http://abc.com/#/path/'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/foo/#/bar/', options1),
    'http://abc.com/foo#/bar/'
  )

  const options2 = {
    removeTrailingSlash: false,
    removeDirectoryIndex: true,
  }
  _assertEqual(
    normalizeUrl('http://abc.com/path/', options2),
    'http://abc.com/path/'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/path/index.html', options2),
    'http://abc.com/path/'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/#/path/', options2),
    'http://abc.com/#/path/'
  )
})

test('sortQueryParameters option', () => {
  const options1 = {
    sortQueryParameters: true,
  }
  _assertEqual(
    normalizeUrl('http://abc.com/?a=Z&b=Y&c=X&d=W', options1),
    'http://abc.com/?a=Z&b=Y&c=X&d=W'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/?b=Y&c=X&a=Z&d=W', options1),
    'http://abc.com/?a=Z&b=Y&c=X&d=W'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/?a=Z&d=W&b=Y&c=X', options1),
    'http://abc.com/?a=Z&b=Y&c=X&d=W'
  )
  _assertEqual(normalizeUrl('http://abc.com/', options1), 'http://abc.com')

  const options2 = {
    sortQueryParameters: false,
  }
  _assertEqual(
    normalizeUrl('http://abc.com/?a=Z&b=Y&c=X&d=W', options2),
    'http://abc.com/?a=Z&b=Y&c=X&d=W'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/?b=Y&c=X&a=Z&d=W', options2),
    'http://abc.com/?b=Y&c=X&a=Z&d=W'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/?a=Z&d=W&b=Y&c=X', options2),
    'http://abc.com/?a=Z&d=W&b=Y&c=X'
  )
  _assertEqual(normalizeUrl('http://abc.com/', options2), 'http://abc.com')
  _assertEqual(
    normalizeUrl('http://abc.com/?a=/path', options1),
    normalizeUrl('http://abc.com/?a=/path', options2)
  )
})

test('invalid urls', () => {
  expect(() => {
    normalizeUrl('http://')
  }).toThrow(/^Invalid URL/)

  expect(() => {
    normalizeUrl('/')
  }).toThrow(/^Invalid URL/)

  expect(() => {
    normalizeUrl('/relative/path/')
  }).toThrow(/^Invalid URL/)
})

test('remove duplicate pathname slashes', () => {
  _assertEqual(
    normalizeUrl('http://abc.com////foo/bar'),
    'http://abc.com/foo/bar'
  )
  _assertEqual(
    normalizeUrl('http://abc.com////foo////bar'),
    'http://abc.com/foo/bar'
  )
  _assertEqual(
    normalizeUrl('//abc.com//foo', { normalizeProtocol: false }),
    '//abc.com/foo'
  )
  _assertEqual(
    normalizeUrl('http://abc.com:5000///foo'),
    'http://abc.com:5000/foo'
  )
  _assertEqual(normalizeUrl('http://abc.com///foo'), 'http://abc.com/foo')
  _assertEqual(
    normalizeUrl('http://abc.com:5000//foo'),
    'http://abc.com:5000/foo'
  )
  _assertEqual(normalizeUrl('http://abc.com//foo'), 'http://abc.com/foo')
  _assertEqual(
    normalizeUrl('http://abc.com/s3://abc.com'),
    'http://abc.com/s3://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/s3://abc.com//foo'),
    'http://abc.com/s3://abc.com/foo'
  )
  _assertEqual(
    normalizeUrl('http://abc.com//foo/s3://abc.com'),
    'http://abc.com/foo/s3://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/git://abc.com'),
    'http://abc.com/git://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/git://abc.com//foo'),
    'http://abc.com/git://abc.com/foo'
  )
  _assertEqual(
    normalizeUrl('http://abc.com//foo/git://abc.com//foo'),
    'http://abc.com/foo/git://abc.com/foo'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/a://abc.com//foo'),
    'http://abc.com/a:/abc.com/foo'
  )
  _assertEqual(
    normalizeUrl(
      'http://abc.com/alongprotocolwithin50charlimitxxxxxxxxxxxxxxxxxxxx://abc.com//foo'
    ),
    'http://abc.com/alongprotocolwithin50charlimitxxxxxxxxxxxxxxxxxxxx://abc.com/foo'
  )
  _assertEqual(
    normalizeUrl(
      'http://abc.com/alongprotocolexceeds50charlimitxxxxxxxxxxxxxxxxxxxxx://abc.com//foo'
    ),
    'http://abc.com/alongprotocolexceeds50charlimitxxxxxxxxxxxxxxxxxxxxx:/abc.com/foo'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/a2-.+://abc.com'),
    'http://abc.com/a2-.+://abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/a2-.+_://abc.com'),
    'http://abc.com/a2-.+_:/abc.com'
  )
  _assertEqual(
    normalizeUrl('http://abc.com/2abc://abc.com'),
    'http://abc.com/2abc:/abc.com'
  )
})

test('prevents homograph attack', () => {
  // The input string uses Unicode to make it look like a valid `ebay.com` URL.
  _assertEqual(normalizeUrl('https://ebаy.com'), 'https://xn--eby-7cd.com')
})

test('view-source URL', () => {
  expect(() => {
    normalizeUrl('view-source:https://www.abc.com')
  }).toThrow('`view-source:` is not supported as it is a non-standard protocol')
})

test('Error on data URLs', () => {
  const url = 'data:' + Array.from({ length: 100 }).fill(',#').join('') + '\ra'
  expect(() => {
    normalizeUrl(url)
  }).toThrow()

  expect(() => {
    normalizeUrl('data:')
  }).toThrow()

  expect(() => {
    normalizeUrl('data:text/plain,foo')
  }).toThrow()
})
