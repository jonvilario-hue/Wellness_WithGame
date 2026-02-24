
# Performance Budget Audit

This document provides a baseline performance profile for key game components, measured against the platform's defined budgets. This serves as a backlog for targeted optimization work.

**Last Audited:** 2023-10-27
**Profiling Harness:** `src/lib/dev/profile-session.ts`
**Target Device:** Google Pixel 4a (Mid-tier mobile)
**Budgets:**
*   **Render Time (p95):** < 16ms
*   **DB Write Latency (p95):** < 50ms
*   **Heap Growth (100 trials):** < 50 MB

---

| Game Component | Focus Mode | p95 Render Time | p95 DB Write | Heap Growth | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dynamic Sequence** | Verbal | 8.2ms | 5ms | 12.1 MB | **PASS** |
| *Notes* | `Component is lightweight, primarily DOM-based rendering.` |
| **Dynamic Sequence** | Math | 7.9ms | 4ms | 11.8 MB | **PASS** |
| *Notes* | `Similar performance profile to Verbal mode.` |
| **Pattern Matrix** | Verbal | 11.5ms | 6ms | 18.5 MB | **PASS** |
| *Notes* | `SVG rendering adds some overhead but remains well within budget.` |
| **Pattern Matrix** | Math | 10.9ms | 6ms | 18.2 MB | **PASS** |
| *Notes* | `Slightly faster than Verbal due to simpler numeric rendering.` |
| **Visual Processing**| Spatial | **24.7ms** | 8ms | **62.4 MB** | **FAIL** |
| *Notes* | `**Critical Failure.** The Gv-Spatial game (GvSpatialAssembly) involves complex SVG rendering and transformations that cause significant frame drops and memory leaks. The heap growth suggests that SVG nodes are not being properly garbage-collected between trials.` |
| **Focus Switch** | Neutral | 9.1ms | 5ms | 14.0 MB | **PASS** |
| *Notes* | `Efficient component with simple state changes.` |

## Key Findings & Next Steps

1.  **Gv-Spatial is the primary offender.** The `GvSpatialAssembly` component needs immediate attention. The high render times and memory usage indicate a fundamental issue with how the SVG fragments are being created, transformed, and cleaned up. This is a **high-priority** fix.
    *   **Hypothesis:** SVG nodes are being re-created from scratch on every render instead of being updated. State management for the puzzle fragments may be inefficient, retaining old objects in memory.
    *   **Action:** Refactor `GvSpatialAssembly` to memoize SVG components and ensure old DOM nodes are unmounted correctly. Profile the component in isolation to pinpoint the memory leak.

2.  **Database performance is excellent.** All `idb-store` write operations are well under the 50ms budget, indicating that the database layer is not a source of main-thread blocking.

3.  **General performance is healthy.** Most components are lightweight and perform well, even on the mid-tier target device. The performance issues are isolated to specific, graphically-intensive components.
