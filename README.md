# Used to Bees 8-Track Player — Audio-Only Version

This version removes YouTube completely.

Playback sequence:

1. John Berry's long-distance dedication
2. A generated 8-track “ka-chunk”
3. “Slow Ride” by Foghat

## Replace the existing repository files

Open your `UsedToBeesPlayer` repository on GitHub and upload these items:

- `index.html`
- `styles.css`
- `player.js`
- the `audio` folder

When GitHub asks about files with the same names, allow it to replace them.

Commit message suggestion:

`Change player to audio-only version`

Your test URL remains:

`https://bbcs-77.github.io/UsedToBeesPlayer/?id=johnberry`

GitHub Pages may take one or two minutes to refresh after the commit.

## Google Sites embed

Use:

`https://bbcs-77.github.io/UsedToBeesPlayer/?id=johnberry`

Choose **Insert → Embed → By URL** in Google Sites.

## Adding another classmate

1. Put the dedication and song MP3 files in the `audio` folder.
2. Add another entry in the `PROFILES` section at the top of `player.js`.
3. Use the new classmate ID in the URL.

Example:

```js
susanexample: {
  classmate: "Susan Example",
  title: "Dancing Queen",
  artist: "ABBA",
  year: "1976",
  dedication: "audio/SusanExampleDedication.mp3",
  song: "audio/ABBA-Dancing-Queen.mp3"
}
```

Then embed:

`https://bbcs-77.github.io/UsedToBeesPlayer/?id=susanexample`

Use simple filenames without apostrophes, ampersands, or unusual punctuation.
