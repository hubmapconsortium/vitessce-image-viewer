/* eslint-disable import/no-extraneous-dependencies, no-unused-expressions */
import test from 'tape-catch';
import { generateLayerTests, testLayer } from '@deck.gl/test-utils';
import { OrthographicView } from '@deck.gl/core';
import ScaleBarLayer from '../../../src/layers/StaticImageLayer';

test('StaticImageLayer', t => {
  const view = new OrthographicView({
    id: 'ortho',
    controller: true,
    height: 4,
    width: 4,
    target: [2, 2, 0],
    zoom: 0
  });
  const testCases = generateLayerTests({
    Layer: ScaleBarLayer,
    assert: t.ok,
    sampleProps: {
      boundingBox: [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2]
      ],
      PhysicalSizeXUnit: 'cm',
      PhysicalSizeX: 1,
      position: 'bottom-left'
    },
    onBeforeUpdate: ({ testCase }) => t.comment(testCase.title)
  });
  testLayer({
    Layer: ScaleBarLayer,
    testCases,
    onError: t.notOkimport,
    viewport: view.makeViewport({
      height: 4,
      width: 4,
      viewState: { target: [2, 2, 0], zoom: 0, width: 4, height: 4 }
    })
  });
  t.end();
});
