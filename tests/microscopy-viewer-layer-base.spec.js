/* eslint-disable import/no-extraneous-dependencies, no-unused-expressions */
import test from 'tape-catch';
import { testLayer } from '@deck.gl/test-utils';
import { VivViewerLayerBase } from '../src/layers/viv-viewer-layer/viv-viewer-layer-base';

test('VivViewerLayerBase#constructor', t => {
  testLayer({
    Layer: VivViewerLayerBase,
    onError: t.notOk,
    testCases: [
      {
        title: 'Init layer',
        props: {
          sliderValues: { channel0: [0, 10], channel1: [2, 9] },
          colorValues: { channel0: [0, 255, 255], channel1: [255, 0, 255] },
          channelsOn: { channel0: true, channel1: true },
          tileSize: 2,
          imageWidth: 4,
          imageHeight: 4
        },
        onAfterUpdate({ layer }) {
          t.deepEqual(
            layer.props.sliderValues,
            [
              0,
              10,
              2,
              9,
              65535,
              65535,
              65535,
              65535,
              65535,
              65535,
              65535,
              65535
            ],
            'should flatten sliders'
          );
          t.deepEqual(
            layer.props.colorValues,
            [
              [0, 1, 1],
              [1, 0, 1],
              [0, 0, 0],
              [0, 0, 0],
              [0, 0, 0],
              [0, 0, 0]
            ],
            'should flatten sliders'
          );
        }
      },
      {
        title: 'Change Color layer',
        props: {
          sliderValues: { channel0: [0, 10], channel1: [2, 9] },
          colorValues: { channel0: [0, 0, 255], channel1: [255, 0, 255] },
          channelsOn: { channel0: true, channel1: true },
          tileSize: 2,
          imageWidth: 4,
          imageHeight: 4
        },
        onAfterUpdate({ layer }) {
          t.deepEqual(
            layer.props.colorValues,
            [
              [0, 0, 1],
              [1, 0, 1],
              [0, 0, 0],
              [0, 0, 0],
              [0, 0, 0],
              [0, 0, 0]
            ],
            'should flatten sliders'
          );
        }
      },
      {
        title: 'Turn off channel',
        props: {
          sliderValues: { channel0: [0, 10], channel1: [2, 9] },
          colorValues: { channel0: [0, 0, 255], channel1: [255, 0, 255] },
          channelsOn: { channel0: false, channel1: true },
          tileSize: 2,
          imageWidth: 4,
          imageHeight: 4
        },
        onAfterUpdate({ layer }) {
          t.deepEqual(
            layer.props.colorValues,
            [
              [0, 0, 0],
              [1, 0, 1],
              [0, 0, 0],
              [0, 0, 0],
              [0, 0, 0],
              [0, 0, 0]
            ],
            'should turn off first channel color'
          );
          t.deepEqual(
            layer.props.sliderValues,
            [
              65535,
              65535,
              2,
              9,
              65535,
              65535,
              65535,
              65535,
              65535,
              65535,
              65535,
              65535
            ],
            'should turn off first slider'
          );
        }
      }
    ]
  });

  t.end();
});