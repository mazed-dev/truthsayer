import React from "react";

import { markdownToDoc } from "./conv.jsx";

test("raw string", () => {
  const md = `# Header 1
## Header 2
### Header 3
#### Header 4
##### Header 5
###### Header 6

- first list item
- second list item


- Schools
- [Travel history](wq8ksuip3t8x85eckumpsezhr4ek6qatraghtohr38khg)
- [Housing history](94ogoxqapi84je7hkbt1qtt8k1oeycqc43haij57pimhn)
- Passports

\`struct timeval *restrict timeout\`

-----

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


- [ ] Checlist item 1
- [ ] Checlist item 2

![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

`;
  markdownToDoc(md);
});
