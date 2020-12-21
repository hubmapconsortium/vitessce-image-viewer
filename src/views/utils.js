import { OrthographicView } from '@deck.gl/core';

export function getVivId(id) {
  return `-#${id}#`;
}
/**
 * Create a boudning box from a viewport based on passed-in viewState.
 * @param {viewState} Object The viewState for a certain viewport.
 * @returns {View} The DeckGL View for this viewport.
 */
export function makeBoundingBox(viewState) {
  const viewport = new OrthographicView().makeViewport({
    // From the current `detail` viewState, we need its projection matrix (actually the inverse).
    viewState,
    height: viewState.height,
    width: viewState.width
  });
  // Use the inverse of the projection matrix to map screen to the view space.
  return [
    viewport.unproject([0, 0]),
    viewport.unproject([viewport.width, 0]),
    viewport.unproject([viewport.width, viewport.height]),
    viewport.unproject([0, viewport.height])
  ];
}

/**
 * Create an initial view state that centers the image in the view at the zoom level that fills the screen.
 * @param {Object} loader The loader of the image for which the view state is desired.
 * @param {Object} viewSize { height, width } object for deducing the right zoom level to center the image.
 * @param {Object} zoomBackOff An positive number for controls how far zoomed out from "full screen" it should be (default is 0).
 * SideBySideViewer and PictureInPictureViewer use .5 when setting viewState automatically.
 * @returns {ViewState} A default initial view state that centers the image within the view: { target: [x, y, 0], zoom: -zoom }.
 */
export function getDefaultInitialViewState(loader, viewSize, zoomBackOff = 0) {
  const { height, width } = loader.getRasterSize({
    z: 0
  });
  const zoom =
    Math.log2(Math.min(viewSize.width / width, viewSize.height / height)) -
    zoomBackOff;
  const loaderInitialViewState = {
    target: [width / 2, height / 2, 0],
    zoom
  };
  return loaderInitialViewState;
}
