import { makeNGrams } from "./ngramsIndex";

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
