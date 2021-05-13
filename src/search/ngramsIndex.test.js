import { makeNGrams, extractIndexNGramsFromDoc } from "./ngramsIndex";

import {
  makeChunk,
  makeHRuleChunk,
  makeAsteriskChunk,
  makeEmptyChunk,
} from "../doc/chunk_util.jsx";
import { makeDoc } from "../doc/doc_util.jsx";

test("simple line", () => {
  const ngrams = makeNGrams("Me too! Well, except for the life part.");
  expect(ngrams).toStrictEqual([
    " me",
    "me ",
    "e t",
    " to",
    "too",
    "oo ",
    "o w",
    " we",
    "wel",
    "ell",
    "ll ",
    "l e",
    " ex",
    "exc",
    "xce",
    "cep",
    "ept",
    "pt ",
    "t f",
    " fo",
    "for",
    "or ",
    "r t",
    " th",
    "the",
    "he ",
    "e l",
    " li",
    "lif",
    "ife",
    "fe ",
    "e p",
    " pa",
    "par",
    "art",
  ]);
});

test("punctuation", () => {
  const ngrams = makeNGrams('Jekyll&Hide!,`Town‘’"/#^&*?!;:{}=-_~()Down[Wood]');
  expect(ngrams).toStrictEqual([
    " je",
    "jek",
    "eky",
    "kyl",
    "yll",
    "ll ",
    "l h",
    " hi",
    "hid",
    "ide",
    "de ",
    "e t",
    " to",
    "tow",
    "own",
    "wn ",
    "n d",
    " do",
    "dow",
    "own",
    "wn ",
    "n w",
    " wo",
    "woo",
    "ood",
  ]);
});

test("markdown link", () => {
  const ngrams = makeNGrams(
    "[Élément HTML](https://fr.wikipedia.org/wiki/%C3%89l%C3%A9ment_HTML)"
  );
  expect(ngrams).toStrictEqual([
    " él",
    "élé",
    "lém",
    "éme",
    "men",
    "ent",
    "nt ",
    "t h",
    " ht",
    "htm",
    "tml",
  ]);
});

test("Long space", () => {
  const ngrams = makeNGrams("Durch    das        Öffnen    des");
  expect(ngrams).toStrictEqual([
    " du",
    "dur",
    "urc",
    "rch",
    "ch ",
    "h d",
    " da",
    "das",
    "as ",
    "s ö",
    " öf",
    "öff",
    "ffn",
    "fne",
    "nen",
    "en ",
    "n d",
    " de",
    "des",
  ]);
});

test("extractIndexNGramsFromDoc", () => {
  const doc = makeDoc({
    chunks: [
      makeChunk("# 945 Madison Avenue"),
      makeChunk(
        "The five story building occupies a roughly square plot at Madison Avenue and 75th Street."
      ),
      makeEmptyChunk(),
      makeChunk("New York City and national historic district."),
      makeHRuleChunk(),
      makeChunk(
        "The design, controversial though lauded by notable critics at its opening"
      ),
      makeEmptyChunk(),
    ],
  });
  const ngrams = extractIndexNGramsFromDoc(doc);
  expect(ngrams).toStrictEqual(
    new Set([
      3896305405, 962736345, 1165784608, 2070333230, 770366422, 2306309830,
      2209025882, 3450620550, 1633189697, 3784913964, 2094674926, 305744468,
      42733853, 4075369378, 498933325, 1783370563, 3533186908, 3476474474,
      1011183078, 2590112928, 2148020246, 3234171439, 3192023655, 4244267546,
      2363060954, 3990213885, 2490761442, 1068027680, 4040654566, 2283440099,
      1839695707, 2455350811, 2963805028, 3526660627, 1564511796, 1003530327,
      2339609609, 2930386527, 2431621999, 2900026000, 4199570652, 4057127032,
      648109449, 3681489340, 3080540388, 3056260003, 576189563, 1774294745,
      2384583204, 113736311, 2156193244, 2648394935, 118028367, 1782487031,
      1028926535, 3299764131, 1543096427, 1494527673, 2065631521, 4176056041,
      3827102829, 3216884255, 3264153352, 1872116063, 2525361830, 2345720326,
      1960609095, 2889337719, 3220564256, 193014043, 3438790965, 59272434,
      3967971377, 3328828479, 171843801, 2392837251, 510436789, 299927883,
      133536621, 2281156947, 2644917059, 28900325, 725376404, 3587943409,
      989059321, 3842852782, 1554949113, 2355664701, 2372300569, 4273994270,
      27937804, 1810056261, 3930922784, 312625917, 3841728900, 4161793461,
      2074343083, 357824392, 4210878867, 3182591594, 1451739552, 3670891735,
      1764424681, 189857697, 2400309779, 113739797, 2525417723, 3379109131,
      3314267577, 4029158026, 2097234664, 2246723757, 1148353638, 1751197342,
      1581688737, 3300307938, 3946690221, 2511181703, 3367011616, 3455660305,
      1787506056, 4076071085, 2245974806, 2717885692, 1845907770, 4215645318,
      1629029770, 2166432528, 3458149134, 955357314, 1925800534, 4231474040,
      1423039327, 4257191772, 282895875, 1213240282, 1824357923, 4080518733,
      4168556200, 163332610, 1700326187, 2554894053, 662474299, 2158321192,
      2086697681, 3700458744, 2073014609, 613664208, 1745177179, 888269463,
      3791991811, 2932035831, 2435991773, 3804921933, 2342674098, 2259131960,
      3105775439, 1904288811, 2616189488, 3783238930, 134610293, 3442260019,
      1944273676, 2778422355, 1082292000, 2640860284, 4033004697, 936884102,
      2629267171, 1264779495, 3346681011, 3426613650, 1067135327, 2326570646,
      223601856, 610007609, 974697929, 2479166307, 3783219056, 1970051494,
      2922232110, 422601471, 2118995724, 2738725769,
    ])
  );
});
