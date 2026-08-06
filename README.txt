USED TO BEES REUNION JUKEBOX — VERSION 5 AI VIDEO

Replace these root files:
- index.html
- styles.css
- player.js

Do not change:
- profiles.json
- audio
- photos
- video

Automatic sequence:
1. 1977 yearbook photo is displayed.
2. Reunion countdown jingle plays.
3. AI Video appears and plays.
4. Current photo appears.
5. Long-distance dedication plays.
6. Ka-chunk.
7. Favorite song plays.

Manual media buttons:
- 1977
- AI Video
- Today

Required JSON field:
"aiVideo": "video/JohnBerry.mp4"

Optional JSON fields:
"aiVideoMuted": true
"aiVideoVolume": 1
"aiVideoPosition": "center 24%"

The default is muted AI video for reliable browser playback. To hear a video's
own audio, add:
"aiVideoMuted": false

If aiVideo is missing or blank, the AI Video button is disabled and the
automatic sequence skips directly from the jingle to the current photo and
dedication.

Commit:
Add AI video sequence to reunion jukebox

Test:
https://bbcs-77.github.io/UsedToBeesPlayer/?v=50
