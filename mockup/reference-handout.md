# NearBaYan Mockup UI Handout

This note tracks the reference layout direction so future changes do not drift. We are matching the layout language, not copying exact pixel sizes.

## Reference Screens

- `mockup/1.png`: landing screen with oversized pin/logo lockup, short tagline, primary sign-in button, secondary create-account button.
- `mockup/2.png`: sign-in screen with top logo lockup, rounded white panel, large blue title, username/password fields, keep-signed-in checkbox, forgot password, Google button, and sign-up switch.
- `mockup/3.png`: register screen with the same auth shell, username/password/confirm password fields, agreement checkbox, and primary create-account action.
- `mockup/4.png` and `mockup/5.png`: home dashboard with blue rounded header, logo/menu/search, task banner, nearby request card, pill tabs, card previews, and khaki bottom navigation.
- `mockup/6.png`: requests list with centered section title, large white request cards, image placeholder, green apply action, comment button, and floating add button.
- `mockup/7.png`: create request form with blue header bar, back button, stacked inputs, blue category control, and split cancel/submit actions.
- `mockup/8.png`: questions list using text-first cards with the same green action/comment footer.
- `mockup/9.png`: items list with buy/rent/swap/sell pills and item cards.
- `mockup/10.png`: lost-and-found list with found-it action and the same card rhythm.
- `mockup/11.png`: profile screen with top profile summary card, rating/response metrics, completed history cards, reviews, and active profile bottom nav.

## Current Implementation Notes

- Keep existing auth/API functions stable. The auth screen remains a real connected form so the browser does not emit disconnected-form warnings.
- UI changes live mostly in the final override section of `prototype-frontend/styles.css` under `Mockup-based layout pass`.
- Home, category lists, composer, auth, profile, messages, and notifications now use the mockup layout language.
- Added light button behavior only: password visibility toggles, composer cancel closes the dialog, card actions create a local activity notification, comment buttons open messages, and "Check Now" opens requests.
- The current desktop treatment intentionally keeps the same centered mobile-style layout instead of restoring the old rail/dashboard UI.

## Guardrails

- Do not reintroduce custom auth panels without a real `<form id="authForm">`.
- Do not wire localhost proxies or backend changes into this UI pass.
- Do not copy exact mockup dimensions; use responsive constraints that preserve the layout on mobile and desktop.
