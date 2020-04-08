import React from 'react';
import { Slider, Checkbox } from '@material-ui/core';

const MIN_SLIDER_VALUE = 0;
const MAX_SLIDER_VALUE = 65535;
const COLORMAP_SLIDER_CHECKBOX_COLOR = [220, 220, 220];

const style = { width: '100%', display: 'flex', position: 'relative' };

function ChannelController({
  name,
  isOn,
  sliderValue,
  colorValue,
  colormapOn,
  channelOptions,
  handleChange
}) {
  return (
    <>
      <select
        value={name}
        onChange={e => handleChange('CHANGE_CHANNEL_DROPDOWN', e.target.value)}
      >
        {channelOptions ? (
          channelOptions.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))
        ) : (
          <option disabled>{name}</option>
        )}
      </select>
      <div style={style}>
        <Checkbox
          onChange={() => handleChange('TOGGLE_ON')}
          checked={isOn}
          style={{
            color: `rgb(${
              colormapOn ? COLORMAP_SLIDER_CHECKBOX_COLOR : colorValue
            })`,
            '&$checked': {
              color: `rgb(${
                colormapOn ? COLORMAP_SLIDER_CHECKBOX_COLOR : colorValue
              })`
            }
          }}
        />
        <Slider
          value={sliderValue}
          onChange={(event, value) => handleChange('CHANGE_SLIDER', value)}
          valueLabelDisplay="auto"
          getAriaLabel={() => `${name}-${colorValue}-${sliderValue}`}
          min={MIN_SLIDER_VALUE}
          max={MAX_SLIDER_VALUE}
          style={{
            color: `rgb(${
              colormapOn ? COLORMAP_SLIDER_CHECKBOX_COLOR : colorValue
            })`,
            top: '7px'
          }}
          orientation="horizontal"
        />
      </div>
    </>
  );
}

export default ChannelController;
