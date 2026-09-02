import { describe, expect, it } from 'vitest'
import { getWeatherIcon, getWeatherLabel } from '~/utils/weather'

describe('weather presentation', () => {
  it('maps Meteosource day, rain, snow and night conditions to amCharts icons', () => {
    expect(getWeatherIcon(2)).toBe('day')
    expect(getWeatherIcon(11)).toBe('rainy-5')
    expect(getWeatherIcon(17)).toBe('snowy-5')
    expect(getWeatherIcon(28)).toBe('cloudy-night-2')
  })

  it('uses compact labels and has a safe fallback', () => {
    expect(getWeatherLabel(11, 'Rain')).toBe('RAIN')
    expect(getWeatherLabel(999, 'Unusual weather')).toBe('UNUSUAL WEATHER')
    expect(getWeatherIcon(999)).toBe('cloudy')
  })
})
