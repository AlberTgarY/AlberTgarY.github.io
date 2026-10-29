/*******************************************************************************
 * Where everything is in the playground's flower shop (shop.js): a market
 * florist's kiosk of dark green steel and glass at the back left, its curved
 * glass awning out over the pavement, buckets of flowers banked in front of it
 * and along to the right, a plinth of house plants at the back right, a mural
 * of painted flowers behind it all and a plane tree in the corner. In voxels:
 * x to the right, y up, z towards the viewer (who looks from the front right
 * and above, as at the house); the pavement's top at y = 0.
 ******************************************************************************/

export const GROUND = { x0: -150, x1: 180, z0: -110, z1: 74 }; // the pavement (the mural stands behind it)
export const MURAL = { z: -112, h: 84 }; // the painted hoarding along the back, its face at z = -110

// The kiosk: walls of steel-framed glass round a floor a step up from the pavement (FLOOR), a flat roof.
export const KIOSK = { x0: -150, x1: 0, z0: -110, z1: -30, h: 70, roof: 4 };
export const FLOOR = 1; // the kiosk's floor, over the pavement
// Its front, from the left: a window bay, the wide doorway (the folding glass doors swung open to either
// side), and a narrow bay; the posts between them.
export const DOOR = { x0: -95, x1: -35 };
export const POSTS = [-150, -95, -35, 0];
export const SILL = 26; // the frosted panels below the glass, up to here
export const LINTEL = 62; // the beam over the doorway (the sign hangs behind it)

// The awning: glass from the roof's front edge out over the pavement, along the front, its edge curving up.
export const AWNING = { x0: -150, x1: 60, z0: -30, z1: -4, y0: 71, y1: 77 };

// Inside the kiosk.
export const BENCH = { x0: -148, x1: -126, z0: -104, z1: -48, h: 24 }; // the wrapping bench along the left wall
export const SHELF = { x0: -104, x1: -74, z0: -108, z1: -98, h: 58 }; // the wire shelving on the back wall
export const COOL = { x0: -62, x1: -40 }; // the cool room's door in the back wall
export const BOARD = { x0: -30, x1: -8, y0: 30, y1: 50 }; // the notice board on the back wall
export const DOG_BED = { x: -20, z: -50, r: 9 };
export const STOOL = { x: -112, z: -66 };

// The flowers out front: the tall grey-blue bins on a step before the left window, the low buckets before
// the doorway, and the rows of black buckets along to the right; the bucket of bouquets made up, by the door.
export const STEP = { x0: -150, x1: -100, z0: -28, z1: -6, h: 12 };
export const LEFT = { x0: -150, x1: -100, z0: -6, z1: 34 };
export const MIDDLE = { x0: -92, x1: -28, z0: 6, z1: 50 };
export const RIGHT = { x0: -12, x1: 148, z0: -6, z1: 50 };
export const MADE = { x: -89, z: -18 }; // the bucket of bouquets made up, beside the doorway

// The house plants: a concrete plinth with a two-tier rack on it, trays on the pavement in front.
export const PLINTH = { x0: 30, x1: 150, z0: -104, z1: -74, h: 14 };
export const TRAYS = { x0: 34, x1: 146, z0: -72, z1: -56 };
export const TREE = { x: 166, z: -94 }; // the plane tree, in the back right corner
export const TAP = { x: 2, z: -40 }; // the tap on the kiosk's right wall, outside, the watering can by it
export const BUCKET_STACKS = { x0: -150, x1: -134, z0: 40, z1: 60 }; // empty buckets stacked, front left
export const SIGN = { x: -116, z: 63 }; // the chalkboard A-frame, "Pick your own bunch"
export const BOWL = { x: -26, z: -2 }; // the dog's water bowl, outside by the door

// Its hours: ten in the morning to ten at night. At ten they come in, the shutter goes up and they set
// everything out, the sign turned to OPEN once it is all out; at ten at night they start bringing it all
// in; once it is in, the shutter comes down over the kiosk's front and they go home.
export const HOURS = { arrive: 10, open: 10, close: 22 };
// The roller shutter over the whole front: its housing under the awning, its curtain coming down just in
// front of the posts (behind the step) to the pavement.
export const SHUTTER = { x0: KIOSK.x0, x1: KIOSK.x1, z: KIOSK.z1 + 1.3, top: 63 };
// The lock-up cool room against the kiosk's right wall, outside: where the flowers out along to the right go
// for the night; its sliding door on the front, to the right.
export const LOCKUP = { x0: 2, x1: 28, z0: -108, z1: -64, h: 46, door: [13, 27] };
// Where people come into the street scene from and go off to: off the front edge of the pavement.
export const STREET = { z: GROUND.z1 + 10, x0: -100, x1: 170 };
