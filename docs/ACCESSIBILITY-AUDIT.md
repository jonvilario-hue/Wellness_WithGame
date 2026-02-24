
# Accessibility Baseline Audit

This document contains a baseline audit of the accessibility (a11y) characteristics of the platform's game components. The goal is to identify common failure patterns and create a backlog for an accessibility-focused engineering sprint.

**Last Audited:** 2023-10-27
**Tooling:** Manual review (keyboard navigation, screen reader simulation), Axe DevTools (browser extension).

| Game Component | File Path | Focus Mgmt | Keyboard Nav | Screen Reader | Color Contrast | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pattern Matrix** | `src/components/training/gf/pattern-matrix.tsx` | **FAIL** | **FAIL** | **FAIL** | PASS | **Major Issues** |
| *Notes* | `Focus is not moved to the answer grid when a trial begins. Keyboard users cannot select an answer. Options are buttons without descriptive aria-labels, so a screen reader just says "button".` |
| **Dynamic Sequence** | `src/components/training/gwm/dynamic-sequence-transformer.tsx`| **FAIL** | PASS | **FAIL** | PASS | **Major Issues** |
| *Notes* | `Focus is not moved to the input field when the answering phase begins. The sequence display is not announced to screen readers.` |
| **Rapid Code Match** | `src/components/training/gs/rapid-code-match.tsx` | N/A | **FAIL** | **FAIL** | PASS | **Critical Issues** |
| *Notes* | `The primary interaction is mouse-based. There is no keyboard alternative for selecting the digit, making the game completely unusable for keyboard-only users.` |
| **Verbal Inference** | `src/components/training/gc/verbal-inference-builder.tsx`| PASS | PASS | PASS | PASS | **Minor Issues** |
| *Notes* | `This component is mostly accessible due to relying on standard button elements. However, the feedback message is not programmatically announced.` |
| **Visual Processing** | `src/components/training/gv/visual-processing-router.tsx`| **FAIL** | **FAIL** | **FAIL** | **FAIL** | **Critical Issues**|
| *Notes* | `Games like Mental Rotation rely entirely on visual information with no text alternative. Buttons are not keyboard navigable. Color is used as the primary indicator of correctness in some feedback.` |

## Key Findings & Next Steps

1.  **Focus Management is a platform-wide issue.** Nearly all games fail to manage focus appropriately when a new trial begins, requiring mouse interaction to proceed. This is the highest priority fix.
2.  **Keyboard Navigation is inconsistent.** Games relying on standard `Button` components are generally navigable, but games with custom grid or clickable-div interactions are not.
3.  **Semantic HTML & ARIA attributes are missing.** Many components use `div`s with `onClick` handlers instead of semantic `<button>` elements, and lack `aria-label` attributes to describe non-textual content, making them opaque to screen readers.
4.  **Color should not be the only feedback.** The use of green/red for correct/incorrect must be supplemented with icons and text that can be announced by assistive tech.

This audit provides a clear backlog for a dedicated accessibility sprint.
