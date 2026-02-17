---
layout: page
permalink: /music/
title: music
nav: true
nav_order: 3
description: Here are the albums I made
---

<div class="echo-player" style="margin: 2.5rem auto; max-width: 720px;">
  <!-- Album switcher -->
  <div class="echo-album-tabs" id="echoAlbumTabs"></div>

  <div class="echo-card">
    <img class="echo-cover" id="echoCover" src="" alt="Album cover" />
    <div class="echo-meta">
      <a class="echo-album" id="echoAlbumLink" href="#" target="_blank" rel="noopener"></a>
      <div class="echo-track" id="echoTrackTitle"></div>
      <!-- Progress bar -->
      <div class="echo-progress-wrap" id="echoProgressWrap">
        <div class="echo-progress-bar" id="echoProgressBar"></div>
      </div>
      <div class="echo-time">
        <span id="echoTimeCur">0:00</span>
        <span id="echoTimeDur">0:00</span>
      </div>
      <div class="echo-controls">
        <button class="echo-btn" id="echoPrev" aria-label="Previous track">◀</button>
        <button class="echo-btn echo-primary" id="echoPlay" aria-label="Play or pause">Play</button>
        <button class="echo-btn" id="echoNext" aria-label="Next track">▶</button>
      </div>
      <audio id="echoAudio" preload="metadata"></audio>
    </div>
  </div>

  <div class="echo-list" id="echoList" aria-label="Track list"></div>
</div>

<style>
  /* Album tab switcher */
  .echo-album-tabs {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .echo-tab {
    border: 1px solid rgba(120,120,120,0.25);
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.85rem;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.6;
  }
  .echo-tab:hover { opacity: 0.85; }
  .echo-tab.is-active {
    opacity: 1;
    font-weight: 600;
    border-color: rgba(120,120,120,0.5);
    background: rgba(120,120,120,0.08);
  }

  /* Card */
  .echo-card {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
    border: 1px solid rgba(120,120,120,0.2);
    border-radius: 16px;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(8px);
  }
  .echo-cover {
    width: 140px; height: 140px;
    border-radius: 12px;
    object-fit: cover;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .echo-meta {
    display: flex; flex-direction: column;
    gap: 0.4rem; justify-content: center;
  }
  .echo-album {
    font-weight: 600; color: inherit;
    text-decoration: none;
  }
  .echo-album:hover { text-decoration: underline; }
  .echo-track { font-size: 1.1rem; font-weight: 500; }

  /* Progress */
  .echo-progress-wrap {
    width: 100%; height: 5px;
    background: rgba(120,120,120,0.15);
    border-radius: 999px;
    cursor: pointer;
    margin-top: 0.25rem;
    position: relative;
  }
  .echo-progress-bar {
    height: 100%; width: 0%;
    background: rgba(80,80,80,0.55);
    border-radius: 999px;
    transition: width 0.1s linear;
    pointer-events: none;
  }
  .echo-time {
    display: flex; justify-content: space-between;
    font-size: 0.75rem; opacity: 0.5;
    margin-top: -0.1rem;
  }

  /* Controls */
  .echo-controls {
    display: flex; gap: 0.5rem; margin-top: 0.25rem;
  }
  .echo-btn {
    border: 1px solid rgba(120,120,120,0.3);
    background: transparent; color: inherit;
    padding: 0.45rem 0.9rem;
    border-radius: 999px; cursor: pointer;
    transition: all 0.2s ease;
  }
  .echo-btn:hover {
    border-color: rgba(120,120,120,0.6);
    background: rgba(120,120,120,0.08);
  }
  .echo-primary { font-weight: 600; }

  /* Track list */
  .echo-list {
    margin-top: 1.5rem; border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(120,120,120,0.2);
  }
  .echo-item {
    display: flex; align-items: center;
    gap: 1rem; padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(120,120,120,0.12);
    background: rgba(255,255,255,0.55);
  }
  .echo-item:last-child { border-bottom: none; }
  .echo-item button {
    border: none; background: none;
    font: inherit; color: inherit;
    text-align: left; cursor: pointer; flex: 1;
  }
  .echo-item span { opacity: 0.6; min-width: 2ch; }
  .echo-item.is-active { background: rgba(40,40,40,0.06); }

  @media (max-width: 600px) {
    .echo-card { grid-template-columns: 1fr; text-align: center; }
    .echo-cover { margin: 0 auto; }
    .echo-controls { justify-content: center; }
  }
</style>

<script>
  const albums = [
    {
      name: "echoRealm (2026)",
      cover: "{{ '/music/echorealm/echorealm.jpg' | relative_url }}",
      link: "https://music.163.com/#/album?id=361732175&uct2=U2FsdGVkX1/xkPGdBqPZJy7ax778Wy99RpWKP530k34=",
      tracks: [
        { title: "Jasper JD7714",                    src: "{{ '/music/echorealm/AlbErt%20-%20Jasper%20JD7714.mp3' | relative_url }}" },
        { title: "Seviyor mu",                       src: "{{ '/music/echorealm/AlbErt%20-%20Seviyor%20mu.mp3' | relative_url }}" },
        { title: "Configurable - A",                 src: "{{ '/music/echorealm/AlbErt%20-%20Configurable%20-%20A.mp3' | relative_url }}" },
        { title: "Configurable - B",                 src: "{{ '/music/echorealm/AlbErt%20-%20Configurable%20-%20B.mp3' | relative_url }}" },
        { title: "Interlude - \"please take a seat\"", src: "{{ '/music/echorealm/AlbErt%20-%20Interlude%20-%20please%20take%20a%20seat.mp3' | relative_url }}" },
        { title: "SW1V 2LF",                         src: "{{ '/music/echorealm/AlbErt%20-%20SW1V%202LF.mp3' | relative_url }}" },
        { title: "Outro - \"Flauta Lunar\"",           src: "{{ '/music/echorealm/AlbErt%20-%20Outro%20-%20Flauta%20Lunar.mp3' | relative_url }}" },
        { title: "Untitled-01",                      src: "{{ '/music/echorealm/AlbErt%20-%20Untitled-01.mp3' | relative_url }}" },
      ],
    },
    {
      name: "LEAVE 4OREVER PT.1 (2022)",
      cover: "{{ '/music/leave4oreverpt1/leaveforeverpt1.jpg' | relative_url }}",
      link: "",
      tracks: [
        { title: "intro - \"time to leave\"",   src: "{{ '/music/leave4oreverpt1/1%20-%20Leave%204orever%20Pt.1%20-%20intro%20-%20%E2%80%9Dtime%20to%20leave%E2%80%9D.mp3' | relative_url }}" },
        { title: "do you even know me",        src: "{{ '/music/leave4oreverpt1/2%20-%20Leave%204orever%20Pt.1%20-%20do%20you%20even%20know%20me.mp3' | relative_url }}" },
        { title: "skit1",                      src: "{{ '/music/leave4oreverpt1/3%20-%20Leave%204orever%20Pt.1%20-%20skit1.mp3' | relative_url }}" },
        { title: "out of my reverie",          src: "{{ '/music/leave4oreverpt1/4%20-%20Leave%204orever%20Pt.1%20-%20out%20of%20my%20reverie.mp3' | relative_url }}" },
        { title: "Orange Juice",               src: "{{ '/music/leave4oreverpt1/5%20-%20Leave%204orever%20Pt.1%20-%20Orange%20Juice.mp3' | relative_url }}" },
        { title: "AffineWarp",                 src: "{{ '/music/leave4oreverpt1/6%20-%20Leave%204orever%20Pt.1%20-%20AffineWarp.mp3' | relative_url }}" },
        { title: "雨宿",                       src: "{{ '/music/leave4oreverpt1/7%20-%20Leave%204orever%20Pt.1%20-%20%E9%9B%A8%E5%AE%BF.mp3' | relative_url }}" },
        { title: "skit2",                      src: "{{ '/music/leave4oreverpt1/8%20-%20Leave%204orever%20Pt.1%20-%20skit2.mp3' | relative_url }}" },
        { title: "remember that",              src: "{{ '/music/leave4oreverpt1/9%20-%20Leave%204orever%20Pt.1%20-%20remember%20that.mp3' | relative_url }}" },
        { title: "sink into the ocean",        src: "{{ '/music/leave4oreverpt1/10%20-%20Leave%204orever%20Pt.1%20-%20sink%20into%20the%20ocean.mp3' | relative_url }}" },
        { title: "too deep",                   src: "{{ '/music/leave4oreverpt1/11%20-%20Leave%204orever%20Pt.1%20-%20too%20deep.mp3' | relative_url }}" },
        { title: "outro - \"rewind2018\"",       src: "{{ '/music/leave4oreverpt1/12%20-%20Leave%204orever%20Pt.1%20-%20outro%20-%20%E2%80%9Crewind2018%E2%80%9D.mp3' | relative_url }}" },
        { title: "untitled-07",                src: "{{ '/music/leave4oreverpt1/13%20-%20Leave%204orever%20Pt.1%20-%20untitled-07.mp3' | relative_url }}" },
      ],
    },
  ];

  const audio       = document.getElementById("echoAudio");
  const playBtn     = document.getElementById("echoPlay");
  const prevBtn     = document.getElementById("echoPrev");
  const nextBtn     = document.getElementById("echoNext");
  const trackTitle  = document.getElementById("echoTrackTitle");
  const listEl      = document.getElementById("echoList");
  const coverImg    = document.getElementById("echoCover");
  const albumLink   = document.getElementById("echoAlbumLink");
  const tabsEl      = document.getElementById("echoAlbumTabs");
  const progressWrap = document.getElementById("echoProgressWrap");
  const progressBar  = document.getElementById("echoProgressBar");
  const timeCur      = document.getElementById("echoTimeCur");
  const timeDur      = document.getElementById("echoTimeDur");

  let albumIdx = 0;
  let trackIdx = 0;

  function fmt(s) {
    if (isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + String(sec).padStart(2, "0");
  }

  /* ---- Album tabs ---- */
  function renderTabs() {
    tabsEl.innerHTML = "";
    albums.forEach((a, i) => {
      const btn = document.createElement("button");
      btn.className = "echo-tab" + (i === albumIdx ? " is-active" : "");
      btn.textContent = a.name;
      btn.addEventListener("click", () => switchAlbum(i));
      tabsEl.appendChild(btn);
    });
  }

  function switchAlbum(i) {
    albumIdx = i;
    trackIdx = 0;
    const album = albums[albumIdx];
    coverImg.src = album.cover;
    if (album.link) {
      albumLink.href = album.link;
      albumLink.style.pointerEvents = "";
    } else {
      albumLink.removeAttribute("href");
      albumLink.style.pointerEvents = "none";
    }
    albumLink.textContent = album.name;
    audio.pause();
    audio.currentTime = 0;
    progressBar.style.width = "0%";
    timeCur.textContent = "0:00";
    timeDur.textContent = "0:00";
    playBtn.textContent = "Play";
    trackIdx = 0;
    audio.src = album.tracks[0].src;
    audio.load();
    trackTitle.textContent = album.tracks[0].title;
    renderList();
    renderTabs();
  }

  /* ---- Track list ---- */
  function renderList() {
    listEl.innerHTML = "";
    albums[albumIdx].tracks.forEach((t, i) => {
      const item = document.createElement("div");
      item.className = "echo-item" + (i === trackIdx ? " is-active" : "");
      const num = document.createElement("span");
      num.textContent = String(i + 1).padStart(2, "0");
      const btn = document.createElement("button");
      btn.textContent = t.title;
      btn.addEventListener("click", () => loadTrack(i));
      item.appendChild(num);
      item.appendChild(btn);
      listEl.appendChild(item);
    });
  }

  function loadTrack(i) {
    const tracks = albums[albumIdx].tracks;
    trackIdx = (i + tracks.length) % tracks.length;
    audio.pause();
    audio.src = tracks[trackIdx].src;
    audio.load();
    trackTitle.textContent = tracks[trackIdx].title;
    progressBar.style.width = "0%";
    timeCur.textContent = "0:00";
    renderList();
    audio.play();
  }

  /* ---- Controls ---- */
  playBtn.addEventListener("click", () => {
    if (audio.paused) audio.play(); else audio.pause();
  });
  prevBtn.addEventListener("click", () => loadTrack(trackIdx - 1));
  nextBtn.addEventListener("click", () => loadTrack(trackIdx + 1));

  audio.addEventListener("play",  () => (playBtn.textContent = "Pause"));
  audio.addEventListener("pause", () => (playBtn.textContent = "Play"));
  audio.addEventListener("ended", () => loadTrack(trackIdx + 1, true));

  /* ---- Progress ---- */
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    progressBar.style.width = (audio.currentTime / audio.duration * 100) + "%";
    timeCur.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener("loadedmetadata", () => {
    timeDur.textContent = fmt(audio.duration);
  });
  progressWrap.addEventListener("click", (e) => {
    if (!audio.duration) return;
    const rect = progressWrap.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });

  /* ---- Init ---- */
  switchAlbum(0);
</script>
