# Accessibility Audit (Baseline)

| Component | Issue | Severity | Proposed Fix |
| :--- | :--- | :--- | :--- |
| `gv-spatial-assembly.tsx` | Draggable shapes lack keyboard support. Users cannot move shapes without a mouse/touch. | **Critical** | Implement `onKeyDown` handlers (Arrow keys) for selected shapes. Add instructions for keyboard usage. |
| `visual-music-match.tsx` | Color matching relies solely on Red/Green distinction for feedback. | **Major** | Add checkmark/X icons and distinct sound cues for success/failure states. |
| `semantic-fluency-storm.tsx` | The countdown timer updates every second but does not announce time remaining to screen readers until 0. | **Minor** | Add `aria-live="polite"` to a hidden container that announces "30 seconds remaining", "10 seconds remaining". |
| `dynamic-sequence-transformer.tsx` | Focus is lost when the sequence finishes and the input field appears. | **Major** | Manually shift focus (`inputRef.current.focus()`) to the answer field immediately after the sequence animation completes. |
| `shared/game-error-boundary.tsx` | The error icon is purely decorative but not hidden from screen readers. | **Minor** | Add `aria-hidden="true"` to the SVG icon. |
