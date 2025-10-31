# Transport API Setup Guide

This document lists the free and paid APIs available for transport data integration.

## ✅ Already Integrated (Free, No API Keys)

### 1. Transport for London (TfL) API
- **URL**: https://api.tfl.gov.uk/
- **Status**: ✅ Already integrated
- **Coverage**: London only (Tube, Bus, DLR, Overground, etc.)
- **Documentation**: https://api.tfl.gov.uk/swagger/ui/index.html
- **API Key Required**: ❌ No - Free to use
- **Limits**: Rate limited, but generous for reasonable use

### 2. OpenStreetMap Overpass API
- **URL**: https://overpass-api.de/api/interpreter
- **Status**: ✅ Already integrated (for bus stops and road closures)
- **Coverage**: Global (uses OpenStreetMap data)
- **Documentation**: https://wiki.openstreetmap.org/wiki/Overpass_API
- **API Key Required**: ❌ No - Free to use
- **Limits**: Rate limited, requires User-Agent header

---

## 🔑 APIs Requiring Keys (For Real Data)

### 3. National Rail Enquiries API (OpenLDBWS)
- **Service Name**: National Rail Live Departure Boards Web Service
- **Registration URL**: https://www.nationalrail.co.uk/46391.aspx
- **API Documentation**: https://lite.realtime-ncc.co.uk/OpenLDBWS/
- **API Key Required**: ✅ Yes - Free registration
- **Coverage**: UK National Rail services
- **What It Provides**: Live train departures, arrivals, service disruptions
- **Setup Steps**:
  1. Go to https://www.nationalrail.co.uk/46391.aspx
  2. Register for a free account
  3. Request API access (usually approved within 24-48 hours)
  4. Receive your API token (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 4. TransportAPI
- **Service Name**: TransportAPI
- **Website**: https://www.transportapi.com/
- **Registration URL**: https://www.transportapi.com/accounts/register/
- **API Key Required**: ✅ Yes - Free tier available
- **Coverage**: UK-wide (bus, train, cycle hire)
- **What It Provides**: Live bus arrivals, train times, cycle hire locations
- **Free Tier Limits**: 
  - 100 requests/day
  - 10 requests/minute
- **Setup Steps**:
  1. Register at https://www.transportapi.com/accounts/register/
  2. Confirm email
  3. Get API key from dashboard
  4. App ID and App Key will be provided

### 5. Highways England Traffic Information API
- **Service Name**: Highways England WebTRIS
- **API Documentation**: https://webtris.highwaysengland.co.uk/api/swagger/ui/index
- **Registration**: Contact via API documentation page
- **API Key Required**: ✅ Yes - May require registration
- **Coverage**: England motorways and major A-roads
- **What It Provides**: Roadworks, incidents, traffic flow data
- **Note**: Check documentation for current registration process

### 6. Realtime Trains API (Unofficial, Free)
- **Service Name**: Realtime Trains
- **Website**: https://www.realtimetrains.co.uk/
- **API Documentation**: https://www.realtimetrains.co.uk/about/developer/
- **Registration URL**: Email request to: enquiries@realtimetrains.co.uk
- **API Key Required**: ✅ Yes - Free but requires email request
- **Coverage**: UK rail services
- **What It Provides**: Real-time train running information
- **Setup Steps**:
  1. Email enquiries@realtimetrains.co.uk requesting API access
  2. Provide details about your use case
  3. Receive API credentials

---

## 📊 Alternative: GTFS Feeds (Static Schedule Data)

### 7. GTFS (General Transit Feed Specification) Feeds
- **What It Is**: Static transit schedule data published by transport authorities
- **Coverage**: Varies by region
- **API Key Required**: ❌ No - Free public data
- **What It Provides**: Bus/train routes, stops, schedules (not real-time)
- **UK GTFS Sources**:
  - **Merseytravel** (Liverpool): Check https://www.merseytravel.gov.uk/Pages/default.aspx
  - **Transport for Greater Manchester (TfGM)**: https://data.gov.uk/dataset/tfgm-metrolink-gtfs-feed
  - **Transport for London**: https://tfl.gov.uk/info-for/open-data-users/our-feeds
  - **National**: https://data.gov.uk/search?q=GTFS

---

## 🎯 Recommended Setup Priority

For **Anfield, Liverpool**, here's what we recommend:

1. **National Rail OpenLDBWS** (Free) - For real train status
   - Register: https://www.nationalrail.co.uk/46391.aspx
   - Provides: Live train delays, disruptions for Liverpool Lime Street

2. **TransportAPI** (Free tier) - For real bus arrivals
   - Register: https://www.transportapi.com/accounts/register/
   - Provides: Live bus times near Anfield

3. **Merseytravel GTFS Feed** (Free) - For bus routes/stops
   - Provides: Complete bus network map (static schedules)
   - Helps with: Showing actual bus routes serving Anfield

---

## 📝 Next Steps

Once you have your API keys:
1. Add them to `.env` file (for CLI) or `.cursor/mcp.json` (for MCP/Cursor)
2. I'll update the code to use the real APIs instead of estimates
3. The system will automatically use real data when available

Please provide:
- [ ] National Rail OpenLDBWS token (if you register)
- [ ] TransportAPI App ID and App Key (if you register)
- [ ] Any other API keys you obtain

