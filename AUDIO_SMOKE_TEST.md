# Audio Engine Smoke Test Checklist

This document outlines the manual verification steps required to confirm the sample-first AudioEngine is functioning correctly across all game modes.

## SETUP

- [ ] **Firebase Storage Bucket:** N/A (Using `/public` folder for now).
- [ ] **CORS Configuration:** N/A (Using `/public` folder for now).
- [ ] **Manifest Uploaded:** Verify `public/audio-assets/manifest.json` exists and is populated.
- [ ] **Placeholder Assets:** Verify placeholder audio files (or real ones) exist for all manifest entries in the `public/audio-assets/` directory.

---

## PER-MODE VERIFICATION (Repeat for each game)

### Game: Ga (Auditory Processing)

- [ ] Navigate to the (Ga) Auditory Processing Lab game.
- [ ] Select the 'Music' focus tab.
- [ ] **AudioLoadingScreen:** This screen is not yet implemented. Verify the game loads directly.
- [ ] **AudioGate:** On first load, an "Enable Audio" button should appear. Click it. The game should start.
- [ ] **Stimulus Plays:** Two tones play sequentially. You should be able to hear them.
- [ ] **AudioVisualizer:** This component is not yet integrated.
- [ ] **Response UI:** "Lower" and "Higher" buttons appear and are clickable.
- [ ] **Submit Response:** Clicking a button gives "Correct!" or "Incorrect." feedback.
- [ ] **Next Round:** The game automatically proceeds to the next trial after feedback. Difficulty should adjust (visible in the top right).
- [ ] **Navigate Away:** Navigate back to the dashboard. All audio from the game should stop immediately.
- [ ] **Return:** Navigate back to the game. It should start fresh from the "Enable Audio" or "Start Session" screen.
- [ ] **Console Check:** Open the dev console. Look for `[AudioEngine] Playing sample: ...` messages. There should be no "PLACEHOLDER" warnings for `piano-C4` or other notes if assets are present.

### Game: Gf, Gc, Gv, Ge, Gq, Glr, EF

- [ ] Navigate to the game page.
- [ ] Select the 'Music' or 'Verbal' focus tab (or any that uses audio).
- [ ] **AudioLoadingScreen:** N/A.
- [ ] **AudioGate:** Should appear if this is the first audio interaction of the session.
- [ ] **Stimulus Plays:** Verify the correct auditory stimulus for that game mode plays.
- [ ] **AudioVisualizer:** N/A.
- [ ] **Response & Cleanup:** Run through the same checks as the 'Ga' game (Response UI, Submit, Next Round, Navigate Away, Console Check).

---

## CROSS-CUTTING TESTS

- [ ] **Rapid Mode Switching:** Quickly navigate between the 'Ga', 'Gv', and 'Gwm' game pages. Verify that audio from the previous game does not "leak" into the next.
- [ ] **Multiple Tabs:** Open the 'Ga' game in two separate browser tabs. Start a session in each. Verify that the audio from one tab does not interfere with the other.
- [ ] **Network Offline Test:**
    - [ ] Open DevTools and go to the "Network" tab. Select the "Offline" preset.
    - [ ] Refresh the 'Ga' game page.
    - [ ] The game should still load. When you start a trial, check the console for `[AudioEngine] WARN: Asset ... not found in cache during offline mode. Using fallback.`
    - [ ] Verify you hear synthesized fallback tones instead of real samples.
- [ ] **Network Re-enabled Test:**
    - [ ] With the game still open, switch the network back to "No throttling" in DevTools.
    - [ ] Start a new session or proceed to the next trial.
    - [ ] Verify that real assets are now loaded and played (check console for `Playing sample` messages).
- [ ] **Mobile Test:**
    - [ ] Open the site on a mobile device.
    - [ ] Navigate to the 'Ga' game.
    - [ ] Verify the "Tap to enable audio" (AudioGate) screen appears and works correctly on the first tap.
- [ ] **Headphones Test:**
    - [ ] Use headphones and navigate to the `Gv` (Visual Processing) game's future auditory mode. For now, this can be simulated by calling a spatial audio method from the console. Verify sounds pan correctly from left to right.
- [ ] **No Headphones Test:**
    - [ ] Verify the spatial audio is still perceivable (though less precise) through stereo speakers.

---

## ASSET PIPELINE VERIFICATION

- [ ] **Replace Asset:** In the `public/audio-assets/tones/piano` folder, replace `C3.mp3` with a distinctly different sound file (e.g., a voice recording named `C3.mp3`).
- [ ] **Verify Change:** Clear browser cache and reload the 'Ga' game. When a C3 tone is supposed to play, you should now hear your replacement audio. This confirms the pipeline is working.
- [ ] **Cache Test:** After running a few trials, go to DevTools -> Application -> Cache Storage. Verify that `audio-assets-v1` contains entries for the loaded audio files. Clear this cache and reload the page; assets should be re-downloaded.
- [ ] **Memory Test:** After playing ~20 rounds of various games, open the DevTools "Memory" tab and take a heap snapshot. The memory usage should be stable and not show continuous growth, indicating that old audio buffers are being released.
