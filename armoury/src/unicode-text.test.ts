import { unicodeText } from './unicode-text'

const { getWordCount, getTimeToRead, trimWhitespace, truncate } = unicodeText

const kMultilineText = `
Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem
Ipsum has been the industry's standard dummy text ever since the 1500s, when an
unknown printer took a galley of type and scrambled it to make a type specimen
book. It has survived not only five centuries, but also the leap into electronic
typesetting, remaining essentially unchanged. It was popularised in the 1960s
with the release of Letraset sheets containing Lorem Ipsum passages, and more
recently with desktop publishing software like Aldus PageMaker including
versions of Lorem Ipsum.
`
test('getWordCount', () => {
  expect(getWordCount('abc')).toStrictEqual(1)
  expect(getWordCount('Abc abc')).toStrictEqual(2)
  expect(getWordCount('Abc,abc')).toStrictEqual(2)
  expect(getWordCount('Abc, abc')).toStrictEqual(2)
  expect(getWordCount(kMultilineText)).toStrictEqual(92)
})

test('getTimeToRead', () => {
  expect(getTimeToRead('abc abc abc abc').asSeconds()).toStrictEqual(1)
  expect(getTimeToRead(kMultilineText).asSeconds()).toStrictEqual(23)
})

test('trimWhitespace', () => {
  expect(trimWhitespace('Abc\t\tabc')).toStrictEqual('Abc abc')
  expect(trimWhitespace('Abc\u2002\u2003abc')).toStrictEqual('Abc abc')
  expect(
    trimWhitespace(`  a  b   c     d   \t \n  e\n\n
@ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ _ \` a b
 c d e f g h i j k l m n o p q r s t u v w x y z { | } ~
  `)
  ).toStrictEqual(
    'a b c d e @ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ \\ ] ^ ' +
      '_ ` a b c d e f g h i j k l m n o p q r s t u v w x y z { | } ~'
  )
})

test('truncate', () => {
  expect(truncate('Джо́зеф Не́льсон Ро́уз', 12)).toStrictEqual('Джо́зеф Не́льс') // Default is kTruncateSeparatorUChar
  expect(
    truncate('Джо́зеф Не́льсон Ро́уз', 11, unicodeText.kTruncateSeparatorUChar)
  ).toStrictEqual('Джо́зеф Не́ль')
  expect(
    truncate('Джо́зеф Не́льсон Ро́уз', 12, unicodeText.kTruncateSeparatorSpace)
  ).toStrictEqual('Джо́зеф')
})
