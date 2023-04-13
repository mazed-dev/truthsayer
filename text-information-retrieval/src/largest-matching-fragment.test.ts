import {
  impl,
  findLargestCommonContinuousSubsequence,
  loadWinkModel,
  sortOutSpacesAroundPunctuation,
} from './largest-matching-fragment'

describe('Find largest matching fragment of text', () => {
  const wink = loadWinkModel()
  it('extendInterval', () => {
    expect(impl.extendInterval([1], 1, 1, 10)).toStrictEqual({
      prefix: [0],
      suffix: [2],
    })
    expect(impl.extendInterval([1, 2], 1, 1, 10)).toStrictEqual({
      prefix: [0],
      suffix: [3],
    })
    expect(impl.extendInterval([1, 2], 1, 2, 10)).toStrictEqual({
      prefix: [0],
      suffix: [3, 4],
    })
    expect(impl.extendInterval([1, 2], 2, 2, 10)).toStrictEqual({
      prefix: [0],
      suffix: [3, 4],
    })
    expect(impl.extendInterval([1, 2], 2, 2, 3)).toStrictEqual({
      prefix: [0],
      suffix: [3],
    })
    expect(impl.extendInterval([10, 11], 3, 5, 100)).toStrictEqual({
      prefix: [7, 8, 9],
      suffix: [12, 13, 14, 15, 16],
    })
  })
  it('fillSmallGaps', () => {
    expect(impl.fillSmallGaps([], 1)).toStrictEqual([])
    expect(impl.fillSmallGaps([], 2)).toStrictEqual([])
    expect(impl.fillSmallGaps([1], 2)).toStrictEqual([1])
    expect(impl.fillSmallGaps([1, 2], 1)).toStrictEqual([1, 2])
    expect(impl.fillSmallGaps([1, 2, 4], 2)).toStrictEqual([1, 2, 3, 4])
    expect(impl.fillSmallGaps([1, 2, 5], 2)).toStrictEqual([1, 2, 5])
    expect(impl.fillSmallGaps([1, 2, 5], 3)).toStrictEqual([1, 2, 3, 4, 5])
    expect(impl.fillSmallGaps([1, 2, 5, 8], 3)).toStrictEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ])
    expect(impl.fillSmallGaps([1, 3, 5, 7], 2)).toStrictEqual([
      1, 2, 3, 4, 5, 6, 7,
    ])
    expect(impl.fillSmallGaps([0, 2, 4, 6, 8], 2)).toStrictEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ])
  })
  it('splitIntoContinuousIntervals', () => {
    expect(impl.splitIntoContinuousIntervals([])).toStrictEqual([])
    expect(impl.splitIntoContinuousIntervals([1])).toStrictEqual([[1]])
    expect(impl.splitIntoContinuousIntervals([1, 2])).toStrictEqual([[1, 2]])
    expect(impl.splitIntoContinuousIntervals([1, 2, 4])).toStrictEqual([
      [1, 2],
      [4],
    ])
    expect(impl.splitIntoContinuousIntervals([1, 2, 4, 5])).toStrictEqual([
      [1, 2],
      [4, 5],
    ])
    expect(impl.splitIntoContinuousIntervals([1, 2, 4, 5, 7])).toStrictEqual([
      [1, 2],
      [4, 5],
      [7],
    ])
    expect(impl.splitIntoContinuousIntervals([1, 2, 4, 7, 8])).toStrictEqual([
      [1, 2],
      [4],
      [7, 8],
    ])
  })
  it('sortOutSpacesAroundPunctuation', () => {
    expect(sortOutSpacesAroundPunctuation('')).toStrictEqual('')
    expect(sortOutSpacesAroundPunctuation('Abc bcd.')).toStrictEqual('Abc bcd.')
    expect(
      sortOutSpacesAroundPunctuation(
        'Mileena returned in Mortal Kombat 11 … First . second ! Is it the last one ? '
      )
    ).toStrictEqual(
      'Mileena returned in Mortal Kombat 11… First. second! Is it the last one?'
    )
    expect(sortOutSpacesAroundPunctuation(` " a " ' abc abc ' `)).toStrictEqual(
      `"a" 'abc abc'`
    )
    expect(
      sortOutSpacesAroundPunctuation(` [ 12 + 21 ] = { 21 + 12 } = ( 33 ) `)
    ).toStrictEqual(`[12 + 21] = {21 + 12} = (33)`)
    expect(
      sortOutSpacesAroundPunctuation(
        `These are the colours I ' m talking about : blue , red, yellow ! Yan said " they all need just a few tweaks " . `
      )
    ).toStrictEqual(
      `These are the colours I'm talking about: blue, red, yellow! Yan said "they all need just a few tweaks".`
    )
  })
  it('findLargestCommonContinuousSubsequence - Jinx', () => {
    const first = `Jinx was added as a playable champion to the marksman roster of League of Legends in October 2013. As established in the lore written by Graham McNeill, Jinx was once a young innocent girl from Zaun, the seedy underbelly of the utopian city of Piltover. She harbors a dark and mysterious past with Vi, another champion from the game. Following a childhood tragedy, Jinx grew up to become "manic and impulsive" and her capacity for creating mayhem "became the stuff of legend".

The first season of Arcane reveals that Jinx was originally named Powder.[15] She and her older sister Violet "Vi" were orphaned following the repressed undercity's failed uprising against the utopian city of Piltover, after which they were taken in by Vander, the leader of the rebellion.
        `
    const second = `Jinx is a character in Riot Games' video game League of Legends and its associated media franchise. She first appeared in the music video "Get Jinxed" to commemorate her official debut as a playable champion in the game's October 2013 update. Jinx is depicted as a manic and impulsive criminal from Zaun who serves as the archenemy of the Piltover enforcer Vi.


Jinx was one of the first champions from League of Legends to star in her own animated music video in the lead-up to her in-game debut. "Get Jinxed" by Agnete Kjølsrud from the band Djerv, which follows Jinx's destructive exploits in Piltover, was released on YouTube on October 8, 2013.
    `

    const lccs = findLargestCommonContinuousSubsequence(
      wink.readDoc(impl.normlizeString(first)),
      wink.readDoc(impl.normlizeString(second)),
      wink,
      {
        gapToFillWordsNumber: 10,
        prefixToExtendWordsNumber: 2,
        suffixToExtendWordsNumber: 6,
      }
    )
    expect(lccs.match).toStrictEqual(
      `champion from the game. Following a childhood tragedy, Jinx grew up to become " manic and impulsive`
    )
    expect(lccs.prefix).toStrictEqual(`, another`)
    expect(lccs.suffix).toStrictEqual(`" and her capacity for creating`)
  })
  it('findLargestCommonContinuousSubsequence - The Verge - Tesla', () => {
    const first = `"The Ethics of Artificial Intelligence"

Artificial intelligence (AI) has the potential to revolutionize many industries, but it also raises ethical concerns. As AI becomes more advanced, it will be able to make decisions that were once reserved for humans, such as driving a car or diagnosing a medical condition. This raises questions about how we should regulate and oversee the development and use of AI.

One major ethical concern about AI is the potential for bias. AI algorithms are only as unbiased as the data they are trained on. If the data used to train an AI system is biased, the system will be biased as well. For example, if an AI system is trained on data that contains racial or gender biases, the system may produce biased results. This can have serious consequences, such as perpetuating systemic discrimination.

Another major ethical concern about AI is the potential for job displacement. As AI becomes more advanced, it has the potential to replace jobs that were once done by humans. This could have significant economic and social consequences. It's important to consider how we can prepare for a future where AI plays a larger role in the job market.

Finally, there are concerns about the potential for AI to be used for malicious purposes. As AI becomes more advanced, it will be able to carry out tasks that were once impossible. This includes tasks that are harmful or unethical. For example, AI could be used to create convincing fake videos, which could be used to spread misinformation or manipulate public opinion.

Overall, it's essential to consider the ethical implications of AI as we continue to develop and implement these technologies. We need to ensure that AI is developed and used in a responsible and ethical manner that prioritizes fairness, transparency, and accountability.
  `
    const second = `"The Benefits of Artificial Intelligence in Healthcare"

Artificial intelligence (AI) has the potential to revolutionize healthcare in numerous ways. By processing and analyzing large amounts of data, AI can help doctors diagnose and treat patients more accurately and efficiently. Here are some of the ways that AI is already being used in healthcare:

1: Medical imaging: AI can analyze medical images such as X-rays and MRIs to help doctors identify and diagnose conditions more accurately. For example, AI can be used to identify early signs of cancer, which can lead to earlier treatment and better outcomes.

2: Personalized medicine: AI can analyze a patient's genetic data to identify personalized treatments that are tailored to their specific needs. This can lead to more effective treatments and better outcomes.

3: Drug discovery: AI can help researchers identify potential new drugs more quickly and accurately than traditional methods. This could lead to the development of new treatments for a wide range of conditions.

4: Virtual assistants: AI-powered virtual assistants can help patients manage their health by reminding them to take their medication, schedule appointments, and track their symptoms.

5: Administrative tasks: AI can automate many administrative tasks, such as billing and scheduling, which can free up time for doctors and other healthcare professionals to focus on patient care.

Overall, the benefits of AI in healthcare are clear. By improving the accuracy and efficiency of medical diagnoses and treatments, AI has the potential to save lives and improve the quality of life for millions of people. As AI continues to develop, we can expect to see even more innovative uses of this technology in healthcare.
  `
    const lccs = findLargestCommonContinuousSubsequence(
      wink.readDoc(impl.normlizeString(first)),
      wink.readDoc(impl.normlizeString(second)),
      wink,
      {
        gapToFillWordsNumber: 10,
        prefixToExtendWordsNumber: 8,
        suffixToExtendWordsNumber: 10,
      }
    )
    expect(lccs.match).toStrictEqual(
      `Artificial Intelligence ". Artificial intelligence (AI) has the potential to revolutionize`
    )
    expect(lccs.prefix).toStrictEqual(`" The Ethics of`)
    expect(lccs.suffix).toStrictEqual(
      `many industries, but it also raises ethical concerns.`
    )
  })
})
