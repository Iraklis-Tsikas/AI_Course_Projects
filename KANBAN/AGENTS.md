#Kanban Project

## Business Requirements

- An MVP of Kanban style Project Management application as web application
- The web app should only have 1 board 
- Each vard has fixed 5 columns that can be renamed
- Drag and drop interface to move cars between columns
- Add a new card to a column; delte an existing card- No more functionality: no archive, no search/filter. Kepp it simple.
- the priority is a slick, professional, gorgeous UI/UX with very simple features
- The should open with dummy data populated for a single board

## Technical Details

- Implemented as a modern Angular app, client rendered
- The Angular app should be created in a subdirectory `Frontend`
- No persistence
- No user management for the MVP - use popular libraries
- As simple as possible but with an elegant UI

## Color Scheme

- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `3032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Strategy

1. Write plan with success criteria for each phase to be checked off. Including project
scaffolding, including .gitignore, and rigorous unit testing.
2. Execute the plan ensuring all critieria are met
3. Carry out extensive intrgration testing with Playwright or similar, fixing defects
4. Only complete when the MVP is finished and tested, with the server running and ready for the user 

## Coding standarts

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over engineer, ALWAYS simplify, NO unnecessary defensive
programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
