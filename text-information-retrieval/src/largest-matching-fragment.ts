import winkNLP, { WinkMethods, Document as WinkDocument } from 'wink-nlp'
import model from 'wink-eng-lite-web-model'
import { range, sortOutSpacesAroundPunctuation } from 'armoury'

export type { WinkDocument, WinkMethods }

export namespace impl {
  export function longestCommonContinuousSubsequenceIndexes<T>(
    seq1: T[],
    seq2: T[],
    maxLengthLimit: number // To cut the search if long enough quote is found
  ): number[] {
    const seq1Len = seq1.length
    const seq2Len = seq2.length
    const dp: Array<Array<number>> = new Array(seq1Len + 1)
      .fill(null)
      .map(() => new Array(seq2Len + 1).fill(0))
    let maxLength = 0
    let endIndex = 0
    for (let i = 1; i <= seq1Len; i++) {
      for (let j = 1; j <= seq2Len; j++) {
        if (seq1[i - 1] === seq2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
          if (dp[i][j] > maxLength) {
            maxLength = dp[i][j]
            endIndex = i - 1
            if (maxLength >= maxLengthLimit) {
              // Exit earler if long enough piece is found already
              return range(endIndex - maxLength + 1, endIndex + 1)
            }
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

export type LongestCommonContinuousPiece = {
  matchTokensCount: number
  matchValuableTokensCount: number
  match: string
  prefix: string
  suffix: string
}

/**
 * Returns largest substring of the first string that matches the second string
 */
export function findLongestCommonContinuousPiece(
  firstDoc: WinkDocument,
  secondDoc: WinkDocument,
  wink: WinkMethods,
  {
    prefixToExtendWordsNumber,
    suffixToExtendWordsNumber, // Cut search if long enough quote is found
    maxLengthOfCommonPieceWordsNumber,
  }: {
    prefixToExtendWordsNumber: number
    suffixToExtendWordsNumber: number
    maxLengthOfCommonPieceWordsNumber: number
  }
): LongestCommonContinuousPiece {
  const firstTokens = firstDoc.tokens().out()
  const firstStems = firstDoc.tokens().out(wink.its.stem)
  const firstStopWordFlags = firstDoc.tokens().out(wink.its.stopWordFlag)
  const firstPartsOfSpeach = firstDoc.tokens().out(wink.its.pos)
  const secondStems = secondDoc.tokens().out(wink.its.stem)
  const largestRow = impl.longestCommonContinuousSubsequenceIndexes(
    firstStems,
    secondStems,
    maxLengthOfCommonPieceWordsNumber
  )
  // TODO(Alexander): Extend this to find all long enough common subsequences
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
