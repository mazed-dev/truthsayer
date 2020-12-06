# Todo

 - [ ] End-to-end encryption
 - [ ] Button for list item to create right-link from this item
 - [ ] Proper preview for small cards
 - [ ] Drag-and-drop for paragraps and list items
 - [ ] Small cards on smart search results
 - [ ] Toolpannel is a part of small card - take is as an argument
 - [ ] Check lists should be interactive in read mode
 - [ ] Draw lines from "in-text" references to other notes
 - [ ] Don't cut small notes in the middle of the line
 - [ ] "Date" menu, to see details and edit in modal window
 - [ ] Notification feature from DATA menu
 - [ ] Publishing "mazes" like a stories with multiple lines and crossroads
 - [ ] Add the number of words and letters to the footer of the note along with last update time
 - [ ] If cursor stays on the list point suggest next to be with a title with the text from the bullet point
 - [ ] Search input on nav bar should be __sticky__ and __centered__
 - [ ] Save and go on "next" and "previous" from smart menue
 - [ ] Add popover for datetime badge on click and hover
 - [ ] Modal window on error
 - [ ] Emoji as viniette for every note
 - [ ] Connect uploaded files
 - [ ] Text area for each paragraph with menu on hover
 - [ ] generate route list from loop and switch off current page reference on global navbar
 - [ ] New button should be brighter - blue or grey or something. Bright!
 - [ ] Better styles for headers in note
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
