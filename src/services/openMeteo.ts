import { SelectedLocation } from '../types/climate';

export interface LiveEnvironmentalData {
  observedAt: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  uvIndex: number | null;
  weatherCode: number;
  weatherCondition: string;
  europeanAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  // Extended fields (nullable so older callers stay compatible)
  surfacePressure: number | null;
  cloudCover: number | null;
  windDirection: number | null;
  dust: number | null;
  ozone: number | null;
  carbonMonoxide: number | null;
  sulphurDioxide: number | null;
  nitrogenDioxide: number | null;
  aqiPm25: number | null;
  aqiPm10: number | null;
  aqiNitrogenDioxide: number | null;
  aqiOzone: number | null;
  aqiSulphurDioxide: number | null;
  hourly: LiveHourlyPoint[];
  daily: LiveDailyPoint[];
  elevationMeters: number | null;
}

export interface LiveHourlyPoint {
  time: string;       // ISO local time e.g. "2026-09-13T14:00"
  hour: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  uvIndex: number | null;
  europeanAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  weatherCode: number;
  weatherCondition: string;
}

export interface LiveDailyPoint {
  date: string;       // ISO date e.g. "2026-09-13"
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  uvIndexMax: number | null;
  europeanAqiMax: number | null;
  pm25Max: number | null;
  weatherCode: number;
  weatherCondition: string;
}

interface WeatherResponse {
  elevation?: number;
  utc_offset_seconds?: number;
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m?: number;
    precipitation: number;
    weather_code: number;
    surface_pressure?: number;
    cloud_cover?: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    precipitation_probability?: number[];
    wind_speed_10m: number[];
    weather_code: number[];
    uv_index?: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max: number[];
    uv_index_max?: number[];
    weather_code: number[];
  };
}

interface AirQualityResponse {
  current?: {
    european_aqi?: number;
    pm2_5?: number;
    pm10?: number;
    uv_index?: number;
    dust?: number;
    ozone?: number;
    carbon_monoxide?: number;
    sulphur_dioxide?: number;
    nitrogen_dioxide?: number;
    pm2_5_separated_notation?: number;
  };
  hourly?: {
    time: string[];
    european_aqi?: number[];
    pm2_5?: number[];
    pm10?: number[];
    uv_index?: number[];
  };
}

const weatherConditions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Slight rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

export const getWeatherCondition = (weatherCode: number) => weatherConditions[weatherCode] ?? 'Unknown conditions';

export const getEuropeanAqiLabel = (aqi: number | null) => {
  if (aqi === null) return 'Unavailable';
  if (aqi <= 20) return 'Good';
  if (aqi <= 40) return 'Fair';
  if (aqi <= 60) return 'Moderate';
  if (aqi <= 80) return 'Poor';
  if (aqi <= 100) return 'Very poor';
  return 'Extremely poor';
};

const fetchJson = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Open-Meteo request failed (${response.status}).`);
  return response.json() as Promise<T>;
};

const num = (value: number | undefined | null): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const avg = (values: Array<number | null | undefined>): number | null => {
  const finite = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (finite.length === 0) return null;
  return finite.reduce((sum, v) => sum + v, 0) / finite.length;
};

const round = (value: number | null, digits = 1): number | null =>
  value === null ? null : Number(value.toFixed(digits));

/**
 * Fetch the complete live climate bundle for a coordinate pair:
 * current weather + current air quality + 24h hourly + 5-day daily.
 * Weather and air quality are requested in parallel.
 */
export const fetchLiveEnvironmentalData = async (
  location: Pick<SelectedLocation, 'lat' | 'lng'>,
  signal?: AbortSignal,
): Promise<LiveEnvironmentalData> => {
  const coordinates = `latitude=${encodeURIComponent(location.lat)}&longitude=${encodeURIComponent(location.lng)}`;
  const timezone = 'auto';

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?${coordinates}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,surface_pressure,cloud_cover` +
    `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m,weather_code,uv_index` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,weather_code` +
    `&forecast_days=5&wind_speed_unit=kmh&timezone=${timezone}`;

  const airQualityUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?${coordinates}` +
    `&current=european_aqi,pm2_5,pm10,uv_index,dust,ozone,carbon_monoxide,sulphur_dioxide,nitrogen_dioxide` +
    `&hourly=european_aqi,pm2_5,pm10,uv_index` +
    `&forecast_days=5&timezone=${timezone}`;

  const [weather, airQuality] = await Promise.all([
    fetchJson<WeatherResponse>(weatherUrl, signal),
    fetchJson<AirQualityResponse>(airQualityUrl, signal),
  ]);

  if (!weather.current) throw new Error('Open-Meteo did not return current weather for this location.');
  const current = weather.current;

  // The API returns location-LOCAL wall-clock times. To filter "next 24 hours" correctly
  // for any location worldwide, convert to true epoch using the returned UTC offset.
  const utcOffsetSec = weather.utc_offset_seconds ?? 0;
  const toEpoch = (localIso: string) => Date.parse(`${localIso}:00Z`) - utcOffsetSec * 1000;

  // ---- Hourly merge (next 24 hours from now, weather + air quality by timestamp) ----
  const hourly: LiveHourlyPoint[] = [];
  const wHours = weather.hourly;
  const aqHours = airQuality.hourly;
  const aqIndexByTime = new Map<string, number>();
  aqHours?.time.forEach((t, i) => aqIndexByTime.set(t, i));

  if (wHours) {
    const nowMs = Date.now();
    for (let i = 0; i < wHours.time.length; i += 1) {
      const hourEpoch = toEpoch(wHours.time[i]);
      if (Number.isNaN(hourEpoch) || hourEpoch < nowMs - 60 * 60 * 1000) continue;
      if (hourly.length >= 24) break;
      const aqI = aqIndexByTime.get(wHours.time[i]);
      const get = (arr: number[] | undefined, idx: number | undefined) =>
        arr && typeof idx === 'number' ? num(arr[idx]) : null;
      hourly.push({
        time: wHours.time[i],
        hour: Number(wHours.time[i].slice(11, 13)), // location-local wall-clock hour
        temp: num(wHours.temperature_2m[i]) ?? 0,
        feelsLike: num(wHours.apparent_temperature[i]) ?? 0,
        humidity: num(wHours.relative_humidity_2m[i]) ?? 0,
        precipitation: num(wHours.precipitation[i]) ?? 0,
        precipitationProbability: num(wHours.precipitation_probability?.[i]) ?? 0,
        windSpeed: num(wHours.wind_speed_10m[i]) ?? 0,
        uvIndex: get(wHours.uv_index, i),
        europeanAqi: get(aqHours?.european_aqi, aqI),
        pm25: get(aqHours?.pm2_5, aqI),
        pm10: get(aqHours?.pm10, aqI),
        weatherCode: wHours.weather_code[i] ?? 0,
        weatherCondition: getWeatherCondition(wHours.weather_code[i] ?? 0),
      });
    }
  }

  // ---- Daily merge (weather daily rows + per-day AQ max from hourly AQ series) ----
  const daily: LiveDailyPoint[] = [];
  const wDays = weather.daily;
  if (wDays) {
    for (let d = 0; d < wDays.time.length; d += 1) {
      const dayPrefix = wDays.time[d];
      const dayHourlyAqi: number[] = [];
      const dayHourlyPm25: number[] = [];
      aqHours?.time.forEach((t, i) => {
        if (t.startsWith(dayPrefix)) {
          const aqiV = aqHours.european_aqi?.[i];
          const pmV = aqHours.pm2_5?.[i];
          if (typeof aqiV === 'number' && Number.isFinite(aqiV)) dayHourlyAqi.push(aqiV);
          if (typeof pmV === 'number' && Number.isFinite(pmV)) dayHourlyPm25.push(pmV);
        }
      });
      daily.push({
        date: dayPrefix,
        tempMax: num(wDays.temperature_2m_max[d]) ?? 0,
        tempMin: num(wDays.temperature_2m_min[d]) ?? 0,
        precipitationSum: num(wDays.precipitation_sum[d]) ?? 0,
        precipitationProbabilityMax: num(wDays.precipitation_probability_max?.[d]) ?? 0,
        windSpeedMax: num(wDays.wind_speed_10m_max[d]) ?? 0,
        uvIndexMax: num(wDays.uv_index_max?.[d]),
        europeanAqiMax: dayHourlyAqi.length ? round(Math.max(...dayHourlyAqi), 0) : null,
        pm25Max: dayHourlyPm25.length ? round(Math.max(...dayHourlyPm25)) : null,
        weatherCode: wDays.weather_code[d] ?? 0,
        weatherCondition: getWeatherCondition(wDays.weather_code[d] ?? 0),
      });
    }
  }

  return {
    observedAt: current.time,
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    precipitation: current.precipitation,
    uvIndex: airQuality.current?.uv_index ?? null,
    weatherCode: current.weather_code,
    weatherCondition: getWeatherCondition(current.weather_code),
    europeanAqi: airQuality.current?.european_aqi ?? null,
    pm25: airQuality.current?.pm2_5 ?? null,
    pm10: airQuality.current?.pm10 ?? null,
    surfacePressure: num(current.surface_pressure),
    cloudCover: num(current.cloud_cover),
    windDirection: num(current.wind_direction_10m),
    dust: num(airQuality.current?.dust),
    ozone: num(airQuality.current?.ozone),
    carbonMonoxide: num(airQuality.current?.carbon_monoxide),
    sulphurDioxide: num(airQuality.current?.sulphur_dioxide),
    nitrogenDioxide: num(airQuality.current?.nitrogen_dioxide),
    aqiPm25: num(airQuality.current?.pm2_5_separated_notation),
    aqiPm10: null,
    aqiNitrogenDioxide: null,
    aqiOzone: null,
    aqiSulphurDioxide: null,
    hourly,
    daily,
    elevationMeters: num(weather.elevation),
  };
};

/** Unused standalone helpers kept for backward compatibility with any legacy callers. */
export const summarizeHourlyAqi = (values: Array<number | null | undefined>) => avg(values);
