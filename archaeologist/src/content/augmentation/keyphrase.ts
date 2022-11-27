export function getKeyPhraseFromText(text: string): string | null {
  if (text.endsWith('//')) {
    return null
  }
  const limited = /\/\/([^.;!?/\n]+)[.;!?/\n ]*$/.exec(text)
  const sentence = /[.;!?\n]?([^.;!?\n]+)[.;!?\n ]*$/.exec(text)
  if (sentence == null && limited == null) {
    return null
  }
  if (sentence != null && limited != null) {
    const sentenceStr = sentence[1].trim()
    const limitedStr = limited[1].trim()
    if (sentenceStr.length < limited.length) {
      return sentenceStr
    }
    return limitedStr
  } else if (sentence != null) {
    return sentence[1].trim()
  } else if (limited != null) {
    return limited[1].trim()
  }
  return null
}
