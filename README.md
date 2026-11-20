# AIMemory demo

A functional, mobile-first web demo of **AIMemory**: connect your messaging apps, and Thera (the built-in assistant) organises your conversations into collections of plans, links, places and photos.

The app is a Next.js 16 project designed for phones. On a desktop it renders inside a phone frame.

## What testers can do

- **Onboarding:** intro screens, connect apps (simulated consent and import), pick a main memory, watch the memory being built. "I have an account" restores a demo account.
- **Home:** search, category filters, collections carousel, pinned contacts, upcoming plans.
- **Collections:** grid with search, pinned and A to Z sorting; create new collections (Thera gathers matching items); press and hold to pin, rename, share or delete.
- **Collection detail:** AI summary, reservations and events (add to calendar), AI suggestion with a dated plan, links, reels and photos (full-screen viewer), search and filters by contact, section, app and date.
- **Contacts:** search, sort, add, pin, mute, delete; contact pages list shared topics with category filters and an empty state that hands off to Thera.
- **Ask Thera:** live AI over the demo data with tappable result cards, plus an automatic scripted fallback.
- **Settings:** connect and disconnect apps (content updates live), main memory, sync frequency, sync now, privacy, edit profile, replay onboarding, reset demo, sign out.

All state is stored in the browser (localStorage), so each tester gets their own copy of the demo.

## Thera and AI Gateway

`/api/thera` calls Vercel AI Gateway (authenticated automatically on Vercel through OIDC). Models are tried in order and can be changed without a code change:

```
THERA_MODELS="google/gemini-2.5-flash,openai/gpt-5.4-mini,openai/gpt-oss-120b"
```

If every model fails (no credit, rate limits, outage), the client answers with a scripted search over the same demo data, so the assistant never breaks.

## Develop

```bash
npm install
npm run dev
```

For live AI locally, run `vercel env pull` (or set `AI_GATEWAY_API_KEY`) first.

## Demo content

All demo data lives in `src/lib/data.ts`: the user, contacts, collections, items and the messages they were found in. Dates are stored relative to today, so the demo always looks current.
