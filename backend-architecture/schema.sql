-- ==========================================================
-- CLIMATESHIELD AI — PostgreSQL & Supabase Database Schema
-- Version: 2.4.0
-- Architecture: Timeseries Ingestion, Multi-Hazard Indexing
-- ==========================================================

-- Enable UUID and PostGIS extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. OBSERVATORY STATIONS / LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128),
    country VARCHAR(128) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation_meters DOUBLE PRECISION DEFAULT 0,
    population_est VARCHAR(64),
    primary_hazard VARCHAR(256),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(latitude, longitude);

-- 2. SENSOR IN-SITU & SATELLITE TELEMETRY LOGS (TIMESERIES)
CREATE TABLE IF NOT EXISTS sensor_telemetry_logs (
    id BIGSERIAL PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Thermal
    temperature_c NUMERIC(5, 2) NOT NULL,
    feels_like_c NUMERIC(5, 2) NOT NULL,
    dew_point_c NUMERIC(5, 2),
    humidity_percent NUMERIC(5, 2) NOT NULL,
    wbgt_c NUMERIC(5, 2) NOT NULL,
    
    -- Air Quality & Pollutants
    aqi_us INTEGER NOT NULL,
    pm25_ugm3 NUMERIC(6, 2) NOT NULL,
    pm10_ugm3 NUMERIC(6, 2),
    no2_ppb NUMERIC(6, 2),
    o3_ppb NUMERIC(6, 2),
    so2_ppb NUMERIC(6, 2),
    co_ppm NUMERIC(5, 2),
    
    -- Radiation & Atmosphere
    uv_index NUMERIC(4, 2) NOT NULL,
    wind_speed_kmh NUMERIC(5, 2) NOT NULL,
    wind_direction_deg INTEGER,
    rain_probability_percent INTEGER DEFAULT 0,
    pressure_hpa NUMERIC(6, 2),
    
    -- Data Source Attribution
    source_tag VARCHAR(64) DEFAULT 'CPCB_OPENAQ_GFS'
);

CREATE INDEX IF NOT EXISTS idx_telemetry_loc_time ON sensor_telemetry_logs(location_id, recorded_at DESC);

-- 3. COMPUTED CLIMATESHIELD RISK SCORES (CSRI v2.4)
CREATE TABLE IF NOT EXISTS computed_risk_scores (
    id BIGSERIAL PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE CASCADE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(32) NOT NULL,
    thermal_component NUMERIC(5, 2),
    air_quality_component NUMERIC(5, 2),
    uv_component NUMERIC(5, 2),
    wind_stagnation_component NUMERIC(5, 2),
    driver_primary VARCHAR(128),
    driver_contribution_percent INTEGER
);

CREATE INDEX IF NOT EXISTS idx_risk_loc_time ON computed_risk_scores(location_id, calculated_at DESC);

-- 4. USER CONFIGURATIONS & VULNERABILITY PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    vulnerability_persona VARCHAR(64) DEFAULT 'general',
    saved_locations JSONB DEFAULT '["pune-india"]'::jsonb,
    preferred_temp_unit VARCHAR(4) DEFAULT 'C',
    preferred_aqi_standard VARCHAR(32) DEFAULT 'US_EPA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. USER CUSTOM ALERT RULES
CREATE TABLE IF NOT EXISTS user_alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    condition_type VARCHAR(64) NOT NULL, -- e.g. AQI_GREATER, TEMP_GREATER
    threshold_value NUMERIC(6, 2) NOT NULL,
    channel_push BOOLEAN DEFAULT TRUE,
    channel_email BOOLEAN DEFAULT TRUE,
    channel_sms BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. DISPATCHED EARLY WARNING INCIDENTS
CREATE TABLE IF NOT EXISTS dispatched_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(64) REFERENCES locations(id),
    severity VARCHAR(32) NOT NULL, -- CRITICAL, WARNING, ADVISORY
    hazard_type VARCHAR(64) NOT NULL,
    title VARCHAR(256) NOT NULL,
    message TEXT NOT NULL,
    action_required TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
