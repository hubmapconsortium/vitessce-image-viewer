import { CompositeLayer, COORDINATE_SYSTEM } from '@deck.gl/core';
import { LineLayer, TextLayer } from '@deck.gl/layers';

function getPosition(boundingBox, position) {
  const viewLength = boundingBox[2][0] - boundingBox[0][0];
  switch (position) {
    case 'bottom-right': {
      const yCoord =
        boundingBox[2][1] - (boundingBox[2][1] - boundingBox[0][1]) * 0.07;
      const xLeftCoord = boundingBox[2][0] - viewLength * 0.07;
      return [yCoord, xLeftCoord];
    }
    case 'top-right': {
      const yCoord = (boundingBox[2][1] - boundingBox[0][1]) * 0.07;
      const xLeftCoord = boundingBox[2][0] - viewLength * 0.07;
      return [yCoord, xLeftCoord];
    }
    case 'top-left': {
      const yCoord = (boundingBox[2][1] - boundingBox[0][1]) * 0.07;
      const xLeftCoord = viewLength * 0.07;
      return [yCoord, xLeftCoord];
    }
    case 'bottom-left': {
      const yCoord =
        boundingBox[2][1] - (boundingBox[2][1] - boundingBox[0][1]) * 0.07;
      const xLeftCoord = viewLength * 0.07;
      return [yCoord, xLeftCoord];
    }
    default: {
      throw new Error(`Position ${position} not found`);
    }
  }
}

const defaultProps = {
  pickable: false,
  boundingBox: {
    type: 'array',
    value: [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 0]
    ],
    compare: true
  },
  PhysicalSizeXUnit: { type: 'string', value: '', compare: true },
  PhysicalSizeX: { type: 'number', value: 1, compare: true },
  position: { type: 'string', value: 'bottom-right', compare: true }
};

/**
 * This layer creates a scale bar using three LineLayers and a TextLayer.
 * @param {Object} props
 * @param {String} props.PhysicalSizeXUnit Physical unit size per pixel at full resolution.
 * @param {Number} props.PhysicalSizeX Physical size of a pixel.
 * @param {Array} props.boundingBox Boudnign box of the view in which this should render.
 * @param {id} props.id Id from the parent layer.
 * @param {id} props.position Location of the viewport - one of "bottom-right", "top-right", "top-left", "bottom-left."  Default is 'bottom-right'.
 */
export default class ScaleBarLayer extends CompositeLayer {
  renderLayers() {
    const {
      id,
      boundingBox,
      PhysicalSizeXUnit,
      PhysicalSizeX,
      position
    } = this.props;
    const viewLength = boundingBox[2][0] - boundingBox[0][0];
    const barLength = viewLength * 0.05;
    const barHeight = (boundingBox[2][1] - boundingBox[0][1]) * 0.005;
    const numUnits = barLength * PhysicalSizeX;
    const [yCoord, xLeftCoord] = getPosition(boundingBox, position);
    const lengthBar = new LineLayer({
      id: `scale-bar-length-${id}`,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      data: [
        [
          [xLeftCoord, yCoord],
          [xLeftCoord + barLength, yCoord]
        ]
      ],
      getSourcePosition: d => d[0],
      getTargetPosition: d => d[1],
      getWidth: 2,
      getColor: [220, 220, 220]
    });
    const tickBoundsLeft = new LineLayer({
      id: `scale-bar-height-left-${id}`,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      data: [
        [
          [xLeftCoord, yCoord - barHeight],
          [xLeftCoord, yCoord + barHeight]
        ]
      ],
      getSourcePosition: d => d[0],
      getTargetPosition: d => d[1],
      getWidth: 2,
      getColor: [220, 220, 220]
    });
    const tickBoundsRight = new LineLayer({
      id: `scale-bar-height-right-${id}`,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      data: [
        [
          [xLeftCoord + barLength, yCoord - barHeight],
          [xLeftCoord + barLength, yCoord + barHeight]
        ]
      ],
      getSourcePosition: d => d[0],
      getTargetPosition: d => d[1],
      getWidth: 2,
      getColor: [220, 220, 220]
    });
    const textLayer = new TextLayer({
      id: `units-label-layer-${id}`,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      data: [
        {
          text: String(numUnits).slice(0, 5) + PhysicalSizeXUnit,
          position: [xLeftCoord + barLength * 0.5, yCoord + barHeight * 4]
        }
      ],
      getColor: [220, 220, 220, 255],
      getSize: 11,
      characterSet: [
        ...PhysicalSizeXUnit.split(''),
        ...String(numUnits).split('')
      ]
    });
    return [lengthBar, tickBoundsLeft, tickBoundsRight, textLayer];
  }
}

ScaleBarLayer.layerName = 'ScaleBarLayer';
ScaleBarLayer.defaultProps = defaultProps;
