# Todo

- [ ] Draft JS as an rich text editor
  - [x] Rich text toolbar at the bottom, between the card and mazed toolbar
  - [x] Hide all buttons from small card except "..." and "Open"
  - [x] Support Draft JS documents in small cards
  - [x] Bottom line toolbar
  - [x] Support saving changed documents
  - [x] Checkbox doesn't work
  - [ ] Support new type of documents in search
  - [ ] Click on the ref in text doesn't work
  - [ ] Migration tool for all existing cards - redirect after a login
  - [ ] Fix links in "cloned from" disclaimers
  - [ ] Magnet edges is broken
  - [ ] Release
- [ ] Refs, url valiation
- [ ] Refs, local node refs recognition
- [ ] Refs, same buttons as for right "next"
- [ ] Smart point
- [ ] Support custom images in docs
- [ ] "Date-time" menu, to see details and edit in modal window. Date picker
- [ ] Checkbox doesn't have depth as normal list
- [ ] Hide share button under meatballs menu
- [ ] Emoji as a default header
- [ ] Twice smaler search cards for mobile devices
- [ ] Button for list item to create right-link from this item
- [ ] Fix tooltip overlap
- [ ] Implement edge stickiness on server side to reduce number of calls to backend
- [ ] Public and private bars are the same - don't split them
- [ ] History of changes for each node
- [ ] On public nodes show (i) information button instead of "..."
- [ ] On public nodes show "Published on DATE and TIME"
- [ ] Add local secrets page to seetings dialog
- [ ] Proper "image" logo, not just emoji
- [ ] Font for logo must be the same size as buttons on nav bar
- [ ] Insert emoji as an image
- [ ] Attach files to the note
- [ ] Footbar for small cards as a reference
- [ ] Footbar for small cards in search
- [ ] Properly cut overflowing html for small cards
- [ ] Use react state (as for toaster) for account info
- [ ] Tooltips for everything!
- [ ] Scrollable overflow for tables
- [ ] Download all or some nodes as markdown
- [ ] Add "date" and "next" as buttons to a toolbar
- [ ] Encryption - encryption of a node should be optional
- [ ] Encryption - reencrypt all function
- [ ] Don't encrypt nodes with server key, just use base64 on broweser side for non-encrypted nodes
- [ ] Proper preview for small cards
- [ ] Smart menu - dark background under smart cards
- [ ] Drag-and-drop for paragraps and list items
- [ ] Small cards on smart search results
- [ ] Toolpannel is a part of small card - take is as an argument
- [ ] Draw lines from "in-text" references to other notes
- [ ] Better cards for date/new nodes
- [ ] Don't cut small notes in the middle of the line
- [ ] Notification feature from DATA menu
- [ ] Publishing "mazes" like a stories with multiple lines and crossroads
- [ ] Add the number of words and letters to the footer of the note along with last update time
- [ ] If cursor stays on the list point suggest next to be with a title with the text from the bullet point
- [ ] Search input on nav bar should be __sticky__ and __centered__
- [ ] Save and go on "next" and "previous" from smart menue
- [ ] Add popover for datetime badge on click and hover
- [ ] Emoji as viniette for every note
- [ ] Connect uploaded files
- [ ] Text area for each paragraph with menu on hover
- [ ] generate route list from loop and switch off current page reference on global navbar
- [ ] New button should be brighter - blue or grey or something. Bright!
- [ ] Add simple vignette for notes

- [?] Improve main page, it should reflect graph nature of notes and expose at least part of connections between found notes

## Feedback

- [ ] Handle all the erros, don't raise them to the console
- [ ] Remove permissions from the interfaces, only in JWT maybe
- [ ] Validate mime-type and size whe upload files
- [ ] Use version of software in the URL, suggetsion from kaldown. __Do we need it?__

## Done

- [x] Page to upload bunch of notes from files
- [x] Add cutting a connection functionality
- [x] Single route switch - for both private and public
- [x] Fix bug. To reproduce: add ref by "search-and-add", click on added connection - you will see note connected to itself.
- [x] Show proper name on global nav bar, not john@
- [x] ----- Release it to public -----
- [x] Login
    еще при переходе на login сразу шлется сессия
    это наверно какойто хитрый трюк, но
    если я авторизован - login не должен быть виден - скрыть под public/private
    а если нет - то сессию слать ненадо, я ведь ен авторизован (пока не нажал на submit)

    как проверить - зайди на страницу /login
    обнови ее
    ты увидешь 2 запроса на авторизацию
    тоесть 1 после обновления, и второй когда заодишь (лишний)
- [x] Modal window with autocompletion
- [x] After using smart menu focus should be back to editing form
- [x] Improve dates view in notes 12/12/20 is apparently too confusing
- [x] Improve the node view, the notes on the sides should reflect how many connections behind them
- [x] Take care of what people see after the sing-in even if registration is not open yet
- [x] Quotes doens't work: the text that starts with `> ` looks like normal paragraph.
- [x] Add "next" and "previous" to smart menu.
- [x] Add symmetric buttons "next" and "search-to-next" to the left side
- [x] Make left and right toolbars symmetric
- [x] Side toolbars should be whitish (whiter than background)
- [x] Vertical toolbar for markdown editing
- [x] Fix the position of scissors on referenec nodes
- [x] Emoji as bullet points for lists in notes.
- [x] Infinite scrol on search
- [x] Sticky links - the links that stick to all the "next" notes
- [x] Update refs of note at a time when they are changed, not after forced update
- [x] Fix "new" button, it doesn't work now. Make it black-gray-white style.
- [x] Remove `node/<nid>/(to|from)` endpoints in favour of `node/<nid>/edge`
- [x] Check lists should look like check lists
- [x] Chunked doc editing
- [-] Pencil should be sticky element, not needed, because editing is per paragraph
- [x] Secure search that will allow full end-to-end encryption
- [x] Chunked doc editing - new chunk on 2 new lines
- [x] Go to a small card only by clicking on Header of it
- [x] Smart menu - incorrect size of dynamic cards grid
- [x] End-to-end encryption
- [x] Encryption - show that node is encrypted but there is no local key to decrypt it, show secret id of unknown key
- [x] Show secret as a pair - signagure & key
- [x] Check that encrypted node can be decrypted with CLI command (`openssl`)
- [x] Encryption - show that loading is in progress
- [x] Reuse the same search grid component for smart menu and for globals search
- [x] Clone for next - new button on side cards menu, hide it with "search and next" under "more" button with arrow - "v"
- [x] Download/copy node as markdown
- [x] Tooltip element
- [x] Pop up for downloading doc as markdown - "Copied to clipboard"
  - [x] Modal window on error. _Canceled because I made toaster instead_
- [x] Upgrade react-bootstrap package
- [x] Reduce size of the cross in "New note" button on global bar, by 20%
- [x] Better styles for headers in note : use colour gradient for h1..h6
- [x] Make global toolbar smaller and sticky
- [x] Markdown toolbar should appear on global toolbar
- [x] Minus as default list bulletsign
- [x] Checklists should be interactive in read mode
- [x] Opacity on toolbars and navbar should be the same!
- [x] Stikiness doesn't work, #bug
- [x] Change sticky option to a new picture - checkbox with picture
- [x] Add internal shadow to a checkboxes to make them look like empty wholes
- [x] Add page "Please register to create new notes"
- [x] Create an error page "Oops, something went wrong"
- [x] Use only "Long in" option on top bar
- [x] Public pages availiable by direct link
  - [x] Share struct to node meta
  - [x] Allow to read shared node without user UID when node is shared
  - [x] Move publick "node" endpoint to "n"
  - [x] Meta get/update endpoints
  - [x] Mark node as shared from modal window
  - [x] Read and show edges only for public notes
  - [x] Redirect to "Log-in" form when non-registered user clicks on it
  - [x] Show the same gloabal navbar for private and public pages
  - [x] Connect "alien" notes correctly
  - [x] Show "alien" notes correctly
  - [x] On public nodes show author along with information about "upate date".
- [x] "Open" button on top of each small card. "See more" should unfold the small card, instead of opening it.
- [x] "Next" button should be dropdown - only, no separate button for clone and search options.
- [x] Non nodes don't work in smartpoint!
- [x] Title extraction work badly - doesn't remove special symbols and new line characters
- [x] Remove arrowhead after account button on navbar
- [x] Blank copy of a note with unticked checkboxes
- [x] Badge for a copied notes is at the bottom of the note under horisontal rule
- [x] Delete node functionality
- [x] Addjust Triptych for small screens
  - All ref cards bellow in 2 rows
- [x] Fixed size cards for search grid, for triptyh, for smartpoint
- [x] Tool for markdown checklists
