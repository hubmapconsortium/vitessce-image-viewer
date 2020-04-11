import React from 'react';
import { Slider, Checkbox, Grid, Select } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import ChannelOptions from './ChannelOptions';

const MIN_SLIDER_VALUE = 0;
const MAX_SLIDER_VALUE = 65535;
const COLORMAP_SLIDER_CHECKBOX_COLOR = [220, 220, 220];

const toRgb = (on, arr) => {
  const color = on ? COLORMAP_SLIDER_CHECKBOX_COLOR : arr;
  return `rgb(${color})`;
};

const useStyles = makeStyles(theme => ({
  root: {
    paddingTop: theme.spacing(1)
  },
  icon: {
    color: theme.palette.text.primary,
    marginTop: '4px'
  }
}));

function ChannelController({
  name,
  isOn,
  sliderValue,
  colorValue,
  colormapOn,
  channelOptions,
  handleChange,
  disableOptions = false
}) {
  const rgbColor = toRgb(colormapOn, colorValue);
  const classes = useStyles();
  return (
    <Grid
      container
      direction="column"
      m={2}
      justify="center"
      className={classes.root}
    >
      <Grid container direction="row" justify="space-between">
        <Grid item xs={11}>
          <Select
            native
            value={name}
            onChange={e => handleChange('CHANGE_CHANNEL', e.target.value)}
          >
            {channelOptions.map(opt => (
              <option disabled={disableOptions} key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </Grid>
        <Grid item>
          <ChannelOptions handleChange={handleChange} />
        </Grid>
      </Grid>
      <Grid container direction="row" justify="flex-start">
        <Grid item xs={2}>
          <Checkbox
            onChange={() => handleChange('TOGGLE_ON')}
            checked={isOn}
            style={{
              color: rgbColor,
              '&$checked': {
                color: rgbColor
              }
            }}
          />
        </Grid>
        <Grid item xs={9}>
          <Slider
            value={sliderValue}
            onChange={(e, v) => handleChange('CHANGE_SLIDER', v)}
            valueLabelDisplay="auto"
            getAriaLabel={() => `${name}-${colorValue}-${sliderValue}`}
            min={MIN_SLIDER_VALUE}
            max={MAX_SLIDER_VALUE}
            orientation="horizontal"
            style={{
              color: rgbColor,
              marginTop: '7px'
            }}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}

export default ChannelController;
