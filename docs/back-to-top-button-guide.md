# Back to Top Button — Placement Relative to Chat Icon

Two implementation options for a responsive "back to top" button positioned near a floating chat icon in the bottom-right corner, without shifting page content.

**Key point:** use `position: fixed`, not `absolute`. Fixed pins an element to the viewport regardless of scroll and takes it out of document flow, so it never pushes or shifts page content. `absolute` anchors to the nearest positioned ancestor and would scroll away with the page unless that ancestor is also fixed.

## Option 1: Single fixed column, two rows, one icon each (try this first)

1. Create one wrapper element, not two independent buttons:
   ```jsx
   <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3 md:gap-4">
     <button> {/* back-to-top icon */} </button>
     <button> {/* chat icon */} </button>
   </div>
   ```
2. `flex flex-col` stacks the two rows vertically; `gap-3`/`gap-4` is the spacing between them — this replaces manually calculated `bottom-24`-style offsets.
3. Order matters: whichever button appears first in the JSX renders as the top row. Put back-to-top first and chat second if chat should sit closest to the corner, or swap if you want the opposite.
4. Responsive sizing only, not repositioning: scale icon button size/padding/gap with breakpoints (e.g. `w-12 h-12 md:w-14 md:h-14`, `gap-3 md:gap-4`), but keep `bottom-6 right-6` constant across all breakpoints. Because the whole column is one fixed unit, both icons always move together and stay aligned — no risk of them drifting apart or overlapping at different viewport sizes.
5. Back-to-top's visibility toggle (`opacity-0 pointer-events-none` when scrollY < 300) only needs to apply to that one button inside the column — the chat button stays independently visible/interactive regardless of scroll position.
6. Give the wrapper `z-50` (or whatever your top layer is) once, instead of setting z-index on each icon separately.

## Option 2: Two independently fixed elements with manual offsets

1. Back-to-top button: `fixed bottom-6 right-6 z-50`.
2. Chat bubble: `fixed bottom-24 right-6 z-50` — same `right` value, `bottom` manually bumped up by one icon-height-plus-gap so it clears the back-to-top button.
3. If either icon's size changes, you must manually recalculate the second one's `bottom-*` value to avoid overlap or an uneven gap — this is the tradeoff vs. Option 1, where the flex `gap` handles that automatically.
4. Chat window (when opened, if it expands into a panel) can reuse the base `bottom-6 right-6` since it's a different, larger element replacing the bubble rather than stacking with it.
