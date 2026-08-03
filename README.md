# Photo-Real Player Fix

This update fixes two problems:

1. The previous CSS overlays are removed, so no remnants of the older design should appear.
2. The PLAY and PAUSE hotspots no longer overlap. The photographed PLAY button now toggles play/pause.

## Replace these files in the repository root

- index.html
- styles.css
- player.js
- README.md

## Replace this file in the assets folder

- assets/player-bg.png

The existing audio files are unchanged and may remain in place:

- audio/JohnBerryDedication.mp3
- audio/Foghat-Slow-Ride.mp3

Commit with:

`Fix photo-real player and play button`

Then test with a cache-busting URL:

`https://bbcs-77.github.io/UsedToBeesPlayer/?id=johnberry&v=3`

The `v=3` forces the browser and Google Sites to request the newest build.
