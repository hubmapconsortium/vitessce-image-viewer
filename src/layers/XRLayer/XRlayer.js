/* eslint-disable prefer-destructuring */
// A lot of this codes inherits paradigms form DeckGL that
// we live in place for now, hence some of the not-destructuring

import GL from '@luma.gl/constants';
import { COORDINATE_SYSTEM, Layer, project32 } from '@deck.gl/core';
import { Model, Geometry, Texture2D } from '@luma.gl/core';
import vs from './xr-layer-vertex';
import fs from './xr-layer-fragment';

const defaultProps = {
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  channelData: { type: 'array', value: [], async: true },
  bounds: { type: 'array', value: [0, 0, 1, 1], compare: true },
  colorValues: { type: 'array', value: [], compare: true },
  sliderValues: { type: 'array', value: [], compare: true },
  tileSize: { type: 'number', value: 0, compare: true }
};

export default class XRLayer extends Layer {
  getShaders() {
    return super.getShaders({ vs, fs, modules: [project32] });
  }

  initializeState() {
    const attributeManager = this.getAttributeManager();
    attributeManager.add({
      positions: {
        size: 3,
        type: GL.DOUBLE,
        fp64: this.use64bitPositions(),
        update: this.calculatePositions,
        noAlloc: true
      }
    });
    this.setState({
      numInstances: 1,
      positions: new Float64Array(12)
    });

    attributeManager.remove('instancePickingColors');
  }

  finalizeState() {
    super.finalizeState();

    if (this.state.textures) {
      Object.values(this.state.textures).forEach(tex => tex && tex.delete());
    }
  }

  updateState({ props, oldProps, changeFlags }) {
    // setup model first
    if (changeFlags.extensionsChanged) {
      const { gl } = this.context;
      if (this.state.model) {
        this.state.model.delete();
      }
      this.setState({ model: this._getModel(gl) });

      this.getAttributeManager().invalidateAll();
    }
    if (props.channelData && props.channelData.length > 0) {
      if (props.channelData !== oldProps.channelData) {
        this.loadTexture(props.channelData);
      }
    }
    const attributeManager = this.getAttributeManager();
    if (props.bounds !== oldProps.bounds) {
      attributeManager.invalidate('positions');
    }
  }

  _getModel(gl) {
    if (!gl) {
      return null;
    }

    /*
       0,0 --- 1,0
        |       |
       0,1 --- 1,1
     */
    return new Model(gl, {
      ...this.getShaders(),
      id: this.props.id,
      geometry: new Geometry({
        drawMode: GL.TRIANGLE_FAN,
        vertexCount: 4,
        attributes: {
          texCoords: new Float32Array([0, 1, 0, 0, 1, 0, 1, 1])
        }
      }),
      isInstanced: false
    });
  }

  calculatePositions(attributes) {
    const { positions } = this.state;
    const { bounds } = this.props;
    // bounds as [minX, minY, maxX, maxY]
    /*
      (minX0, maxY3) ---- (maxX2, maxY3)
             |                  |
             |                  |
             |                  |
      (minX0, minY1) ---- (maxX2, minY1)
   */
    positions[0] = bounds[0];
    positions[1] = bounds[1];
    positions[2] = 0;

    positions[3] = bounds[0];
    positions[4] = bounds[3];
    positions[5] = 0;

    positions[6] = bounds[2];
    positions[7] = bounds[3];
    positions[8] = 0;

    positions[9] = bounds[2];
    positions[10] = bounds[1];
    positions[11] = 0;

    // eslint-disable-next-line  no-param-reassign
    attributes.value = positions;
  }

  draw({ uniforms }) {
    const { textures, model } = this.state;
    if (textures && model) {
      const { sliderValues, colorValues, opacity } = this.props;
      model
        .setUniforms({
          ...uniforms,
          colorValues,
          sliderValues,
          opacity,
          ...textures
        })
        .draw();
    }
  }

  loadTexture(channelData) {
    const textures = {
      channel0: null,
      channel2: null,
      channel3: null,
      channel4: null,
      channel5: null
    };
    if (this.state.textures) {
      Object.values(this.state.textures).forEach(tex => tex && tex.delete());
    }
    if (channelData.length > 0) {
      channelData.forEach(function(d, i) {
        textures[`channel${i}`] = this.dataToTexture(d);
      }, this);
      this.setState({ textures });
    }
  }

  dataToTexture(data) {
    const isInt8 = data instanceof Uint8Array;
    const isInt16 = data instanceof Uint16Array;
    const isInt32 = data instanceof Uint32Array;
    const formats = {
      format:
        (isInt8 && GL.R8UI) || (isInt16 && GL.R16UI) || (isInt32 && GL.R32UI),
      dataFormat: GL.RED_INTEGER,
      type:
        (isInt8 && GL.UNSIGNED_BYTE) ||
        (isInt16 && GL.UNSIGNED_SHORT) ||
        (isInt32 && GL.UNSIGNED_INT)
    };
    const texture = new Texture2D(this.context.gl, {
      width: this.props.tileSize,
      height: this.props.tileSize,
      data,
      // we don't want or need mimaps
      mipmaps: false,
      parameters: {
        // NEAREST for integer data
        [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
        [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
        [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
        [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE
      },
      ...formats
    });
    return texture;
  }
}

XRLayer.layerName = 'XRLayer';
XRLayer.defaultProps = defaultProps;
