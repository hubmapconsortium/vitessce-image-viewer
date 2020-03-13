import { range } from '../layers/VivViewerLayer/utils';

export default class ZarrLoader {
  constructor(data, isRgb, scale, dimensions) {
    let base;
    if (Array.isArray(data)) {
      this.isPyramid = true;
      [base] = data;
    } else {
      this.isPyramid = false;
      base = data;
    }
    this._data = data;
    this.scale = scale;
    this.chunkIndex = Array(base.shape.length).fill(0);
    if (isRgb) {
      this.channelIndex = base.shape.length - 1;
      this.xIndex = base.shape.length - 2;
      this.yIndex = base.shape.length - 3;
    } else {
      this.xIndex = base.shape.length - 1;
      this.yIndex = base.shape.length - 2;
      this.channelIndex = base.shape.length - 3;
    }
    this.channelChunkSize = base.chunks[this.channelIndex];
    this.dimensions = dimensions;
    this.dimNames = Object.keys(dimensions);
    this._selections = [Array(base.shape.length).fill(0)];
    this.type = 'zarr';
  }

  get _base() {
    return this.isPyramid ? this._data[0] : this._data;
  }

  get vivMetadata() {
    const { dtype } = this._base;
    const imageHeight = this._base.shape[this.yIndex];
    const imageWidth = this._base.shape[this.xIndex];
    const tileSize = this._base.chunks[this.xIndex];
    const minZoom = this.isPyramid ? -this._data.length : 0;
    return {
      imageWidth,
      imageHeight,
      tileSize,
      minZoom,
      dtype,
      scale: this.scale
    };
  }

  setSelection(selections) {
    const zarrSelections = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const s of selections) {
      const selection = Array(this._base.shape.length).fill(0);
      // eslint-disable-next-line no-restricted-syntax
      for (const [name, index] of s) {
        const dimKey =
          typeof name === 'string' ? this.dimNames.indexOf(name) : name;

        if (dimKey === -1) {
          throw Error(
            `Dimension with name ${name} does not exist on array with dimensions : ${this.dimNames}`
          );
        }

        const dimValue =
          typeof index === 'string'
            ? this.dimensions[dimKey].values.indexOf(index)
            : index;

        if (dimValue === -1) {
          throw Error(
            `Dimension '${this.dimNames[dimKey]}' does not contain an entry for ${index}.
            Index must be one of ${this.dimensions[dimKey].values} or an integer.`
          );
        }

        selection[dimKey] = dimValue;
      }
      zarrSelections.push(selection);
    }
    this._selections = zarrSelections;
  }

  setChunkIndex(dimName, index) {
    const chunkIndex = [...this.chunkIndex];
    if (typeof dimName === 'string') {
      // Just change index across one axis
      const i = this.dimNames.indexOf(dimName);
      chunkIndex[i] = index;
    } else if (dimName.length !== index.length) {
      throw Error(
        `Dimension names and indicies must be same length when set together`
      );
    } else {
      for (let i = 0; i < dimName.length; i += 1) {
        const dimIndex = this.dimNames.indexOf(dimName[i]);
        chunkIndex[dimIndex] = index[i];
      }
    }
    this.chunkIndex = chunkIndex;
  }

  async getTile({ x, y, z }) {
    const source = this.isPyramid ? this._data[z] : this._data;

    const chunkKey = [...this.chunkIndex];
    chunkKey[this.xIndex] = x;
    chunkKey[this.yIndex] = y;

    if (this.isRgb) {
      // Return one interleaved TypedArray
      const imageTile = await source.getRawChunk(chunkKey);
      return imageTile.data;
    }

    const { data } = await source.getRawChunk(chunkKey);
    // Return Array of TypedArrays
    if (this.channelChunkSize > 1) {
      return this._decodeChannels(data);
    }
    return [data];
  }

  async getRaster({ z }) {
    const source = this.isPyramid ? this._data[z] : this._data;
    const selection = [...this.chunkIndex];
    selection[this.xIndex] = null;
    selection[this.yIndex] = null;
    const { data } = await source.getRaw(selection);
    return [data];
  }

  _decodeChannels(chunkData) {
    // Used for multichannel images where channels are in same chunk.
    // Separates single TypedArray into multiple channel views.
    const offset = chunkData.length / this.channelChunkSize;
    const tileData = range(this.channelChunkSize).map(i =>
      chunkData.subarray(offset * i, offset * i + offset)
    );
    return tileData;
  }
}
