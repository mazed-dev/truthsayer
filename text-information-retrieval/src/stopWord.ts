export function isStopWord(word: string): boolean {
  return kStopWords.has(word)
}

const kStopWords: Set<string> = new Set([
  'a',
  'about',
  'above',
  'across',
  'after',
  'afterwards',
  'again',
  'against',
  'all',
  'almost',
  'alone',
  'along',
  'already',
  'also',
  'although',
  'always',
  'am',
  'among',
  'amongst',
  'amoungst',
  'amount',
  'an',
  'and',
  'another',
  'any',
  'anyhow',
  'anyone',
  'anything',
  'anyway',
  'anywhere',
  'are',
  'around',
  'as',
  'at',
  'be',
  'became',
  'because',
  'become',
  'becomes',
  'becoming',
  'been',
  'before',
  'beforehand',
  'behind',
  'being',
  'below',
  'beside',
  'besides',
  'between',
  'beyond',
  'both',
  'but',
  'by',
  'call',
  'can',
  'cannot',
  'cant',
  'co',
  'computer',
  'con',
  'could',
  'couldnt',
  'cry',
  'de',
  'describe',
  'detail',
  'did',
  'do',
  'does',
  'doesn',
  'doing',
  'done',
  'down',
  'due',
  'during',
  'each',
  'eg',
  'else',
  'elsewhere',
  'enough',
  'etc',
  'even',
  'ever',
  'every',
  'everyone',
  'everything',
  'everywhere',
  'except',
  'few',
  'fill',
  'find',
  'for',
  'formerly',
  'from',
  'full',
  'further',
  'get',
  'give',
  'go',
  'had',
  'has',
  'hasnt',
  'have',
  'he',
  'hence',
  'her',
  'here',
  'hereafter',
  'hereby',
  'herein',
  'hereupon',
  'hers',
  'herself',
  'him',
  'himself',
  'his',
  'how',
  'however',
  'ie',
  'if',
  'in',
  'inc',
  'indeed',
  'interest',
  'into',
  'is',
  'it',
  'its',
  'itself',
  'just',
  'keep',
  'km',
  'last',
  'latter',
  'latterly',
  'least',
  'less',
  'made',
  'many',
  'may',
  'me',
  'meanwhile',
  'might',
  'mill',
  'mine',
  'more',
  'moreover',
  'most',
  'mostly',
  'move',
  'much',
  'must',
  'my',
  'myself',
  'name',
  'namely',
  'neither',
  'never',
  'nevertheless',
  'next',
  'no',
  'nobody',
  'none',
  'noone',
  'nor',
  'not',
  'nothing',
  'now',
  'nowhere',
  'of',
  'off',
  'often',
  'on',
  'once',
  'only',
  'onto',
  'or',
  'other',
  'others',
  'otherwise',
  'our',
  'ours',
  'ourselves',
  'out',
  'over',
  'own',
  'part',
  'per',
  'perhaps',
  'please',
  'put',
  'quite',
  'rather',
  're',
  'really',
  'regarding',
  'same',
  'say',
  'see',
  'seem',
  'seemed',
  'seeming',
  'seems',
  'serious',
  'several',
  'she',
  'should',
  'show',
  'side',
  'since',
  'sincere',
  'so',
  'some',
  'somehow',
  'someone',
  'something',
  'sometime',
  'sometimes',
  'somewhere',
  'still',
  'such',
  'system',
  'take',
  'than',
  'that',
  'the',
  'their',
  'them',
  'themselves',
  'then',
  'thence',
  'there',
  'thereafter',
  'thereby',
  'therefore',
  'therein',
  'thereupon',
  'these',
  'they',
  'thick',
  'thin',
  'this',
  'those',
  'though',
  'through',
  'throughout',
  'thru',
  'thus',
  'to',
  'together',
  'too',
  'toward',
  'towards',
  'un',
  'under',
  'unless',
  'until',
  'up',
  'upon',
  'us',
  'used',
  'using',
  'various',
  'very',
  'via',
  'was',
  'we',
  'well',
  'were',
  'what',
  'whatever',
  'when',
  'whence',
  'whenever',
  'where',
  'whereafter',
  'whereas',
  'whereby',
  'wherein',
  'whereupon',
  'wherever',
  'whether',
  'which',
  'while',
  'whither',
  'who',
  'whoever',
  'whole',
  'whom',
  'whose',
  'why',
  'will',
  'with',
  'within',
  'without',
  'would',
  'yet',
  'you',
  'your',
  'yours',
  'yourself',
  'yourselves',
])