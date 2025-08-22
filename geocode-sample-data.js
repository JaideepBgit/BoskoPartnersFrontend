/**
 * Script to add location data to survey responses using Google Maps API
 * This script uses the existing GoogleMapsService to geocode addresses
 * Run with: node geocode-sample-data.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load environment variables
require('dotenv').config();

class GeocodeService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAA5PZQdpcY4NXonqUny2sGZzMLbFKE0Iw';
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
    this.requestDelay = 100; // 100ms delay between requests to avoid quota issues
  }

  async geocodeAddress(address) {
    try {
      console.log(`🔍 Geocoding: ${address}`);
      
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        const addressComponents = this.parseAddressComponents(result.address_components);
        
        return {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: result.formatted_address,
          state: addressComponents.state,
          country: addressComponents.country,
          timezone: this.getTimezone(addressComponents.country),
          address_components: result.address_components
        };
      } else {
        console.warn(`⚠️  Geocoding failed for "${address}": ${response.data.status}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error geocoding "${address}":`, error.message);
      return null;
    }
  }

  parseAddressComponents(components) {
    const parsed = {};
    
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('administrative_area_level_1')) {
        parsed.state = component.long_name;
      } else if (types.includes('country')) {
        parsed.country = component.long_name;
      } else if (types.includes('locality')) {
        parsed.city = component.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('neighborhood')) {
        parsed.town = component.long_name;
      }
    });

    return parsed;
  }

  getTimezone(country) {
    const timezoneMap = {
      'Nigeria': 'Africa/Lagos',
      'Ghana': 'Africa/Accra',
      'Kenya': 'Africa/Nairobi',
      'Uganda': 'Africa/Kampala',
      'South Africa': 'Africa/Johannesburg',
      'Ethiopia': 'Africa/Addis_Ababa',
      'Tanzania': 'Africa/Dar_es_Salaam',
      'Rwanda': 'Africa/Kigali',
      'Zambia': 'Africa/Lusaka',
      'Zimbabwe': 'Africa/Harare'
    };

    return timezoneMap[country] || 'UTC';
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function addLocationDataToResponses(responses, geocodeService) {
  const updatedResponses = [];
  let geocodedCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    
    // Check if location data already exists
    if (response.latitude && response.longitude) {
      console.log(`⏭️  Skipping ${response.id} (already has coordinates)`);
      updatedResponses.push(response);
      skippedCount++;
      continue;
    }

    // Build address string from existing data
    const addressParts = [
      response.physical_address,
      response.town,
      response.city,
      response.country
    ].filter(Boolean);
    
    const fullAddress = addressParts.join(', ');
    
    if (!fullAddress.trim()) {
      console.warn(`⚠️  No address found for response ${response.id}`);
      updatedResponses.push(response);
      continue;
    }

    // Geocode the address
    const locationData = await geocodeService.geocodeAddress(fullAddress);
    
    if (locationData) {
      const updatedResponse = {
        ...response,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        state: locationData.state || response.state,
        timezone: locationData.timezone,
        formatted_address: locationData.formatted_address
      };
      
      updatedResponses.push(updatedResponse);
      geocodedCount++;
      console.log(`✅ Updated response ${response.id} with coordinates`);
    } else {
      console.warn(`⚠️  Could not geocode response ${response.id}`);
      updatedResponses.push(response);
    }

    // Add delay to respect API limits
    await geocodeService.delay(geocodeService.requestDelay);
  }

  console.log(`\n📊 Summary: ${geocodedCount} geocoded, ${skippedCount} skipped, ${updatedResponses.length} total`);
  return updatedResponses;
}

async function processFile(filePath, geocodeService) {
  try {
    console.log(`\n📂 Processing ${path.basename(filePath)}...`);
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.responses || !Array.isArray(data.responses)) {
      console.error(`❌ Invalid data structure in ${filePath}`);
      return;
    }

    console.log(`📝 Found ${data.responses.length} responses`);
    
    // Add location data to responses
    data.responses = await addLocationDataToResponses(data.responses, geocodeService);
    
    // Create backup of original file
    const backupPath = filePath.replace('.json', '.backup.json');
    fs.writeFileSync(backupPath, fs.readFileSync(filePath));
    console.log(`💾 Backup saved to ${path.basename(backupPath)}`);
    
    // Write updated data
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Updated ${path.basename(filePath)}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting location data enhancement using Google Maps API...\n');
  
  const geocodeService = new GeocodeService();
  
  // Validate API key
  console.log('🔑 Validating Google Maps API key...');
  try {
    const testResponse = await geocodeService.geocodeAddress('Lagos, Nigeria');
    if (!testResponse) {
      console.error('❌ API key validation failed. Please check your GOOGLE_MAPS_API_KEY.');
      return;
    }
    console.log('✅ API key is valid\n');
  } catch (error) {
    console.error('❌ API key validation failed:', error.message);
    return;
  }

  const sampleDataDir = path.join(__dirname, 'public', 'sample-data');
  const files = [
    'church-survey-responses.json',
    'institution-survey-responses.json',
    'non-formal-survey-responses.json'
  ];

  for (const filename of files) {
    const filePath = path.join(sampleDataDir, filename);
    if (fs.existsSync(filePath)) {
      await processFile(filePath, geocodeService);
    } else {
      console.error(`❌ File not found: ${filePath}`);
    }
  }

  console.log('\n🎉 Location data enhancement completed!');
  console.log('\n💡 Tips:');
  console.log('   - Backup files (.backup.json) have been created');
  console.log('   - You can now use latitude/longitude for mapping');
  console.log('   - State and timezone information has been added where available');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { GeocodeService, addLocationDataToResponses };
