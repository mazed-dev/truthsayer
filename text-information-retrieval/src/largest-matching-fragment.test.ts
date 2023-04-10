import {
  impl,
  findLargestCommonContinuousSubsequenceOfStems,
} from './largest-matching-fragment'
import winkNLP from 'wink-nlp'
import model from 'wink-eng-lite-web-model'

describe('Find largest matching fragment of text', () => {
  const wink = winkNLP(model)
  it('extendInterval', () => {
    expect(impl.extendInterval([1], 1, 1, 10)).toStrictEqual([0, 1, 2])
    expect(impl.extendInterval([1, 2], 1, 1, 10)).toStrictEqual([0, 1, 2, 3])
    expect(impl.extendInterval([1, 2], 1, 2, 10)).toStrictEqual([0, 1, 2, 3, 4])
    expect(impl.extendInterval([1, 2], 2, 2, 10)).toStrictEqual([0, 1, 2, 3, 4])
    expect(impl.extendInterval([1, 2], 2, 2, 3)).toStrictEqual([0, 1, 2, 3])
    expect(impl.extendInterval([10, 11], 3, 5, 100)).toStrictEqual([
      7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    ])
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
    expect(impl.sortOutSpacesAroundPunctuation('')).toStrictEqual('')
    expect(impl.sortOutSpacesAroundPunctuation('Abc bcd.')).toStrictEqual(
      'Abc bcd.'
    )
    expect(
      impl.sortOutSpacesAroundPunctuation(
        'Mileena returned in Mortal Kombat 11 … First . second ! Is it the last one ? '
      )
    ).toStrictEqual(
      'Mileena returned in Mortal Kombat 11… First. second! Is it the last one?'
    )
    expect(
      impl.sortOutSpacesAroundPunctuation(` " a " ' abc abc ' `)
    ).toStrictEqual(`"a" 'abc abc'`)
    expect(
      impl.sortOutSpacesAroundPunctuation(
        ` [ 12 + 21 ] = { 21 + 12 } = ( 33 ) `
      )
    ).toStrictEqual(`[12 + 21] = {21 + 12} = (33)`)
    expect(
      impl.sortOutSpacesAroundPunctuation(
        `These are the colours I ' m talking about : blue , red, yellow ! Yan said " they all need just a few tweaks " . `
      )
    ).toStrictEqual(
      `These are the colours I'm talking about: blue, red, yellow! Yan said "they all need just a few tweaks".`
    )
  })
  it('findLargestCommonContinuousSubsequenceOfStems - Jinx', () => {
    const first = `Jinx was added as a playable champion to the marksman roster of League of Legends in October 2013. As established in the lore written by Graham McNeill, Jinx was once a young innocent girl from Zaun, the seedy underbelly of the utopian city of Piltover. She harbors a dark and mysterious past with Vi, another champion from the game. Following a childhood tragedy, Jinx grew up to become "manic and impulsive" and her capacity for creating mayhem "became the stuff of legend".

The first season of Arcane reveals that Jinx was originally named Powder.[15] She and her older sister Violet "Vi" were orphaned following the repressed undercity's failed uprising against the utopian city of Piltover, after which they were taken in by Vander, the leader of the rebellion.
        `
    const second = `Jinx is a character in Riot Games' video game League of Legends and its associated media franchise. She first appeared in the music video "Get Jinxed" to commemorate her official debut as a playable champion in the game's October 2013 update. Jinx is depicted as a manic and impulsive criminal from Zaun who serves as the archenemy of the Piltover enforcer Vi.


Jinx was one of the first champions from League of Legends to star in her own animated music video in the lead-up to her in-game debut. "Get Jinxed" by Agnete Kjølsrud from the band Djerv, which follows Jinx's destructive exploits in Piltover, was released on YouTube on October 8, 2013.
    `

    expect(
      findLargestCommonContinuousSubsequenceOfStems(
        first,
        second,
        wink,
        10,
        2,
        6
      ).extended
    ).toStrictEqual(
      `…, another champion from the game. Following a childhood tragedy, Jinx grew up to become "manic and impulsive" and her capacity for creating…`
    )
  })
  it('findLargestCommonContinuousSubsequenceOfStems - The Verge - Tesla', () => {
    const first = `
Tesla rewrote its own software to survive the chip shortage
/ The company was able to swap substitute chips after rewriting its firmware
By ANDREW J. HAWKINS / @andyjayhawk

Photo by Sean O’Kane / The Verge
Tesla is weathering the global chip shortage by rewriting its vehicle software to support alternative chips, CEO Elon Musk said during an earnings call Monday. The shortage has upended the auto industry at a time of historic demand for new cars, leading to factory shutdowns, longer wait times, and higher prices.

“We were able to substitute alternative chips, and then write the firmware in a matter of weeks,” Musk said. “It’s not just a matter of swapping out a chip; you also have to rewrite the software.”

This approach has helped Tesla maintain high levels of production, delivering over 200,000 vehicles to customers over the course of the last three months, the company said. Tesla generated $11.9 billion in revenue in the quarter, including $1.1 billion in profit.

Tesla isn’t alone in feeling the effects of the global shortage. With demand for cars at an all-time high, automakers around the world are feeling the constraints of production with chips in short supply. This week, Daimler and BMW said the lack of chips has forced it to shutdown some of their assembly lines, which will cut the companies’ output by tens of thousands of vehicles.

“The global chip shortage situation remains quite serious”

Musk said that Tesla’s future growth will depend on a swift resolution to the global semiconductor shortage. “The global chip shortage situation remains quite serious,” he said. “For the rest of this year, our growth rate will be determined by the slowest part in our supply chain,” which includes the wide range of chips used in Tesla’s vehicles.

Tesla relies on chips to power everything from its airbags to the modules that control the vehicles’ seatbelts — which now means Tesla is missing components that are essential for the vehicle’s safety features. “A big struggle this quarter was the module that controls the airbags and seatbelts,” Musk said. “And obviously you cannot ship a car without those.”

Musk sounded an uncertain note about the future. “It does seem like it’s getting better,” he said, “but it’s hard to predict.”
  `

    const second = `
  Tesla employees reportedly passed around personal videos from owners’ cars
/ Tesla workers viewed and shared private videos of car crashes, road rage incidents, and other potentially embarrassing clips, according to a report from Reuters.
By EMMA ROTH

This is a stock image of the Tesla logo spelled out in red with a white shape forming around it and a tilted and zoomed red Tesla T logo behind it.
Illustration by Alex Castro / The Verge
Tesla employees passed around and poked fun at private videos recorded by vehicle cameras, according to a report from Reuters. The videos, which were reportedly shared via Tesla’s internal messaging systems from 2019 through 2022, were recorded on the cameras that come mounted on Tesla vehicles to enable self-driving features.

As described by sources to Reuters, the recordings shared by Tesla workers range from graphic crashes and road rage incidents to more embarrassing scenes, including a video of a naked man approaching a car. Some employees reportedly even created memes using captures from recorded videos and later shared them in private group chats.

Tesla says “Sentry Mode recordings are not transmitted to us”

One former Tesla employee tells Reuters that some of the videos may have even been recorded when vehicles were turned off. “We could see inside people’s garages and their private properties,” a former employee tells Reuters. “Let’s say that a Tesla customer had something in their garage that was distinctive, you know, people would post those kinds of things.”

According to Reuters, Tesla previously had a policy that allowed the company to receive recordings from non-running vehicles if customers signed off on it. After an investigation from the Dutch Data Protection Authority (DPA) found that Tesla vehicles “were often filming everyone who came near the vehicle,” Tesla was turning off its vehicles’ cameras by default by 2023.

Tesla launched Sentry Mode in 2019, advertising the feature as a way to alert drivers of any suspicious activity around their parked vehicles and then store recorded incidents in the car’s onboard memory. Tesla updated this feature in 2021 and started letting drivers use their vehicles’ cameras to livestream their cars’ surroundings from the Tesla app.

On its support page for the feature, Tesla says “Sentry Mode recordings are not transmitted to us” while adding that livestreams are end-to-end encrypted and “cannot be accessed” by the company. Tesla also added a couple of other privacy-focused tweaks to Sentry Mode following the DPA’s investigation. Now cameras only start recording when the vehicle is touched, instead of right when it detects suspicious activity. Tesla also started warning passersby that its vehicles are recording by making their headlights flash.

The Netherlands isn’t the only country where Tesla’s Sentry Mode has raised concerns. Last year, Germany’s consumer organization VZBZ sued Tesla, claiming Sentry Mode “violates data protection law.” Tesla vehicles were also banned from China’s Beidaihe district last year over concerns that the vehicles’ cameras would capture a private meeting between the country’s senior leadership, while the Chinese military banned Tesla vehicles in 2021 over similar surveillance concerns.
  `
    expect(
      findLargestCommonContinuousSubsequenceOfStems(
        first,
        second,
        wink,
        10,
        2,
        8
      ).extended
    ).toStrictEqual(
      `…/ The Verge. Tesla is weathering the global chip shortage by rewriting its vehicle software to support alternative chips, CEO Elon…`
    )
  })
  it('findLargestCommonContinuousSubsequenceOfStems - The Verge - Tesla', () => {
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
    expect(
      findLargestCommonContinuousSubsequenceOfStems(
        first,
        second,
        wink,
        10,
        2,
        12
      ).extended
    ).toStrictEqual(
      `…Ethics of Artificial Intelligence ". Artificial intelligence (AI) has the potential to revolutionize many industries, but it also raises ethical concerns. As AI…`
    )
  })
})
