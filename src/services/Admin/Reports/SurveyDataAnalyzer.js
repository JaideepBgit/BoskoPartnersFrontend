/**
 * Service for analyzing and extracting data from survey responses
 * Handles mixed data types: numeric, text, objects, arrays
 */

class SurveyDataAnalyzer {
  /**
   * Analyze a survey response and categorize fields by type
   */
  analyzeSurveyResponse(response) {
    if (!response || !response.answers) {
      return {
        numeric: {},
        text: {},
        objects: {},
        arrays: {},
        metadata: {}
      };
    }

    const answers = typeof response.answers === 'string' 
      ? JSON.parse(response.answers) 
      : response.answers;

    const categorized = {
      numeric: {},
      text: {},
      objects: {},
      arrays: {},
      metadata: {
        totalFields: 0,
        numericCount: 0,
        textCount: 0,
        objectCount: 0,
        arrayCount: 0
      }
    };

    Object.entries(answers).forEach(([key, value]) => {
      categorized.metadata.totalFields++;

      if (value === null || value === undefined || value === '') {
        return; // Skip empty values
      }

      // Check if it's an object (but not array)
      if (typeof value === 'object' && !Array.isArray(value)) {
        categorized.objects[key] = value;
        categorized.metadata.objectCount++;
        
        // Try to extract numeric values from nested objects
        const nestedNumerics = this.extractNumericFromObject(value, key);
        Object.assign(categorized.numeric, nestedNumerics);
      }
      // Check if it's an array
      else if (Array.isArray(value)) {
        categorized.arrays[key] = value;
        categorized.metadata.arrayCount++;
      }
      // Check if it's a number or numeric string
      else if (this.isNumericValue(value)) {
        const numericValue = this.convertToNumeric(value);
        if (numericValue !== null) {
          categorized.numeric[key] = numericValue;
          categorized.metadata.numericCount++;
        } else {
          categorized.text[key] = value;
          categorized.metadata.textCount++;
        }
      }
      // Otherwise it's text
      else {
        categorized.text[key] = value;
        categorized.metadata.textCount++;
      }
    });

    return categorized;
  }

  /**
   * Extract numeric values from nested objects
   */
  extractNumericFromObject(obj, parentKey) {
    const numerics = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = `${parentKey}_${key}`;
      
      if (this.isNumericValue(value)) {
        const numericValue = this.convertToNumeric(value);
        if (numericValue !== null) {
          numerics[fullKey] = numericValue;
        }
      }
    });

    return numerics;
  }

  /**
   * Check if a value can be converted to a number
   */
  isNumericValue(value) {
    if (typeof value === 'number') return true;
    if (typeof value !== 'string') return false;

    // Check for pure numbers
    if (!isNaN(value) && !isNaN(parseFloat(value))) return true;

    // Check for numeric ranges (e.g., "41-50", "1-5")
    if (/^\d+\s*-\s*\d+$/.test(value)) return true;

    // Check for numbers with units (e.g., "120000", "5 years")
    if (/^\d+/.test(value)) return true;

    return false;
  }

  /**
   * Convert various formats to numeric values
   */
  convertToNumeric(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return null;

    // Remove whitespace
    value = value.trim();

    // Handle pure numbers
    const pureNumber = parseFloat(value);
    if (!isNaN(pureNumber) && value === pureNumber.toString()) {
      return pureNumber;
    }

    // Handle ranges (take midpoint)
    const rangeMatch = value.match(/^(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return (min + max) / 2;
    }

    // Handle numbers at start (e.g., "120000 students", "5 years")
    const numberMatch = value.match(/^(\d+)/);
    if (numberMatch) {
      return parseFloat(numberMatch[1]);
    }

    // Handle scale values (e.g., "More than 15" -> 15)
    const scaleMatch = value.match(/(\d+)/);
    if (scaleMatch) {
      return parseFloat(scaleMatch[1]);
    }

    return null;
  }

  /**
   * Analyze multiple responses and calculate statistics
   */
  analyzeMultipleResponses(responses) {
    if (!responses || responses.length === 0) {
      return {
        numericFields: {},
        textFields: {},
        commonFields: [],
        statistics: {}
      };
    }

    // Collect all numeric fields across responses
    const numericFieldsMap = new Map();
    const textFieldsMap = new Map();
    const fieldFrequency = new Map();

    responses.forEach(response => {
      const analyzed = this.analyzeSurveyResponse(response);

      // Track numeric fields
      Object.entries(analyzed.numeric).forEach(([key, value]) => {
        if (!numericFieldsMap.has(key)) {
          numericFieldsMap.set(key, []);
        }
        numericFieldsMap.get(key).push(value);

        // Track field frequency
        fieldFrequency.set(key, (fieldFrequency.get(key) || 0) + 1);
      });

      // Track text fields
      Object.entries(analyzed.text).forEach(([key, value]) => {
        if (!textFieldsMap.has(key)) {
          textFieldsMap.set(key, []);
        }
        textFieldsMap.get(key).push(value);

        fieldFrequency.set(key, (fieldFrequency.get(key) || 0) + 1);
      });
    });

    // Calculate statistics for numeric fields
    const statistics = {};
    numericFieldsMap.forEach((values, key) => {
      statistics[key] = this.calculateStatistics(values);
    });

    // Find common fields (present in at least 50% of responses)
    const commonFields = Array.from(fieldFrequency.entries())
      .filter(([_, count]) => count >= responses.length * 0.5)
      .map(([field, _]) => field)
      .sort();

    return {
      numericFields: Object.fromEntries(numericFieldsMap),
      textFields: Object.fromEntries(textFieldsMap),
      commonFields,
      statistics,
      totalResponses: responses.length
    };
  }

  /**
   * Calculate statistics for an array of numeric values
   */
  calculateStatistics(values) {
    if (!values || values.length === 0) {
      return {
        count: 0,
        min: null,
        max: null,
        mean: null,
        median: null,
        mode: null
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;

    // Calculate median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    // Calculate mode
    const frequency = {};
    let maxFreq = 0;
    let mode = null;
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
      if (frequency[val] > maxFreq) {
        maxFreq = frequency[val];
        mode = val;
      }
    });

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      mode: mode,
      sum: sum
    };
  }

  /**
   * Compare a target response with similar responses
   */
  compareWithSimilar(targetResponse, similarResponses) {
    const targetAnalysis = this.analyzeSurveyResponse(targetResponse);
    const groupAnalysis = this.analyzeMultipleResponses(similarResponses);

    const comparison = {
      target: targetAnalysis,
      group: groupAnalysis,
      comparisons: {},
      strengths: [],
      improvements: []
    };

    // Compare numeric fields
    Object.entries(targetAnalysis.numeric).forEach(([key, targetValue]) => {
      if (groupAnalysis.statistics[key]) {
        const groupStats = groupAnalysis.statistics[key];
        const difference = targetValue - groupStats.mean;
        const percentDiff = ((difference / groupStats.mean) * 100).toFixed(1);

        comparison.comparisons[key] = {
          targetValue,
          groupMean: groupStats.mean,
          groupMedian: groupStats.median,
          difference,
          percentDifference: parseFloat(percentDiff),
          isAboveAverage: targetValue > groupStats.mean,
          isBelowAverage: targetValue < groupStats.mean,
          isAverage: Math.abs(difference) < 0.1
        };

        // Track strengths and improvements
        if (targetValue > groupStats.mean && Math.abs(difference) > 0.5) {
          comparison.strengths.push({
            field: key,
            targetValue,
            groupMean: groupStats.mean,
            difference
          });
        } else if (targetValue < groupStats.mean && Math.abs(difference) > 0.5) {
          comparison.improvements.push({
            field: key,
            targetValue,
            groupMean: groupStats.mean,
            difference: Math.abs(difference)
          });
        }
      }
    });

    // Sort by difference magnitude
    comparison.strengths.sort((a, b) => b.difference - a.difference);
    comparison.improvements.sort((a, b) => b.difference - a.difference);

    return comparison;
  }

  /**
   * Get human-readable label for a field key
   */
  getFieldLabel(key) {
    // Handle nested keys (e.g., "13_item_0")
    if (key.includes('_')) {
      const parts = key.split('_');
      return parts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }

    // Handle numeric keys (question numbers)
    if (!isNaN(key)) {
      return `Question ${key}`;
    }

    // Handle snake_case
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Extract text responses for qualitative analysis
   */
  extractTextResponses(responses, minLength = 20) {
    const textResponses = [];

    responses.forEach(response => {
      const analyzed = this.analyzeSurveyResponse(response);
      
      Object.entries(analyzed.text).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length >= minLength) {
          textResponses.push({
            responseId: response.id,
            field: key,
            text: value,
            length: value.length,
            wordCount: value.split(/\s+/).length
          });
        }
      });
    });

    return textResponses;
  }

  /**
   * Get summary statistics for a set of responses
   */
  getSummaryStatistics(responses) {
    const analysis = this.analyzeMultipleResponses(responses);
    
    return {
      totalResponses: responses.length,
      numericFieldCount: Object.keys(analysis.numericFields).length,
      textFieldCount: Object.keys(analysis.textFields).length,
      commonFieldCount: analysis.commonFields.length,
      averageNumericFields: Object.keys(analysis.statistics).length,
      statistics: analysis.statistics
    };
  }
}

export default new SurveyDataAnalyzer();
