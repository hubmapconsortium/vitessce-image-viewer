import { TileLayer } from '@deck.gl/geo-layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import { renderSubLayers } from './utils';

const defaultProps = {
  ...TileLayer.defaultProps,
  pickable: false,
  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
  sliderValues: { type: 'array', value: [], compare: true },
  colorValues: { type: 'array', value: [], compare: true },
  tileSize: { type: 'number', value: 512, compare: true },
  minZoom: { type: 'number', value: 0, compare: true },
  maxZoom: { type: 'number', value: 0, compare: true },
  renderSubLayers: { type: 'function', value: renderSubLayers, compare: false },
  opacity: { type: 'number', value: 1, compare: true },
  colormap: { type: 'string', value: '', compare: true },
  dtype: { type: 'string', value: '<u2', compare: true },
  domain: { type: 'array', value: [], compare: true },
  viewportId: { type: 'string', value: '', compare: true }
};

export default class VivViewerLayerBase extends TileLayer {
  // This function allows us to controls which viewport gets to update the Tileset2D.
  // This is a uniquely TileLayer issue since it updates based on viewport updates thanks
  // to it's ability to handle zoom-pan loading.  Essentially, with a picture-in-picture,
  // this prevents it from detecting the update of some other viewport that is unwanted.

  // This prevents the overview layer from rendering its tile in the detail view
  _updateTileset() {
    if(!this.props.viewportId){
      super._updateTileset();
    }
    if (
      this.props.viewportId &&
      this.context.viewport.id === this.props.viewportId
    ) {
      super._updateTileset();
    }
  }
}

VivViewerLayerBase.layerName = 'VivViewerLayerBase';
VivViewerLayerBase.defaultProps = defaultProps;
