import winkNLP, { WinkMethods, Document as WinkDocument } from 'wink-nlp'
import model from 'wink-eng-lite-web-model'
import { range /* log */ } from 'armoury'

export type { WinkDocument, WinkMethods }

export namespace impl {
  export function findLargestCommonSubsequenceIndexes<T>(
    arr1: T[],
    arr2: T[]
  ): number[] {
    const m = arr1.length
    const n = arr2.length

    // Initialize the table with zeros
    const table: number[][] = []
    for (let i = 0; i <= m; i++) {
      table[i] = []
      for (let j = 0; j <= n; j++) {
        table[i][j] = 0
      }
    }

    // Fill in the table using dynamic programming
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          table[i][j] = table[i - 1][j - 1] + 1
        } else {
          table[i][j] = Math.max(table[i - 1][j], table[i][j - 1])
        }
      }
    }

    // Trace back the table to find the subsequence indexes
    const result: number[] = []
    let i = m
    let j = n
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        result.unshift(i - 1)
        i--
        j--
      } else if (table[i - 1][j] > table[i][j - 1]) {
        i--
      } else {
        j--
      }
    }
    return result
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
    .replace(/\s+([:;!?.,…'ʼ’])\s+/g, '$1 ') // "abc . Abc" -> "abc. Abc"
    .replace(/\s+([:;!?.,…'ʼ’])$/g, '$1') // "A abc ." -> "A abc."
    .replace(/\s*(['ʼ’])\s*(ll|s|m|d|re)/g, '$1$2')
    .replace(/\s\s+/g, ' ')
    .trim()
}

type LargestCommonContinuousSubsequenceOfStems = {
  match: string
  prefix: string
  suffix: string
}

/**
 * Returns largest substring of the first string that matches the second string
 */
export function findLargestCommonContinuousSubsequence(
  firstDoc: WinkDocument,
  secondDoc: WinkDocument,
  wink: WinkMethods,
  gapToFillWordsNumber: number,
  prefixToExtendWordsNumber: number,
  suffixToExtendWordsNumber: number
): LargestCommonContinuousSubsequenceOfStems {
  // Clean up the inputs a bit
  // first = first.replace(/\n+/g, '. ').replace(/\s+/g, ' ')
  // second = second.replace(/\n+/g, '. ').replace(/\s+/g, ' ')
  // const firstDoc = wink.readDoc(first)
  // const secondDoc = wink.readDoc(second)

  const firstTokens = firstDoc.tokens().out()
  const firstPartsOfSpeach = firstDoc.tokens().out(wink.its.pos)
  const firstStopWords = firstDoc.tokens().out(wink.its.stopWordFlag)

  const indexes = impl
    .findLargestCommonSubsequenceIndexes(
      firstDoc.tokens().out(wink.its.stem),
      secondDoc.tokens().out(wink.its.stem)
    )
    .filter((item) => {
      // Remove matches for punctuation, spaces, symbols and stop words
      return (
        firstPartsOfSpeach[item] !== 'PUNCT' &&
        firstPartsOfSpeach[item] !== 'SPACE' &&
        firstPartsOfSpeach[item] !== 'SYM' &&
        !firstStopWords[item]
      )
    })
  // log.debug('Out 1', firstDoc.tokens().out())
  // log.debug('Stem 1', firstDoc.tokens().out(wink.its.stem))
  // log.debug('Stem 2', secondDoc.tokens().out(wink.its.stem))
  // log.debug('Out 2', secondDoc.tokens().out())
  // log.debug('Pos 1', firstPartsOfSpeach)
  // log.debug('Types 1', firstTypes)
  // log.debug('Result indexes', indexes)
  const rows = impl.splitIntoContinuousIntervals(
    impl.fillSmallGaps(indexes, gapToFillWordsNumber)
  )
  const lengths = rows.map((a) => a.length)
  const largestInd = lengths.indexOf(Math.max(...lengths))
  const largestRow = rows[largestInd]
  const { prefix, suffix } = impl.extendInterval(
    largestRow,
    prefixToExtendWordsNumber,
    suffixToExtendWordsNumber,
    firstTokens.length - 1
  )
  // Join string and sort out spaces
  return {
    match: sortOutSpacesAroundPunctuation(
      largestRow.map((item) => firstTokens[item]).join(' ')
    ),
    prefix: sortOutSpacesAroundPunctuation(
      prefix.map((item) => firstTokens[item]).join(' ')
    ),
    suffix: sortOutSpacesAroundPunctuation(
      suffix.map((item) => firstTokens[item]).join(' ')
    ),
  }
}
