USED TO BEES REUNION JUKEBOX v4.8 — CLASSMATE PROFILE BUTTON

Replace these root files:
- index.html
- styles.css
- player.js

Do not change:
- audio
- photos

Add this optional field to each profile in profiles.json:

"profileUrl": "https://sites.google.com/view/YOUR-SITE/classmates/john-berry"

Example:

{
  "id": "johnberry",
  "name": "John Berry",
  "songTitle": "Slow Ride",
  "artist": "Foghat",
  "year": 1975,
  "dedicationFile": "audio/dedications/JohnBerry.mp3",
  "songFile": "audio/songs/Foghat-Slow-Ride.mp3",
  "yearbookPhoto": "photos/yearbook/JohnBerry.jpg",
  "currentPhoto": "photos/current/JohnBerry.jpg",
  "profileUrl": "https://sites.google.com/view/YOUR-SITE/classmates/john-berry"
}

Behavior:
- When profileUrl is present, a black button with yellow text appears beneath the left yellow classmate-name box.
- Button text: Click to See Classmate Profile
- The profile opens in a new browser tab, which allows the jukebox audio to continue playing in the original tab.
- When profileUrl is omitted or blank, the button is hidden.

Commit:
Add classmate profile button

Test:
https://bbcs-77.github.io/UsedToBeesPlayer/?v=48
