# NearBaYan UI Reference Handout

Source references: `mockup/1.png` through `mockup/11.png`.

## Direction

The mockups define the layout and visual system, not a fixed device size. The prototype should stay responsive while preserving the same screen hierarchy, component order, color roles, and rounded mobile-app feel.

## Visual System

- Page background: warm cream.
- Header: powder blue panel with large rounded lower corners.
- Primary action color: royal blue.
- Bottom navigation: khaki dock with black inactive icons and white active pill.
- Cards: white rounded blocks with soft shadows.
- Content chips: mint pills for Request, Question, Item, Lost and Found, and Completed.
- Main CTA chips: green pills inside white action wells.
- Typography: bold centered uppercase section titles for list pages; heavy card titles; soft gray placeholder and helper text.

## Screen References

- `1.png`: Landing page. Large brand mark dominates the top, tagline sits above two stacked CTAs.
- `2.png`: Sign in. Brand badge overlaps the form panel; title is centered; username/password fields stack; Google sign-in and sign-up link sit below the primary button.
- `3.png`: Register. Same auth panel system; username, password, confirm password, agreement row, and primary button.
- `4.png`: Home. Blue rounded header, wordmark at top, menu circle, search pill, task banner, nearby request card, horizontal category pills, request previews, khaki bottom nav.
- `5.png`: Home menu open. Floating white menu aligned top right, active Dashboard row in soft blue.
- `6.png`: Requests. Centered title, stacked large request cards, landscape image placeholder, green Apply Now chip, comment icon, floating add button.
- `7.png`: Create request. Blue header bar with back control and centered title; full form; blue category control; bottom Cancel and Submit buttons.
- `8.png`: Questions. Same list layout, but cards use text summaries instead of image blocks.
- `9.png`: Items. Horizontal item filters above large item cards; active Buy pill in royal blue.
- `10.png`: Lost and Found. Same list-card treatment with Found It action.
- `11.png`: Profile. Profile card at top with avatar, edit affordance, rating and response metrics; completed history cards below.

## Current Progress

- Prototype frontend now uses the reference layout language responsively instead of copying the 414px mockup size.
- Auth views include landing, sign-in, and register states matching the reference screen structure.
- Home, menu, category tabs, cards, FAB, composer, bottom navigation, and profile are restyled toward the mockups.
- Existing data rendering and backend auth flow remain in place.

## Keep Checking

- Do not lock the UI to the mockup dimensions.
- Preserve the reference component order when adding features.
- New list cards should use the same white card, mint chip, location row, and action well pattern.
- New primary buttons should use royal blue; transactional list actions should use green.
- Keep the bottom nav khaki and the active item as a white pill.
