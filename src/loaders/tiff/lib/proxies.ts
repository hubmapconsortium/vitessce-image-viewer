import type { GeoTIFF } from 'geotiff';
import Pool from './Pool';

const VIV_PROXY_KEY = '__viv';
export function addProxies(
  tiff: GeoTIFF,
  usePool: boolean,
  offsets?: number[]
) {
  if (usePool) {
    /*
     * Creates a worker pool to decode tiff tiles. Wraps tiff
     * in a Proxy that injects 'pool' into `tiff.readRasters`.
     */
    const pool = new Pool();
    tiff = createPoolProxy(tiff, pool);
  }

  if (offsets) {
    /*
     * Performance enhancement. If offsets are provided, we
     * create a proxy that intercepts calls to `tiff.getImage`
     * and injects the pre-computed offsets.
     */
    tiff = createOffsetsProxy(tiff, offsets);
  }

  return tiff;
}

/*
 * Inspect if the GeoTIFF source is wrapped in our proxies,
 * and warn if missing.
 */
export function checkProxies(tiff: GeoTIFF) {
  if (!isProxy(tiff, OFFSETS_PROXY_KEY)) {
    console.warn('GeoTIFF source is missing offsets proxy.');
  }

  if (!isProxy(tiff, POOL_PROXY_KEY)) {
    console.warn('GeoTIFF source is missing decoder-pool proxy.');
  }
}

/*
 * > isProxy(tiff, POOL_PROXY_KEY) === true; // false
 * > tiff = createPoolProxy(tiff, new Pool());
 * > isProxy(tiff, POOL_PROXY_KEY) === true; // true
 */
function isProxy(tiff: GeoTIFF, proxyFlag: string) {
  return proxyFlag in tiff;
}

/*
 * Creates an ES6 Proxy that wraps a GeoTIFF object. The proxy
 * handler intercepts calls to `tiff.getImage` and uses our custom
 * pre-computed offsets to pre-fetch the correct file directory.
 *
 * This is a bit of a hack. Internally GeoTIFF inspects `this.ifdRequests`
 * to see which fileDirectories need to be traversed. By adding the
 * ifdRequest for an 'index' manually, GeoTIFF will await that request
 * rather than traversing the file system remotely.
 */
const OFFSETS_PROXY_KEY = `${VIV_PROXY_KEY}-offsets` as const;
function createOffsetsProxy(tiff: GeoTIFF, offsets: number[]) {
  const get = (target: GeoTIFF, key: any) => {
    // Intercept `tiff.getImage`
    if (key === 'getImage') {
      return (index: number) => {
        // Manually add ifdRequest to tiff if missing and we have an offset.
        if (!(index in target.ifdRequests) && index in offsets) {
          const offset = offsets[index];
          target.ifdRequests[index] = target.parseFileDirectoryAt(offset);
        }
        return target.getImage(index);
      };
    }

    // tiff['__viv-offsets'] === true
    if (key === OFFSETS_PROXY_KEY) {
      return true;
    }

    return Reflect.get(target, key);
  };
  return new Proxy(tiff, { get });
}

/*
 * Creates an ES6 Proxy that wraps a GeoTIFF object. The proxy
 * handler intercepts calls to `tiff.readRasters` and injects
 * a pool argument to every call. This means our TiffPixelSource
 * doesn't need to be aware of whether a decoder pool is in use.
 *
 * > tiff.readRasters({ window }) -> tiff.readRasters({ window, pool });
 */
const POOL_PROXY_KEY = `${VIV_PROXY_KEY}-decoder-pool` as const;
function createPoolProxy(tiff: GeoTIFF, pool: Pool) {
  const get = (target: GeoTIFF, key: any) => {
    // Intercept calls to `image.readRasters`
    if (key === 'readRasters') {
      return (options: Parameters<typeof target.readRasters>) => {
        // Inject `pool` argument with other raster options.
        return target.readRasters({ ...options, pool });
      };
    }

    // tiff['__viv-decoder-pool'] === true
    if (key === POOL_PROXY_KEY) {
      return true;
    }

    return Reflect.get(target, key);
  };
  return new Proxy(tiff, { get });
}