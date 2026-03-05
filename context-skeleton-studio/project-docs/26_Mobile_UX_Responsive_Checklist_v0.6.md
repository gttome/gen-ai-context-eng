# Mobile UX / Responsive Checklist — Context Skeleton Studio

## Version
- **Version:** v0.6.0
- **Date:** 2026-02-25

## How to use
Use this checklist during any UI change and before calling a release “ready”.
If something fails, capture:
- device/viewport
- steps to reproduce
- screenshot (optional)
Then log it in the backlog.

---

## A) Reflow & Layout
- [ ] No horizontal scroll in standard UI on phone portrait
- [ ] Content reflows cleanly on narrow screens (no clipped panels)
- [ ] Phone landscape remains usable (no trapped/hidden primary actions)
- [ ] Resized desktop window remains usable
- [ ] Header controls wrap cleanly (theme + help/feedback links do not overflow)

## B) Touch Usability
- [ ] Primary controls are easy to tap (no precision tapping required)
- [ ] Controls are not too close together (no accidental taps)
- [ ] Any gesture behavior is optional (not required to complete core flow)

## C) Keyboard & Focus (Cross-device)
- [ ] All interactive controls are reachable by keyboard
- [ ] Visible focus indicator is clear on all controls (buttons, links, selects)
- [ ] Focus order is logical (top-to-bottom / left-to-right)
- [ ] No keyboard trap

## D) Hover / Pointer Independence
- [ ] No core action requires hover
- [ ] Hover styles (if any) are enhancement only and degrade gracefully on touch

## E) Readability, Theme, & Accessibility
- [ ] Text remains readable on phone portrait
- [ ] Contrast appears acceptable in **both** Light and Dark themes
- [ ] Focus outlines are visible in both themes
- [ ] Zoom works (no zoom-disabling viewport settings)
- [ ] Form controls have labels/accessible names
- [ ] Theme toggle is reachable and tappable

## F) Mobile Browser/Viewport Robustness
- [ ] Viewport meta tag present and correct
- [ ] App remains usable when the on-screen keyboard opens (textareas)
- [ ] Orientation change does not break UI state

## G) Performance & Responsiveness (Lightweight)
- [ ] Initial load feels acceptable on phone-sized viewport
- [ ] Interactions feel responsive (no obvious lag on core flows)
