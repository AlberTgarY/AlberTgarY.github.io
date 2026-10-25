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
 * computer, the TV dramas she streams (a palace drama, a romance in the rain, a
 * hospital drama, a detective mystery, a school romance, a sword fight in the
 * bamboo, a family sitcom, a café romance) or her cosy farm game, and what the
 * side screen shows meanwhile.
 *
 * The drawing is in screens/: tv.js, pc.js and dramas.js, on pen.js.
 ******************************************************************************/

export { CHANNELS, drawChannel, drawTvGame } from "./screens/tv.js";
export { GAMES, SIDES, drawPcGame, drawGameSide } from "./screens/pc.js";
export { DRAMAS, GIRL_GAMES, drawPcDrama, drawSideShow } from "./screens/dramas.js";
