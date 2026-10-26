/*******************************************************************************
 * What is on the playground's screens (house.js draws them a few times a
 * second, a texel a pixel): the TV's channels (a nature programme, a cartoon, a
 * cooking show, the weather forecast with today's real sky, adverts, a football
 * match, a concert, a baking contest, a travel show, an ocean documentary,
 * tennis, a late-night film, the evening news at seven and four real dramas),
 * the game the two of them play on it, and the games he plays on his computer
 * (a platformer, a farm, a world of blocks, a race, a falling-blocks puzzle, a
 * space shooter, a rhythm game, fishing, tower defence, karts, pinball, a
 * memory card game, snake, a monster battle) with their win and loss screens,
 * the launcher he picks them from and what his side screen shows meanwhile;
 * and, when the girl sits at his computer, one of the four dramas (clips cut
 * from the real episodes) or a day of her cosy farm game, scene by scene, and
 * what the side screen shows meanwhile; and what in them she reacts to.
 *
 * The drawing is in screens/: tv.js, pc.js, clipshows.js and stardew.js, on
 * pen.js; and posters.js, her farm game's poster for the visitor to choose.
 ******************************************************************************/

export { CHANNELS, HI_RES, drawChannel, drawTvGame } from "./screens/tv.js";
export { GAMES, SIDES, drawPcGame, drawGameSide } from "./screens/pc.js";
export { CLIP_SHOWS, DRAMAS, episodeOf, clipLength, clipMoment, drawClipShow, drawClipSide, drawClipThumb } from "./screens/clipshows.js";
export { stardewMoment, FARM_DAY, drawFarmSide } from "./screens/stardew.js";
export { POSTER, drawPoster } from "./screens/posters.js";
