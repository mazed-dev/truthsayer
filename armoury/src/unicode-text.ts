import lodash from 'lodash'
import moment from 'moment'

export namespace unicodeText {
  export function truncateTextByWords(
    text: string,
    limit: number,
    omission?: string
  ): string {
    let truncated = text
      .split(/[\n\p{Separator}]+/gu, limit * 2)
      .filter((s) => !!s)
      .slice(0, limit)
      .join(' ')
    if (omission != null && truncated.length < text.length) {
      truncated = truncated.concat(omission)
    }
    return truncated
  }

  export function getWordCount(plaintext: string): number {
    return plaintext.match(/\p{L}+/gu)?.length || 0
  }

  export function getTimeToRead(plaintext: string): moment.Duration {
    // 240 words per minute is an average reading spead in English, so we take it
    // as a solution to-go. We shall adjeust it based on language and each
    // individual user.
    return moment.duration(getWordCount(plaintext) / 240, 'minutes')
  }

  /**
   * Removes leading, trailing and repeated spaces in text.
   */
  export function trimWhitespace(text: string): string {
    text = text.trim()
    text = text.replace(/[\u00B6\u2202\s]{2,}/g, ' ')
    return text
  }

  export function truncate(
    text: string,
    limit: number,
    omission?: string
  ): string {
    return lodash.truncate(text, {
      length: limit,
      separator: /./u,
      omission: omission ?? '',
    })
  }
}
