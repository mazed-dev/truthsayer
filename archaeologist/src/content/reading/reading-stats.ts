import moment from 'moment'

export function getWordCount(plaintext: string): number {
  return plaintext.match(/\p{L}+/gu)?.length || 0
}

export function getTimeToRead(plaintext: string): moment.Duration {
  // 220 words per minute is an average reading spead in English, so we take it
  // as a solution to-go. We shall adjeust it based on language and each
  // individual user.
  return moment.duration(getWordCount(plaintext) / 220, 'minutes')
}
