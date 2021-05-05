import React from "react";

import { mdToBlocks } from "./conv.jsx";

test("raw string", () => {
  const md = `# Hello world!

## Second layer

- first list item
- second list item

## Historical lists (personal)

- [Travel history](wq8ksuip3t8x85eckumpsezhr4ek6qatraghtohr38khg)
- Employment history
- [Housing history](94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn)
- Schools
- Passports

\`struct timeval *restrict timeout\`


\`\`\`python
 s = "Python syntax highlighting"
  print s
\`\`\`

| Tables | Are    | Cool |
| ------ |:------:| ----:|
| col    | aligne | $160 |
| col    | ed     |   $2 |
| zebra  | neat   |   $1 |

> Blockquotes are very handy in email to emulate reply text.
> This line is part of the same quote.

---

[I'm an inline-style link](https://www.google.com)

[I'm an inline-style link with title](https://www.google.com "Google's Homepage")

[I'm a reference-style link][Arbitrary case-insensitive reference text]

`;
  mdToBlocks(md);
});
