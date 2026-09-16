import { DataSourceMeta } from '../types/climate';

export const DATA_SOURCES: DataSourceMeta[] = [
  {
    id: 'copernicus-s5p',
    name: 'Copernicus Sentinel-5P TROPOMI',
    organization: 'European Space Agency (ESA)',
    type: 'Satellite',
    parameters: ['Tropospheric NO2 column', 'Total Ozone (O3)', 'Sulfur Dioxide (SO2)', 'Aerosol Index (AI)', 'Carbon Monoxide (CO)'],
    updateInterval: 'Real-time swath passes (~3.5 hours latency)',
    latencyMs: 142,
    status: 'ONLINE',
    accuracyConfidence: 98.4,
    coverage: 'Global 3.5km x 5.5km spatial grid',
    description: 'High-resolution atmospheric spectroscopy satellite providing daily global trace gas and air pollution monitoring.',
    apiEndpointDoc: 'https://sentinel.esa.int/web/sentinel/missions/sentinel-5p'
  },
  {
    id: 'nasa-modis-viirs',
    name: 'NASA MODIS & VIIRS Thermal Anomaly',
    organization: 'NASA Earth Science Data and Information System (ESDIS)',
    type: 'Satellite',
    parameters: ['Active Thermal Hotspots', 'Fire Radiative Power (FRP)', 'Aerosol Optical Depth (AOD)', 'Surface Temperature (LST)'],
    updateInterval: 'Sub-daily (Every 3 hours)',
    latencyMs: 215,
    status: 'ONLINE',
    accuracyConfidence: 96.8,
    coverage: 'Global 375m - 1km resolution',
    description: 'Near real-time infrared thermal imaging detecting wildfire propagation, smoke plume density, and urban heat islands.',
    apiEndpointDoc: 'https://earthdata.nasa.gov/firms'
  },
  {
    id: 'noaa-gfs',
    name: 'NOAA Global Forecast System (GFS)',
    organization: 'National Oceanic and Atmospheric Administration (NOAA)',
    type: 'Numerical Model',
    parameters: ['Surface Temperature', 'Relative Humidity', 'Wind Vectors (U/V)', 'Wet-Bulb Globe Temp (WBGT)', 'Precipitation Accumulation'],
    updateInterval: '4 times daily (00, 06, 12, 18 UTC)',
    latencyMs: 95,
    status: 'ONLINE',
    accuracyConfidence: 94.2,
    coverage: 'Global 13km atmospheric grid',
    description: 'Coupled atmospheric-ocean numerical weather prediction model computing thermodynamic state variables across 127 vertical levels.',
    apiEndpointDoc: 'https://nomads.ncep.noaa.gov'
  },
  {
    id: 'openaq-grid',
    name: 'OpenAQ Ground In-Situ Network',
    organization: 'OpenAQ Global Environmental Consortium',
    type: 'Ground Sensor Grid',
    parameters: ['PM2.5 (µg/m³)', 'PM10 (µg/m³)', 'NO2 (ppb)', 'O3 (ppb)', 'SO2 (ppb)', 'CO (ppm)'],
    updateInterval: 'Hourly real-time telemetry',
    latencyMs: 68,
    status: 'ONLINE',
    accuracyConfidence: 99.1,
    coverage: 'Over 48,000 reference-grade & calibrated hyper-local sensor nodes worldwide',
    description: 'Decentralized aggregation of official government EPA stations, CPCB monitors, and calibrated IoT particulate counters.',
    apiEndpointDoc: 'https://api.openaq.org/v2'
  },
  {
    id: 'ecmwf-era5',
    name: 'ECMWF ERA5 Atmospheric Reanalysis',
    organization: 'European Centre for Medium-Range Weather Forecasts',
    type: 'Atmospheric Reanalysis',
    parameters: ['Historical 50-year climate anomalies', 'Mean Radiant Temperature (MRT)', 'Universal Thermal Climate Index (UTCI)', 'Planetary Boundary Layer Height'],
    updateInterval: 'Hourly historical reanalysis & 15-day ensemble',
    latencyMs: 180,
    status: 'ONLINE',
    accuracyConfidence: 97.9,
    coverage: 'Global 31km grid (137 pressure levels)',
    description: 'State-of-the-art climate reanalysis combining model data with observations into a globally complete and consistent dataset.',
    apiEndpointDoc: 'https://cds.climate.copernicus.eu'
  }
];
