/*******************************************************************************
 * What the girl streams at his computer: twelve dramas (a palace drama, a
 * romance in the rain, a hospital drama, a detective mystery, a school romance,
 * a sword fight in the bamboo, a family sitcom, a café romance, an office
 * romance, an idol story, immortals in the clouds, a summer by the sea), each a
 * season of four short episodes told shot by shot (SERIES), every shot a step
 * on in the story: who comes and goes, what they give each other, what they
 * think (in bubbles), the things that matter seen up close; with what she
 * makes of each shot; and what the side screen shows while she watches or
 * plays (her farm game is in stardew.js).
 ******************************************************************************/

import { hash } from "../../models/voxels.js";
import { pen, person, number } from "./pen.js";
import { drawFarmSide } from "./stardew.js";

export const DRAMAS = ["palace", "rain", "hospital", "detective", "campus", "wuxia", "sitcom", "cafe", "office", "idol", "immortal", "seaside"];

export const GIRL_GAMES = ["stardew"];

// Each drama's look: its setting (the wall or sky, the floor), its two leads ([hair, clothes] each), and the
// third person in the story (a rival, a suspect, the boss...).
const DRAMA_LOOK = {
  palace: { back: "#e9b8b0", floor: "#e8cf8a", leads: ["#2b2522", "#f7b8cc", "#2b2522", "#b8a0e0"], third: ["#2b2522", "#d0a020"] },
  rain: { back: "#8a9cc0", floor: "#6f7f9f", leads: ["#2b2522", "#3e4f7a", "#47281b", "#f2e3c4"], third: ["#8a5a34", "#2a2a2a"] },
  hospital: { back: "#dcefe8", floor: "#bfd4cc", leads: ["#2b2522", "#ffffff", "#5e3624", "#8fc0e8"], third: ["#c0c0c0", "#8fc0e8"] },
  detective: { back: "#3a4060", floor: "#565a70", leads: ["#3b3330", "#c9a878", "#47281b", "#8a6f9a"], third: ["#1a1416", "#6a1a1a"] },
  campus: { back: "#cdeafa", floor: "#e6d8b8", leads: ["#2b2522", "#3a4f8a", "#8a4a2a", "#3a4f8a"], third: ["#f2c14e", "#3a4f8a"] },
  wuxia: { back: "#d8ecd0", floor: "#a8d090", leads: ["#1a1416", "#f2f2f2", "#1a1416", "#4a4f5a"], third: ["#8a8f97", "#6a1a1a"] },
  sitcom: { back: "#f6e3a0", floor: "#d9b48a", leads: ["#5e3624", "#3e6fd6", "#f2c14e", "#e05aa0"], third: ["#c0c0c0", "#9b59d0"] },
  cafe: { back: "#d9b896", floor: "#a8805f", leads: ["#2b2522", "#3f7a5a", "#47281b", "#f28aa8"], third: ["#5e3624", "#2a2a2a"] },
  office: { back: "#dfe6ee", floor: "#9aa3b0", leads: ["#2b2522", "#2f3b55", "#5e3624", "#f2f2f2"], third: ["#8a8f97", "#4a4f5a"] },
  idol: { back: "#2a1f4a", floor: "#4a3a7a", leads: ["#f2c14e", "#e05aa0", "#2b2522", "#f2f2f2"], third: ["#2b2522", "#1a1a1a"] },
  immortal: { back: "#cfe0f6", floor: "#f4f4f8", leads: ["#1a1416", "#f2f2f2", "#1a1416", "#c03a3a"], third: ["#f2f2f2", "#3a1f4a"] },
  seaside: { back: "#9fdcf5", floor: "#f2dca0", leads: ["#5e3624", "#f6cf4a", "#2b2522", "#3e8fd6"], third: ["#f2c14e", "#e05aa0"] },
};

// Each drama's season: its title, and four episodes (how they meet, the episode where it goes wrong, the low
// point, the finale), each a title and its shots, "kind seconds words..." one after another (" | "):
// - "title" (the opening card with the episode's number) and "end" (to be continued; "fin", the end);
// - "close": one face filling the picture (who, and a look: smile, blush, laugh, tears, sad, shock, angry, kiss);
// - "item": something that matters, up close (ITEMS: a letter, a ring, a phone, a photo...), and how it is
//   (heart, no, check, broken, torn, gone, alarm, spill, note, plane, mess, alert);
// - "scene": people somewhere. Who (a and b the leads, c the third; none, the two leads; "three", all three)
//   in that order, from the left; where (PLACES, else the drama's own setting); where they stand ("near",
//   "far", "hug"; "come", the first walking in, "leave", the last walking off); what they do ("x:run",
//   "x:fall", "x:kneel", "x:lie" ill in bed, "x:back" turned away; "slap", the first slapping the second);
//   what they hold ("x+thing") or the first gives the second ("give=thing"); what they think, in a bubble
//   over their head ("x=icon", ICONS); the weather and the rest ("night", "rain", "storm", "petals",
//   "spark", "fireworks", "alarm", "clash", "spot" the stage lights, "crowd", "smoke", "dark" the lights
//   out, "umbrella", "heart"); and how it feels (a look, as for "close").
const SERIES = {
  palace: {
    title: "Palace Secrets",
    episodes: [
      [
        "The Spring Garden",
        "title 3 | scene 4 b park petals b+jade smile | scene 4 park petals come a=ask | scene 4 park petals near b=shock | close 2 a blush | scene 4 park petals near give=flower | close 3 b blush | scene 4 park petals near a=heart b=heart | scene 4 c park c=anger | close 2 c angry | scene 4 c hall night c+poison | item 3 poison | close 3 c smile | end 3",
      ],
      [
        "A Storm at Court",
        "title 3 | scene 4 c b hall give=cup | close 2 c smile | scene 4 b a hall give=cup | scene 4 a b hall a:fall b=shock | close 2 b shock | scene 4 three hall c=anger | close 2 c angry | scene 4 three hall b:kneel b=tear | close 3 b tears | item 3 jade broken | scene 5 b hall storm leave | scene 4 a room night a:lie a=zzz | end 3",
      ],
      [
        "The Cold Palace",
        "title 3 | scene 4 b room night rain b=tear sad | close 3 b tears | scene 4 c b room night come c=anger | scene 4 c b room night slap | close 2 b shock | scene 4 c b room night leave | item 3 poison | scene 4 b room night b+poison b=star | item 3 letter | scene 4 a room a:lie a+letter a=shock | close 3 a angry | end 3",
      ],
      [
        "Under the Lanterns",
        "title 3 | scene 4 three hall a+poison a=anger | close 2 c shock | scene 4 three hall c:kneel c=tear | scene 4 c hall leave | scene 4 a street night a:run | scene 4 a b room night rain come a=heart | scene 4 room night rain hug | close 3 b tears | scene 5 park night fireworks near | item 3 ring | close 3 b blush | scene 5 park night hug fireworks heart | close 3 a kiss | end 4 fin",
      ],
    ],
  },
  rain: {
    title: "Rain Romance",
    episodes: [
      [
        "Caught in the Rain",
        "title 3 | scene 4 b street rain b=tear | close 2 b sad | scene 4 street rain come a+umbrella | scene 4 street rain umbrella near b=shock | close 2 a smile | scene 5 street rain umbrella near b=heart | scene 4 station rain umbrella near | scene 4 a station rain leave | item 3 phone | scene 4 b station b+phone b=ask | close 3 b blush | end 3",
      ],
      [
        "The Other Girl",
        "title 3 | scene 4 b a park give=phone | close 2 a laugh | scene 5 park petals near a=heart b=heart | item 3 photo | scene 4 c a street come c=heart | close 2 a shock | scene 4 c a street hug | scene 4 b street b=broken | close 3 b tears | scene 4 b street rain b:run | scene 4 a street a=dots | end 3",
      ],
      [
        "A Long Night",
        "title 3 | scene 4 b room night rain b=tear | item 3 phone no | close 2 b sad | scene 4 c a street c=dots | scene 4 c a street give=ticket | item 3 ticket plane | scene 4 c station leave | scene 4 a street night rain a=heart | item 3 clock | scene 4 a street night rain a=tear | close 3 a sad | end 3",
      ],
      [
        "Under One Umbrella",
        "title 3 | scene 4 b room b=star | scene 4 b street rain b:run b+umbrella | scene 4 b a street rain come | scene 4 street rain umbrella hug | close 3 a smile | scene 4 bridge rain umbrella near | item 3 ring | close 3 b blush | scene 5 bridge petals hug heart | close 3 b kiss | end 4 fin",
      ],
    ],
  },
  hospital: {
    title: "Heartbeat Ward",
    episodes: [
      [
        "The Night Shift",
        "title 3 | scene 4 b night alarm b=shock | scene 4 night alarm a:run | item 3 monitor alarm | close 2 a angry | scene 4 night alarm near | item 3 monitor | scene 4 night b=star a=check | close 3 b blush | scene 4 roof night give=cup | scene 4 roof night near b=heart | close 2 a smile | scene 4 c come c=anger | end 3",
      ],
      [
        "Doctor's Secret",
        "title 3 | scene 4 c a c=anger | close 2 a sad | scene 4 a a+paper a=dots | item 3 paper no | close 3 a shock | scene 4 b a give=cup b=heart | scene 4 a b a=dots | scene 4 a b a:fall b=shock | close 3 b shock | item 3 monitor alarm | end 3",
      ],
      [
        "Let Me Go",
        "title 3 | scene 4 a b a:lie b=tear | close 3 b tears | scene 4 a b a:lie a=no | close 2 a sad | scene 4 b leave b=broken | item 3 letter | scene 4 a a:lie a+letter | scene 4 c a come a:lie c=star | item 3 paper check | close 3 c smile | end 3",
      ],
      [
        "Heartbeat",
        "title 3 | scene 4 c alarm c=star | item 3 monitor alarm | close 2 c angry | item 3 monitor | scene 4 c c=check | scene 4 b night b:run | scene 4 b a come a:lie | item 3 hands | close 3 a smile | scene 5 roof hug petals heart | item 3 ring | close 3 b kiss | end 4 fin",
      ],
    ],
  },
  detective: {
    title: "Midnight Case",
    episodes: [
      [
        "The Stolen Star",
        "title 3 | scene 4 three hall night | item 3 jewel | scene 4 three hall night alarm | scene 3 hall dark | item 3 jewel gone | close 2 b shock | scene 4 a b hall night a=ask | scene 4 c hall night c=dots | close 2 c smile | item 3 paper | close 3 a smile | end 3",
      ],
      [
        "The Alibi",
        "title 3 | scene 4 night | item 3 photo | scene 4 c a night c=no | item 3 ticket | close 2 a angry | scene 4 night a=star | scene 5 c street night c:run | scene 4 a street night a:run | scene 4 a street night a=anger | close 3 a angry | item 3 phone alert | end 3",
      ],
      [
        "Where Is She",
        "title 3 | scene 4 b night b+paper | scene 4 c b night come b=shock | scene 3 dark | scene 4 a room night a=ask | item 3 phone no | close 3 a sad | scene 4 a night rain a+paper | item 3 paper | scene 4 a night rain a=star | scene 4 a street night storm a:run | end 3",
      ],
      [
        "Case Closed",
        "title 3 | scene 4 c b roof night b=tear | scene 4 a roof night come a=anger | scene 4 a c roof night clash | close 2 c shock | scene 4 a c roof night c:kneel | item 3 jewel | scene 4 a b roof night hug | close 3 b tears | item 3 paper check | scene 5 night near spark | close 3 a smile | end 4 fin",
      ],
    ],
  },
  campus: {
    title: "Campus Spring",
    episodes: [
      [
        "The New Seat",
        "title 3 | scene 4 b petals b:run | scene 4 a class a=dots | scene 4 b a class come b=shock | scene 4 a b class near give=letter | item 3 letter | close 2 b laugh | scene 4 petals near a=note | scene 4 petals near a=heart | close 3 b blush | scene 4 c come c=heart | end 3",
      ],
      [
        "Exam Results",
        "title 3 | item 3 paper no | close 2 b tears | item 3 paper check | scene 4 a b class a+paper b=tear | scene 4 a b class near a=star | scene 4 class night near b=ask | close 3 b blush | scene 4 c b give=flower c=heart | close 2 b shock | scene 4 a a=broken | close 3 a sad | end 3",
      ],
      [
        "The Festival",
        "title 3 | scene 4 c b street night spark near | close 2 b smile | scene 4 a roof night a=dots | close 3 a sad | scene 4 b class night b=ask | item 3 letter heart | close 3 b shock | scene 4 c b street night b=no c=broken | scene 4 b street night b:run | end 3",
      ],
      [
        "Graduation",
        "title 3 | scene 4 three petals | item 3 photo | scene 4 b roof b:run | scene 4 b a roof come b=heart | scene 4 roof near a=shock | close 3 a blush | scene 4 roof near a=heart b=heart | item 3 hands | scene 5 roof petals hug heart | close 3 b laugh | end 4 fin",
      ],
    ],
  },
  wuxia: {
    title: "Bamboo Sword",
    episodes: [
      [
        "Duel in the Bamboo",
        "title 3 | scene 4 a a+sword | scene 4 b a come b+sword | scene 4 clash | scene 4 clash spark | close 2 b angry | scene 4 far a=ask b=ask | close 2 a smile | scene 4 inn near give=cup | close 3 b laugh | scene 4 c night c=knife | close 3 c angry | end 3",
      ],
      [
        "Night Ambush",
        "title 3 | scene 4 inn night near a=note | scene 4 c inn night come c=knife | scene 4 a c inn night clash | scene 4 b c inn night clash | scene 4 b a inn night b:fall a=shock | close 3 a shock | item 3 jade | scene 4 c inn night leave c+jade | scene 4 a b inn night a:kneel b:lie | close 3 a angry | end 3",
      ],
      [
        "The Cliff",
        "title 3 | scene 4 a cliff a+sword a=anger | scene 4 c b cliff c+jade b=tear | scene 4 a c b cliff | close 2 c smile | scene 4 a c cliff clash | scene 4 b cliff leave b=shock | close 3 a shock | scene 4 a cliff a:kneel a=tear | end 3",
      ],
      [
        "The Jade Returned",
        "title 3 | scene 4 a rain a=tear | scene 4 b a come | close 3 a shock | scene 4 hug | scene 4 c come c=knife | scene 4 a c clash spark | scene 4 b c clash | scene 4 c c:kneel | item 3 jade | scene 4 near give=jade petals | close 3 b blush | scene 5 hug heart petals | end 4 fin",
      ],
    ],
  },
  sitcom: {
    title: "Our Noisy Home",
    episodes: [
      [
        "Grandma Moves In",
        "title 3 | scene 4 laugh | scene 4 c come c+gift c=heart | close 2 a shock | scene 4 three laugh | scene 4 c kitchen c=star | item 3 cake mess | scene 4 a c kitchen smoke a=shock | close 2 a laugh | scene 4 three c=heart laugh | close 3 c laugh | end 3",
      ],
      [
        "The Forgotten Day",
        "title 3 | item 3 calendar | scene 4 b b+gift b=heart | scene 4 a a=dots | scene 4 b a give=gift a=shock | close 2 a shock | scene 4 b a b=anger | close 3 b angry | scene 4 b leave b=anger | scene 4 c a c=star | close 3 c laugh | end 3",
      ],
      [
        "Flour Everywhere",
        "title 3 | scene 4 a c kitchen c+paper | scene 4 a c kitchen smoke a=shock | close 2 a laugh | scene 4 a c kitchen c=anger | item 3 cake mess | scene 4 b come b=ask | scene 4 a c kitchen a=shock c=shock | close 3 b shock | scene 4 three kitchen laugh | close 2 c laugh | end 3",
      ],
      [
        "Happy Anniversary",
        "title 3 | scene 4 b night come b=ask | scene 3 dark | scene 4 three spark c=heart a=heart | item 3 cake | close 3 b tears | scene 4 a b give=ring | item 3 ring | scene 4 hug heart | item 3 photo | scene 4 three laugh spark | end 4 fin",
      ],
    ],
  },
  cafe: {
    title: "Coffee for Two",
    episodes: [
      [
        "The Usual",
        "title 3 | scene 4 a a+cup | scene 4 b a come b=ask | close 2 b smile | item 3 cup heart | close 3 b blush | scene 4 b b+letter b=note | scene 4 a b a=heart | scene 4 b leave | item 3 letter heart | close 3 a blush | scene 4 c come c+paper | end 3",
      ],
      [
        "Closing Sign",
        "title 3 | scene 4 c a give=paper c=anger | item 3 paper no | close 3 a sad | scene 4 a rain a=tear | scene 4 b a come b=ask | scene 4 near a=dots | close 2 b sad | scene 4 b b=star | item 3 phone | close 3 b smile | end 3",
      ],
      [
        "Full House",
        "title 3 | item 3 phone heart | scene 4 a crowd a=shock | scene 4 b a crowd near a=heart | scene 4 c come c=anger | scene 4 c b c=no b=anger | close 2 b angry | scene 4 c leave c=anger | close 3 a smile | scene 4 night near spark | end 3",
      ],
      [
        "Coffee for Two",
        "title 3 | scene 4 c a c+paper | item 3 paper check | close 2 c smile | scene 4 c leave | scene 4 b come b+letter | scene 4 a b give=cup | item 3 ring | close 3 b tears | scene 5 hug heart | close 3 a kiss | end 4 fin",
      ],
    ],
  },
  office: {
    title: "Overtime Love",
    episodes: [
      [
        "First Day",
        "title 3 | scene 4 b b=star | scene 4 b a come a=dots | item 3 cup spill | close 2 a angry | close 2 b shock | scene 4 b night b=zzz | scene 4 a b night come a+cup | scene 4 a b night give=cup b=heart | close 3 b blush | scene 4 c night c=anger | end 3",
      ],
      [
        "The Missing File",
        "title 3 | scene 4 b b+paper b=star | item 3 paper | scene 4 c b c=dots | scene 4 c night c+paper leave | scene 4 three hall c+paper | close 2 b shock | scene 4 b roof rain b=tear | close 3 b tears | scene 4 a b roof come a=ask | end 3",
      ],
      [
        "The Proof",
        "title 3 | scene 4 a night a=ask | item 3 photo | close 2 a angry | scene 4 three hall a+photo | scene 4 a c hall a=anger c=shock | scene 4 c hall leave c=tear | item 3 paper check | close 3 b tears | scene 4 a b hall near a=heart | close 2 a blush | end 3",
      ],
      [
        "Rooftop Fireworks",
        "title 3 | scene 4 b night b=zzz | scene 4 a b night give=ticket | scene 4 roof night near | scene 4 roof night fireworks near a=heart | close 2 a blush | item 3 ring | close 3 b tears | scene 5 roof night fireworks hug heart | close 3 a kiss | end 4 fin",
      ],
    ],
  },
  idol: {
    title: "Stage Lights",
    episodes: [
      [
        "Debut",
        "title 3 | scene 4 a a:fall a=tear | scene 4 b a come b=ask | close 2 a smile | scene 4 a b near b=note | item 3 mic | scene 5 a spot crowd a=note | close 3 a laugh | scene 4 c c=anger | close 2 c angry | end 3",
      ],
      [
        "Scandal",
        "title 3 | scene 4 a b street night near | item 3 photo | scene 4 c street night c+phone | item 3 phone alert | close 2 a shock | scene 4 a b room a=tear b=dots | scene 4 b room leave b=broken | close 3 a tears | item 3 mic no | end 3",
      ],
      [
        "A New Song",
        "title 3 | scene 4 a room rain a=tear | scene 4 b room night b+letter b=note | item 3 letter note | scene 4 b a street rain come give=letter | scene 4 a street rain a+letter a=note | close 3 a tears | scene 4 street rain umbrella near | close 2 b smile | scene 4 c c=anger | end 3",
      ],
      [
        "Final Stage",
        "title 3 | scene 4 c spot crowd | scene 4 a spot crowd come a=note | item 3 mic | close 3 a smile | scene 5 a spot crowd a=star | scene 4 c leave c=tear | scene 4 b crowd b=heart | close 3 b tears | scene 4 hug | scene 5 spot fireworks hug heart | end 4 fin",
      ],
    ],
  },
  immortal: {
    title: "Above the Clouds",
    episodes: [
      [
        "Falling Star",
        "title 3 | scene 4 b cliff b=star | scene 4 b cliff leave b=shock | scene 4 a a:run | scene 4 hug spark | close 3 b blush | scene 4 near a=ask b=heart | item 3 jade | scene 4 near give=jade | close 2 a smile | scene 4 c come c=anger | end 3",
      ],
      [
        "Heaven's Rule",
        "title 3 | scene 4 c a hall c=no | close 2 c angry | scene 4 a hall a:kneel a=tear | scene 4 b b+jade b=heart | scene 4 c b come c=anger | scene 4 c b c=knife b=shock | close 3 b tears | scene 4 b storm leave | item 3 jade broken | end 3",
      ],
      [
        "Storm over the Peaks",
        "title 3 | scene 4 b park rain b=tear | scene 4 a storm a=anger | scene 4 a c storm clash | scene 4 a c storm clash spark | close 2 c shock | scene 4 a storm a:run | scene 4 a b park rain come | close 3 b tears | scene 4 park rain hug | end 3",
      ],
      [
        "Peach Blossoms",
        "title 3 | scene 4 three park c=anger | scene 4 a c park a=no | close 3 a angry | scene 4 c park c=dots | item 3 jade | scene 4 c park leave c=heart | scene 4 park petals near give=jade | close 3 b blush | item 3 hands | scene 5 petals fireworks hug heart | close 3 b kiss | end 4 fin",
      ],
    ],
  },
  seaside: {
    title: "Summer by the Sea",
    episodes: [
      [
        "Hat in the Wind",
        "title 3 | scene 4 b b+hat smile | item 3 hat | scene 4 a come a+hat | scene 4 near give=hat | close 2 b blush | scene 4 near a+ice | scene 4 near give=ice b=heart | close 3 a laugh | scene 4 c come c=heart | end 3",
      ],
      [
        "Festival Night",
        "title 3 | scene 4 night fireworks near | close 2 b smile | scene 4 c a night come c=heart | scene 4 c a night give=letter | close 2 a shock | scene 4 b night b=broken | close 3 b tears | scene 4 b night leave | scene 4 a night a=ask | end 3",
      ],
      [
        "The Storm",
        "title 3 | scene 4 b storm b=tear | item 3 phone no | scene 4 a storm a:run | scene 4 c a storm c=dots | scene 4 a storm a=anger | scene 4 a b storm come | close 3 b tears | scene 4 storm hug | close 2 a sad | end 3",
      ],
      [
        "Next Summer",
        "title 3 | scene 4 a b station a+ticket | item 3 ticket | close 3 b tears | scene 4 a station leave a=dots | scene 4 b station b:run | item 3 letter heart | close 3 b blush | item 3 calendar | scene 4 a b come | scene 5 hug heart | close 3 b laugh | end 4 fin",
      ],
    ],
  },
};

const FACES = ["smile", "blush", "laugh", "tears", "sad", "shock", "angry", "kiss"];

// What a shot makes her feel (acts/pc.js): "love", "sad", "twist", "laugh", "tense", or nothing much. A face
// says it first, then what they think, then what happens.
const ICON_MOOD = {
  heart: "love",
  broken: "sad",
  tear: "sad",
  shock: "twist",
  anger: "tense",
  knife: "tense",
  poison: "tense",
  no: "tense",
  star: "laugh",
  check: "laugh",
  note: "laugh",
};
function moodOf({ shot, face, has, thinks, thing, how }) {
  if (shot === "title") return null;
  if (shot === "end") return has.has("fin") ? "love" : "twist";
  if (shot === "item") {
    if (["ring", "hands", "cake"].includes(thing) && how !== "mess") return "love";
    if (how === "heart") return "love";
    if (["no", "broken", "torn", "gone", "alarm", "spill", "alert", "mess"].includes(how) || thing === "poison") return "twist";
    return how === "check" ? "laugh" : null;
  }
  if (face === "tears" || face === "sad") return "sad";
  if (face === "shock") return "twist";
  if (face === "laugh") return "laugh";
  if (face === "blush" || face === "kiss") return "love";
  if (face === "angry") return "tense";
  for (const { icon } of thinks) if (ICON_MOOD[icon]) return ICON_MOOD[icon];
  if (has.has("storm") || has.has("dark") || [...has].some((w) => w.endsWith(":fall"))) return "twist";
  if (has.has("hug") || has.has("heart") || has.has("fireworks")) return "love";
  if (has.has("clash") || has.has("alarm") || has.has("slap")) return "tense";
  return null;
}

// A shot's words: who, their look, what they do, hold, give and think, and the rest (`has`).
function beatOf(line) {
  const [shot, secs, ...words] = line.split(" ");
  const of = (sep) => words.filter((w) => /^[abc]./.test(w) && w[1] === sep).map((w) => ({ who: w[0], what: w.slice(2) }));
  const beat = {
    shot,
    secs: +secs,
    who: words.filter((w) => w.length === 1),
    face: words.find((w) => FACES.includes(w)) || null,
    has: new Set(words),
    thinks: of("=").map(({ who, what }) => ({ who, icon: what })),
    holds: of("+"),
    poses: Object.fromEntries(of(":").map(({ who, what }) => [who, what])),
    gives: words.find((w) => w.startsWith("give="))?.slice(5) || null,
    thing: shot === "item" ? words[0] : null, // (an item shot: the thing, and how it is)
    how: shot === "item" ? words[1] || null : null,
  };
  return { ...beat, mood: moodOf(beat) };
}

// Each drama's title and episodes: their titles, their shots (with what each makes her feel) and how long.
const EPISODES = Object.fromEntries(
  Object.entries(SERIES).map(([drama, { title, episodes }]) => [
    drama,
    {
      title,
      episodes: episodes.map(([title, shots]) => {
        const beats = shots.split(" | ").map(beatOf);
        return { title, beats, secs: beats.reduce((sum, b) => sum + b.secs, 0) };
      }),
    },
  ])
);

// A drama's title, and its episodes' (each { title, secs }): for the visitor to choose from (playground.js),
// and how long she watches.
export const seriesOf = (drama) => EPISODES[drama] || EPISODES.cafe;

const episodeOf = (drama, ep) => seriesOf(drama).episodes[ep] || seriesOf(drama).episodes[0];

// The shot `e` seconds into episode `ep`, and how far into it (0-1); after the end, its last moment.
function shotAt(drama, ep, e) {
  const { beats } = episodeOf(drama, ep);
  let s = Math.max(0, e);
  for (const [i, b] of beats.entries()) {
    if (s < b.secs) return { i, b, p: s / b.secs };
    s -= b.secs;
  }
  return { i: beats.length - 1, b: beats[beats.length - 1], p: 1 };
}

// What the drama is making her feel just now: `beat` counts the shots, `mood` comes a moment into the shot
// (null before, or if the shot is nothing much).
export function dramaMoment(drama, ep, e) {
  const { i, b, p } = shotAt(drama, ep, e);
  return { beat: i, mood: p > 0.25 ? b.mood : null };
}

// A colour darker by `k` (night).
function dim(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[16, 8, 0].map((s) => Math.round(((n >> s) & 255) * k))})`;
}

const lookOf = (look, who) => (who === "c" ? look.third : who === "b" ? look.leads.slice(2) : look.leads.slice(0, 2)); // [hair, clothes]
const SKIN = "#f9d6bd";

// A pattern of texels ("1" in `c`, "2" in `c2`, "." none) with its top left at (x, y).
function glyph(px, rows, x, y, c, c2) {
  rows.forEach((row, j) => [...row].forEach((ch, i) => ch !== "." && px(x + i, y + j, ch === "1" ? c : c2)));
}

// What they think, in a bubble: [colour, second colour, the bubble's colour, pattern rows].
const ICONS = {
  heart: ["#ff4f7a", null, "#ffffff", ["1.1", "111", ".1."]],
  broken: ["#e0607a", "#3a2a3a", "#d8dce8", ["1.1", "121", ".1."]],
  shock: ["#e0402e", null, "#ffe58a", [".1.", ".1.", ".1."]],
  ask: ["#3a5aa8", null, "#ffffff", ["11.", "..1", ".1."]],
  dots: ["#6a6f86", null, "#ffffff", [".....", "1.1.1", "....."]],
  anger: ["#ffe58a", null, "#5a5a6a", ["..1", ".1.", "1.."]],
  note: ["#3a3040", null, "#ffffff", ["..1", "..1", "11."]],
  tear: ["#5aa8e8", null, "#ffffff", [".1.", "111", "111"]],
  zzz: ["#6a6f86", null, "#ffffff", ["111", ".1.", "111"]],
  knife: ["#9aa4b4", "#6a4a2a", "#ffffff", ["..1", ".1.", "2.."]],
  star: ["#f2b632", null, "#ffffff", [".1.", "111", ".1."]],
  poison: ["#8a4ac0", "#9aa4b4", "#ffffff", [".2.", "111", "111"]],
  no: ["#e0402e", null, "#ffffff", ["1.1", ".1.", "1.1"]],
  check: ["#3fa860", null, "#ffffff", ["..1", "1.1", ".1."]],
};
function bubble(rect, px, icon, x, w) {
  const [c, c2, back, rows] = ICONS[icon] || ICONS.dots;
  const bw = rows[0].length + 2;
  const x0 = Math.max(0, Math.min(w - bw, x + 1 - Math.floor(bw / 2)));
  rect(x0, 0, bw, 3, back);
  glyph(px, rows, x0 + 1, 0, c, c2);
}

// Things held (at the hand, `x`, `y`) and given.
const HELD = {
  jade: (rect, px, x, y) => (px(x, y - 1, "#c03a3a"), rect(x, y, 2, 1, "#3fae7a")),
  poison: (rect, px, x, y) => (px(x, y - 1, "#c8ccd4"), rect(x, y, 1, 2, "#8a4ac0")),
  letter: (rect, px, x, y) => (rect(x, y, 3, 2, "#fff8ef"), px(x + 1, y, "#e0402e")),
  ring: (rect, px, x, y) => (px(x, y - 1, "#bff4ff"), px(x, y, "#f2c14e")),
  phone: (rect, px, x, y) => (rect(x, y - 1, 1, 2, "#2b2b33"), px(x, y - 1, "#8fd3ff")),
  photo: (rect, px, x, y) => (rect(x, y, 2, 2, "#ffffff"), px(x, y + 1, "#8fb8e0")),
  paper: (rect, px, x, y) => (rect(x, y - 1, 2, 3, "#fff8ef"), px(x, y, "#9aa0b8")),
  cup: (rect, px, x, y) => (rect(x, y, 2, 2, "#ffffff"), rect(x, y, 2, 1, "#8a5a3a")),
  ticket: (rect, px, x, y) => rect(x, y, 3, 1, "#f6cf4a"),
  mic: (rect, px, x, y) => (px(x, y - 1, "#2b2b33"), px(x, y, "#9aa4b4")),
  sword: (rect, px, x, y) => [0, 1, 2, 3].forEach((k) => px(x + k, y - k, k ? "#d8dde6" : "#6a4a2a")),
  flower: (rect, px, x, y) => (px(x, y - 1, "#ff6f9a"), px(x, y, "#5bb046")),
  gift: (rect, px, x, y) => (rect(x, y - 1, 2, 2, "#e0402e"), px(x, y - 1, "#f6cf4a")),
  hat: (rect, px, x, y) => (rect(x - 1, y, 4, 1, "#f2d27a"), rect(x, y - 1, 2, 1, "#e8c060")),
  ice: (rect, px, x, y) => (px(x, y - 1, "#f7c6d6"), px(x, y, "#e8b87a")),
  umbrella: (rect, px, x, y) => rect(x, y - 2, 1, 3, "#f28aa8"),
};

/* ---------- where: the shared places, and each drama's own setting ---------- */

// Places a story can go (scene words): each draws the back and the floor (`tint` darkens at night), and may
// put something in front of the people (`front`).
const PLACES = {
  street: {
    back(rect, px, b, t, tint, night) {
      rect(0, 0, 26, 10, night ? "#2a3460" : "#bfe2f8");
      for (const [x, y, w, c] of [
        [0, 3, 6, "#9a8a9a"],
        [7, 1, 6, "#b8a890"],
        [18, 2, 8, "#8a9aa8"],
      ]) {
        rect(x, y, w, 10 - y, tint(c));
        for (let wy = y + 1; wy < 9; wy += 2)
          for (let wx = x + 1; wx < x + w - 1; wx += 2) px(wx, wy, night ? (hash(wx, wy, 7) < 0.6 ? "#ffe58a" : "#3a3a50") : "#dfe8f0");
      }
      rect(15, 2, 1, 8, "#2a2e40");
      rect(14, 2, 3, 1, night ? "#ffe58a" : "#8a8f97");
      rect(0, 10, 26, 3, tint("#7a7a86"));
      for (let x = 1; x < 26; x += 5) rect(x, 11, 2, 1, tint("#c8ccd4"));
    },
  },
  park: {
    back(rect, px, b, t, tint, night) {
      rect(0, 0, 26, 10, night ? "#26305a" : "#cdeafa");
      rect(3, 3, 2, 7, "#8a5a34");
      rect(0, 0, 9, 4, tint(b.has.has("petals") ? "#f7b8cc" : "#5bb046"));
      rect(1, 4, 6, 1, tint(b.has.has("petals") ? "#f2a0b8" : "#4a9a3a"));
      rect(19, 7, 7, 1, "#8a5a34");
      rect(19, 8, 1, 2, "#6b4429");
      rect(24, 8, 1, 2, "#6b4429");
      rect(0, 10, 26, 3, tint("#7ec85a"));
    },
  },
  roof: {
    back(rect, px, b, t, tint, night) {
      rect(0, 0, 26, 10, night ? "#1f2650" : "#a8d8f5");
      for (const [x, y, w] of [
        [0, 5, 4],
        [5, 3, 3],
        [9, 6, 5],
        [16, 4, 4],
        [21, 6, 5],
      ]) {
        rect(x, y, w, 10 - y, night ? "#3a3f60" : "#8aa0b8");
        if (night) for (let wy = y + 1; wy < 9; wy += 2) px(x + 1, wy, "#ffe58a");
      }
      rect(0, 8, 26, 1, "#c8ccd4");
      for (let x = 0; x < 26; x += 4) rect(x, 8, 1, 2, "#c8ccd4");
      rect(0, 10, 26, 3, tint("#9aa0a8"));
    },
  },
  station: {
    back(rect, px, b, t, tint, night) {
      rect(0, 0, 26, 10, tint("#d8d0c0"));
      rect(9, 0, 8, 2, "#3e6fd6");
      rect(10, 1, 6, 1, "#ffffff");
      // The train: in, or pulling out once someone has gone (leave).
      const off = b.has.has("leave") ? Math.max(0, b.p - 0.5) * 60 : 0;
      rect(Math.round(off) - 2, 3, 30, 6, "#e8e8f0");
      rect(Math.round(off) - 2, 7, 30, 1, "#3e8fd6");
      for (let x = 0; x < 28; x += 5) rect(Math.round(off) + x, 4, 3, 2, "#8fb8e0");
      rect(0, 9, 26, 1, "#f6cf4a");
      rect(0, 10, 26, 3, tint("#a8a090"));
    },
  },
  room: {
    back(rect, px, b, t, tint, night, look) {
      rect(0, 0, 26, 10, tint(look.back));
      rect(2, 2, 6, 5, night ? "#1f2a4a" : b.has.has("rain") ? "#8a9cc0" : "#cdeafa");
      rect(4, 2, 1, 5, "#8a5a34");
      rect(2, 4, 6, 1, "#8a5a34");
      if (night) px(6, 3, "#f3ecc8");
      rect(21, 3, 3, 1, "#f6cf4a");
      rect(22, 4, 1, 6, "#8a8f97");
      rect(0, 10, 26, 3, tint(look.floor));
    },
  },
  hall: {
    back(rect, px, b, t, tint, night, look) {
      rect(0, 0, 26, 10, tint(look.back === "#2a1f4a" ? "#4a3a7a" : "#e8d8b8"));
      for (const x of [0, 7, 17, 24]) {
        rect(x, 0, 2, 10, tint("#c0392b"));
        rect(x, 0, 2, 1, "#f2c14e");
      }
      for (const x of [11, 14]) {
        rect(x, 1, 1, 2, "#e0605a");
        px(x, 2, "#ffe58a");
      }
      rect(0, 10, 26, 3, tint("#b08a5a"));
      rect(8, 10, 10, 3, tint("#c0392b"));
    },
  },
  bridge: {
    back(rect, px, b, t, tint, night) {
      rect(0, 0, 26, 8, night ? "#26305a" : b.has.has("rain") ? "#9aa8c8" : "#cdeafa");
      rect(0, 6, 26, 7, tint("#3e8fd6"));
      for (let k = 0; k < 5; k++) rect((k * 6 + Math.round(t * 2)) % 26, 11 + (k % 2), 2, 1, tint("#8fc8f0"));
      rect(0, 8, 26, 1, "#a0703a");
      for (let x = 1; x < 26; x += 4) rect(x, 8, 1, 2, "#a0703a");
      rect(0, 10, 26, 1, tint("#8a5a34"));
    },
  },
  cliff: {
    back(rect, px, b, t, tint, night) {
      rect(0, 0, 26, 13, night ? "#26305a" : "#cfe0f6");
      for (const [x, top] of [
        [15, 6],
        [19, 4],
        [23, 7],
      ])
        rect(x, top, 4, 13 - top, tint("#a8b8d0"));
      for (let k = 0; k < 3; k++) rect(Math.round((k * 9 + t * 1.5) % 30) - 3, 9 + k, 5, 1, "#ffffff");
      rect(0, 10, 17, 3, tint("#8a7a6a"));
      rect(16, 10, 1, 3, tint("#6a5a4a"));
    },
  },
  class: {
    back(rect, px, b, t, tint, night) {
      rect(0, 0, 26, 10, tint("#e8e0c8"));
      rect(6, 1, 14, 5, "#2f5a3a");
      for (let k = 0; k < 3; k++) rect(8 + k * 4, 2 + (k % 2), 3, 1, "#d8e8d8");
      rect(0, 10, 26, 3, tint("#c8a878"));
    },
    front(rect) {
      for (const x of [1, 19]) {
        rect(x, 9, 6, 1, "#a0703a");
        rect(x + 1, 10, 1, 2, "#6b4429");
        rect(x + 4, 10, 1, 2, "#6b4429");
      }
    },
  },
  inn: {
    back(rect, px, b, t, tint, night) {
      rect(0, 0, 26, 10, tint("#c8a070"));
      for (let x = 0; x < 26; x += 6) rect(x, 0, 1, 10, tint("#8a5a34"));
      for (const x of [4, 21]) {
        rect(x, 1, 2, 3, "#e0402e");
        px(x, 2, "#ffe58a");
      }
      rect(0, 10, 26, 3, tint("#8a5a34"));
    },
    front(rect, px) {
      rect(9, 9, 8, 1, "#5c3a26");
      rect(10, 10, 1, 2, "#4a2a1a");
      rect(15, 10, 1, 2, "#4a2a1a");
      px(11, 8, "#f2f2f2");
      px(14, 8, "#f2f2f2");
    },
  },
  kitchen: {
    back(rect, px, b, t, tint) {
      rect(0, 0, 26, 10, tint("#f2e8d0"));
      for (let x = 0; x < 26; x += 3) for (let y = 0; y < 6; y += 3) px(x, y, tint("#d8ccb0"));
      rect(0, 6, 26, 4, tint("#c8ccd4"));
      rect(18, 5, 5, 1, "#3a3a40");
      rect(19, 3, 3, 2, "#8a8f97");
      rect(0, 10, 26, 3, tint("#d9b48a"));
    },
  },
};

// Each drama's own setting, where it mostly happens: its one or two things behind them, and in front.
function setting(rect, px, drama, b, t, tint) {
  if (drama === "palace") {
    for (const x of [3, 22]) {
      rect(x, 0, 1, 2, "#8a5a34");
      rect(x - 1, 2, 3, 3, "#e0605a");
      px(x, 3, "#ffe58a");
    }
  } else if (drama === "rain" || drama === "detective") {
    px(4, 2, "#f3ecc8");
    rect(22, 1, 1, 9, "#2a2e40");
    rect(21, 1, 3, 1, "#ffe58a");
  } else if (drama === "hospital") {
    rect(3, 3, 3, 1, "#e0605a");
    rect(4, 2, 1, 3, "#e0605a");
    rect(20, 2, 5, 4, "#2b3a3a");
    px(20 + Math.floor((t * 5) % 5), 4 - (Math.floor(t * 5) % 5 === 2 ? 1 : 0), b.has.has("alarm") ? "#e0402e" : "#7fe0a0");
  } else if (drama === "campus") {
    rect(2, 4, 2, 6, "#9a6a4a");
    rect(0, 0, 6, 5, tint("#f7c6d6"));
  } else if (drama === "wuxia") {
    for (const x of [2, 5, 21, 24]) rect(x, 0, 1, 10, tint("#7cb86a"));
  } else if (drama === "sitcom") {
    rect(1, 1, 5, 4, tint("#cdeafa"));
  } else if (drama === "cafe") {
    rect(20, 1, 5, 5, tint(b.has.has("rain") ? "#8a9cc0" : "#cdeafa"));
  } else if (drama === "office") {
    rect(1, 1, 9, 6, tint("#a8c8e0"));
    for (let x = 1; x < 10; x += 3) rect(x, 1, 1, 6, tint("#7a8a9a"));
    if (b.has.has("night")) for (let k = 0; k < 4; k++) px(2 + k * 2, 2 + (k % 3), "#ffe58a");
  } else if (drama === "idol") {
    rect(0, 0, 2, 10, "#a02040");
    rect(24, 0, 2, 10, "#a02040");
    if (b.has.has("spot"))
      for (const [x, c] of [
        [6, "#f6cf4a"],
        [13, "#f28aa8"],
        [20, "#8fd3ff"],
      ])
        for (let y = 0; y < 10; y++) if ((y + Math.floor(t * 4)) % 3) px(x + Math.round((y - 5) * 0.3 * Math.sin(t + x)), y, c);
  } else if (drama === "immortal") {
    for (const [x, top] of [
      [2, 4],
      [6, 2],
      [19, 3],
      [23, 5],
    ])
      rect(x, top, 3, 10 - top, tint("#a8b8d0"));
    for (let k = 0; k < 3; k++) rect(Math.round((k * 9 + t * 1.5) % 30) - 3, 1 + k * 2, 4, 1, tint("#ffffff"));
  } else if (drama === "seaside") {
    rect(0, 6, 26, 4, tint("#3e8fd6"));
    for (let k = 0; k < 5; k++) rect((k * 6 + Math.round(t * 2)) % 26, 7 + (k % 2) * 2, 2, 1, tint("#cfeaff"));
    px(21, 2, b.has.has("night") ? "#f3ecc8" : "#fff1a8");
    if (!b.has.has("night")) px(Math.round((t * 3) % 26), 3 + Math.round(Math.sin(t * 2)), "#ffffff");
  }
}
function inFront(rect, px, drama, b, cast) {
  if (drama === "sitcom") rect(5, 9, 17, 3, "#e08a6a");
  else if (drama === "cafe") {
    rect(10, 9, 7, 1, "#8a5a3a");
    px(11, 8, "#ffffff");
    px(15, 8, "#ffffff");
  } else if (drama === "office") {
    rect(3, 9, 20, 1, "#c8ccd4");
    rect(18, 7, 3, 2, "#2b2b33");
  } else if (drama === "detective") {
    const a = cast.find((c) => c.who === "a");
    if (a && !a.pose) {
      rect(a.x - 2, 2, 6, 1, "#3b3330");
      rect(a.x - 1, 1, 4, 1, "#3b3330");
    }
  }
}

/* ---------- who: where they stand, and how ---------- */

// Who stands where in a scene: x for each (the first walking in or the last walking off as the shot goes
// on; one running across, or in), and how they are (b.poses).
function cast(b, p) {
  const who = b.who.length ? b.who : b.has.has("three") ? ["a", "b", "c"] : ["a", "b"];
  const xs =
    who.length === 1
      ? [12]
      : who.length === 3
        ? [5, 12, 19]
        : b.has.has("far")
          ? [4, 20]
          : b.has.has("hug")
            ? [11, 13]
            : b.has.has("near") || b.has.has("umbrella")
              ? [9, 15]
              : [8, 16];
  if (b.has.has("come")) xs[0] -= Math.round((1 - Math.min(1, p * 1.5)) * 14);
  if (b.has.has("leave")) xs[xs.length - 1] += Math.round(Math.max(0, p - 0.3) * 24);
  return who.map((w, k) => {
    const pose = b.poses[w] || null;
    let x = xs[k];
    if (pose === "run") x = who.length === 1 ? Math.round(-4 + p * 34) : Math.round(xs[k] - (1 - Math.min(1, p / 0.5)) * 18);
    return { who: w, x, pose };
  });
}

// One of them, by how they are: standing (talking, or not), running (bobbing, with speed lines), turned
// away, kneeling, fallen to the floor (staggering first), or ill in bed.
function figure(rect, px, { x, pose }, hair, clothes, mouth, p, t) {
  if (pose === "lie") {
    rect(x - 4, 8, 11, 2, "#f2f2f2");
    rect(x - 4, 10, 1, 2, "#8a8f97");
    rect(x + 6, 10, 1, 2, "#8a8f97");
    rect(x - 3, 7, 2, 2, SKIN);
    rect(x - 4, 7, 1, 2, hair);
    rect(x - 1, 7, 7, 2, clothes === "#ffffff" ? "#cfe0f6" : "#cfe0f6");
    return;
  }
  if (pose === "fall" && p > 0.4) {
    rect(x - 3, 10, 2, 2, SKIN);
    rect(x - 4, 10, 1, 2, hair);
    rect(x - 1, 10, 6, 2, clothes);
    return;
  }
  const top =
    pose === "kneel" ? 5 : pose === "run" ? 3 - Math.round(Math.abs(Math.sin(t * 14))) : pose === "fall" ? 3 + Math.round(Math.sin(t * 20)) : 3;
  person(rect, px, x, top, { hair, clothes, mouth });
  if (pose === "back") rect(x - 1, top + 1, 4, 3, hair);
  if (pose === "run") for (const dy of [5, 7]) rect(x - 5, top + dy, 2, 1, "#ffffff");
}

/* ---------- the shots ---------- */

// A scene: the place, the people, what they hold, give and think, and the weather and the rest.
function scene(rect, px, w, drama, look, b, p, t, e) {
  const night = b.has.has("night");
  const tint = (c) => (night ? dim(c, 0.55) : c);
  const place = Object.keys(PLACES).find((k) => b.has.has(k));
  if (place) PLACES[place].back(rect, px, { ...b, p }, t, tint, night, look);
  else {
    rect(0, 0, w, 13, tint(look.back));
    rect(0, 10, w, 3, tint(look.floor));
    setting(rect, px, drama, b, t, tint);
  }
  const people = cast(b, p);
  const talker = Math.floor(e / 2) % people.length;
  const struck = b.has.has("slap") && p > 0.42 && people.length > 1 ? people[1] : null;
  people.forEach((c, k) => {
    const [hair, clothes] = lookOf(look, c.who);
    const bob = b.has.has("clash") || (drama === "sitcom" && b.face === "laugh") ? Math.round(Math.abs(Math.sin(t * 6))) : 0;
    const at = { ...c, x: c.x + (c === struck ? 1 : 0) };
    if (bob && !c.pose) person(rect, px, at.x, 3 - bob, { hair, clothes, mouth: k === talker && Math.sin(t * 9) > 0 });
    else figure(rect, px, at, hair, clothes, k === talker && !c.pose && Math.sin(t * 9) > 0, p, t);
    if (c === struck) px(at.x + 2, 5, "#f58aa6");
  });
  // The slap: an arm out, and a flash as it lands.
  if (b.has.has("slap") && people.length > 1) {
    const [a, v] = people;
    if (p > 0.3 && p < 0.46) rect(a.x + 4, 7, Math.max(1, v.x - a.x - 4), 1, SKIN);
    if (p > 0.42 && p < 0.47) rect(0, 0, w, 13, "#ffffff");
  }
  // In hand, and handed over: from the first's hand to the second's, half way through.
  const handOf = (c) => [c.x + 3, c.pose === "kneel" ? 10 : 8];
  for (const { who, what } of b.holds) {
    const c = people.find((o) => o.who === who);
    if (c && HELD[what] && !["lie", "fall"].includes(c.pose)) HELD[what](rect, px, ...handOf(c));
  }
  if (b.gives && HELD[b.gives] && people.length > 1) {
    const [from, to] = people;
    const k = Math.min(1, Math.max(0, (p - 0.25) / 0.45));
    const [x0, y0] = handOf(from);
    const [x1, y1] = [to.x - 3, 8];
    HELD[b.gives](rect, px, Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 2));
  }
  (place ? PLACES[place].front : (...args) => inFront(...args.slice(0, 2), drama, b, people))?.(rect, px, drama, b, people);
  effects(rect, px, b, people, t, w);
  // What they think, one bubble after another.
  b.thinks.forEach(({ who, icon }, k) => {
    const c = people.find((o) => o.who === who);
    if (c && p > 0.15 + k * 0.25 && !["lie", "fall"].includes(c.pose)) bubble(rect, px, icon, c.x, w);
    else if (c && c.pose === "lie" && p > 0.15 + k * 0.25) bubble(rect, px, icon, c.x - 3, w);
  });
}

// A face filling the picture: whose (`who`), with a look (`face`), blinking now and then and talking.
function closeUp(rect, px, look, b, t) {
  const [hair] = lookOf(look, b.who[0] || "a");
  const x = 8;
  rect(x, 2, 10, 11, SKIN);
  rect(x - 1, 0, 12, 3, hair);
  rect(x - 1, 3, 1, 10, hair);
  rect(x + 10, 3, 1, 10, hair);
  const blink = t % 4 < 0.15;
  const { face } = b;
  for (const [k, ex] of [x + 1, x + 6].entries()) {
    const inner = k ? ex : ex + 2; // the eye's end nearer the nose
    const outer = k ? ex + 2 : ex;
    if (face === "laugh") {
      px(ex, 6, "#2b2522");
      px(ex + 1, 5, "#2b2522");
      px(ex + 2, 6, "#2b2522");
    } else if (face === "kiss" || blink) rect(ex, 6, 3, 1, "#2b2522");
    else if (face === "shock") {
      rect(ex, 4, 3, 3, "#ffffff");
      px(ex + 1, 5, "#2b2522");
    } else if (face === "angry") {
      rect(ex, 6, 3, 2, "#2b2522");
      px(outer, 4, "#2b2522");
      px(ex + 1, 4, "#2b2522");
      px(inner, 5, "#2b2522");
    } else {
      rect(ex, 5, 3, 3, "#2b2522");
      px(ex, 5, "#ffffff");
      if (face === "tears" || face === "sad") {
        px(inner, 3, "#2b2522");
        px(ex + 1, 4, "#2b2522");
      }
    }
    if (face === "tears") px(ex + 1, 8 + (Math.floor(t * 4 + k) % 4), "#8fd3ff");
  }
  const flushed = face === "blush" || face === "kiss";
  rect(x + 1, flushed ? 8 : 9, 2, flushed ? 2 : 1, flushed ? "#f58aa6" : "#f7a1b5");
  rect(x + 7, flushed ? 8 : 9, 2, flushed ? 2 : 1, flushed ? "#f58aa6" : "#f7a1b5");
  if (face === "smile" || face === "blush") {
    rect(x + 4, 10, 2, 1, "#c4503f");
    px(x + 3, 9, "#c4503f");
    px(x + 6, 9, "#c4503f");
  } else if (face === "laugh") {
    rect(x + 3, 9, 4, 2, "#7a2a2a");
    rect(x + 4, 10, 2, 1, "#e0605a");
  } else if (face === "sad" || face === "tears") {
    rect(x + 4, 10, 2, 1, "#c4503f");
    px(x + 3, 11, "#c4503f");
    px(x + 6, 11, "#c4503f");
  } else if (face === "shock") rect(x + 4, 9, 2, 2, "#5a1a1a");
  else if (face === "angry") rect(x + 3, 10, 4, 1, "#7a2a2a");
  else if (face === "kiss") px(x + 5, 10, "#e0607a");
  else rect(x + 4, 10, 2, Math.sin(t * 9) > 0 ? 2 : 1, "#c4503f"); // talking
}

function heartAt(rect, px, x, y, c = "#ff6f9a") {
  px(x, y, c);
  px(x + 2, y, c);
  rect(x, y + 1, 3, 1, c);
  px(x + 1, y + 2, c);
}
function sparkles(px, x, y, t, n = 4) {
  for (let k = 0; k < n; k++) if (Math.sin(t * 9 + k * 1.7) > 0.2) px(x + [-2, 3, -1, 2, 4][k], y + [-1, 0, 2, 1, -2][k], "#fff6c9");
}

// Something that matters, up close (an item shot): `thing` as it is (`how`), `p` into the shot.
const ITEMS = {
  letter(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#e8d8c0");
    if (p < 0.35) {
      rect(7, 4, 12, 7, "#fff8ef");
      for (let k = 0; k < 6; k++) px(7 + k, 4 + Math.floor(k / 2), "#d8c8b0"), px(18 - k, 4 + Math.floor(k / 2), "#d8c8b0");
      rect(12, 7, 2, 2, "#c0392b");
      return;
    }
    const up = Math.round(Math.min(1, (p - 0.35) / 0.3) * 4);
    rect(7, 8, 12, 4, "#f2e8d8");
    rect(8, 5 - up, 10, 9, "#fff8ef");
    if (how === "note") for (let k = 0; k < 3; k++) glyph(px, ["..1", "..1", "11."], 9 + k * 3, 6 - up + (k % 2), "#3a3040");
    else for (let y = 6 - up; y < 12 - up; y += 2) rect(9, y, 6 + (y % 3), 1, "#9aa0b8");
    if (how === "heart" || !how) heartAt(rect, px, 14, 10 - up, "#e0405a");
  },
  ring(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#3a2a3a");
    rect(8, 7, 10, 5, "#c0304a");
    if (p < 0.3) return rect(8, 5, 10, 2, "#a0283e");
    rect(8, 2, 10, 3, "#a0283e");
    rect(9, 7, 8, 2, "#f2e8f0");
    rect(12, 5, 2, 1, "#f2c14e");
    px(11, 6, "#f2c14e");
    px(14, 6, "#f2c14e");
    rect(12, 4, 2, 1, "#bff4ff");
    sparkles(px, 12, 3, t);
  },
  phone(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#4a4a5a");
    rect(8, 0, 10, 13, "#2b2b33");
    rect(9, 1, 8, 11, how === "no" ? "#3a3a48" : "#f2f4f8");
    if (how === "no") {
      // A call not taken: the ringing, then the red button.
      rect(11, 2, 4, 3, "#c8ccd4");
      if (p < 0.6) for (const x of [10, 15]) if (Math.sin(t * 12) > 0) px(x, 3, "#ffffff");
      rect(12, 8, 2, 2, "#e0402e");
      if (p >= 0.6) glyph(px, ["1.1", ".1.", "1.1"], 15, 8, "#e0402e");
      return;
    }
    if (how === "alert") {
      rect(9, 1, 8, 2, "#e0402e");
      if (Math.sin(t * 8) > -0.3) rect(12, 4, 2, 4, "#e0402e"), rect(12, 9, 2, 1, "#e0402e");
      return;
    }
    rect(10, 2, 5, 2, "#d8dce6");
    if (p > 0.3) rect(12, 5, 4, 2, "#8fd3ff");
    if (p > 0.6) {
      rect(10, 8, 5, 3, "#d8dce6");
      if (how === "heart") heartAt(rect, px, 11, 8, "#ff4f7a");
      else rect(11, 9, 3, 1, "#9aa0b8");
    }
  },
  photo(rect, px, how, p, t, look) {
    rect(0, 0, 26, 13, "#c8a878");
    rect(6, 1, 14, 11, "#ffffff");
    rect(7, 2, 12, 8, "#bfe2f8");
    for (const [x, k] of [
      [9, 0],
      [14, 1],
    ]) {
      rect(x, 4, 3, 1, look.leads[k * 2]);
      rect(x, 5, 3, 2, SKIN);
      rect(x - 1, 7, 5, 3, look.leads[k * 2 + 1]);
    }
    if (how === "torn" && p > 0.4) rect(12, 0, Math.round((p - 0.4) * 6), 13, "#c8a878");
  },
  poison(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#2a2030");
    rect(8, 8, 9, 4, "#e8e8f0");
    rect(9, 7, 7, 1, p > 0.6 ? "#8a4ac0" : "#c89a5a");
    rect(15, 0, 3, 4, "#8a4ac0");
    px(16, 0, "#c8ccd4");
    if (p > 0.2 && p < 0.65) for (let k = 0; k < 2; k++) px(15, 4 + Math.floor((t * 6 + k * 1.5) % 3), "#b07ae0");
  },
  paper(rect, px, how, p) {
    rect(0, 0, 26, 13, "#c8b8a0");
    rect(7, 0, 12, 13, "#fff8ef");
    for (let y = 2; y < 12; y += 2) rect(9, y, 5 + ((y * 7) % 4), 1, "#9aa0b8");
    if (p > 0.3 && how === "check") glyph(px, ["....11", "...11.", "1.11..", "111...", ".1...."], 11, 4, "#3fa860");
    if (p > 0.3 && how === "no") glyph(px, ["11..11", ".1111.", "..11..", ".1111.", "11..11"], 10, 4, "#e0402e");
    if (!how) {
      rect(14, 6, 4, 4, "#e8e0d0");
      px(15, 7, "#8a5a3a"), px(16, 8, "#8a5a3a");
    }
  },
  cup(rect, px, how, p) {
    rect(0, 0, 26, 13, "#8a5a3a");
    if (how === "spill") {
      rect(4, 8, Math.round(4 + p * 14), 3, "#6b3a1a");
      rect(5, 5, 6, 4, "#ffffff");
      return;
    }
    rect(8, 1, 10, 11, "#ffffff");
    rect(9, 2, 8, 9, "#c89a5a");
    if (how === "heart" && p > 0.3) {
      const s = p > 0.6 ? "#fff1e0" : "#f2d8b8";
      rect(10, 4, 2, 2, s);
      rect(14, 4, 2, 2, s);
      rect(10, 6, 6, 1, s);
      rect(11, 7, 4, 1, s);
      rect(12, 8, 2, 1, s);
    }
  },
  ticket(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#8fd0f5");
    rect(4, 6, 18, 6, "#f6cf4a");
    for (let y = 6; y < 12; y += 2) px(16, y, "#c8a030");
    rect(6, 8, 7, 1, "#8a6a2a");
    rect(6, 10, 4, 1, "#8a6a2a");
    if (how === "plane") {
      const x = Math.round(p * 34) - 6;
      rect(x, 2, 6, 1, "#ffffff");
      rect(x + 2, 1, 1, 3, "#ffffff");
    }
  },
  calendar(rect, px, how, p) {
    rect(0, 0, 26, 13, "#f2e8d0");
    rect(6, 1, 14, 11, "#ffffff");
    rect(6, 1, 14, 2, "#e0402e");
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) px(8 + c * 2, 4 + r * 2, "#9aa0b8");
    if (p > 0.4) {
      rect(15, 7, 3, 1, "#e0402e");
      rect(15, 9, 3, 1, "#e0402e");
      px(15, 8, "#e0402e");
      px(17, 8, "#e0402e");
    }
  },
  cake(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#3a2a3a");
    if (how === "mess") {
      rect(8, 8, 11, 4, "#8a5a3a");
      rect(10, 6, 6, 2, "#6b3a1a");
      for (let k = 0; k < 3; k++) px(11 + k * 2, Math.round(5 - ((t * 2 + k) % 4)), "#8a8f97");
      return;
    }
    rect(7, 7, 12, 5, "#f7c6d6");
    rect(7, 7, 12, 1, "#ffffff");
    for (const x of [9, 13, 17]) {
      rect(x, 5, 1, 2, "#8fd3ff");
      px(x, 4, Math.sin(t * 10 + x) > 0 ? "#f6cf4a" : "#f39a33");
    }
    if (p > 0.5) sparkles(px, 13, 2, t);
  },
  mic(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#2a1f4a");
    for (const x of [4, 21]) for (let y = 0; y < 13; y++) if ((y + Math.floor(t * 4)) % 3) px(x + Math.round((y - 6) * 0.2), y, "#5a4a8a");
    rect(12, 2, 3, 3, "#9aa4b4");
    rect(13, 5, 1, 7, "#3a3a48");
    rect(11, 12, 5, 1, "#3a3a48");
    if (how === "no" && p > 0.4) glyph(px, ["1....1", ".1..1.", "..11..", ".1..1.", "1....1"], 10, 3, "#e0402e");
    else if (p > 0.5) sparkles(px, 13, 2, t);
  },
  hands(rect, px, how, p, t, look) {
    rect(0, 0, 26, 13, look.back);
    const k = Math.min(1, p / 0.5);
    const l = Math.round(-6 + k * 15);
    const r = Math.round(32 - k * 15);
    rect(l - 8, 6, 8, 3, look.leads[1]);
    rect(l, 6, 4, 3, SKIN);
    rect(r - 4, 7, 4, 3, SKIN);
    rect(r, 7, 8, 3, look.leads[3]);
    if (p > 0.6) heartAt(rect, px, 12, Math.round(3 - (p - 0.6) * 4));
  },
  jewel(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#1a1a2a");
    rect(9, 9, 8, 4, "#5a5a6a");
    rect(8, 2, 10, 7, "#2a3040");
    for (const x of [8, 17]) rect(x, 2, 1, 7, "#8fa8c8");
    rect(8, 2, 10, 1, "#8fa8c8");
    if (how === "gone") {
      if (Math.sin(t * 8) > 0) glyph(px, ["1", "1", ".", "1"], 13, 4, "#e0402e");
      return;
    }
    rect(12, 5, 3, 3, "#bff4ff");
    px(13, 4, "#e8fcff");
    sparkles(px, 13, 5, t);
  },
  monitor(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#0a1a14");
    const alarm = how === "alarm";
    const c = alarm ? "#e0402e" : "#7fe0a0";
    for (let x = 0; x < 26; x++) {
      const ph = (x + Math.floor(t * 12)) % 13;
      const y = !alarm && ph === 5 ? 3 : !alarm && ph === 6 ? 9 : alarm && p > 0.5 ? 7 : ph === 5 && Math.sin(t * 3) > 0 ? 4 : 7;
      px(x, y, c);
    }
    if (alarm && Math.sin(t * 10) > 0) rect(0, 0, 26, 1, "#e0402e");
    else if (!alarm) heartAt(rect, px, 21, 1, "#e0402e");
  },
  clock(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#3a3050");
    for (let y = 0; y < 13; y++)
      for (let x = 7; x < 20; x++) {
        const r = Math.hypot(x - 13, y - 6);
        if (r < 6.5) px(x, y, r > 5.4 ? "#c8a050" : "#fff8ef");
      }
    for (const [x, y] of [
      [13, 1],
      [18, 6],
      [13, 11],
      [8, 6],
    ])
      px(x, y, "#3a3050");
    const a = t * 6; // the hours flying by
    for (let k = 1; k < 5; k++) px(Math.round(13 + Math.sin(a) * k), Math.round(6 - Math.cos(a) * k), "#2b2522");
    for (let k = 1; k < 3; k++) px(Math.round(13 + Math.sin(a / 12) * k), Math.round(6 - Math.cos(a / 12) * k), "#e0402e");
  },
  hat(rect, px, how, p, t) {
    rect(0, 0, 26, 7, "#9fdcf5");
    rect(0, 7, 26, 6, "#3e8fd6");
    for (let k = 0; k < 4; k++) rect((k * 7 + Math.round(t * 9)) % 26, 1 + k * 2, 3, 1, "#ffffff");
    const x = Math.round(p * 30) - 4;
    const y = Math.round(5 - Math.sin(p * Math.PI) * 4);
    rect(x, y + 1, 6, 1, "#f2d27a");
    rect(x + 1, y, 4, 1, "#e8c060");
    rect(x + 1, y + 1, 4, 1, "#f2d27a");
    px(x + 4, y, "#e05aa0");
  },
  jade(rect, px, how, p, t) {
    rect(0, 0, 26, 13, "#8a1a2a");
    const x = 13 + Math.round(Math.sin(t * 1.5));
    rect(x, 0, 1, 3, "#e0402e");
    rect(x - 3, 3, 7, 7, "#3fae7a");
    rect(x - 1, 5, 3, 3, "#8a1a2a");
    px(x - 2, 4, "#8fe0b0");
    if (how === "broken" && p > 0.4) {
      for (let k = 0; k < 7; k++) px(x - 3 + k, 3 + ((k * 3) % 7), "#2a3a2a");
    }
  },
};

// The weather and the rest, over the picture.
function effects(rect, px, b, cast, t, w) {
  const { has } = b;
  if (has.has("dark")) {
    rect(0, 0, w, 13, "#06060a");
    for (const c of cast) if (Math.sin(t * 3 + c.x) > -0.8) px(c.x, 5, "#f2f2f2"), px(c.x + 1, 5, "#f2f2f2");
  }
  if (has.has("rain") || has.has("storm")) for (let k = 0; k < 12; k++) px((k * 7 + 3) % w, Math.floor((k * 4 + t * 16) % 13), "#cdd8f0");
  if (has.has("storm") && t % 3.3 < 0.15) rect(0, 0, w, 13, "#f4f4ff");
  if (has.has("petals")) for (let k = 0; k < 6; k++) px(Math.floor((k * 7 + t * 2) % w), Math.floor((k * 3 + t * 2.5) % 11), "#f7a1b5");
  if (has.has("spark")) for (let k = 0; k < 5; k++) if (Math.sin(t * 7 + k * 2.1) > 0.4) px((k * 5 + 3) % w, 1 + ((k * 3) % 8), "#fff6c9");
  if (has.has("alarm") && t % 0.8 < 0.4) rect(0, 0, w, 1, "#e0402e");
  if (has.has("smoke")) for (let k = 0; k < 4; k++) rect(18 + (k % 2), Math.round(4 - ((t * 2 + k) % 5)), 2, 1, "#9a9aa4");
  if (has.has("crowd"))
    for (let x = 0; x < w; x += 3) {
      const up = Math.sin(t * 6 + x) > 0 ? 1 : 0;
      rect(x, 11 - up, 2, 2, "#2b2522");
      if (has.has("spot")) px(x + 1, 9 - up, ["#f6cf4a", "#f28aa8", "#8fd3ff"][x % 3]);
    }
  if (has.has("fireworks")) {
    const burst = Math.floor(t * 1.1);
    const [bx, by] = [3 + Math.floor(hash(burst, 1, 9) * 20), 2 + Math.floor(hash(burst, 2, 9) * 2)];
    const r = 1 + ((t * 1.1) % 1) * 2;
    for (let a = 0; a < 6; a++) px(Math.round(bx + Math.cos(a) * r), Math.round(by + Math.sin(a) * r), ["#ff6f9a", "#f6cf4a", "#8fd3ff"][burst % 3]);
  }
  if (b.shot !== "scene" || cast.length < 2) return;
  if (has.has("umbrella")) {
    const [l, r] = [cast[0].x - 2, cast[1].x + 4];
    rect(l, 1, r - l, 1, "#f28aa8");
    rect(l + 2, 0, r - l - 4, 1, "#f28aa8");
    rect(Math.round((l + r) / 2), 2, 1, 6, "#5c4a4a");
  }
  if (has.has("clash")) {
    const mx = Math.round((cast[0].x + cast[1].x) / 2) + 1;
    rect(mx - 2, 7, 4, 1, "#c9d6e6");
    if (Math.sin(t * 12) > 0)
      for (const [dx, dy] of [
        [0, -1],
        [1, 0],
        [-1, 0],
        [0, 1],
      ])
        px(mx + dx, 7 + dy, "#fff6c9");
  }
  if (has.has("heart") && t % 5 > 3) {
    const x = Math.round((cast[0].x + cast[cast.length - 1].x) / 2);
    heartAt(rect, px, x, Math.round(7 - (t % 5)));
  }
}

// The opening card: the two leads' faces either side, the episode's number between them on a dark plate, its
// title writing itself in under that, and a sparkle.
function titleCard(rect, px, look, ep, p, t, w) {
  rect(0, 0, w, 13, look.back);
  rect(0, 9, w, 4, look.floor);
  for (const [k, x] of [
    [0, 2],
    [1, 19],
  ]) {
    const hair = look.leads[k * 2];
    rect(x, 3, 5, 5, SKIN);
    rect(x - 1, 2, 7, 2, hair);
    rect(x - 1, 4, 1, 4, hair);
    rect(x + 5, 4, 1, 4, hair);
    px(x + 1, 5, "#2b2522");
    px(x + 3, 5, "#2b2522");
  }
  rect(11, 1, 5, 7, "#1b1b22");
  number(px, ep + 1, 12, 2, "#ffffff");
  for (let k = 0; k < Math.min(2, Math.floor(p * 6)); k++) rect(10 + k, 9 + k * 2, 7 - k * 2, 1, "#ffffff");
  if (Math.sin(t * 6) > 0.3) px(9 + Math.floor((t * 4) % 9), 0, "#fff6c9");
}

// To be continued: the two leads' colours either side, frozen, and the words with their three dots. The
// end (`fin`): their colours bright, a heart between them, and the words.
function endCard(rect, px, look, t, w, fin) {
  rect(0, 0, 13, 13, fin ? look.leads[1] : dim(look.leads[1], 0.45));
  rect(13, 0, 13, 13, fin ? look.leads[3] : dim(look.leads[3], 0.45));
  if (fin) heartAt(rect, px, 12, 3 + Math.round(Math.sin(t * 2)));
  rect(fin ? 6 : 4, 9, fin ? 14 : 15, 1, "#f2f2f2");
  if (!fin) for (let k = 0; k < 3; k++) if (t % 1.5 > k * 0.4) px(20 + k * 2, 9, "#f2f2f2");
}

// Her drama on his computer: `drama` (DRAMAS), episode `ep`, `e` seconds into it. The shot she is at, the
// subtitles under the picture while they talk, and a thin red bar for how far into the episode she is.
export function drawPcDrama(g, w, h, drama, t, e, ep) {
  const { rect, px } = pen(g);
  if (!EPISODES[drama]) drama = "cafe";
  const look = DRAMA_LOOK[drama];
  const { b, p } = shotAt(drama, ep, e);
  if (b.shot === "title") titleCard(rect, px, look, ep, p, t, w);
  else if (b.shot === "end") endCard(rect, px, look, t, w, b.has.has("fin"));
  else if (b.shot === "item") (ITEMS[b.thing] || ITEMS.letter)(rect, px, b.how, p, t, look);
  else if (b.shot === "close") {
    rect(0, 0, w, 13, b.has.has("night") ? dim(look.back, 0.55) : look.back);
    closeUp(rect, px, look, b, t);
    effects(rect, px, b, [], t, w);
  } else scene(rect, px, w, drama, look, b, p, t, e);
  rect(0, 13, w, 2, "#1b1b22");
  if ((b.shot === "scene" || b.shot === "close") && e % 2.5 < 2) {
    const said = Math.floor(e / 2.5) + ep * 50;
    rect(5 + Math.floor(hash(said, 0, 22) * 4), 13, 10 + Math.floor(hash(said, 1, 22) * 6), 1, "#f2f2f2");
  }
  rect(0, 14, Math.max(1, Math.min(w, Math.round((e / episodeOf(drama, ep).secs) * w))), 1, "#e0605a");
}

// The side screen while she uses his computer, `w` by `h` on end (11 by 25). Watching a drama (`mode` "show",
// `game` its DRAMAS id, episode `ep`, `e` seconds in): a strip in the drama's colours, its episodes with this
// one picked out (the ones before seen), and how far in she is. Playing her farm game ("game", `ep` the day):
// stardew.js.
export function drawSideShow(g, w, h, mode, game, e, ep) {
  const { rect, px } = pen(g);
  if (mode === "off") return rect(0, 0, w, h, "#060608");
  if (mode !== "show") return drawFarmSide(g, w, h, e, ep);
  const drama = EPISODES[game] ? game : "cafe";
  const look = DRAMA_LOOK[drama];
  rect(0, 0, w, h, "#1f1f28");
  rect(0, 0, w, 4, look.back);
  rect(2, 1, 2, 3, look.leads[1]);
  rect(7, 1, 2, 3, look.leads[3]);
  const { episodes } = seriesOf(drama);
  episodes.forEach(({ title }, k) => {
    const y = 6 + k * 4;
    const now = k === ep;
    if (now) rect(0, y - 1, w, 3, "#3a3a4c");
    px(1, y, now ? "#e0605a" : k < ep ? "#7fe0a0" : "#6a6f86");
    rect(3, y, Math.min(7, 3 + (title.length % 5)), 1, now ? "#ffffff" : "#9aa0b8");
  });
  rect(1, 22, w - 2, 1, "#3a3a4c");
  rect(1, 22, Math.max(1, Math.min(w - 2, Math.round((e / episodeOf(drama, ep).secs) * (w - 2)))), 1, "#e0605a");
}
