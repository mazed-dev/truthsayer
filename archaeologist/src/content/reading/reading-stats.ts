import moment from 'moment'

export function getWordCount(plaintext: string): number {
  return plaintext.match(/\p{L}+/gu)?.length || 0
}

export function getTimeToRead(plaintext: string): moment.Duration {
  return moment.duration(getWordCount(plaintext) / 200, 'minutes')
}
