import test from 'tape';
import { fromFile } from 'geotiff';

import OMETiffLoader from '../../src/loaders/OMETiffLoader';

test('OME-TIFF Properties', async t => {
  t.plan(3);
  try {
    const tiff = await fromFile('tests/loaders/fixtures/multi-channel.ome.tif');
    const firstImage = await tiff.getImage();
    const { ImageDescription: omexmlString } = firstImage.fileDirectory;
    const loader = new OMETiffLoader({
      tiff,
      pool: { decode: () => new Promise([]) },
      firstImage,
      omexmlString,
    });
    const { width, height, isPyramid } = loader;
    t.equal(width, 439);
    t.equal(height, 167);
    t.equal(isPyramid, false);
    t.end();
  } catch (e) {
    t.fail(e);
  }
});

test('OME-TIFF Selection', async t => {
  t.plan(1);
  try {
    const tiff = await fromFile('tests/loaders/fixtures/multi-channel.ome.tif');
    const firstImage = await tiff.getImage();
    const { ImageDescription: omexmlString } = firstImage.fileDirectory;
    const loader = new OMETiffLoader({
      tiff,
      pool: { decode: () => new Promise([]) },
      firstImage,
      omexmlString,
    });
    const selection = loader._getIFDIndex({ channel: 1 });

    t.deepEqual(selection, 1);
    t.end();
  } catch (e) {
    t.fail(e);
  }
});
