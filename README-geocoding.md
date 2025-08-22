# Location Data Enhancement for Survey Responses

This script uses your existing Google Maps API integration to add accurate location data to the sample survey responses.

## Prerequisites

1. **Google Maps API Key**: Ensure you have a valid Google Maps API key
2. **API Key Setup**: Add your API key to your environment variables
3. **Node.js**: Make sure Node.js is installed

## Setup

1. Make sure your Google Maps API key is configured:
   ```bash
   # In your .env file (create if it doesn't exist)
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

2. Install required dependencies:
   ```bash
   npm install axios dotenv
   ```

## Running the Script

```bash
# Navigate to the frontend directory
cd BoskoPartnersFrontend

# Run the geocoding script
node geocode-sample-data.js
```

## What the Script Does

1. **Validates API Key**: Tests your Google Maps API key
2. **Reads Survey Data**: Processes all three survey response files:
   - `church-survey-responses.json`
   - `institution-survey-responses.json` 
   - `non-formal-survey-responses.json`

3. **Geocodes Addresses**: For each response:
   - Builds full address from existing data (physical_address, town, city, country)
   - Calls Google Maps Geocoding API
   - Extracts coordinates, state, timezone information

4. **Adds Location Fields**:
   - `latitude`: GPS latitude coordinate
   - `longitude`: GPS longitude coordinate  
   - `state`: Administrative state/region
   - `timezone`: Timezone identifier
   - `formatted_address`: Google's formatted address

5. **Creates Backups**: Saves `.backup.json` files before modifying originals

## Sample Output

```
🚀 Starting location data enhancement using Google Maps API...

🔑 Validating Google Maps API key...
✅ API key is valid

📂 Processing church-survey-responses.json...
📝 Found 12 responses
🔍 Geocoding: 12 Adeniyi Jones Avenue, Ikeja, Lagos, Nigeria
✅ Updated response 1 with coordinates
🔍 Geocoding: Plot 45 Ahmadu Bello Way, Kaduna, Nigeria
✅ Updated response 2 with coordinates
...
📊 Summary: 12 geocoded, 0 skipped, 12 total
💾 Backup saved to church-survey-responses.backup.json
✅ Updated church-survey-responses.json
```

## Features

- **Rate Limiting**: Adds delays between API calls to respect quotas
- **Smart Skipping**: Skips responses that already have coordinates
- **Backup Creation**: Automatically creates backup files
- **Error Handling**: Gracefully handles API failures
- **Progress Tracking**: Shows detailed progress and summary

## After Running

Your survey responses will have enhanced location data:

```json
{
  "id": 1,
  "survey_type": "church",
  "church_name": "Redeemed Christian Church of God - Victory Chapel",
  "pastor_name": "Pastor Michael Adebayo",
  "physical_address": "12 Adeniyi Jones Avenue, Ikeja",
  "town": "Ikeja",
  "city": "Lagos",
  "state": "Lagos State",
  "country": "Nigeria",
  "latitude": 6.6018,
  "longitude": 3.3515,
  "timezone": "Africa/Lagos",
  "formatted_address": "12 Adeniyi Jones Ave, Ikeja, Lagos, Nigeria"
}
```

## Troubleshooting

- **API Key Issues**: Make sure your key has Geocoding API enabled
- **Quota Exceeded**: The script includes rate limiting, but check your quota
- **Invalid Addresses**: Some addresses might not geocode - they'll be logged as warnings
- **Backup Recovery**: If something goes wrong, restore from `.backup.json` files

## Usage in Analytics

Once enhanced, you can use the location data for:
- **Interactive Maps**: Plot survey responses on maps
- **Geographic Analysis**: Analyze patterns by region/state
- **Distance Calculations**: Calculate distances between locations
- **Timezone Handling**: Display times in local timezones
