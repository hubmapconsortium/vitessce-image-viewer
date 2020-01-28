import React, {PureComponent} from 'react';
import { MicroscopyViewer, loadZarr } from '../../src'
import { source } from './source-info'
import Slider from '@material-ui/core/Slider';
import { withStyles } from '@material-ui/core/styles';
import './App.css';

const RedSlider = withStyles({
  root: {
    color: 'red',
  }
})(Slider)
const BlueSlider = withStyles({
  root: {
    color: 'blue',
  }
})(Slider)
const GreenSlider = withStyles({
  root: {
    color: 'green',
  }
})(Slider)



export default class App extends PureComponent {

  constructor(props){
    super(props)
    this.handleRedSliderChange = this.handleRedSliderChange.bind(this)
    this.handleGreenSliderChange = this.handleGreenSliderChange.bind(this)
    this.handleBlueSliderChange = this.handleBlueSliderChange.bind(this)
    this.resize = this.resize.bind(this)
    this.state = {
      sliderValues:[10000,10000,10000],
      viewHeight: window.innerHeight * .9,
      viewWidth: window.innerWidth * .8
    };
    this.max =  65535
    window.addEventListener("resize", this.resize);

  }

  handleRedSliderChange(event, value){
    var sliderValues = this.state.sliderValues.concat([])
    sliderValues[0] = value
    this.setState({sliderValues})
  }

  handleGreenSliderChange(event, value){
    var sliderValues = this.state.sliderValues.concat([])
    sliderValues[1] = value
    this.setState({sliderValues})
  }

  handleBlueSliderChange(event, value){
    var sliderValues = this.state.sliderValues.concat([])
    sliderValues[2] = value
    this.setState({sliderValues})
  }

  resize(){
    this.setState({
      viewHeight: window.innerHeight * .9,
      viewWidth: window.innerWidth * .7
    });
  };

  render() {
    const initialViewState = {
      zoom: -5.5,
      target: [
        30000,
        10000,
        0
      ],
    }
    const propSettings = {
      imageHeight: source.height * source.tileSize,
      imageWidth: source.width * source.tileSize,
      tileSize: source.tileSize,
      sourceChannels: source.channels,
      minZoom: Math.floor(
        -1 * Math.log2(Math.max(source.height * source.tileSize, source.width * source.tileSize)),
      )
    }
    const props = {
      getTileData: ({ x, y, z }) => {
        return loadZarr({
          x, y, z: -1 * z, ...propSettings,
        });
      },
      initialViewState,
      ...propSettings,
      ...this.state
    }
    return (
      <div>
      <MicroscopyViewer {...props}/>
      <div className="slider-container-red">
      <RedSlider
        value={this.state.sliderValues[0]}
        onChange={this.handleRedSliderChange}
        valueLabelDisplay="auto"
        aria-label="range-slider-red"
        min={0}
        max={this.max}
        orientation="vertical"
      />
      </div>
      <div className="slider-container-green">
      <GreenSlider
        value={this.state.sliderValues[1]}
        onChange={this.handleGreenSliderChange}
        valueLabelDisplay="auto"
        aria-label="range-slider-green"
        min={0}
        max={this.max}
        orientation="vertical"
      />
      </div>
      <div className="slider-container-blue">
      <BlueSlider
        value={this.state.sliderValues[2]}
        onChange={this.handleBlueSliderChange}
        valueLabelDisplay="auto"
        aria-label="range-slider-blue"
        min={0}
        max={this.max}
        orientation="vertical"
      />
      </div>
      </div>
    );
  }
}
