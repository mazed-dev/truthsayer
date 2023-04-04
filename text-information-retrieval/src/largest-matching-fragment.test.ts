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
        // const indexes = findLargestCommonSubsequenceIndexes(
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

describe('', () => {
  it('', () => {
    const wink = winkNLP(model)
    const first = ` Spider-Man: Across the Spider-Verse’s new trailer pits Miles against the multiverse - The Verge.
Sony has released a second trailer for Spider-Man: Across the Spider-Verse (Part One), which is releasing on June 2nd. It finds Miles Morales on the run as an entire universe of Spider-People chase him from one universe to another..
Charles Pulliam-Moore.
There may come a day when the trailer-based hype around Sony’s Spider-Man: Across the Spider-Verse (Part One) no longer feels warranted, but that day is categorically not today.Across the Spider-Verse’s new trailer finds Miles Morales (Shameik Moore) doing just fine in his home universe as he balances life between doing fine in school and dealing with friendly neighborhood villains like the Spot (Jason Schwartzman). As always, all Miles’ mother Rio (Luna Lauren Vélez) and father Jefferson (Brian Tyree Henry) want is for their son to be happy and open up to them. But rather than telling his parents about his double life, whatever Miles is dealing with brings him face to face with his good friend Gwen (Hailee Steinfeld) from another dimension, and this time around she shows up with an invitation to take Miles on an adventure.Across the Spider-Verse’s first trailer implied that Miles’ journey from one reality to another would be marked by conflict with other Spider-people despite them all ostensibly being on the same team. But the newest spot makes it much more clear why Miguel O’Hara (Oscar Isaac) is going to end up leading the charge to catch Miles. Every big Spider-Man story’s been marked by tragic loss, and it seems very much like Miles may have to choose between saving a single person he loves, or saving the entire universe — a difficult decision that’s going to put him at odds with the film’s other webheads.Heavy as that all is, the trailer also leaves little doubt that Across the Spider-Verse is going to go every bit as hard as its predecessor, which is almost certainly going to make it a must-see when it premieres on June 2nd, 2023.`
    const second = `The Mandalorian season 3 premiere review: a return to simple Star Wars - The Verge. The Mandalorian’s Chapter 17: The Apostate felt like a big, action-packed, and overly familiar tour of the galaxy that could have taken more risks.. Charles Pulliam-Moore. Between The Mandalorian’s second season and the way it played into The Book of Boba Fett, it wouldn’t have been surprising if Mando’s and Grogu’s season 3 returns were shot through with a seriousness that spoke to how high-stakes their adventures have become. But instead, The Mandalorian’s season 3 premiere felt much more like a purposeful return to what the show was when it first premiered: a big and sometimes rather goofy joyride through space that’s focused on forging the next generation of young Star Wars faithful.Though Disney and Lucasfilm might want all of their Disney Plus series to feel accessible enough for viewers to be able to jump in anytime, The Mandalorian’s season 3 premiere crystalizes just how involved and complicated the show became in the buildup to Din Djarin (Pedro Pascal) willingly unmasking himself for his adoptive son Grogu. “Chapter 17: The Apostate” from director Rick Famuyiwa and writer Jon Favreau catches the bounty hunter father / Force-sensitive son duo reunited and feeling good as they embark on a new journey in search of a way to redeem Mando for exposing his face to someone else — a violation of the Mandalorian code.After two seasons of teasing out new facets of Mandalorian culture in bits and pieces, the way “The Apostate” opens on the Armorer (Emily Swallow) overseeing a young Mandalorian’s induction ceremony feels like a signifier of how the show’s entered into a new chapter of its existence, defined by providing more information instead of leading with intrigue. Similar to how it was sort of wild to see an infant of Yoda’s species, it’s interesting to see how young Mandalorians are brought into the fold and given their first child-size beskar helmets (which they presumably have to reforge as their heads get bigger with age). Image: LucasfilmWhat’s even more fascinating about “The Apostate,” though, is how the episode uses its brief glimpses of other Mandalorians and its action set pieces to illustrate important pieces of Mandalorian cultural identity that have been weighing on Din and others like Bo-Katan Kryze (Katee Sackhoff).At the same time that Din’s grappling with the possibility of being expelled from one family because of his devotion to another, “The Apostate” also makes clear that the Mandalorians, as a people, place more value on their traditions than any one of their members — even when it seems as if they aren’t committed to The Way as individuals. Compelling as the motivation behind Din’s quest to find and then purify himself in the living waters of Mandalore is, “The Apostate” makes short work of using the plot beat as a reason to send Mando and Grogu on yet another series of space errands that all feel like the show retreading familiar territory in order to check in with figures like Greef Karga (Carl Weathers) and Peli Motto (Amy Sedaris).As it’s following Mando to places like the new and improved — and mostly pirate-free — planet Nevarro, you can feel The Mandalorian trying to tap into that classic lived-in and practically created Star Wars magic. Especially in moments when “The Apostate” is focused on Grogu, or any one of its other tiny alien creatures brought to life with puppetry, it’s easy to be reminded of what first made The Mandalorian feel distinct in this era of larger-than-life Star Wars narratives. But “The Apostate” moves through its story so swiftly that you never really get a chance to appreciate all of its rich detail, which sometimes makes it feel like the episode’s really just checking off a series of general scene-setting boxes rather than trying to more deeply explore this universe.Image: LucasfilmCompared to something like Andor, all of those creative choices might make The Mandalorian seem like it isn’t trying hard enough to live up to the prestige-adjacent hype Disney’s committed to maintaining around the show. But the reality’s more that The Mandalorian’s a half-hour-ish series entering its third season, and Disney’s very interested in keeping it going as long as it possibly can. It doesn’t feel entirely fair to assume that “The Apostate” alone speaks to how The Mandalorian’s entire third season’s going to turn out. But in things like the episode’s overlong repetition-based jokes and action pieces that feel like pitches for future theme park attractions, you do get the sense that The Mandalorian’s going for quick, easy thrills and not necessarily telling the most engrossing tale at this point.Again, there’s probably more to The Mandalorian’s third season than its premiere would have you think. It’s very possible that the show might revisit or expand on some of the things that work well in “The Apostate,” like its implication that Grogu’s gaining a much more nuanced understanding of the world around him. But taken on its own, the episode leaves more than a bit to be desired — particularly if you’ve been looking forward to seeing The Mandalorian try something a little more bold and new.. https:. theverge.com. 23620519. the-mandalorian-season-3-premiere-the-apostate`
    const firstDoc = wink.readDoc(first)
    const secondDoc = wink.readDoc(second)

    let indexes = findLargestCommonContinuousSubsequenceIndexes(
      firstDoc.tokens().out(wink.its.stem),
      secondDoc.tokens().out(wink.its.stem)
    )
    const kExpectedLen = 42
    const firstTokens = firstDoc.tokens().out()
    const firstPos = firstDoc.tokens().out(wink.its.pos)
    const firstTypes = firstDoc.tokens().out(wink.its.type)
    let prefix = ''
    let suffix = ''
    if (indexes.length < kExpectedLen) {
      const half = kExpectedLen / 2
      const startInd = Math.max(indexes[0] - half, 0)
      const tailLen = Math.max(indexes[0] - startInd, half)
      const endInd = Math.min(
        indexes[indexes.length - 1] + tailLen,
        firstTokens.length
      )
      indexes = range(startInd, endInd)
      if (startInd > 0) {
        prefix = '…'
      }
      if (endInd < firstTokens.length) {
        suffix = '…'
      }
    }

    console.log('Stem 1', firstDoc.tokens().out(wink.its.stem))
    console.log('Stem 2', secondDoc.tokens().out(wink.its.stem))
    console.log('Out 1', firstDoc.tokens().out())
    console.log('Out 2', secondDoc.tokens().out())
    console.log('Pos 1', firstPos)
    console.log('Pos 1', firstTypes)
    console.log('Result', indexes) // .map(ind => firstDoc.tokens().itemAt(ind)))
    console.log(
      'Result',
      prefix +
        indexes
          .map((ind) => {
            const pos = firstPos[ind]
            return (ind === 0 || pos === 'PUNCT' || pos === 'PART') ? '' : ' ' + firstTokens[ind]
          })
          .join('') +
        suffix
    )
  })
})
