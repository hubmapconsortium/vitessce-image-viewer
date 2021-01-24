import { getDims, getLabels } from '../../utils';
import type { OMEXML } from '../../omexml';

const DTYPE_LOOKUP = {
  uint8: 'Uint8',
  uint16: 'Uint16',
  uint32: 'Uint32',
  float: 'Float32',
  // TODO: we currently need to cast these dtypes to their uint counterparts.
  int8: 'Uint8',
  int16: 'Uint16',
  int32: 'Uint32'
} as const;

export function getOmePixelSourceMeta({ Pixels }: OMEXML[0]) {
  // e.g. 'XYZCT' -> ['t', 'c', 'z', 'y', 'x']
  const labels = getLabels(Pixels.DimensionOrder);

  // Compute "shape" of image
  const dims = getDims(labels);
  const shape: number[] = Array(labels.length).fill(0);
  shape[dims('t')] = Pixels.SizeT;
  shape[dims('c')] = Pixels.SizeC;
  shape[dims('z')] = Pixels.SizeZ;

  // Push extra dimension if data are interleaved.
  if (Pixels.Interleaved) {
    // @ts-ignore
    labels.push('_c');
    shape.push(3);
  }

  // Creates a new shape for different level of pyramid.
  // Assumes factor-of-two downsampling.
  const getShape = (level: number) => {
    const s = [...shape];
    s[dims('x')] = Pixels.SizeX >> level;
    s[dims('y')] = Pixels.SizeY >> level;
    return s;
  };

  if (!(Pixels.Type in DTYPE_LOOKUP)) {
    throw Error(`Pixel type ${Pixels.Type} not supported.`);
  }

  const dtype = DTYPE_LOOKUP[Pixels.Type as keyof typeof DTYPE_LOOKUP];

  if (Pixels.PhysicalSizeX && Pixels.PhysicalSizeY) {
    const physicalSizes = {
      x: {
        size: Pixels.PhysicalSizeX,
        unit: Pixels.PhysicalSizeXUnit
      },
      y: {
        size: Pixels.PhysicalSizeY,
        unit: Pixels.PhysicalSizeYUnit
      }
    };
    return { labels, getShape, physicalSizes, dtype };
  }

  return { labels, getShape, dtype };
}