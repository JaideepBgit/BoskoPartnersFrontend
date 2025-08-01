import axios from 'axios';

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAA5PZQdpcY4NXonqUny2sGZzMLbFKE0Iw';
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  // Geocoding: Convert address to coordinates
  async geocodeAddress(address) {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: response.data.results[0].formatted_address,
          addressComponents: response.data.results[0].address_components
        };
      } else {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Reverse Geocoding: Convert coordinates to address
  async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return {
          address: response.data.results[0].formatted_address,
          components: response.data.results[0].address_components
        };
      } else {
        throw new Error(`Reverse geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  // Place Search: Search for places by text query
  async searchPlaces(query, location = null, radius = 50000) {
    try {
      const params = {
        query: query,
        key: this.apiKey,
        radius: radius
      };

      if (location) {
        params.location = `${location.lat},${location.lng}`;
      }

      const response = await axios.get(`${this.baseUrl}/place/textsearch/json`, {
        params: params
      });

      if (response.data.status === 'OK') {
        return response.data.results.map(place => ({
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: place.geometry.location,
          types: place.types,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total
        }));
      } else {
        throw new Error(`Place search failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Place search error:', error);
      throw error;
    }
  }

  // Place Details: Get detailed information about a specific place
  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: 'name,formatted_address,geometry,types,website,formatted_phone_number,opening_hours,rating,user_ratings_total,photos'
        }
      });

      if (response.data.status === 'OK') {
        const place = response.data.result;
        return {
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: place.geometry.location,
          types: place.types,
          website: place.website,
          phone: place.formatted_phone_number,
          openingHours: place.opening_hours,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          photos: place.photos
        };
      } else {
        throw new Error(`Place details failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Place details error:', error);
      throw error;
    }
  }

  // Autocomplete: Get place predictions for user input
  async getPlacePredictions(input, sessionToken = null, location = null, radius = 50000) {
    try {
      const params = {
        input: input,
        key: this.apiKey,
        types: 'address'
      };

      if (sessionToken) {
        params.sessiontoken = sessionToken;
      }

      if (location) {
        params.location = `${location.lat},${location.lng}`;
        params.radius = radius;
      }

      const response = await axios.get(`${this.baseUrl}/place/autocomplete/json`, {
        params: params
      });

      if (response.data.status === 'OK') {
        return response.data.predictions.map(prediction => ({
          placeId: prediction.place_id,
          description: prediction.description,
          structuredFormatting: prediction.structured_formatting,
          types: prediction.types
        }));
      } else {
        throw new Error(`Autocomplete failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      throw error;
    }
  }

  // Distance Matrix: Calculate distance and travel time between locations
  async getDistanceMatrix(origins, destinations, mode = 'driving') {
    try {
      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: origins,
          destinations: destinations,
          mode: mode,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK') {
        return response.data.rows.map(row => 
          row.elements.map(element => ({
            distance: element.distance,
            duration: element.duration,
            status: element.status
          }))
        );
      } else {
        throw new Error(`Distance matrix failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Distance matrix error:', error);
      throw error;
    }
  }

  // Parse address components into structured data
  parseAddressComponents(addressComponents) {
    const components = {};
    
    addressComponents.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        components.street_number = component.long_name;
      } else if (types.includes('route')) {
        components.route = component.long_name;
      } else if (types.includes('locality')) {
        components.city = component.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('neighborhood')) {
        components.town = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        components.province = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        components.region = component.long_name;
      } else if (types.includes('country')) {
        components.country = component.long_name;
      } else if (types.includes('postal_code')) {
        components.postal_code = component.long_name;
      }
    });

    // Build address line 1
    components.address_line1 = [
      components.street_number,
      components.route
    ].filter(Boolean).join(' ');

    return components;
  }

  // Get continent from country
  getContinent(country) {
    const continentMap = {
      // North America
      'United States': 'North America', 'USA': 'North America', 'Canada': 'North America',
      'Mexico': 'North America', 'Guatemala': 'North America', 'Belize': 'North America',
      'Costa Rica': 'North America', 'El Salvador': 'North America', 'Honduras': 'North America',
      'Nicaragua': 'North America', 'Panama': 'North America',
      
      // Europe
      'United Kingdom': 'Europe', 'UK': 'Europe', 'England': 'Europe', 'Scotland': 'Europe',
      'Wales': 'Europe', 'Ireland': 'Europe', 'Germany': 'Europe', 'France': 'Europe',
      'Spain': 'Europe', 'Italy': 'Europe', 'Netherlands': 'Europe', 'Belgium': 'Europe',
      'Portugal': 'Europe', 'Greece': 'Europe', 'Poland': 'Europe', 'Sweden': 'Europe',
      'Norway': 'Europe', 'Denmark': 'Europe', 'Finland': 'Europe', 'Switzerland': 'Europe',
      'Austria': 'Europe', 'Czech Republic': 'Europe', 'Hungary': 'Europe', 'Romania': 'Europe',
      'Bulgaria': 'Europe', 'Croatia': 'Europe', 'Serbia': 'Europe', 'Ukraine': 'Europe',
      'Russia': 'Europe',
      
      // Asia
      'China': 'Asia', 'Japan': 'Asia', 'India': 'Asia', 'South Korea': 'Asia',
      'Singapore': 'Asia', 'Thailand': 'Asia', 'Philippines': 'Asia', 'Indonesia': 'Asia',
      'Malaysia': 'Asia', 'Vietnam': 'Asia', 'Bangladesh': 'Asia', 'Pakistan': 'Asia',
      'Sri Lanka': 'Asia', 'Myanmar': 'Asia', 'Cambodia': 'Asia', 'Laos': 'Asia',
      'Mongolia': 'Asia', 'Kazakhstan': 'Asia', 'Uzbekistan': 'Asia', 'Afghanistan': 'Asia',
      'Iran': 'Asia', 'Iraq': 'Asia', 'Saudi Arabia': 'Asia', 'United Arab Emirates': 'Asia',
      'UAE': 'Asia', 'Kuwait': 'Asia', 'Qatar': 'Asia', 'Bahrain': 'Asia', 'Oman': 'Asia',
      'Yemen': 'Asia', 'Jordan': 'Asia', 'Lebanon': 'Asia', 'Syria': 'Asia', 'Turkey': 'Asia',
      'Israel': 'Asia', 'Palestine': 'Asia',
      
      // Oceania
      'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania',
      'Papua New Guinea': 'Oceania', 'Solomon Islands': 'Oceania', 'Vanuatu': 'Oceania',
      'Samoa': 'Oceania', 'Tonga': 'Oceania',
      
      // South America
      'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America',
      'Colombia': 'South America', 'Peru': 'South America', 'Venezuela': 'South America',
      'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
      'Uruguay': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
      'French Guiana': 'South America',
      
      // Africa
      'South Africa': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa', 'Egypt': 'Africa',
      'Morocco': 'Africa', 'Ghana': 'Africa', 'Ethiopia': 'Africa', 'Tanzania': 'Africa',
      'Uganda': 'Africa', 'Algeria': 'Africa', 'Sudan': 'Africa', 'Libya': 'Africa',
      'Tunisia': 'Africa', 'Zimbabwe': 'Africa', 'Zambia': 'Africa', 'Botswana': 'Africa',
      'Namibia': 'Africa', 'Mozambique': 'Africa', 'Madagascar': 'Africa', 'Cameroon': 'Africa',
      'Ivory Coast': 'Africa', 'Senegal': 'Africa', 'Mali': 'Africa', 'Burkina Faso': 'Africa',
      'Niger': 'Africa', 'Chad': 'Africa', 'Central African Republic': 'Africa',
      'Democratic Republic of the Congo': 'Africa', 'Republic of the Congo': 'Africa',
      'Gabon': 'Africa', 'Equatorial Guinea': 'Africa', 'Rwanda': 'Africa', 'Burundi': 'Africa'
    };

    // Try exact match first
    if (continentMap[country]) {
      return continentMap[country];
    }

    // Try partial match (case insensitive)
    const lowerCountry = country.toLowerCase();
    for (const [key, value] of Object.entries(continentMap)) {
      if (key.toLowerCase().includes(lowerCountry) || lowerCountry.includes(key.toLowerCase())) {
        return value;
      }
    }

    return '';
  }

  // Convert place data to geo location format
  convertPlaceToGeoLocation(place) {
    const addressComponents = this.parseAddressComponents(place.address_components);
    const coordinates = {
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng()
    };

    return {
      continent: this.getContinent(addressComponents.country),
      region: addressComponents.region || '',
      country: addressComponents.country || '',
      province: addressComponents.province || '',
      city: addressComponents.city || '',
      town: addressComponents.town || '',
      address_line1: addressComponents.address_line1 || '',
      address_line2: '',
      postal_code: addressComponents.postal_code || '',
      latitude: coordinates.latitude.toString(),
      longitude: coordinates.longitude.toString()
    };
  }

  // Validate API key
  async validateApiKey() {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: 'test',
          key: this.apiKey
        }
      });

      return response.data.status !== 'REQUEST_DENIED';
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }
}

export default new GoogleMapsService(); 