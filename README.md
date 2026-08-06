# Used to Bees Tabletop Reunion Jukebox — Version 4

This redesign keeps your current `profiles.json`, photos, dedication MP3s, song MP3s, and countdown jingle.

## Upload to GitHub

Replace only these root files:

- `index.html`
- `styles.css`
- `player.js`
- `README.md`

Do **not** replace `profiles.json`, `audio`, or `photos`.

Commit message:

`Install tabletop reunion jukebox v4`

Test:

`https://bbcs-77.github.io/UsedToBeesPlayer/?v=40`

## Photo behavior

- Yearbook photo appears first.
- During the dedication, the display dissolves to the current photo.
- 1977 and Today buttons allow manual switching.
- JPG, JPEG, PNG, and mixed filename capitalization are supported.
- The default framing uses `object-fit: cover` and `object-position: center 24%`.

For a spouse/group photo that needs different framing, add an optional field to that profile:

```json
"currentPhotoPosition": "center center"
```

Other examples:

```json
"currentPhotoPosition": "35% 20%"
```

```json
"currentPhotoPosition": "65% 25%"
```
