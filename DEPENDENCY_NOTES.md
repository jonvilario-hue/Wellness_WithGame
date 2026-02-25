## React Three Fiber / Drei Compatibility
- React 19 requires @react-three/fiber v9.
- @react-three/drei may lag behind in its peer dependency declarations, causing installation failures.
- The `overrides` field in `package.json` is used to force a compatible resolution and bypass the peer dependency check.
- If upgrading @react-three/drei in the future, first attempt to remove the overrides and test all spatial renderers before committing the change.
- Last verified working: 2024-07-29, drei v9.109.2, fiber v9.0.0-beta.23, React v19.2.1
