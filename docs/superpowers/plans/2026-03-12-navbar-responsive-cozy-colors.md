# Navbar Responsiveness + Cozy Color Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a responsive mobile drawer navbar and a cozy moss + cream retheme (light + dark) via global tokens, with minimal header-only polish and automated interaction coverage.

**Architecture:** Keep changes isolated to the web header and shared UI token stylesheet. Implement drawer behavior with local state in the header and semantic token updates in the shared globals file so existing components inherit palette changes. Add a lightweight web test harness (Vitest + Testing Library) only to validate required drawer interactions and focus behavior.

**Tech Stack:** React 19, TanStack Router, Tailwind CSS v4 tokens in shared UI package, Bun workspace scripts, Vitest + Testing Library + jsdom (new for web tests)

---

## File Structure Map

- Modify: `apps/web/src/components/header.tsx`
  - Responsibility: responsive header layout, mobile drawer behavior, a11y attributes, keyboard and focus handling, header-only visual polish.
- Modify: `packages/ui/src/styles/globals.css`
  - Responsibility: semantic global color tokens for cozy palette in both `:root` and `.dark`.
- Modify: `apps/web/package.json`
  - Responsibility: web-specific test dependencies and scripts.
- Create: `apps/web/vitest.config.ts`
  - Responsibility: test runner config (jsdom environment, setup file, include patterns).
- Create: `apps/web/src/test/setup.ts`
  - Responsibility: shared testing setup (DOM matchers + cleanup hooks).
- Create: `apps/web/src/components/header.test.tsx`
  - Responsibility: automated interaction/a11y checks for mobile drawer open/close, Escape behavior, link-close behavior, and focus transitions.

## Chunk 1: Responsive Header + Cozy Tokens

### Task 1: Add responsive mobile drawer behavior in header

**Files:**
- Modify: `apps/web/src/components/header.tsx`

- [ ] **Step 1: Implement responsive layout split (desktop inline nav, mobile trigger)**

```tsx
// In Header component:
const [isMenuOpen, setIsMenuOpen] = useState(false)
// Desktop: keep inline <nav> with md:flex
// Mobile: show trigger button with md:hidden
// Trigger press must toggle drawer open/closed
// Desktop and mobile nav link sets must stay identical
// Suggested structure:
// <header>
//   <div className="...">
//     <button aria-label="Open navigation menu" aria-controls="mobile-nav-drawer" ... />
//     <nav className="hidden md:flex ...">...</nav>
//   </div>
// </header>
```

- [ ] **Step 2: Implement ARIA + landmark contract**

```tsx
// Required behavior:
// - aria-expanded + aria-controls + descriptive aria-label on trigger
// - drawer nav uses navigation landmark semantics (e.g. <nav aria-label="Mobile">)
// - keep visible focus styles on trigger and links (focus-visible ring classes)
```

- [ ] **Step 3: Implement close interactions (overlay, Escape, link click)**

```tsx
// Close paths:
// - overlay click closes drawer
// - Escape key closes drawer
// - link click closes drawer
// - trigger re-press closes drawer
```

- [ ] **Step 4: Implement focus management + scroll lock lifecycle**

```tsx
// Focus and scroll behavior:
// - focus first drawer link on open
// - focus returns to trigger on close
// - lock body scroll while open; unlock on close/unmount
// Concrete hooks/refs to add:
// const triggerRef = useRef<HTMLButtonElement | null>(null)
// const firstLinkRef = useRef<HTMLAnchorElement | null>(null)
// const originalOverflowRef = useRef<string | null>(null)
// useEffect(() => {
//   if (!isMenuOpen) return
//   firstLinkRef.current?.focus()
// }, [isMenuOpen])
// useEffect(() => {
//   const onKeyDown = (event: KeyboardEvent) => {
//     if (event.key === "Escape") setIsMenuOpen(false)
//   }
//   if (isMenuOpen) document.addEventListener("keydown", onKeyDown)
//   return () => document.removeEventListener("keydown", onKeyDown)
// }, [isMenuOpen])
// useEffect(() => {
//   if (isMenuOpen) {
//     if (originalOverflowRef.current === null) {
//       originalOverflowRef.current = document.body.style.overflow
//     }
//     document.body.style.overflow = "hidden"
//     return
//   }
//   if (originalOverflowRef.current !== null) {
//     document.body.style.overflow = originalOverflowRef.current
//     originalOverflowRef.current = null
//   }
//   return () => {
//     if (originalOverflowRef.current !== null) {
//       document.body.style.overflow = originalOverflowRef.current
//       originalOverflowRef.current = null
//     }
//   }
// }, [isMenuOpen])
```

- [ ] **Step 5: Verify focus return and scroll unlock behavior before styling polish**

Run: `bun dev:web`
Expected:
- Open drawer: first drawer link receives focus and body cannot scroll.
- Close via trigger/Escape: focus returns to trigger and body scroll is restored.

- [ ] **Step 6: Add header-only visual polish classes**

```tsx
// Apply classes only in header.tsx with concrete targets:
// - Header container: sticky top, bg-background/95, backdrop-blur, border-b border-border/70
// - Trigger button: rounded-md, hover:bg-accent, focus-visible:ring-2 ring-ring
// - Desktop and drawer links: rounded px/py hover:bg-accent hover:text-accent-foreground
// - Active link: bg-secondary text-secondary-foreground
// - Drawer panel: bg-card text-card-foreground border-l border-border shadow-xl
// - Overlay: bg-foreground/20 with transition-opacity
```

- [ ] **Step 7: Run typecheck for web app**

Run: `bun --filter web check-types`
Expected: PASS with no TypeScript errors.

- [ ] **Step 8: Run manual responsive/a11y smoke check in browser**

Run: `bun dev:web`
Expected checks:
- Mobile: trigger opens drawer and first link receives focus.
- Mobile: pressing trigger again closes drawer.
- Mobile: `Escape`, overlay click, and link click all close drawer.
- Mobile: body cannot scroll while drawer is open; scroll restored on close.
- Keyboard-only: `Tab` cycles through visible drawer links with visible focus ring.
- Desktop: inline nav remains visible and usable.

- [ ] **Step 9: Commit header implementation slice**

```bash
git add apps/web/src/components/header.tsx
git commit -m "feat(web): add responsive drawer header behavior"
```

### Task 2: Retheme global tokens to cozy moss + cream (light + dark)

**Files:**
- Modify: `packages/ui/src/styles/globals.css`

- [ ] **Step 1: Update semantic tokens in `:root` for cozy light mode**

```css
/* Update: --background, --card, --popover to warm cream family
   Update: --primary/--accent to moss family
   Tune: --muted, --border, --input, --ring for soft separation */

/* Concrete palette map (light / :root) */
--background: oklch(0.97 0.02 95);
--foreground: oklch(0.26 0.03 140);
--card: oklch(0.99 0.01 95);
--card-foreground: oklch(0.26 0.03 140);
--popover: oklch(0.99 0.01 95);
--popover-foreground: oklch(0.26 0.03 140);
--primary: oklch(0.46 0.08 150);
--primary-foreground: oklch(0.97 0.01 95);
--secondary: oklch(0.92 0.02 120);
--secondary-foreground: oklch(0.3 0.03 145);
--muted: oklch(0.93 0.01 105);
--muted-foreground: oklch(0.44 0.03 140);
--accent: oklch(0.88 0.04 140);
--accent-foreground: oklch(0.3 0.03 145);
--border: oklch(0.86 0.02 120);
--input: oklch(0.88 0.02 110);
--ring: oklch(0.6 0.06 150);
```

- [ ] **Step 2: Update semantic tokens in `.dark` for cozy dark mode**

```css
/* Shift dark neutrals toward moss-charcoal while preserving readability
   Keep foreground contrast high; keep border/input/ring distinguishable */

/* Concrete palette map (dark / .dark) */
--background: oklch(0.2 0.02 150);
--foreground: oklch(0.94 0.01 95);
--card: oklch(0.25 0.02 150);
--card-foreground: oklch(0.94 0.01 95);
--popover: oklch(0.24 0.02 150);
--popover-foreground: oklch(0.94 0.01 95);
--primary: oklch(0.72 0.08 145);
--primary-foreground: oklch(0.2 0.02 150);
--secondary: oklch(0.3 0.02 145);
--secondary-foreground: oklch(0.94 0.01 95);
--muted: oklch(0.29 0.01 145);
--muted-foreground: oklch(0.75 0.02 120);
--accent: oklch(0.36 0.04 145);
--accent-foreground: oklch(0.96 0.01 95);
--border: oklch(0.34 0.01 145);
--input: oklch(0.37 0.01 145);
--ring: oklch(0.62 0.06 145);
```

- [ ] **Step 3: Verify all required semantic tokens were updated in both themes**

Required token set:
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--border`, `--input`, `--ring`

Run: `rg --line-number "--(background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|border|input|ring):" packages/ui/src/styles/globals.css`
Expected: each token appears in both `:root` and `.dark` sections with non-default values matching the palette map above.

- [ ] **Step 4: Build web app to verify token changes do not break styles**

Run: `bun --filter web build`
Expected: PASS and emits `dist` assets.

- [ ] **Step 5: Perform manual verification across breakpoints/themes**

Run: `bun dev:web`
Expected checks:
- Mobile: drawer interaction + no horizontal overflow.
- Desktop: inline nav layout remains stable.
- Light/Dark: cozy palette applied globally with readable contrast.

- [ ] **Step 6: Commit token update slice**

```bash
git add packages/ui/src/styles/globals.css
git commit -m "feat(ui): retheme global tokens with cozy moss palette"
```

## Chunk 2: Automated Header Interaction Coverage

### Task 3: Add lightweight web test harness for component interaction tests

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`

- [ ] **Step 1: Add test command entry in web package scripts**

```json
{
  "scripts": {
    "test": "vitest run --passWithNoTests"
  }
}
```

- [ ] **Step 2: Add required dev dependencies for browser-like unit tests**

```json
{
  "devDependencies": {
    "vitest": "^2.1.0",
    "jsdom": "^25.0.1",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.6.3"
  }
}
```

- [ ] **Step 3: Configure Vitest for jsdom and setup file**

```ts
// apps/web/vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})
```

- [ ] **Step 4: Add shared setup for cleanup and matchers**

```ts
// apps/web/src/test/setup.ts
import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

afterEach(() => cleanup())
```

- [ ] **Step 5: Run dependency install + test runner sanity check**

Run: `bun install && bun --filter web test`
Expected: command exits 0 with either no tests or passing tests.

- [ ] **Step 6: Commit test harness setup**

```bash
git add apps/web/package.json apps/web/vitest.config.ts apps/web/src/test/setup.ts bun.lock
git commit -m "test(web): add vitest component test harness"
```

### Task 4: Implement automated mobile drawer behavior tests

**Files:**
- Create: `apps/web/src/components/header.test.tsx`
- Modify (if needed for testability): `apps/web/src/components/header.tsx`

- [ ] **Step 1: Write failing tests for required drawer behavior**

```tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import Header from "./header"

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
}))

afterEach(() => cleanup())

// Requires setup file at src/test/setup.ts importing "@testing-library/jest-dom/vitest"

it("opens mobile drawer from menu button", async () => {
  render(<Header />)
  await userEvent.click(screen.getByRole("button", { name: /open navigation menu/i }))
  expect(screen.getByRole("navigation", { name: /mobile navigation/i })).toBeVisible()
})

it("closes drawer when overlay is clicked", async () => {
  render(<Header />)
  await userEvent.click(screen.getByRole("button", { name: /open navigation menu/i }))
  await userEvent.click(screen.getByTestId("mobile-nav-overlay"))
  expect(screen.queryByRole("navigation", { name: /mobile navigation/i })).not.toBeInTheDocument()
})

it("closes drawer on Escape and returns focus to trigger", async () => {
  render(<Header />)
  const trigger = screen.getByRole("button", { name: /open navigation menu/i })
  await userEvent.click(trigger)
  fireEvent.keyDown(document, { key: "Escape" })
  expect(screen.queryByRole("navigation", { name: /mobile navigation/i })).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

it("closes drawer when a drawer link is selected", async () => {
  render(<Header />)
  await userEvent.click(screen.getByRole("button", { name: /open navigation menu/i }))
  await userEvent.click(screen.getByRole("link", { name: /documents/i }))
  expect(screen.queryByRole("navigation", { name: /mobile navigation/i })).not.toBeInTheDocument()
})

it("moves focus to first drawer link when opened", async () => {
  render(<Header />)
  await userEvent.click(screen.getByRole("button", { name: /open navigation menu/i }))
  expect(screen.getByRole("link", { name: /home/i })).toHaveFocus()
})
```

- [ ] **Step 2: Run focused test file to verify failures**

Run: `bun --filter web test -- src/components/header.test.tsx`
Expected: FAIL initially with assertion mismatches.

- [ ] **Step 3: Make minimal header adjustments needed for deterministic tests**

```tsx
// Add stable labels/roles/test-friendly structure:
// - explicit aria-label on menu trigger
// - deterministic id for drawer container
// - data-testid="mobile-nav-overlay" on overlay element
// - ensure first focusable link ref can be targeted
```

- [ ] **Step 4: Re-run focused header tests until passing**

Run: `bun --filter web test -- src/components/header.test.tsx`
Expected: PASS all header interaction tests (5 passed).

- [ ] **Step 5: Run full web test + typecheck + build verification**

Run: `bun --filter web test && bun --filter web check-types && bun --filter web build`
Expected: all PASS.

- [ ] **Step 6: Commit automated test coverage**

```bash
git add apps/web/src/components/header.test.tsx apps/web/src/components/header.tsx
git commit -m "test(web): cover mobile drawer nav interactions"
```

## Final Verification Checklist

- [ ] Mobile nav uses hamburger trigger and drawer links only.
- [ ] Drawer closes on overlay click, link click, and `Escape`.
- [ ] Focus moves to first drawer link on open and returns to trigger on close.
- [ ] Body scroll locks while drawer is open and unlocks on close.
- [ ] Cozy moss + cream token set is applied in both light and dark themes.
- [ ] `bun --filter web test`, `bun --filter web check-types`, and `bun --filter web build` all pass.
