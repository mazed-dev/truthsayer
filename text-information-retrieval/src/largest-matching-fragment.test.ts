// Load wink-nlp package.
import winkNLP from 'wink-nlp'
// Load english language model.
import model from 'wink-eng-lite-web-model'
import { range } from 'armoury'

function findLargestCommonSubsequenceIndexes<T>(
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

function findLargestCommonContinuousSubsequenceIndexes<T>(
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

  let maxLen = 0 // Length of the largest common continuous subsequence
  let maxI = 0 // Ending index of the largest common continuous subsequence in the first array

  // Fill in the table using dynamic programming
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1
        if (table[i][j] > maxLen) {
          maxLen = table[i][j]
          maxI = i - 1
        }
      } else {
        table[i][j] = 0
      }
    }
  }

  // Construct the result array
  const result: number[] = []
  for (let i = maxI - maxLen + 1; i <= maxI; i++) {
    result.push(i)
  }

  return result
}

function splitIntoContinuousIntervals(row: number[]): number[][] {
  const intervals:number[][] = []
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

function connectCloseIntervals(row: number[], threshold: number): number[] {
  const res: number[] = []
  for (const item of row) {
    if (res.length !== 0) {
      const prev = res[res.length-1]
      if (/* prev + 1 !== item && */ item <= prev + threshold) {
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

function extendInterval(row: number[], len: number, maxItem: number): number[] {
    const first = row[0]
    const last = row[row.length - 1]
    for (const item of range(Math.max(0, first - len), first)) {
      row.unshift(item)
    }
    for (const item of range(Math.min(last + 1, maxItem), Math.min(maxItem, last + len + 1))) {
      row.push(item)
    }
    return row
    // if (indexes.length < kExpectedLen) {
    //   const half = kExpectedLen / 2
    //   const startInd = Math.max(indexes[0] - half, 0)
    //   const tailLen = Math.max(indexes[0] - startInd, half)
    //   const endInd = Math.min(
    //     indexes[indexes.length - 1] + tailLen,
    //     firstTokens.length
    //   )
    //   indexes = range(startInd, endInd)
    //   if (startInd > 0) {
    //     prefix = '…'
    //   }
    //   if (endInd < firstTokens.length) {
    //     suffix = '…'
    //   }
    // }
}

describe('', () => {
  it('connectCloseIntervals', () => {
    expect(connectCloseIntervals([], 1)).toStrictEqual([])
    expect(connectCloseIntervals([], 2)).toStrictEqual([])
    expect(connectCloseIntervals([1], 2)).toStrictEqual([1])
    expect(connectCloseIntervals([1, 2], 1)).toStrictEqual([1, 2])
    expect(connectCloseIntervals([1, 2, 4], 2)).toStrictEqual([1, 2, 3, 4])
    expect(connectCloseIntervals([1, 2, 5], 2)).toStrictEqual([1, 2, 5])
    expect(connectCloseIntervals([1, 2, 5], 3)).toStrictEqual([1, 2, 3, 4, 5])
    expect(connectCloseIntervals([1, 2, 5, 8], 3)).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(connectCloseIntervals([1, 3, 5, 7], 2)).toStrictEqual([1, 2, 3, 4, 5, 6, 7])
    expect(connectCloseIntervals([0, 2, 4, 6, 8], 2)).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })
  it('splitIntoContinuousIntervals', () => {
    expect(splitIntoContinuousIntervals([])).toStrictEqual([])
    expect(splitIntoContinuousIntervals([1])).toStrictEqual([[1]])
    expect(splitIntoContinuousIntervals([1,2])).toStrictEqual([[1,2]])
    expect(splitIntoContinuousIntervals([1,2,4])).toStrictEqual([[1,2],[4]])
    expect(splitIntoContinuousIntervals([1,2,4,5])).toStrictEqual([[1,2],[4,5]])
    expect(splitIntoContinuousIntervals([1,2,4,5,7])).toStrictEqual([[1,2],[4,5],[7]])
    expect(splitIntoContinuousIntervals([1,2,4,7,8])).toStrictEqual([[1,2],[4],[7,8]])
  })
  it('', () => {
    const wink = winkNLP(model)
    const first = `Jinx was added as a playable champion to the marksman roster of League of Legends in October 2013. As established in the lore written by Graham McNeill, Jinx was once a young innocent girl from Zaun, the seedy underbelly of the utopian city of Piltover. She harbors a dark and mysterious past with Vi, another champion from the game. Following a childhood tragedy, Jinx grew up to become "manic and impulsive" and her capacity for creating mayhem "became the stuff of legend".`
    const second = `Jinx is a character in Riot Games' video game League of Legends and its associated media franchise. She first appeared in the music video "Get Jinxed" to commemorate her official debut as a playable champion in the game's October 2013 update. Jinx is depicted as a manic and impulsive criminal from Zaun who serves as the archenemy of the Piltover enforcer Vi.`
    const firstDoc = wink.readDoc(first)
    const secondDoc = wink.readDoc(second)

    const firstTokens = firstDoc.tokens().out()
    const firstPos = firstDoc.tokens().out(wink.its.pos)
    const firstTypes = firstDoc.tokens().out(wink.its.type)
    const firstStopWords = firstDoc.tokens().out(wink.its.stopWordFlag)

    let indexes = findLargestCommonSubsequenceIndexes(
      firstDoc.tokens().out(wink.its.stem),
      secondDoc.tokens().out(wink.its.stem)
    )

    indexes = indexes.filter((item) => {
      return firstPos[item] !== 'PUNCT' && firstPos[item] !== 'PART' && !firstStopWords[item]
    })
    // const kExpectedLen = 42
    let prefix = ''
    let suffix = ''
    // if (indexes.length < kExpectedLen) {
    //   const half = kExpectedLen / 2
    //   const startInd = Math.max(indexes[0] - half, 0)
    //   const tailLen = Math.max(indexes[0] - startInd, half)
    //   const endInd = Math.min(
    //     indexes[indexes.length - 1] + tailLen,
    //     firstTokens.length
    //   )
    //   indexes = range(startInd, endInd)
    //   if (startInd > 0) {
    //     prefix = '…'
    //   }
    //   if (endInd < firstTokens.length) {
    //     suffix = '…'
    //   }
    // }

    console.log('Stem 1', firstDoc.tokens().out(wink.its.stem))
    console.log('Stem 2', secondDoc.tokens().out(wink.its.stem))
    console.log('Out 1', firstDoc.tokens().out())
    console.log('Out 2', secondDoc.tokens().out())
    console.log('Pos 1', firstPos)
    console.log('Pos 1', firstTypes)
    console.log('Result', indexes) // .map(item => firstDoc.tokens().itemAt(item)))
    console.log(
      'Result: …',
      prefix +
        indexes
          .map((item) => {
            const pos = firstPos[item]
            return ((item === 0 || pos === 'PUNCT' || pos === 'PART') ? '' : ' ') + firstTokens[item]
          })
          .join('') +
        suffix, '…'
    )
    for (const interval of splitIntoContinuousIntervals(connectCloseIntervals(indexes, 8))) {
      const extended = extendInterval(interval, 2, firstTokens.length - 1)
      console.log(
        'Result: …',
          extended
            .map((item) => {
              const pos = firstPos[item]
              return ((item === 0 || pos === 'PUNCT' || pos === 'PART') ? '' : ' ') + firstTokens[item]
            })
            .join(''), '…'
      )
    }
  })
})
