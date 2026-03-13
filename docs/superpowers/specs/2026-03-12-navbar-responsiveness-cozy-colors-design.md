# Navbar Responsiveness + Cozy Color Refresh Design

## Context

The web app currently uses a simple horizontal header navigation in `apps/web/src/components/header.tsx` and neutral global theme tokens in `packages/ui/src/styles/globals.css`. The requested update is to make the navbar more responsive and shift application colors toward a cozy moss + cream aesthetic, applied to both light and dark themes.

Decisions confirmed during brainstorming:

- Mobile navigation pattern: hamburger menu with drawer.
- Palette direction: soft moss + cream.
- Theme scope: apply cozy direction to both light and dark themes.
- Styling scope: global token retheme plus targeted polish for key surfaces.
- Implementation approach: token-first with minimal component-level polish.

## Goals

- Improve navigation usability on small screens without changing route structure.
- Establish a cozy, warmer visual tone across the app by updating semantic tokens.
- Keep changes maintainable by favoring shared token updates over one-off overrides.

## Non-Goals

- No backend or API changes.
- No route/content changes.
- No broad page-by-page redesign.

## Proposed Architecture

### 1) Responsive Header Pattern

Update `apps/web/src/components/header.tsx` to support two navigation layouts:

- Desktop and tablet (`md` and above): retain inline nav links with minor spacing/visual polish.
- Mobile (`<md`): replace inline link row with a menu button that opens a drawer containing links only.

Component behavior:

- Local state `isMenuOpen` controls drawer visibility.
- Menu button toggles drawer.
- Overlay click closes drawer.
- Selecting any link closes drawer.

### 2) Global Cozy Token Refresh

Update semantic color tokens in `packages/ui/src/styles/globals.css` for both `:root` and `.dark`.

Primary targets:

- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--border`, `--input`, `--ring`

Token strategy:

- Light mode favors cream backgrounds and muted moss accents.
- Dark mode keeps contrast/readability but shifts away from stark neutral gray toward deeper moss-charcoal and warm neutrals.
- Keep semantic meaning stable so existing components inherit styling without refactors.

### 3) Targeted Surface Polish

Apply minimal targeted styling where token inheritance alone is not enough. Scope is strictly limited to `apps/web/src/components/header.tsx` class updates and does not include editing other route or shared component files.

- Header container background/border tint for clearer hierarchy.
- Nav link hover/active treatment aligned to cozy accent tones.
- Drawer panel and overlay styling for usability and visual consistency.
- Small-screen spacing refinements only for header internals (trigger, row height, drawer link spacing).

## Interaction and Accessibility

Drawer/menu a11y requirements:

- Menu trigger includes `aria-expanded`, `aria-controls`, and descriptive label.
- Drawer is marked as navigation region and keeps clear focus states.
- Keyboard users can tab through visible menu items.
- Pressing `Escape` closes the drawer.
- On open, keyboard focus moves to the first drawer link.
- On close, keyboard focus returns to the menu trigger.
- While drawer is open, page scroll is locked to reduce background interaction.
- Contrast must remain readable in both themes.

Failure tolerance:

- Links remain standard router links and continue navigating normally.
- If drawer state logic fails, no data loss or blocking side effects occur.

## Data Flow and State

- No server state changes.
- No query/mutation changes.
- Single local UI state (`isMenuOpen`) in header controls mobile drawer visibility.

## Verification Plan

### Automated checks

- Run web app typecheck/build to verify no compile regressions.
- Add/update one automated UI test (component or integration) that verifies: mobile menu opens, `Escape` closes it, and selecting a drawer link closes it.

### Manual checks

- Mobile viewport:
  - Menu button visible and inline link row hidden.
  - Drawer opens/closes via trigger and overlay.
  - Tapping link navigates and closes drawer.
  - No horizontal overflow/clipping.
- Desktop viewport:
  - Inline nav remains visible and aligned.
  - Controls retain expected position.
- Themes:
  - Light and dark both reflect cozy palette direction.
  - Surface separation and text contrast remain clear.

## Risks and Mitigations

- Risk: dark mode could become too low contrast after warming tones.
  - Mitigation: validate contrast manually and adjust foreground/muted/border tokens conservatively.
- Risk: drawer styling may clash with inherited utilities.
  - Mitigation: keep classes local to header and rely on existing utility conventions.

## Rollout Scope

Files expected to change:

- `apps/web/src/components/header.tsx`
- `packages/ui/src/styles/globals.css`

Out of scope for this spec:

- App-shell or route-specific visual tweaks outside `header.tsx` and global tokens.
- Any additional component-level polish beyond header/drawer surfaces.
