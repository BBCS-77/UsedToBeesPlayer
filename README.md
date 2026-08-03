# Used to Bees 8-Track Player

Starter player for the BBCS Class of '77 reunion website.

## Current test profile

- Classmate: John Berry
- Song: Slow Ride
- Artist: Foghat
- Year: 1975
- YouTube video ID: DfwsXn5n8HU
- Dedication: audio/JohnBerryDedication.mp3

## Publish on GitHub Pages

1. Sign in to GitHub as **BBCS-77**.
2. Create a new **public** repository named exactly:
   `UsedToBeesPlayer`
3. Upload all files and the `audio` folder from this package.
4. Open the repository's **Settings**.
5. Select **Pages** in the left menu.
6. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
7. Click **Save** and wait a minute or two.

The test address should become:

`https://bbcs-77.github.io/UsedToBeesPlayer/?id=johnberry`

GitHub URLs are case-sensitive in parts of the path. Use the exact repository spelling.

## Embed in Google Sites

1. Open John Berry's profile page in edit mode.
2. Choose **Insert → Embed → By URL**.
3. Paste:
   `https://bbcs-77.github.io/UsedToBeesPlayer/?id=johnberry`
4. Insert it and resize the embed. A width around 850–950 pixels works well on desktop.
5. Publish the Google Site.

## Adding more classmates later

Add another object inside `PROFILES` in `player.js`, following the John Berry example.
Use a simple lowercase ID with no spaces.

Example:

```js
susanexample: {
  classmate: "Susan Example",
  title: "Dancing Queen",
  artist: "ABBA",
  year: "1976",
  dedication: "audio/SusanExampleDedication.mp3",
  youtubeId: "YOUTUBE_VIDEO_ID"
}
```

Then use:

`https://bbcs-77.github.io/UsedToBeesPlayer/?id=susanexample`

## Important YouTube behavior

The YouTube video remains visible because YouTube embeds are not intended to be hidden or used as audio-only players. A visitor clicks the maroon button once; the dedication plays first, followed by the YouTube song. Some browser settings may require a second click on the visible YouTube play button.
