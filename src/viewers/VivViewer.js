import React, { PureComponent } from 'react';
import DeckGL from '@deck.gl/react';
import { getVivId } from '../views/utils';

// Taken from https://stackoverflow.com/a/31732310/8060591
function isSafari() {
  return (
    navigator.vendor &&
    navigator.vendor.indexOf('Apple') > -1 &&
    navigator.userAgent &&
    navigator.userAgent.indexOf('CriOS') === -1 &&
    navigator.userAgent.indexOf('FxiOS') === -1
  );
}

/**
 * This class handles rendering the various views within the DeckGL contenxt.
 * @param {Array} layerProps The props for the layers in each view.
 * @param {Array} viewStates The initial view states for each view.
 * @param {VivView} views The various VivViews to render.
 * */
export default class VivViewer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      viewStates: {}
    };
    const { viewStates } = this.state;
    const { views } = this.props;
    views.forEach(view => {
      viewStates[view.id] = view.filterViewState({
        viewState: view.initialViewState
      });
    });
    this._onViewStateChange = this._onViewStateChange.bind(this);
    this.layerFilter = this.layerFilter.bind(this);
  }

  /**
   * This prevents only the `draw` call of a layer from firing,
   * but not other layer lifecycle methods.  Nonetheless, it is
   * still useful.
   * @param {Layer} layer The layer being updated.
   * @param {Viewport} viewport The viewport being updated.
   * @returns {boolean} Whether or not this layer should be drawn in this viewport
   */
  // eslint-disable-next-line class-methods-use-this
  layerFilter({ layer, viewport }) {
    return layer.id.includes(getVivId(viewport.id));
  }

  /**
   * This updates the viewState as a callback to the viewport changing in DeckGL
   * (hence the need for storing viewState in state).
   */
  _onViewStateChange({ viewId, viewState, oldViewState }) {
    // Save the view state and trigger rerender
    const { views } = this.props;
    this.setState(prevState => {
      const newState = {};
      const viewStates = {};
      views.forEach(view => {
        const currentViewState = prevState.viewStates[view.id];
        viewStates[view.id] = view.filterViewState({
          viewState: { ...viewState, id: viewId },
          oldViewState,
          currentViewState
        });
      });
      newState.viewStates = viewStates;
      return { ...newState };
    });
  }

  /**
   * This updates the viewStates' height and width with the newest height and
   * width on any call where the viewStates changes (i.e resize events),
   * using the previous state (falling back on the view's initial state) for target x and y, zoom level etc.
   */
  componentDidUpdate(prevProps) {
    const { views } = this.props;
    // Update internal viewState on view changes as well as height and width changes.
    // Maybe we should add x/y too?
    if (
      views.some(
        (view, i) =>
          prevProps.views[i] !== view ||
          view.initialViewState.height !==
            prevProps.views[i].initialViewState.height ||
          view.initialViewState.width !==
            prevProps.views[i].initialViewState.width
      )
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(prevState => {
        const newState = {};
        const viewStates = {};
        views.forEach(view => {
          const { height, width } = view.initialViewState;
          const currentViewState = prevState.viewStates[view.id];
          viewStates[view.id] = view.filterViewState({
            viewState: {
              ...(currentViewState || view.initialViewState),
              height,
              width,
              id: view.id
            }
          });
        });
        newState.viewStates = viewStates;
        return { ...newState };
      });
    }
  }

  /**
   * This renders the layers in the DeckGL context.
   */
  _renderLayers() {
    const { viewStates } = this.state;
    const { views, layerProps } = this.props;
    return views.map((view, i) =>
      view.getLayer({ viewStates, props: layerProps[i] })
    );
  }

  render() {
    /* eslint-disable react/destructuring-assignment */
    const { views, randomize } = this.props;
    const { viewStates } = this.state;
    const deckGLViews = views.map(view => view.getDeckGlView());
    // DeckGL seems to use the first view more than the second for updates
    // so this forces it to use the others more evenly.  This isn't perfect,
    // but I am not sure what else to do.  The DeckGL render hooks don't help,
    // but maybe useEffect() would help?  This works, so I'm going to leave it
    // for now.
    if (randomize) {
      const random = Math.random();
      const holdFirstElement = deckGLViews[0];
      const randomizedIndex = Math.round(random * views.length);
      deckGLViews[0] = deckGLViews[randomizedIndex];
      deckGLViews[randomizedIndex] = holdFirstElement;
    }
    return !isSafari() ? (
      <DeckGL
        glOptions={{ webgl2: true }}
        layerFilter={this.layerFilter}
        layers={this._renderLayers()}
        onViewStateChange={this._onViewStateChange}
        views={deckGLViews}
        viewState={viewStates}
      />
    ) : (
      <div className="viv-error">
        <p>
          Safari does not support WebGL2, which Viv requires. Please use Chrome
          or Firefox.
        </p>
      </div>
    );
    /* eslint-disable react/destructuring-assignment */
  }
}
