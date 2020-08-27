import { openArray, HTTPStore } from 'zarr';
import { fromBlob, fromUrl } from 'geotiff';
import Pool from './Pool';
import ZarrLoader from './zarrLoader';
import OMETiffLoader from './OMETiffLoader';
import { getChannelStats, getJson, dimensionsFromOMEXML } from './utils';
import OMEXML from './omeXML';
import FileStore from './fileStore';

export async function createZarrLoader({
  url,
  dimensions,
  isPyramid,
  isRgb,
  scale,
  translate,
  is3d
}) {
  // TODO: This is a legacy initialization function. There is an official
  // specification now for multiscale datasets (see below), that doesn't
  // consolidate metadata in this way.
  let data;
  if (isPyramid) {
    const metadataUrl = `${url}${url.slice(-1) === '/' ? '' : '/'}.zmetadata`;
    const response = await fetch(metadataUrl);
    const { metadata } = await response.json();
    const paths = Object.keys(metadata)
      .filter(metaKey => metaKey.includes('.zarray'))
      .map(arrMetaKeys => arrMetaKeys.slice(0, -7));
    data = Promise.all(paths.map(path => openArray({ store: url, path })));
  } else {
    data = openArray({ store: url });
  }
  return new ZarrLoader({
    data: await data,
    dimensions,
    scale,
    translate,
    isRgb,
    is3d
  });
}

/**
 * This function wraps parsing OME-XML metadata and creating a zarr loader.
 * @param {(string | File[])}, either a string URL or array of File Objects.
 */
export async function createBioformatsZarrLoader({ source }) {
  const METADATA = 'METADATA.ome.xml';
  const ZARR_DIR = 'data.zarr/';

  let store;
  let omexmlBuffer;
  if (typeof source === 'string') {
    // Remote Zarr
    const baseUrl = source.endsWith('/') ? source : `${source}/`;
    const metaUrl = `${baseUrl}${METADATA}`;
    store = new HTTPStore(`${baseUrl}${ZARR_DIR}`); // first image
    omexmlBuffer = await fetch(metaUrl).then(res => res.arrayBuffer());
  } else {
    // Local Zarr
    /*
     * You can't randomly access files from a directory by path name
     * without the Native File System API, so we need to get objects for _all_
     * the files right away for Zarr. This is unfortunate because we need to iterate
     * over all File objects and create an in-memory index.
     */
    const fMap = new Map();
    let keyPrefixLength;
    for (let i = 0; i < source.length; i += 1) {
      const file = source[i];
      if (file.name === METADATA) {
        // Find the metadata file.
        // eslint-disable-next-line no-await-in-loop
        omexmlBuffer = await file.arrayBuffer();
      } else {
        if (!keyPrefixLength) {
          keyPrefixLength = file.path.indexOf(ZARR_DIR) + ZARR_DIR.length;
        }
        const path = file.path.slice(keyPrefixLength);
        fMap.set(path, file);
      }
    }
    store = new FileStore(fMap);
  }

  const rootAttrs = await getJson(store, '0/.zattrs');
  let resolutions = ['0'];
  if ('multiscales' in rootAttrs) {
    // Get path to subresolutions if they exist
    const { datasets } = rootAttrs.multiscales[0];
    resolutions = datasets.map(d => `0/${d.path}`);
  }

  const promises = resolutions.map(path => openArray({ store, path }));
  const pyramid = await Promise.all(promises);

  /*
   * TODO: There should be a much better way to do this.
   * If base image is small, we don't need to fetch data for the
   * top levels of the pyramid. For large images, the tile sizes (chunks)
   * will be the same size for x/y. We check the chunksize here for this edge case.
   */
  const { chunks, shape } = pyramid[0];
  const shouldUseBase = chunks[-1] !== chunks[-2];
  const data = pyramid.length > 1 || shouldUseBase ? pyramid : pyramid[0];

  // Get OMEXML string
  const omexmlString = new TextDecoder().decode(new Uint8Array(omexmlBuffer));
  const omexml = new OMEXML(omexmlString);
  const dimensions = dimensionsFromOMEXML(omexml);

  /*
   * Specifying different dimension orders form the METADATA.ome.xml is
   * possible and necessary for creating an OME-Zarr precursor.
   *
   * e.g. `bioformats2raw --file_type=zarr --dimension-order='XYZCY'`
   *
   * Here we check the shape of base of the pyrmaid and compare the shape
   * to the shape of the dimensions. If they are different, we reorder the
   * dimensions to create the zarr loader. This is fragile code, and will only
   * be executed if someone tries to specify different dimension orders.
   */
  const nonXYShape = shape.slice(0, -2); // XY always last dims and don't need to be compared
  const nonXYDims = dimensions.filter(d => d.values); // XY are null
  const allSameSize = nonXYShape.every(
    (s, i) => s === nonXYDims[i].values.length
  );
  if (!allSameSize) {
    const sortedDims = [];
    // Greedily match first matching dimension
    nonXYShape.forEach(len => {
      const firstMatchedDim = nonXYDims.filter(d => d.values.length === len)[0];
      sortedDims.push(firstMatchedDim);
    });
    const newDimensions = [...sortedDims, ...dimensions.slice(-2)]; // append YX dims
    return new ZarrLoader({ data, dimensions: newDimensions });
  }

  return new ZarrLoader({ data, dimensions });
}

/**
 * This function wraps creating a ome-tiff loader.
 * @param {Object} args
 * @param {String} args.urlOrFile URL or File Object from which to fetch the tiff.
 * @param {Array} args.offsets List of IFD offsets.
 * @param {Object} args.headers Object containing headers to be passed to all fetch requests.
 */
export async function createOMETiffLoader({
  urlOrFile,
  offsets = [],
  headers = {}
}) {
  let tiff;
  if (urlOrFile instanceof File) {
    tiff = await fromBlob(urlOrFile);
  } else {
    tiff = await fromUrl(urlOrFile, headers);
  }
  const firstImage = await tiff.getImage(0);
  const pool = new Pool();
  const omexmlString = firstImage.fileDirectory.ImageDescription;
  return new OMETiffLoader({
    tiff,
    pool,
    firstImage,
    omexmlString,
    offsets
  });
}

export { ZarrLoader, OMETiffLoader, getChannelStats };
