# Keyz Game: 81-Block Implementation

This document describes the Keyz game as implemented in the STEADYWATCH-QUANTUM-DEMO: a 9×9 voxel board with 81 mineable key ore blocks and key-drop orbs, driven by Hurwitz Keyz and UnifiedQubitStyling.

## Overview

- **Board:** 9×9 ground layer (y=0) plus 81 key ore blocks (y=1), one per cell. World coordinates: `(i, j)` with `i, j` from -4 to 4; cell center at `(i, 1, j)` in world units.
- **Interaction:** Click a key ore block to "mine" it: the block is removed and a key-drop orb appears at that position. OrbitControls allow camera orbit/zoom.
- **Styling:** Each block and orb is colored by a Hurwitz key index (p=5, 144 keys). UnifiedQubitStyling drives animated glow, phase, and subtle motion in the render loop.

## Files

| File | Role |
|------|------|
| [game.html](../game.html) | Page shell: nav, header, `#game-container` (Three.js canvas), `#game-key-label` (status). Loads Three.js r128, OrbitControls, hurwitz-keys.js, unified-qubit-styling.js, game.js. |
| [game.js](../game.js) | All game logic: scene, 9×9 ground, 81 key ore blocks, raycast click, key drops, animate loop. |

## Data Structures

- **Block types:** `BLOCK.AIR`, `BLOCK.GROUND`, `BLOCK.KEY_ORE_P5`, `BLOCK.KEY_ORE_P13`. The 81-block implementation uses only GROUND and KEY_ORE_P5.
- **Constants:** `BLOCK_SIZE = 1`, `TOTAL_P5 = 144`, `TOTAL_P13 = 336`.
- **State:** `blocks` (map of `"bx,by,bz"` to mesh), `blockMeshes` (array for raycast and animate), `keyDrops` (array of `{ mesh, prime, keyIndex, total, basePosition }`).

## World Build: buildWorld()

1. **Ground:** For `i, j` in [-4, 4], `setBlock(i, 0, j, BLOCK.GROUND)` — 81 brown boxes at y=0.
2. **Key ore:** For `i, j` in [-4, 4], `setBlock(i, 1, j, BLOCK.KEY_ORE_P5)` — 81 key ore blocks at y=1.

Each key ore block gets a **key index** from `hashKeyIndex(bx, bz, 5)` with `bx = i`, `bz = j`, so 81 distinct indices in [0, 143], giving 81 distinct hues from the p=5 palette.

## Block and Orb Creation

- **createBlockMesh(blockType, bx, by, bz):** Builds a box (0.98 scale). For KEY_ORE_P5, uses `getKeyColor(keyIndex, 144)` and Phong material with emissive; stores `userData.blockType`, `bx`, `by`, `bz`, `prime`, `keyIndex`.
- **setBlock(bx, by, bz, blockType):** Removes any existing mesh at that key, then (unless AIR) creates a mesh via createBlockMesh, adds it to the scene and `blockMeshes`, and records it in `blocks`.
- **spawnKeyDrop(wx, wy, wz, prime, keyIndex):** Creates a sphere (radius 0.25), same key color and emissive, stores basePosition and key data, pushes to `keyDrops`.

## Interaction

- **Raycast:** On click, NDC mouse is converted to a ray; `raycaster.intersectObjects(blockMeshes)` returns hits. The first hit is used.
- **Mining:** If the hit object is KEY_ORE_P5 or KEY_ORE_P13, the block is set to AIR (removed) and a key drop is spawned at `(bx, 1.5, bz)` in world units (centered above the now-empty cell). The status label updates with key count or last-mined key quaternion (from HurwitzKeys.getKey).

## Animate Loop

- **Key ore blocks:** For each block with type KEY_ORE_P5/KEY_ORE_P13, `UnifiedQubitStyling.calculateUnifiedStyle(keyIndex, time, rotationAngle, position)` is used to set color, emissive, and emissiveIntensity from a phase derived from keyIndex/total.
- **Key drops:** Each drop's mesh position is wobbled from basePosition using `style.noiseFactor`; color and emissive are updated from styling; scale gets a small variation. All key drops remain in the scene until the page is left or refreshed.

## Dependencies

- **Three.js** r128 (and OrbitControls): scene, camera, renderer, geometry, materials, raycasting.
- **HurwitzKeys** (js/hurwitz-keys.js): `getKey(prime, keyIndex)` for quaternion display in the label.
- **UnifiedQubitStyling** (js/unified-qubit-styling.js): `calculateUnifiedStyle(keyIndex, time, rotationAngle, position)` for glow, lighting factor, and noise used in the animate loop.

## Scaling Note

The 81-block layout is a direct scale-up from the original 5-block layout: the same loop that builds the ground is used a second time to place one key ore block per cell with `BLOCK.KEY_ORE_P5`. No changes were required to setBlock, createBlockMesh, click handling, or key-drop logic; only buildWorld() was extended to cover all 81 cells.
