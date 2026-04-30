# Radix Dialog Focus Return Requires a Trigger Reference

## One-liner

Radix only returns focus when the dialog closes if it knows what opened it. Opening a dialog imperatively via `useState` bypasses Radix's trigger tracking entirely, leaving keyboard users with no idea where they are after the dialog closes.

## Why this matters

When a modal dialog closes, WCAG 2.4.3 requires focus to return to a logical place in the page, almost always the element that triggered the dialog. Without this, a keyboard user who opened a dialog is left with focus on `document.body` after it closes and has to start navigating from scratch. Screen reader users get no orientation signal at all.

---

## CARL

**Context**

The task picker dialog in `TaskLinking.tsx` was opened imperatively: a "Link Issue" button called `openPicker()` which set `showPicker: true` in `useTaskLinking`. The dialog rendered as `<Dialog open={showPicker} onOpenChange={closePicker}>` with no `<DialogTrigger>`. Two Playwright tests failed: focus did not return to the "Link Issue" button after ESC or after clicking close.

A separate clipboard fallback dialog in `CopyButtons.tsx` had the same structural problem. It opened when `navigator.clipboard.writeText` threw, set via `useState`, and had no trigger reference.

**Action**

For the task picker: removed `showPicker`, `openPicker`, and `closePicker` from `useTaskLinking` entirely. Dialog open state moved into `TaskLinkingSection` as `const [pickerOpen, setPickerOpen] = useState(false)`. The "Link Issue" button was wrapped in `<DialogTrigger asChild>`, and the `<Dialog>` was lifted to wrap both the trigger and the dialog content. Radix now holds a ref to the trigger and restores focus automatically on close. The `addFromSearch` call closes the dialog via `mutate(task, { onSuccess: () => setPickerOpen(false) })` rather than through hook state.

For the clipboard fallback: `DialogTrigger` does not apply here because the dialog is a programmatic error recovery flow, not a user-initiated open action. The fix was `onCloseAutoFocus` on `<DialogContent>`. A `useRef` was attached to the Copy dropdown trigger button. On close: `e.preventDefault()` suppresses Radix's default behavior (which would focus `document.body`), then `triggerRef.current?.focus()` explicitly returns focus to the trigger. The `?.` is optional chaining, a null guard in case the ref has not yet attached.

**Result**

All 10 task picker a11y tests pass. The `CopyButtons` fix is not covered by an automated test because the clipboard failure path requires mocking the clipboard API, but the behavior is correct.

---

**Learning**

- Radix `Dialog` only restores focus automatically when the dialog was opened via `<DialogTrigger>`. That is how Radix stores the trigger ref internally. Bypassing the trigger with imperative state means Radix has nothing to return focus to.
- The fix for a dialog with a clear trigger: use `<DialogTrigger asChild>`. The dialog can still be controlled via `open` and `onOpenChange` state alongside it.
- The fix for a dialog with no trigger (error recovery, programmatic open): use `onCloseAutoFocus` on `<DialogContent>`. Call `e.preventDefault()` to suppress Radix's body-focus default, then manually focus the element that should receive focus.
- UI open state does not belong in a data hook. Moving `showPicker` out of `useTaskLinking` and into the component made the Radix-correct structure possible and made the hook's responsibilities clearer.
- `?.` in `triggerRef.current?.focus()` is a null guard, not a focus-state check. It means "call .focus() only if current is not null or undefined."
