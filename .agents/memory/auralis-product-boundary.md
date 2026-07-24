---
name: Auralis product boundary
description: Durable product constraints and visual direction for the Auralis music player.
---

Auralis should remain a private, offline-first music player: songs, playlists, artwork, playback state, and preferences stay on the user's device unless the user explicitly asks to change that boundary. The signature accent is bright teal.

**Why:** The product brief makes privacy and offline ownership the central differentiator, and the user explicitly chose bright teal as the main accent.

**How to apply:** Avoid accounts, cloud sync, external music APIs, and remote databases in future Auralis work. Preserve the immersive now-playing focus and use bright teal as the primary visual signal.

Navigation should keep Queue and Library as distinct views inside the top-right menu; the now-playing screen should not carry a duplicate queue or floating library control. Side carousel artwork must remain square, tilted, faded, and unlabeled.

**Why:** The user explicitly corrected the navigation hierarchy and artwork proportions after seeing the intermediate layout.

**How to apply:** Use the menu button as the single entry point, keep queue contents inside the Queue view and playlist/search/edit controls inside Library, and keep chrome minimal. Use a fixed 1:1 aspect ratio for all cover art, including carousel neighbors.

Playlist shuffle should be explicit: Shuffle & Play creates a shuffled queue, the active shuffle control restores playlist order, and activating shuffle again generates a fresh order rather than repeating the previous one.

**Why:** The user wants playlist playback to feel intentional and reversible, with a different randomized order on each new shuffle.

**How to apply:** Keep the shuffled sequence as the active queue for previous/next navigation and the Queue view, while leaving the saved playlist order unchanged.