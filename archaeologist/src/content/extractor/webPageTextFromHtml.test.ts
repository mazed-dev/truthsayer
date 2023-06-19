import { extractTextContentBlocksFromHtml } from './webPageTextFromHtml'

test('notion.so document structure', () => {
  const html = `
<main>
<div>
  <div>
    <div>
      <div>
        <div placeholder="Heading 2" spellcheck="true">
          Introduction
        </div>
      </div>
    </div>
    <div>
      <div>
        <div>
          <div placeholder="" spellcheck="true">Climate change is
            one
            of the most pressing issues facing our world today. The burning of fossil fuels has released an enormous
            amount of carbon dioxide into the atmosphere, contributing to global warming. While many efforts have been
            made to reduce carbon emissions, it may not be enough to reverse the damage already done. That’s where
            carbon catching factories come in. This innovative technology could be the solution to our climate crisis.
          </div>
        </div>
      </div>
    </div>
    <div>
      <div>
        <div placeholder="Heading 2" spellcheck="true">The Concept
          of
          Carbon Catching Factories</div>
      </div>
    </div>
    <div>
      <div>
        <div>
          <div placeholder="" spellcheck="true">Carbon catching
            factories, also known as direct air capture facilities, are designed to remove carbon dioxide directly from
            the air. These facilities use technology to capture and store carbon dioxide, preventing it from entering
            the atmosphere. The captured carbon dioxide can be stored underground or used to create other products, such
            as fuel or building materials. The technology is still in its early stages, but it has the potential to
            significantly reduce carbon emissions and slow the effects of climate change.</div>
        </div>
      </div>
    </div>
  </div>
</div>
</main>
    `
  expect(extractTextContentBlocksFromHtml(html, '')).toStrictEqual([
    {
      text: 'Introduction',
      type: 'H',
    },
    {
      text: 'Climate change is one of the most pressing issues facing our world today. The burning of fossil fuels has released an enormous amount of carbon dioxide into the atmosphere, contributing to global warming. While many efforts have been made to reduce carbon emissions, it may not be enough to reverse the damage already done. That’s where carbon catching factories come in. This innovative technology could be the solution to our climate crisis.',
      type: 'P',
    },
    {
      text: 'The Concept of Carbon Catching Factories',
      type: 'H',
    },
    {
      text: 'Carbon catching factories, also known as direct air capture facilities, are designed to remove carbon dioxide directly from the air. These facilities use technology to capture and store carbon dioxide, preventing it from entering the atmosphere. The captured carbon dioxide can be stored underground or used to create other products, such as fuel or building materials. The technology is still in its early stages, but it has the potential to significantly reduce carbon emissions and slow the effects of climate change.',
      type: 'P',
    },
  ])
})

test('HTML table -', () => {
  // FIXME(Alexander): This is "good" enough quick solution to get it done and
  // have text from tables indexed. Please whenever you have time, parse tables
  // properly and ideally render them accordingly as the direct quote.
  const html = `
<main>
<h2>HTML Table</h2>
<table>
  <tr>
    <th>Company</th>
    <th>Contact</th>
    <th>Country</th>
  </tr>
  <tr>
    <td>Alfreds Futterkiste</td>
    <td>Maria Anders</td>
    <td>Germany</td>
  </tr>
  <tr>
    <td>Centro comercial Moctezuma</td>
    <td>Francisco Chang</td>
    <td>Mexico</td>
  </tr>
  <tr>
    <td>Ernst Handel</td>
    <td>Roland Mendel</td>
    <td>Austria</td>
  </tr>
  <tr>
    <td>Island Trading</td>
    <td>Helen Bennett</td>
    <td>UK</td>
  </tr>
  <tr>
    <td>Laughing Bacchus Winecellars</td>
    <td>Yoshi Tannamuri</td>
    <td>Canada</td>
  </tr>
  <tr>
    <td>Magazzini Alimentari Riuniti</td>
    <td>Giovanni Rovelli</td>
    <td>Italy</td>
  </tr>
</table>
</main>
`
  expect(extractTextContentBlocksFromHtml(html, '')).toStrictEqual([
    {
      text: 'HTML Table',
      type: 'H',
    },
    {
      text: '| Company | Contact | Country | | Alfreds Futterkiste | Maria Anders | Germany | | Centro comercial Moctezuma | Francisco Chang | Mexico | | Ernst Handel | Roland Mendel | Austria | | Island Trading | Helen Bennett | UK | | Laughing Bacchus Winecellars | Yoshi Tannamuri | Canada | | Magazzini Alimentari Riuniti | Giovanni Rovelli | Italy |',

      type: 'P',
    },
  ])
})

test('HTML lists', () => {
  const html = `<main>
<h2>An unordered HTML list</h2>
<ul>
  <li>Coffee</li>
  <li>Tea</li>
  <li>Milk</li>
</ul>
<h2>An ordered HTML list</h2>
<ol>
  <li>Coffee</li>
  <li>Tea</li>
  <li>Milk</li>
</ol>
<h2>A Description List</h2>
<dl>
  <dt>Coffee</dt>
  <dd>- black hot drink</dd>
  <dt>Milk</dt>
  <dd>- white cold drink</dd>
</dl>
<h2>A Nested List</h2>
<ul>
  <li>Coffee</li>
  <li>Tea
    <ul>
      <li>Black tea</li>
      <li>Green tea</li>
    </ul>
  </li>
  <li>Milk</li>
</ul>
</main>
`
  // TODO(Alexander): Description lists are not supported very well now and
  // treated as mere paragraphs.
  // TODO(Alexander): Nested lists are not supported very well now.
  // TODO(Alexander): Ordered lists are not supported very well now, and trated
  // as unordered lists.
  expect(extractTextContentBlocksFromHtml(html, '')).toStrictEqual([
    {
      text: 'An unordered HTML list',
      type: 'H',
    },
    {
      text: 'Coffee',
      type: 'LI',
    },
    {
      text: 'Tea',
      type: 'LI',
    },
    {
      text: 'Milk',
      type: 'LI',
    },
    {
      text: 'An ordered HTML list',
      type: 'H',
    },
    {
      text: 'Coffee',
      type: 'LI',
    },
    {
      text: 'Tea',
      type: 'LI',
    },
    {
      text: 'Milk',
      type: 'LI',
    },
    {
      text: 'A Description List',
      type: 'H',
    },
    {
      text: 'Coffee - black hot drink Milk - white cold drink',
      type: 'P',
    },
    {
      text: 'A Nested List',
      type: 'H',
    },
    {
      text: 'Coffee',
      type: 'LI',
    },
    {
      text: 'Tea',
      type: 'LI',
    },
    {
      text: 'Black tea',
      type: 'LI',
    },
    {
      text: 'Green tea',
      type: 'LI',
    },
    {
      text: 'Milk',
      type: 'LI',
    },
  ])
})

test('extractTextContentBlocksFromHtml - put extra dot after header and table rows', () => {
  expect(
    extractTextContentBlocksFromHtml(
      `<div>
        <h2>From the Crew</h2>
        <h3></h3><h3></h3>
        <p>Just one extra message</p>
      </div>`,
      ''
    )
  ).toStrictEqual([
    { text: 'From the Crew', type: 'H' },
    { text: 'Just one extra message', type: 'P' },
  ])
  expect(
    extractTextContentBlocksFromHtml(
      `<table>
      <tbody>
        <tr><td>Born</td><td>15 March 1813</td></tr>
        <tr></tr>
        <tr><td>Alma mater</td><td>	University of London (MD)</td></tr>
      </tbody>
      </table>
      `,
      ''
    )
  ).toStrictEqual([
    {
      text: '| Born | 15 March 1813 | | | Alma mater | University of London (MD) |',
      type: 'P',
    },
  ])
})
