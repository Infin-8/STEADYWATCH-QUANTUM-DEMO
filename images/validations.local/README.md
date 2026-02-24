# Hardware Validation Media Gallery

**Date Created:** February 1, 2026  
**Purpose:** Organized gallery of IBM Quantum hardware validation screenshots and videos  
**Status:** ✅ Active

---

## Directory Structure

```
validations/
├── ghz/
│   ├── ghz-12qubit-screenshot.png
│   ├── ghz-12qubit-video.mov
│   ├── ghz-28qubit-record-screenshot.png
│   ├── ghz-28qubit-record-video.mov
│   └── screen-recording-2026-01-30-at-11.25.01 am.mov
├── qkd/          (Ready for QKD validation media)
├── hybrid/       (Ready for hybrid system validation media)
├── echo-resonance/ (Ready for Echo Resonance validation media)
├── seed-generation/ (Ready for seed generation validation media)
└── bell-inequality/ (Ready for Bell inequality validation media)
```

---

## Current Validations

### GHZ State Validations

#### 12-Qubit GHZ State
- **Screenshot:** `ghz/ghz-12qubit-screenshot.png`
- **Video:** `ghz/ghz-12qubit-video.mov`
- **Job ID:** `d5fen5nea9qs738vpnj0`
- **Backend:** IBM Quantum ibm_fez
- **Fidelity:** 70-75%
- **Verification:** https://quantum.ibm.com/jobs/d5fen5nea9qs738vpnj0

#### 28-Qubit GHZ State (Record)
- **Screenshot:** `ghz/ghz-28qubit-record-screenshot.png`
- **Video:** `ghz/ghz-28qubit-record-video.mov`
- **Job ID:** `d5g22lf67pic7383m5qg`
- **Backend:** IBM Quantum ibm_fez
- **Fidelity:** 35%
- **Verification:** https://quantum.ibm.com/jobs/d5g22lf67pic7383m5qg
- **Note:** Record-breaking 28-qubit GHZ state - deepest validated on IBM Quantum hardware

---

## Adding New Validations

### File Naming Convention

**Screenshots:**
- Format: `{category}-{description}-screenshot.png`
- Example: `ghz-12qubit-screenshot.png`

**Videos:**
- Format: `{category}-{description}-video.mov` (or `.mp4`)
- Example: `ghz-12qubit-video.mov`

### Categories

- **ghz** - GHZ state validations
- **qkd** - QKD protocol validations
- **hybrid** - Hybrid system validations
- **echo-resonance** - Echo Resonance validations
- **seed-generation** - Quantum entropy seed generation
- **bell-inequality** - Bell inequality tests

### Adding to Gallery

1. Copy media files to appropriate category folder
2. Update `hardware-validation.html` JavaScript `validations` array
3. Add job ID, backend, fidelity, and description
4. Add verification links to IBM Quantum platform

---

## HTML Gallery

The validation gallery is accessible at:
- **URL:** `hardware-validation.html`
- **Features:**
  - Filterable by category
  - Clickable job IDs (copies to clipboard)
  - Modal view for full-size images
  - Direct links to IBM Quantum platform
  - Video playback support

---

## Verification Links

All job IDs are verifiable on IBM Quantum platform:
- Format: `https://quantum.ibm.com/jobs/{job_id}`
- Example: `https://quantum.ibm.com/jobs/d5g22lf67pic7383m5qg`

---

## File Sizes

Current media files:
- Screenshots: ~780KB each
- Videos: 3-11MB each
- Screen recording: 77MB

**Note:** Consider compressing large video files for web optimization if needed.

---

**Last Updated:** February 1, 2026
