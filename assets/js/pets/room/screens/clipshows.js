/*******************************************************************************
 * The four real dramas, on the TV (tv.js: a channel each) and on his computer
 * for her (acts/pc.js), each as clips of its leads cut from an episode:
 * 放羊的星星 (My Lucky Star: 夏之星 and 仲天骐, four scenes), 就想賴著妳 (Down
 * With Love: 簡單 and 馬克, four scenes) and two episodes of 我的前半生 (The
 * First Half of My Life): 6, 罗子君's mother storming 凌玲's office, and 27,
 * 罗子君 and 贺涵 on the bridge in the rain. Clips are 168 x 96 and five
 * frames a second, played at twice that, one after another and round again
 * (on his computer, 我的前半生 is one drama of two episodes: DRAMAS).
 * Each clip is one sheet of its frames, COLS across (assets/playground/<show>/,
 * cut from the videos by a script; the videos themselves are not in the repo),
 * fetched as it comes up, with the next one. Put on, a show first holds its
 * title on black for TITLE s (and till its clip is in). What she reacts to
 * (`moods`): one clip in two or so, a mood a second into it.
 ******************************************************************************/

export const CLIP_SHOWS = {
  luckystar: {
    clips: 22,
    title: "放羊的星星",
    thumb: [4, 12],
    // By the car at the river, teasing; outside the house, she tells him and breaks down; at the hospital, the
    // baby; at night he finds her, and they sit together till she cries.
    moods: { 1: "love", 3: "love", 4: "laugh", 7: "tense", 9: "sad", 12: "sad", 13: "love", 16: "twist", 18: "love", 19: "love", 21: "sad" },
  },
  downwithlove: {
    clips: 24,
    title: "就想賴著妳",
    thumb: [0, 0],
    // Squabbling over a game, face to face; at work in the kitchen; a row in the street; the boss in the office.
    moods: {
      1: "laugh",
      3: "laugh",
      5: "love",
      7: "laugh",
      9: "laugh",
      11: "twist",
      12: "tense",
      13: "laugh",
      15: "twist",
      18: "tense",
      19: "twist",
      21: "love",
      22: "laugh",
    },
  },
  firsthalf6: {
    clips: 30,
    title: "我的前半生",
    ep: "第6集",
    thumb: [2, 12],
    // Her mother at 凌玲's desk, shouting, waving a banner at the staff, and the guards called.
    moods: {
      1: "tense",
      3: "twist",
      5: "tense",
      7: "twist",
      9: "laugh",
      12: "tense",
      14: "twist",
      17: "tense",
      19: "laugh",
      22: "laugh",
      25: "tense",
      27: "twist",
      29: "twist",
    },
  },
  firsthalf27: {
    clips: 22,
    title: "我的前半生",
    ep: "第27集",
    thumb: [20, 6],
    // 罗子君 alone on the bridge in the rain, crying out; 贺涵 running up with his umbrella; words; his arms.
    moods: { 1: "sad", 3: "sad", 5: "sad", 7: "sad", 9: "twist", 10: "love", 12: "tense", 15: "tense", 18: "sad", 20: "love", 21: "love" },
  },
};
// On his computer the same, as her dramas: each an episode or two of them, in order.
export const DRAMAS = {
  luckystar: { title: "放羊的星星", episodes: ["luckystar"] },
  downwithlove: { title: "就想賴著妳", episodes: ["downwithlove"] },
  firsthalf: { title: "我的前半生", episodes: ["firsthalf6", "firsthalf27"] },
};
// The show (CLIP_SHOWS) that is episode `ep` of `drama`.
export const episodeOf = (drama, ep) => DRAMAS[drama].episodes[ep];

const FRAMES = 30; // in each clip
const COLS = 6; // frames across a sheet
const FPS = 10; // (cut at 5)
const TITLE = 1; // s
const [W, H] = [168, 96];
const DIR = new URL("../../../../playground/", import.meta.url);
const CJK = "'Microsoft JhengHei', 'PingFang TC', 'Noto Sans CJK TC', 'Microsoft YaHei', sans-serif";

// How long `show` runs, s, before it goes round again.
export const clipLength = (show) => (CLIP_SHOWS[show].clips * FRAMES) / FPS;

// A clip's sheet, fetched and decoded off the page's thread (decoded on first drawing instead, it would hold
// up that frame, by up to a tenth of a second); `ready` once it is.
const sheets = {};
function sheet(show, n) {
  const key = `${show}/clip_${String(n).padStart(2, "0")}.png`;
  if (!sheets[key]) {
    const img = (sheets[key] = new Image());
    img.crossOrigin = "anonymous"; // (the same site; served from elsewhere in tests, drawn untainted)
    img.src = new URL(key, DIR).href;
    img.decoded = img.decode().then(
      () => (img.ready = true),
      () => {}
    );
  }
  return sheets[key];
}
const ready = (img) => img.ready === true;

// Frame `k` of a clip's sheet `img` to fill g's w x h.
function frame(g, w, h, img, k) {
  g.imageSmoothingEnabled = false;
  g.drawImage(img, (k % COLS) * W, Math.floor(k / COLS) * H, W, H, 0, 0, w, h);
}

// `show` (CLIP_SHOWS) at `t` s into its run (the clock, on the TV: it goes on whether watched or not), `e` s
// since it was put on; w x h texels (168 x 96).
export function drawClipShow(g, w, h, show, t, e) {
  const { clips, title, ep } = CLIP_SHOWS[show];
  const f = Math.floor(t * FPS);
  const n = Math.floor(f / FRAMES) % clips;
  const img = sheet(show, n);
  sheet(show, (n + 1) % clips);
  if (e >= TITLE && ready(img)) return frame(g, w, h, img, f % FRAMES);
  g.fillStyle = "#000000";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#f7a8c4";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `bold 18px ${CJK}`;
  g.fillText(title, w / 2, ep ? h / 2 - 9 : h / 2);
  if (ep) {
    g.font = `bold 13px ${CJK}`;
    g.fillText(ep, w / 2, h / 2 + 12);
  }
}

// What is happening `e` s into `show` for her to go with: `beat` the clip, `mood` how she takes it (from a
// second into the clip; none in the others).
export function clipMoment(show, e) {
  const { clips, moods } = CLIP_SHOWS[show];
  const f = Math.floor(e * FPS);
  const beat = Math.floor(f / FRAMES) % clips;
  return { beat, mood: f % FRAMES >= FPS ? moods[beat] ?? null : null };
}

// Its picture in the picker: a frame of the show, on the `canvas` given (W x H) once its clip is in.
export function drawClipThumb(canvas, show) {
  const [n, k] = CLIP_SHOWS[show].thumb;
  const img = sheet(show, n);
  img.decoded.then(() => ready(img) && frame(canvas.getContext("2d"), W, H, img, k));
}

// The side screen while she watches episode `ep` of `drama` (DRAMAS) on his computer, `w` by `h` on end (11
// by 25), `e` s in: her dramas, this one picked out, and how far into the episode she is.
export function drawClipSide(g, w, h, drama, ep, e) {
  const rect = (x, y, rw, rh, c) => {
    g.fillStyle = c;
    g.fillRect(x, y, rw, rh);
  };
  rect(0, 0, w, h, "#1f1f28");
  rect(0, 0, w, 4, "#f7a8c4");
  Object.keys(DRAMAS).forEach((d, k) => {
    const y = 6 + k * 4;
    const now = d === drama;
    if (now) rect(0, y - 1, w, 3, "#3a3a4c");
    rect(1, y, 1, 1, now ? "#e0605a" : "#6a6f86");
    rect(3, y, 4 + (DRAMAS[d].title.length % 4), 1, now ? "#ffffff" : "#9aa0b8");
  });
  const show = episodeOf(drama, ep);
  rect(1, 22, w - 2, 1, "#3a3a4c");
  rect(1, 22, Math.max(1, Math.min(w - 2, Math.round((e / clipLength(show)) * (w - 2)))), 1, "#e0605a");
}
