import winkNLP, { WinkMethods, Document as WinkDocument } from 'wink-nlp'
import model from 'wink-eng-lite-web-model'
import { range } from 'armoury'

export type { WinkDocument, WinkMethods }

export namespace impl {
  export function longestCommonContinuousSubsequenceIndexes<T>(
    seq1: T[],
    seq2: T[]
  ): number[] {
    const m = seq1.length
    const n = seq2.length
    const dp: Array<Array<number>> = new Array(m + 1)
      .fill(null)
      .map(() => new Array(n + 1).fill(0))
    let maxLength = 0
    let endIndex = 0
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (seq1[i - 1] === seq2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
          if (dp[i][j] > maxLength) {
            maxLength = dp[i][j]
            endIndex = i - 1
          }
        }
      }
    }
    return range(endIndex - maxLength + 1, endIndex + 1)
  }

  export function splitIntoContinuousIntervals(row: number[]): number[][] {
    const intervals: number[][] = []
    let current: number[] = []
    for (const item of row) {
      if (current.length === 0) {
        current.push(item)
      } else {
        const prev = current[current.length - 1]
        if (item === prev + 1) {
          current.push(item)
        } else {
          intervals.push(current)
          current = [item]
        }
      }
    }
    if (current.length !== 0) {
      intervals.push(current)
    }
    return intervals
  }

  export function fillSmallGaps(row: number[], maxGapLen: number): number[] {
    const res: number[] = []
    for (const item of row) {
      if (res.length !== 0) {
        const prev = res[res.length - 1]
        if (item <= prev + maxGapLen) {
          // Fill the small gap
          for (const v of range(prev + 1, item)) {
            res.push(v)
          }
        }
      }
      res.push(item)
    }
    return res
  }

  export function extendInterval(
    row: number[],
    prefixLen: number,
    suffixLen: number,
    maxItem: number
  ): { prefix: number[]; suffix: number[] } {
    const prefix: number[] = []
    const suffix: number[] = []
    if (row.length === 0) {
      return { prefix, suffix }
    }
    const first = row[0]
    const last = row[row.length - 1]
    for (const item of range(Math.max(0, first - prefixLen), first)) {
      prefix.push(item)
    }
    for (const item of range(
      Math.min(last, maxItem),
      Math.min(maxItem, last + suffixLen)
    )) {
      suffix.push(item + 1)
    }
    return { prefix, suffix }
  }

  export function normlizeString(str: string): string {
    return str.replace(/\n+/g, '. ').replace(/\s+/g, ' ')
  }
} // namespace impl

export function loadWinkModel(): WinkMethods {
  return winkNLP(model)
}

export function sortOutSpacesAroundPunctuation(str: string): string {
  return str
    .replace(/\s*"\s*(.*?)\s*"/g, ' "$1" ') // ' abc ' -> 'abc'
    .replace(/\s*'\s*(.*?)\s*'/g, " '$1' ") // " abc " -> "abc"
    .replace(/\s*([«“„〝({\[])\s*(.*?)\s*([»”‟〞)\]}])/g, ' $1$2$3 ')
    .replace(/\s+([:;!?.,…'ʼ’]+)\s+/g, '$1 ') // "abc ?! Abc" -> "abc?! Abc"
    .replace(/\s+([:;!?.,…'ʼ’]+)$/g, '$1') // "A abc ." -> "A abc."
    .replace(/\s*(['ʼ’])\s*(ll|s|m|d|re)/g, '$1$2')
    .replace(/\s\s+/g, ' ')
    .trim()
}

type LargestCommonContinuousSubsequenceOfStems = {
  matchTokensCount: number
  matchValuableTokensCount: number
  match: string
  prefix: string
  suffix: string
}

/**
 * Returns largest substring of the first string that matches the second string
 */
export function findLongestCommonQuote(
  firstDoc: WinkDocument,
  secondDoc: WinkDocument,
  wink: WinkMethods,
  {
    // gapToFillWordsNumber,
    prefixToExtendWordsNumber,
    suffixToExtendWordsNumber,
  }: {
    gapToFillWordsNumber: number
    prefixToExtendWordsNumber: number
    suffixToExtendWordsNumber: number
  }
): LargestCommonContinuousSubsequenceOfStems {
  const firstTokens = firstDoc.tokens().out()
  const firstStems = firstDoc.tokens().out(wink.its.stem)
  const firstStopWordFlags = firstDoc.tokens().out(wink.its.stopWordFlag)
  const firstPartsOfSpeach = firstDoc.tokens().out(wink.its.pos)
  const secondStems = secondDoc.tokens().out(wink.its.stem)
  const largestRow = impl.longestCommonContinuousSubsequenceIndexes(
    firstStems,
    secondStems
  )
  // TODO(Alexander): Extend this to find all long enough common subsequences
  // const rows = impl.splitIntoContinuousIntervals(
  //   impl.fillSmallGaps(indexes, gapToFillWordsNumber)
  // )
  // for (const row of rows) {
  //   log.debug('match', sortOutSpacesAroundPunctuation(
  //     row.map((index) => firstTokens[index]).join(' ')
  //   ))
  // }
  // const lengths = rows.map((a) => a.length)
  // const largestInd = lengths.indexOf(Math.max(...lengths))
  // const largestRow = rows[largestInd]

  const matchValuableTokensCount = largestRow.filter(
    // Don't count punctuation, spaces, symbols and stop words
    (index) =>
      !(
        firstStopWordFlags[index] ||
        firstPartsOfSpeach[index] === 'PUNCT' ||
        firstPartsOfSpeach[index] === 'SPACE' ||
        firstPartsOfSpeach[index] === 'SYM'
      )
  ).length
  const { prefix, suffix } = impl.extendInterval(
    largestRow,
    prefixToExtendWordsNumber,
    suffixToExtendWordsNumber,
    firstTokens.length - 1
  )
  // Join string and sort out spaces
  return {
    match: sortOutSpacesAroundPunctuation(
      largestRow.map((index) => firstTokens[index]).join(' ')
    ),
    matchValuableTokensCount,
    matchTokensCount: largestRow.length,
    prefix: sortOutSpacesAroundPunctuation(
      prefix.map((index) => firstTokens[index]).join(' ')
    ),
    suffix: sortOutSpacesAroundPunctuation(
      suffix.map((index) => firstTokens[index]).join(' ')
    ),
  }
}
