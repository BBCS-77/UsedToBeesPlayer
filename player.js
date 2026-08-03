<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Used to Bees 8-Track Player</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="page">
    <section class="player-shell" aria-label="Used to Bees 8-track music player">
      <div class="handle" aria-hidden="true">
        <span class="handle-left"></span>
        <span class="handle-top"></span>
        <span class="handle-right"></span>
      </div>

      <div class="player-body">
        <header class="brand-row">
          <div class="brand">BBCS • 1977</div>
          <div class="model">USED TO BEES 8-TRACK</div>
        </header>

        <div class="content-grid">
          <div class="speaker-panel">
            <div class="speaker-ring">
              <div class="speaker-grille">
                <div class="program-badge" aria-label="Program 3">
                  <span>PROGRAM</span>
                  <strong>3</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="display-panel">
            <div class="now-playing">NOW PLAYING</div>
            <h1 id="songTitle">Slow Ride</h1>
            <p id="artistLine">Foghat • 1975</p>
            <p class="dedication-line">A long-distance dedication for <strong id="classmateName">John Berry</strong></p>

            <!-- YouTube must remain visible; this is the licensed song source. -->
            <div class="video-frame">
              <div id="youtubePlayer"></div>
            </div>

            <div class="status-row">
              <span id="statusText">Ready</span>
              <span id="timeText">0:00</span>
            </div>

            <div class="progress-track" aria-hidden="true">
              <div id="progressFill" class="progress-fill"></div>
            </div>

            <div class="controls">
              <button id="playSequence" class="main-button" type="button" aria-label="Play dedication and song">
                ▶ PLAY DEDICATION &amp; SONG
              </button>
              <button id="pauseSong" type="button" aria-label="Pause song">Ⅱ</button>
              <button id="restartSong" type="button" aria-label="Restart song">↺</button>
            </div>

            <p id="fallbackMessage" class="fallback" hidden>
              Your browser stopped automatic playback. Press the YouTube play button above to begin the song.
            </p>
          </div>
        </div>

        <footer>
          <div class="bee-mark" aria-hidden="true">🐝</div>
          <div>
            <strong>USED TO BEES</strong>
            <span>BBCS Class of ’77 Reunion Radio</span>
          </div>
        </footer>
      </div>
    </section>

    <audio id="dedicationAudio" preload="metadata"></audio>
  </main>

  <script src="https://www.youtube.com/iframe_api"></script>
  <script src="player.js"></script>
</body>
</html>
