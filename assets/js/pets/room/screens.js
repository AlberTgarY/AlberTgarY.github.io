/*******************************************************************************
 * What is on the playground's screens (house.js draws them a few times a
 * second, a texel a pixel): the TV's channels (a nature programme, a cartoon, a
 * cooking show, the evening news, the weather forecast with today's real sky,
 * adverts, a football match, a concert, a craft show, a baking contest, a
 * travel show, an ocean documentary, a pop video, a quiz, a gardening show,
 * tennis, an anime drama, a late-night film), the game the two of them play on
 * it, and the games he plays on his computer (a platformer, a farm, a world of
 * blocks, a race, a falling-blocks puzzle, a space shooter, a rhythm game,
 * fishing, tower defence, karts, pinball, a memory card game, snake, a monster
 * battle) with their win and loss screens, the launcher he picks them from and
 * what his side screen shows meanwhile; and, when the girl sits at his
 * computer, the dramas she streams (a palace drama, a romance in the rain, a
 * hospital drama, a detective mystery, a school romance, a sword fight in the
 * bamboo, a family sitcom, a café romance, an office romance, an idol story,
 * immortals in the clouds, a summer by the sea), each episode shot by shot, or
 * a day of her cosy farm game, scene by scene, and what the side screen shows
 * meanwhile; and what in them she reacts to.
 *
 * The drawing is in screens/: tv.js, pc.js, dramas.js and stardew.js, on pen.js;
 * and posters.js, the posters of her shows for the visitor to choose from.
 ******************************************************************************/

export { CHANNELS, drawChannel, drawTvGame } from "./screens/tv.js";
export { GAMES, SIDES, drawPcGame, drawGameSide } from "./screens/pc.js";
export { DRAMAS, GIRL_GAMES, drawPcDrama, drawSideShow, dramaMoment, seriesOf } from "./screens/dramas.js";
export { stardewMoment, FARM_DAY } from "./screens/stardew.js";
export { POSTER, drawPoster } from "./screens/posters.js";
