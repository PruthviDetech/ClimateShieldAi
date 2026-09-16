# CLIMATESHIELD AI — Backend & Database Integration Architecture

This directory provides the production-grade architectural templates and database schemas for connecting the **ClimateShield AI** frontend to a Node.js/Express ingestion API and a Supabase (PostgreSQL) timeseries database.

---

## Architecture Diagram

```
[Satellites: Copernicus S5P, NASA MODIS, NOAA GFS]
                        │
                        ▼
       [Ground IoT Nodes / OpenAQ / CPCB]
                        │  (REST / MQTT Webhooks)
                        ▼
       ┌─────────────────────────────────┐
       │   Node.js / Express API Server  │
       │   (backend-architecture/server) │
       └──────────────┬──────────────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
           ▼                     ▼
┌──────────────────────┐ ┌───────────────────────────┐
│ Supabase PostgreSQL  │ │ WebSocket Gateway         │
│ (schema.sql)         │ │ (Real-time live telemetry)│
└──────────────────────┘ └─────────────┬─────────────┘
                                       │
                                       ▼
                         ┌───────────────────────────┐
                         │   ClimateShield Frontend  │
                         │   (React / TypeScript)    │
                         └───────────────────────────┘
```

---

## Database Deployment (Supabase / PostgreSQL)

1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** tab.
3. Paste and execute the contents of `backend-architecture/schema.sql`.
4. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your root `.env` file.

---

## Express Server Ingestion Gateway

1. Install dependencies:
   ```bash
   npm install express ws cors dotenv
   npm install -D @types/express @types/ws @types/cors typescript ts-node
   ```
2. Run the ingestion daemon:
   ```bash
   npx ts-node backend-architecture/server.example.ts
   ```
