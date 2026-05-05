# Accessibility Improvements - StandUp Tracker

## Overview
This document outlines the comprehensive accessibility improvements made to the StandUp Tracker application to ensure full compatibility with screen readers (particularly VoiceOver) and compliance with WCAG 2.1 Level AA standards.

## Branch
`accessibility-improvements`

## Critical Issues Fixed

### 1. **Semantic HTML & Landmark Regions**
#### Problem
- Missing proper HTML5 semantic elements
- No `<main>` landmarks
- Lack of skip navigation links
- No proper `<nav>` elements

#### Solution
- **Layout.tsx**: Added skip navigation link that appears on focus
- **Dashboard.tsx**: Added proper `<main>` landmark with `role="main"` and `aria-label`
- **Header.tsx**: Added `<nav>` element with `aria-label="Main navigation"`
- **LandingPage.tsx**: Added semantic `<main>` element with proper role

### 2. **Heading Hierarchy**
#### Problem
- Dashboard started with `<h2>` instead of `<h1>`
- Missing heading structure in sections

#### Solution
- **Dashboard.tsx**: Changed primary heading to `<h1>`
- Added screen reader-only `<h2>` headings for each section:
  - "Repository Selection"
  - "Create Standup Note"
  - "Standup Note History"
- **LandingPage.tsx**: Properly structured with `<h1>` and hidden `<h2>` for sections

### 3. **Screen Reader Announcements (ARIA Live Regions)**
#### Problem
- Dynamic content updates not announced to screen readers
- No feedback when commits are loaded or selected
- Loading and error states not properly announced

#### Solution
- **StandupForm.tsx**: Added `aria-live="polite"` and `aria-atomic="true"` to:
  - Commit count status
  - Date range information
  - Submit button states
- **StandupHistory.tsx**: Added `role="status"` and `aria-live="polite"` to:
  - Loading state with descriptive text
  - Error states with `role="alert"` and `aria-live="assertive"`
  - Note count display
- **RepoSelector.tsx**: Added `role="status"` and `aria-live="polite"` to branch fetching message

### 4. **Form Accessibility**
#### Problem
- Missing fieldset/legend for grouped form controls
- Inadequate labels for some inputs
- No ARIA labels for complex interactions

#### Solution
- **StandupForm.tsx**:
  - Wrapped date range controls in `<fieldset>` with proper `<legend>`
  - Added `<fieldset>` for sort order radio button group
  - Added explicit `aria-label` attributes to all date inputs
  - Added `role="group"` with `aria-label` for button groups
  - All form inputs now have proper `htmlFor` associations

- **RepoSelector.tsx**:
  - Added proper `id` and `htmlFor` associations for select elements
  - Added `aria-label` to SelectTrigger elements
  - Added `aria-busy` state for loading branches

### 5. **Icons & Decorative Elements**
#### Problem
- Icons used decoratively not hidden from screen readers
- Icons conveying meaning without text alternatives

#### Solution
- Added `aria-hidden="true"` to all decorative icons:
  - GitCommit, GitFork, GitBranch, Calendar icons
  - Loading spinners (Loader2)
  - Checkmarks and other visual indicators
  
- **Header.tsx**: Made user avatar decorative with `aria-hidden="true"`
- **LandingPage.tsx**: Added `aria-label="GitHub logo"` to GitHub icon SVG

### 6. **Interactive Elements**
#### Problem
- Clickable cards without proper keyboard support
- Toggle buttons without `aria-pressed` state
- Missing button labels

#### Solution
- **StandupHistory.tsx**:
  - Already had good keyboard support (Enter/Space)
  - Changed `role="button"` to `role="listitem"` within proper list structure
  - Each card has comprehensive `aria-label` describing content
  - Added `role="list"` wrapper

- **StandupForm.tsx**:
  - Added `aria-pressed` to sort order toggle buttons
  - Added descriptive `aria-label` to all action buttons
  - Checkbox labels now include commit SHA and message
  - Accordion items have descriptive labels for each day

### 7. **Accordion/Collapsible Content**
#### Problem
- Accordion content might not be properly announced
- Day groupings lack context

#### Solution
- **StandupForm.tsx**:
  - Added `aria-label` to ScrollArea containing commit list
  - Each AccordionItem has `aria-label` with formatted date
  - Commit list within accordion has `role="list"` and `aria-label`
  - Each commit has `role="listitem"`
  - Button to select/deselect day has descriptive `aria-label`

### 8. **Navigation & Focus Management**
#### Problem
- No skip navigation
- Missing focus styles could make keyboard navigation difficult

#### Solution
- **Layout.tsx**: Added skip navigation link with proper focus styles
- All interactive elements maintain focus indicators through Tailwind classes
- Focus ring visible on keyboard navigation

### 9. **Loading & Status States**
#### Problem
- Loading spinners not announced
- No indication of processing states

#### Solution
- **All Components**:
  - Loading states have `role="status"` and descriptive `aria-label`
  - Error states use `role="alert"` for immediate announcement
  - Empty states use `role="status"`

### 10. **Region Labels & Structure**
#### Problem
- Sections lacked proper labeling
- Groups of content not identified

#### Solution
- **Dashboard.tsx**: Each major section has `aria-labelledby` pointing to heading
- **StandupForm.tsx**: Card has `role="region"` with `aria-labelledby`
- **StandupHistory.tsx**: Container has `role="region"` with proper heading reference
- **RepoSelector.tsx**: Card has `role="region"` with hidden heading

## CSS Additions

### Screen Reader Utilities
Added to [src/index.css](src/index.css):
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.not-sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Files Modified

1. **src/index.css** - Added screen reader utility classes, WCAG-compliant color tokens
2. **src/components/Layout.tsx** - Skip navigation, semantic structure
3. **src/components/Dashboard.tsx** - Heading hierarchy, landmarks, sections
4. **src/components/Header.tsx** - Navigation landmark, aria labels
5. **src/components/LandingPage.tsx** - Semantic HTML, sections, icon labels
6. **src/components/RepoSelector.tsx** - Form labels, aria attributes, live regions
7. **src/components/StandupForm.tsx** - Extensive form accessibility, fieldsets, aria labels, live regions
8. **src/components/StandupHistory.tsx** - List semantics, status announcements, better role usage
9. **src/components/StandupDetail.tsx** - Complete rebuild: removed Card/section wrappers, flattened structure, direct h1/h2 hierarchy, simplified prose containers for full VoiceOver cursor access
10. **All component files** - Updated to use WCAG-compliant color tokens

## WCAG 1.4.3 Color Contrast Compliance

### Problem
The original color tokens failed WCAG AA contrast requirements (4.5:1 minimum for normal text):
- `--text-muted` (mauve-9: #6f6d78) - Only 3.6:1 contrast ❌
- `--text-subtle` (mauve-10: #7c7a85) - Only 4.3:1 contrast ❌

WCAG 1.4.3 is the **most frequently violated** accessibility guideline.

### Solution
Consolidated to WCAG-compliant Radix Colors only:
- `--foreground` (mauve-12: #eeeef0) - ~16:1 contrast ✅
- `--foreground-muted` (mauve-11: #9f9ba8) - ~7:1 contrast ✅

### Token Naming Convention Update
Updated from awkward `text-text-*` pattern to industry-standard `text-foreground` pattern:

**Before:**
```css
--text-default: var(--mauve-12);
--text-soft: var(--mauve-11);
```
Usage: `text-text`, `text-text-soft` (awkward double "text")

**After:**
```css
--foreground: var(--mauve-12);
--foreground-muted: var(--mauve-11);
```
Usage: `text-foreground`, `text-foreground-muted` (follows Shadcn/Radix UI pattern)

### UI Element Tokens
Non-text UI elements (borders, disabled states) now use:
- `--ui-muted` (mauve-9) - For borders and disabled states only
- `--ui-subtle` (mauve-10) - For subtle UI elements only

These should **never** be used for readable text.

## Testing Recommendations

### Important: VoiceOver Cursor vs Tab Navigation
**VoiceOver Cursor** (`Ctrl + Option + Arrow Keys`): Tests ALL content including headings, paragraphs, and static text. This is the comprehensive screen reader test and was used to validate all improvements.

**Tab Navigation**: Only tests interactive elements (buttons, links, form fields). Useful for keyboard accessibility but doesn't test if all content is readable by screen readers.

### VoiceOver (macOS)
1. Enable VoiceOver: `Cmd + F5`
2. **VoiceOver Cursor Navigation** (Comprehensive Testing):
   - Use `Ctrl + Option + Arrow Keys` to navigate through ALL content in reading order
   - This tests the VoiceOver cursor, not just tab-able elements
   - Ensures ALL text, headings, and content are accessible
   - Verifies correct reading order and that no content is skipped
3. Test skip navigation: `Tab` to first element, should announce skip link
4. Navigate through form: All fields should be announced with labels
5. Test accordion: Should announce day and commit count
6. Test commit selection: Each checkbox should announce commit message
7. Navigate standup history: Each item should announce date, commit count, and blocker status
8. **StandupDetail page**: 
   - Verify date (h1) is read first
   - Commit count and repository name announced
   - All section headings (h2) are readable
   - Work completed/planned/blockers content is fully accessible
   - Commits accordion and individual commit messages are navigable

### Keyboard Navigation
1. `Tab` through all interactive elements
2. `Enter` and `Space` should activate buttons and links
3. Arrow keys should work in dropdowns
4. `Escape` should close dialogs/dropdowns

### Screen Reader Checklist
- ✅ All images have alt text or are decoratively hidden
- ✅ All form inputs have associated labels
- ✅ All buttons have accessible names
- ✅ Heading hierarchy is logical (h1 → h2 → h3)
- ✅ Landmarks properly identify page regions
- ✅ Dynamic content updates are announced
- ✅ Loading and error states are announced
- ✅ Keyboard navigation is fully functional
- ✅ Focus indicators are visible
- ✅ Color is not the only means of conveying information

## WCAG 2.1 Compliance

These changes address the following WCAG criteria:

- **1.1.1 Non-text Content** (Level A) - All icons properly handled
- **1.3.1 Info and Relationships** (Level A) - Proper semantic structure
- **1.3.2 Meaningful Sequence** (Level A) - Logical heading hierarchy
- **1.4.3 Contrast (Minimum)** (Level AA) - All text meets 4.5:1 contrast ratio ✅
- **2.1.1 Keyboard** (Level A) - Full keyboard accessibility
- **2.4.1 Bypass Blocks** (Level A) - Skip navigation implemented
- **2.4.2 Page Titled** (Level A) - Proper page structure
- **2.4.3 Focus Order** (Level A) - Logical tab order maintained
- **2.4.6 Headings and Labels** (Level AA) - Descriptive labels throughout
- **3.2.4 Consistent Identification** (Level AA) - Consistent patterns
- **4.1.2 Name, Role, Value** (Level A) - All elements properly identified
- **4.1.3 Status Messages** (Level AA) - Live regions for status updates

## Testing Strategy

### Philosophy

WCAG compliance is the floor, not the ceiling. A product can pass every automated check and still be unusable by a screen reader user. Disabled people know what they need; their feedback takes priority over any checklist.

We test in two layers. Automated tools (axe) catch structural problems fast: missing labels, bad contrast, broken ARIA roles. They catch roughly 25 to 40 percent of real issues. The remaining 60 to 75 percent are behavioral: does focus land in the right place? Are errors announced? Can a keyboard user complete the task without a mouse? Those require explicit tests.

### Test Organization

Tests live in `e2e/a11y/` and are organized by component surface, not by WCAG criterion. This makes it easier to find tests when you change a component, and it makes failures obvious: a broken test in `standup-form.a11y.spec.ts` points directly at the form.

| File | Surface |
| --- | --- |
| `landing.a11y.spec.ts` | Landing page |
| `dashboard.a11y.spec.ts` | Dashboard layout, skip link, route focus |
| `standup-form.a11y.spec.ts` | Standup creation form |
| `standup-history.a11y.spec.ts` | History card list |
| `standup-detail.a11y.spec.ts` | Standup detail view |
| `task-picker.a11y.spec.ts` | Task linking dialog |
| `toasts.a11y.spec.ts` | Toast live regions |

### Priority Order

We apply an 80/20 approach. The issues that affect the most people most severely come first.

1. **Focus management** (affects all keyboard and screen reader users): dialog open/close, route transitions, error states
2. **Form error announcements** (affects all screen reader users on form pages): `aria-invalid`, `aria-describedby`, live regions on submit
3. **Skip links** (affects all keyboard users on every page): must be the first Tab stop and must actually move focus
4. **Live regions** (affects screen reader users on async operations): toasts, submission state, loading states
5. **Structural semantics** (affects screen reader navigation): landmarks, heading hierarchy, list roles

### What Automated Tools Miss

Axe cannot test whether:
- Focus lands in a modal when it opens
- Focus returns to the trigger when a modal closes
- The Tab key is trapped inside a dialog
- An error message is actually linked to its input via `aria-describedby`
- A toast fires after its container exists (live region pre-existence rule)
- A route transition moves focus to the new content area

Every item in this list has a manual test in the suite above.

### Running the Suite

```bash
# All a11y tests in headed Chromium
npx playwright test e2e/a11y/ --project=chromium

# Single surface
npx playwright test e2e/a11y/standup-form.a11y.spec.ts --project=chromium
```

## Next Steps

1. **Manual Testing**: Test with actual screen reader users on VoiceOver and NVDA
2. **User Feedback**: Gather feedback from disabled users; treat it as higher priority than automated results
3. **Automated Testing**: Run axe DevTools or WAVE for spot-checking outside the test suite
4. **Maintenance**: Run the a11y suite on every PR; regressions in focus management are as critical as functional regressions

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [A11Y Project Checklist](https://www.a11yproject.com/checklist/)
