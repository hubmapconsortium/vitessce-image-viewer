/* eslint-disable import/no-extraneous-dependencies, no-unused-expressions */
import test from 'tape-catch';
import { testLayer } from '@deck.gl/test-utils';
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import GL from '@luma.gl/constants';
import { XRLayer } from '../src/layers/xr-layer';

test('XRLayer#constructor', t => {
  const positions = new Float32Array([2, 4, 0, 2, 8, 0, 16, 8, 0, 16, 4, 0]);
  const data0 = new Uint32Array([200000000, 10000, 10000, 10000]);
  const data1 = new Uint32Array([200000000, 20000, 10000, 10000]);
  const tileSize = 2;
  testLayer({
    Layer: XRLayer,
    onError: t.notOk,
    testCases: [
      {
        title: 'Init layer',
        props: {
          bounds: [2, 4, 16, 8],
          sliderValues: [0, 10],
          colorValues: [0, 1, 1],
          pickable: false,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          id: 'New Layer',
          tileSize,
          data: [data0]
        },
        onAfterUpdate({ layer }) {
          t.ok(layer.state, 'should update layer state');
          t.deepEqual(
            layer.getAttributeManager().attributes.positions.value,
            positions,
            'should propagate positions'
          );
          t.deepEqual(
            layer.state.textures.channel0.type,
            GL.UNSIGNED_INT,
            'should propagate with one data channel'
          );
        }
      },
      {
        updateProps: {
          data: [data0, data1]
        },
        onAfterUpdate({ layer }) {
          t.deepEqual(
            layer.state.textures.channel0.type,
            GL.UNSIGNED_INT,
            'should update first data channel'
          );
          t.deepEqual(
            layer.state.textures.channel1.type,
            GL.UNSIGNED_INT,
            'should update second data channel'
          );
        }
      }
    ]
  });

  t.end();
});