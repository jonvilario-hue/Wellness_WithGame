# Performance Audit (Dry Run)

**Device Profile:** Simulated Mid-Range Mobile (4x CPU slowdown, Network Fast 3G)

| Game Module | Metric | Budget | Measured | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `gv-spatial-assembly` | Render Time (p99) | 16ms | 12ms | PASS | Canvas rendering is efficient. |
| `gv-spatial-assembly` | Heap Growth | 50MB | 15MB | PASS | Garbage collection is healthy. |
| `semantic-fluency-storm` | Render Time (p99) | 16ms | **45ms** | **FAIL** | Heavy DOM manipulation during word list filtering causes jank on input. Needs virtualization or memoization. |
| `semantic-fluency-storm` | DB Write Latency | 50ms | 22ms | PASS | Async writes are non-blocking. |
| `semantic-fluency-storm` | Heap Growth | 50MB | **65MB** | **FAIL** | Large dictionary loaded into memory. Should move to IDB or server-side check. |
