export function isInTileBounds({
  x,
  y,
  z,
  width,
  height,
  tileSize,
  numLevels
}) {
  const xInBounds = x < Math.ceil(width / (tileSize * 2 ** z)) && x >= 0;
  const yInBounds = y < Math.ceil(height / (tileSize * 2 ** z)) && y >= 0;
  const zInBounds = z >= 0 && z < numLevels;
  return xInBounds && yInBounds && zInBounds;
}

export function guessRgb(shape) {
  const lastDimSize = shape[shape.length - 1];
  return shape.length > 2 && (lastDimSize === 3 || lastDimSize === 4);
}

// Credit to https://github.com/zbjornson/node-bswap/blob/master/bswap.js for the implementation.
// I could not get this to import, and it doesn't appear anyone else can judging by the "Used by" on github.
// We need this for handling the endianness returned by geotiff since it only returns bytes.
function flip16(info) {
  const flipper = new Uint8Array(info.buffer, info.byteOffset, info.length * 2);
  const len = flipper.length;
  for (let i = 0; i < len; i += 2) {
    const t = flipper[i];
    flipper[i] = flipper[i + 1];
    flipper[i + 1] = t;
  }
}

function flip32(info) {
  const flipper = new Uint8Array(info.buffer, info.byteOffset, info.length * 4);
  const len = flipper.length;
  for (let i = 0; i < len; i += 4) {
    let t = flipper[i];
    flipper[i] = flipper[i + 3];
    flipper[i + 3] = t;
    t = flipper[i + 1];
    flipper[i + 1] = flipper[i + 2];
    flipper[i + 2] = t;
  }
}

function flip64(info) {
  const flipper = new Uint8Array(info.buffer, info.byteOffset, info.length * 8);
  const len = flipper.length;
  for (let i = 0; i < len; i += 8) {
    let t = flipper[i];
    flipper[i] = flipper[i + 7];
    flipper[i + 7] = t;
    t = flipper[i + 1];
    flipper[i + 1] = flipper[i + 6];
    flipper[i + 6] = t;
    t = flipper[i + 2];
    flipper[i + 2] = flipper[i + 5];
    flipper[i + 5] = t;
    t = flipper[i + 3];
    flipper[i + 3] = flipper[i + 4];
    flipper[i + 4] = t;
  }
}

export function flipEndianness(arr) {
  switch (arr.BYTES_PER_ELEMENT) {
    case 1:
      // no op
      return;
    case 2:
      flip16(arr);
      break;
    case 4:
      flip32(arr);
      break;
    case 8:
      flip64(arr);
      break;
    default:
      throw new Error('Invalid input');
  }
}

export function padTileWithZeros(tile, tileSize) {
  const { data, width, height } = tile;
  // Create new TypedArray with same constructor (filled with zeros)
  const padded = new data.constructor(tileSize * tileSize);
  // Take (row) strips from original tile data and fill padded tile using
  // multiples of the tileSize as the offset.
  for (let i = 0; i < height; i += 1) {
    const subset = data.subarray(i * width, (i + 1) * width);
    padded.set(subset, i * tileSize);
  }
  return padded;
}