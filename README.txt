USED TO BEES REUNION JUKEBOX v4.6 — PHOTO LOADER FIX

Replace:
- index.html
- player.js

styles.css may remain unchanged from v4.5.

The new photo loader:
- Uses yearbookPhoto/currentPhoto when present.
- Also supports a photos array.
- Tries JPG, JPEG, PNG, and uppercase extensions automatically.
- Builds full URLs relative to the GitHub Pages site.
- Adds a cache-busting image parameter.
- Falls back to filenames based on the classmate name.

Do not change profiles.json, audio, or photos.

Commit:
Fix jukebox photo loading

Test:
https://bbcs-77.github.io/UsedToBeesPlayer/?v=46
