/**
 * Extract phrase from text of a textarea to search for relevant nodes in
 * Foreword for write augmentation. I named it "keyphrase" for short.
 *
 * It extracts the last sentense from the text OR whatever text follows magic
 * code "//". The trick with "//" is needed to adjust keyphrase manually to
 * achieve the desired result when search by last sentence fails to find
 * relevant content.
 *
 * @akindyakov: This is crude temporary solution based on reg exps. I'll
 * replace it with [wink-nlp](https://winkjs.org/wink-nlp/) very soon.
 */
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
