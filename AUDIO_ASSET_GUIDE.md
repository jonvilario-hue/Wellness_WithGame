# Audio Asset Contribution Guide

This guide outlines the process for recording, formatting, and uploading audio assets to the Cognitive Crucible project. Adherence to these specifications is crucial for ensuring a consistent and high-quality auditory experience.

## 1. Recording Specifications

- **Format:** MP3
- **Bitrate:** 128kbps Constant Bit Rate (CBR)
- **Sample Rate:** 44.1kHz
- **Channels:** Mono (for both speech and individual instruments)
- **Normalization:** All audio should be normalized to have a peak amplitude of **-3dBFS**. This prevents clipping and ensures consistent volume across all assets.
- **Silence:** Trim leading and trailing silence to be no more than 50ms.

## 2. Naming Convention

All asset file names must follow the convention: `{category}-{subcategory}-{id_or_name}.mp3`

**Examples:**
- `tones-piano-C3.mp3`
- `speech-words-en-apple.mp3`
- `emotions-vocalizations-laugh-01.mp3`
- `noise-babble-01.mp3`

## 3. Speech Recording Guide (for Gc and Ge modes)

This is the most critical asset category. Quality and consistency are paramount.

### Technical Setup
- **Environment:** Use a quiet room with minimal echo or background noise.
- **Microphone:** Use a quality condenser microphone with a pop filter.
- **Distance:** Maintain a consistent distance of 6-8 inches from the microphone.

### Sentences to Record
The following sentences need to be recorded by at least 3 distinct voice actors (ideally male, female, and one other) in **all 8 emotional variants**.

**Sentence List:**
1. "The book is on the table."
2. "I'll be there soon."
3. "She didn't know what to do."
4. "We need to finish this by five."
5. "That's not what I expected."

**Emotional Variants:**
- `happy` (genuine, warm)
- `sad` (somber, low energy)
- `angry` (forceful, sharp)
- `fearful` (breathy, uncertain)
- `surprised` (sharp intake, high pitch contour)
- `disgusted` (guttural, dismissive tone)
- `neutral` (flat, informative)
- `contemptuous` (slight sneer, dismissive)

**File Naming Example:** `speech-sentences-happy-s1_actor1.mp3`

### Non-Verbal Vocalizations
Record at least 5 distinct non-verbal sounds for each primary emotion (laugh, sigh, gasp, cry, growl, etc.).

**File Naming Example:** `emotions-vocalizations-laugh-01.mp3`

## 4. Instrument Recording Guide (for Ga, Gf, Gl modes)

- **Piano:** Record clean, single notes for each key from C2 to C6. Let each note sustain for at least 3 seconds to capture its natural decay.
- **Percussion:** Record single, clean hits of a kick drum, snare drum, closed hi-hat, and a simple click/wood block.
- **Other Instruments (Guitar, Bell):** Record single, sustained notes as with the piano.

## 5. How to Upload

1. Place your recorded and formatted `.mp3` files into a local folder named `public/audio-assets/`. The folder structure inside `public/audio-assets/` should match the paths defined in `AUDIO_ASSET_MANIFEST_TEMPLATE.json` (e.g., `public/audio-assets/tones/piano/C3.mp3`).
2. This project does not currently use Firebase Storage. Assets are served directly from the `public` folder.
3. After adding files, you **must update `public/audio-assets/manifest.json`** manually. Add a new entry for your asset, ensuring the `id`, `path`, `duration`, `format`, `sampleRate`, and `fileSize` are all correct.

## 6. How to Test Your Assets

1. Run the game in development mode (`npm run dev`).
2. Navigate to the game mode that uses your new asset.
3. Open the browser's developer console.
4. When the asset is supposed to play, look for console messages:
   - **SUCCESS:** `[AudioEngine] Playing sample: {your-asset-id}` indicates the real asset was loaded and played.
   - **FAILURE:** `[AudioEngine] WARN: Asset '{your-asset-id}' not found. Using fallback.` indicates the manifest entry is missing or the file path is incorrect.

**The goal for production is to have zero "PLACEHOLDER" or "fallback" warnings in the console.**
