# Portfolio repo guardrails (React 18 + Vite + Tailwind v3 + three.js, GitHub Pages)

## Breakpoint convention (declared once, applied everywhere)
- Tailwind breakpoints are the defaults: sm 640, md 768, lg 1024, xl 1280, 2xl 1536, plus a custom xs 450.
- Convention: below `lg` = mobile/tablet layout (hamburger menu); `lg` and up = desktop layout.
- If a component uses a different breakpoint than this, that is a bug. Fix it or ask.
- Never edit `theme.extend.screens` without checking that it contains only ONE `screens` key (a duplicate key silently drops the first).

## Layout rules
- Content that appears in more than one layout block (nav links, social links, text) must come from ONE shared source, never typed twice.
- Never nest a `position: fixed` element inside an ancestor with `backdrop-filter`, `filter`, or `transform`.
- Use `h-dvh`, not `h-screen`/`100vh`, for sections that must fill one mobile viewport.
- Do not assume a fixed header's height. Measure it, or drive header height and content offset from one shared value.
- Interactive controls that must never disappear (hamburger, close buttons) get `shrink-0`; flexible text beside them gets `min-w-0` and may wrap or truncate first.
- Do not use `whitespace-nowrap` on text that sits beside a control that must stay visible.
- Do not use `&nbsp;` for layout spacing; use gap/margin.
- Any logo or image that must scale with adjacent text keeps its aspect ratio (`object-contain`, aspect-ratio or `h-auto`), never both width and height fixed to unrelated values.

## Verification protocol (required before saying a layout change works)
1. Never trust a browser tool's default width. Use Playwright with explicit viewports (`scripts/qa-layout.mjs`) at 320, 360, 390, 430, 640, 768, 900, 940, 1023, 1024, 1180, 1280, 1536, 1920.
2. Assert numbers (no horizontal overflow; required controls inside the viewport; no overlaps; logo ratio) and print them.
3. Screenshot each width and actually look at the images. Describe what you see.
4. Test between breakpoints, not only at them.
5. Never write "renders correctly" or "no errors" unless steps 1-3 passed. List anything you did not verify.
6. Report mobile menu, scroll-to-top, and any floating buttons explicitly.

## Scope discipline
- Change only what the task names. Do not touch Supabase functions, AI prompts, or data files unless asked.
- Work on a branch, commit in small steps, run `npm run build` before reporting.
