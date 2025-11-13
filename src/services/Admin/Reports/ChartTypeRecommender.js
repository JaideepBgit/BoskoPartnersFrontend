/**
 * Chart Type Recommender Service
 * 
 * Provides intelligent chart type recommendations based on question types
 * following data visualization best practices for survey data.
 * 
 * Based on research from:
 * - Flourish Studio survey visualization guide
 * - Data visualization best practices
 * - Question type characteristics
 */

class ChartTypeRecommender {
  /**
   * Question Type to Chart Type Mapping
   * Based on QUESTION_TYPE_REFERENCE.md and visualization best practices
   */
  static QUESTION_TYPE_CHART_MAP = {
    // ID 1: Short Text - Word Cloud for text analysis
    1: {
      primary: 'word_cloud',
      alternatives: ['table', 'list'],
      description: 'Word clouds identify frequent keywords and patterns in short text responses'
    },
    
    // ID 2: Single Choice - Bar Chart for categorical comparison
    2: {
      primary: 'bar',
      alternatives: ['pie', 'donut', 'horizontal_bar'],
      description: 'Bar charts effectively compare categorical response distributions'
    },
    
    // ID 3: Yes/No - Pie/Donut for binary proportions
    3: {
      primary: 'pie',
      alternatives: ['donut', 'stacked_bar'],
      description: 'Pie charts clearly show binary proportions and splits'
    },
    
    // ID 4: Five-Point Likert Scale - Diverging Stacked Bar
    4: {
      primary: 'diverging_stacked_bar',
      alternatives: ['stacked_bar', 'bar'],
      description: 'Diverging stacked bars visualize agreement spectrum with neutral midpoint'
    },
    
    // ID 5: Multiple Select - Horizontal Bar Chart
    5: {
      primary: 'horizontal_bar',
      alternatives: ['bar', 'grouped_bar'],
      description: 'Horizontal bars show frequency of each selected option clearly'
    },
    
    // ID 6: Paragraph Text - Word Cloud with sentiment
    6: {
      primary: 'word_cloud',
      alternatives: ['sentiment_chart', 'theme_clustering'],
      description: 'Word clouds extract themes from long-form responses'
    },
    
    // ID 7: Numeric Entry - Histogram for distribution
    7: {
      primary: 'histogram',
      alternatives: ['box_plot', 'line'],
      description: 'Histograms display distribution and statistical measures'
    },
    
    // ID 8: Percentage Allocation - Sunburst Chart
    8: {
      primary: 'sunburst',
      alternatives: ['stacked_bar_100', 'pie'],
      description: 'Sunburst charts show hierarchical part-to-whole relationships'
    },
    
    // ID 9: Flexible Input - Table with filters
    9: {
      primary: 'table',
      alternatives: ['grouped_bar', 'list'],
      description: 'Tables allow drill-down into alphanumeric patterns'
    },
    
    // ID 10: Year Matrix - Heatmap for temporal patterns
    10: {
      primary: 'heatmap',
      alternatives: ['line', 'area'],
      description: 'Heatmaps visualize temporal patterns across rows effectively'
    }
  };

  /**
   * Available Chart Types with Metadata
   */
  static CHART_TYPES = {
    // Basic Charts
    bar: {
      name: 'Bar Chart',
      icon: 'BarChart',
      category: 'Basic',
      bestFor: ['categorical', 'comparison', 'single_choice'],
      description: 'Compare values across categories',
      implemented: true
    },
    horizontal_bar: {
      name: 'Horizontal Bar Chart',
      icon: 'BarChart',
      category: 'Basic',
      bestFor: ['categorical', 'multiple_select', 'long_labels'],
      description: 'Compare values with long category names',
      implemented: true
    },
    line: {
      name: 'Line Chart',
      icon: 'Timeline',
      category: 'Basic',
      bestFor: ['temporal', 'trends', 'continuous'],
      description: 'Show trends over time or continuous data',
      implemented: true
    },
    pie: {
      name: 'Pie Chart',
      icon: 'PieChart',
      category: 'Basic',
      bestFor: ['proportions', 'yes_no', 'binary'],
      description: 'Show proportions of a whole',
      implemented: true
    },
    donut: {
      name: 'Donut Chart',
      icon: 'DonutLarge',
      category: 'Basic',
      bestFor: ['proportions', 'yes_no', 'binary'],
      description: 'Show proportions with emphasis on total',
      implemented: true
    },
    
    // Advanced Charts
    histogram: {
      name: 'Histogram',
      icon: 'BarChart',
      category: 'Statistical',
      bestFor: ['numeric', 'distribution', 'frequency'],
      description: 'Show distribution of numeric values',
      implemented: false
    },
    box_plot: {
      name: 'Box Plot',
      icon: 'Insights',
      category: 'Statistical',
      bestFor: ['numeric', 'outliers', 'quartiles'],
      description: 'Display median, quartiles, and outliers',
      implemented: false
    },
    diverging_stacked_bar: {
      name: 'Diverging Stacked Bar',
      icon: 'BarChart',
      category: 'Advanced',
      bestFor: ['likert', 'agreement', 'sentiment'],
      description: 'Visualize Likert scale responses with neutral center',
      implemented: false
    },
    stacked_bar: {
      name: 'Stacked Bar Chart',
      icon: 'BarChart',
      category: 'Advanced',
      bestFor: ['categorical', 'composition', 'parts'],
      description: 'Show composition across categories',
      implemented: false
    },
    grouped_bar: {
      name: 'Grouped Bar Chart',
      icon: 'BarChart',
      category: 'Advanced',
      bestFor: ['categorical', 'comparison', 'multiple_series'],
      description: 'Compare multiple series across categories',
      implemented: false
    },
    heatmap: {
      name: 'Heatmap',
      icon: 'GridOn',
      category: 'Advanced',
      bestFor: ['matrix', 'temporal', 'correlation'],
      description: 'Visualize patterns in matrix data with color intensity',
      implemented: false
    },
    sunburst: {
      name: 'Sunburst Chart',
      icon: 'PieChart',
      category: 'Advanced',
      bestFor: ['hierarchical', 'percentage', 'nested'],
      description: 'Show hierarchical data with nested rings',
      implemented: false
    },
    
    // Text Analysis Charts
    word_cloud: {
      name: 'Word Cloud',
      icon: 'Cloud',
      category: 'Text Analysis',
      bestFor: ['text', 'keywords', 'frequency'],
      description: 'Display word frequency with size representing importance',
      implemented: false
    },
    sentiment_chart: {
      name: 'Sentiment Analysis',
      icon: 'SentimentSatisfied',
      category: 'Text Analysis',
      bestFor: ['text', 'sentiment', 'opinion'],
      description: 'Analyze and visualize sentiment in text responses',
      implemented: false
    },
    
    // Other Charts
    radar: {
      name: 'Radar Chart',
      icon: 'Radar',
      category: 'Comparison',
      bestFor: ['multivariate', 'comparison', 'profile'],
      description: 'Compare multiple variables in a circular layout',
      implemented: true
    },
    table: {
      name: 'Data Table',
      icon: 'TableChart',
      category: 'Data Display',
      bestFor: ['detailed', 'flexible_input', 'raw_data'],
      description: 'Display data in tabular format with sorting and filtering',
      implemented: false
    },
    area: {
      name: 'Area Chart',
      icon: 'ShowChart',
      category: 'Temporal',
      bestFor: ['temporal', 'cumulative', 'volume'],
      description: 'Show cumulative values over time',
      implemented: false
    }
  };

  /**
   * Get recommended chart type for a question
   * @param {Object} question - Question object with type information
   * @returns {Object} Recommendation with primary and alternative chart types
   */
  static getRecommendation(question) {
    const questionTypeId = question.question_type_id;
    const mapping = this.QUESTION_TYPE_CHART_MAP[questionTypeId];
    
    if (!mapping) {
      return {
        primary: 'bar',
        alternatives: ['pie', 'line'],
        description: 'Default chart recommendation',
        confidence: 'low'
      };
    }
    
    return {
      primary: mapping.primary,
      alternatives: mapping.alternatives,
      description: mapping.description,
      confidence: 'high',
      questionType: question.question_type_display || question.question_type_name
    };
  }

  /**
   * Get all recommended charts for a question (primary + alternatives)
   * @param {Object} question - Question object
   * @returns {Array} Array of chart type objects
   */
  static getAllRecommendedCharts(question) {
    const recommendation = this.getRecommendation(question);
    const allChartTypes = [recommendation.primary, ...recommendation.alternatives];
    
    return allChartTypes.map(chartType => ({
      type: chartType,
      ...this.CHART_TYPES[chartType],
      isPrimary: chartType === recommendation.primary,
      confidence: chartType === recommendation.primary ? 'high' : 'medium'
    })).filter(chart => chart.name); // Filter out undefined chart types
  }

  /**
   * Get chart type metadata
   * @param {string} chartType - Chart type identifier
   * @returns {Object} Chart type metadata
   */
  static getChartTypeInfo(chartType) {
    return this.CHART_TYPES[chartType] || null;
  }

  /**
   * Get all available chart types
   * @param {boolean} implementedOnly - Return only implemented charts
   * @returns {Array} Array of chart type objects
   */
  static getAllChartTypes(implementedOnly = false) {
    const chartTypes = Object.entries(this.CHART_TYPES).map(([key, value]) => ({
      type: key,
      ...value
    }));
    
    if (implementedOnly) {
      return chartTypes.filter(chart => chart.implemented);
    }
    
    return chartTypes;
  }

  /**
   * Get chart types by category
   * @param {string} category - Category name
   * @returns {Array} Array of chart types in the category
   */
  static getChartTypesByCategory(category) {
    return Object.entries(this.CHART_TYPES)
      .filter(([_, value]) => value.category === category)
      .map(([key, value]) => ({
        type: key,
        ...value
      }));
  }

  /**
   * Check if a chart type is suitable for a question type
   * @param {string} chartType - Chart type identifier
   * @param {number} questionTypeId - Question type ID
   * @returns {Object} Suitability assessment
   */
  static isChartSuitableForQuestion(chartType, questionTypeId) {
    const mapping = this.QUESTION_TYPE_CHART_MAP[questionTypeId];
    
    if (!mapping) {
      return {
        suitable: false,
        reason: 'Unknown question type',
        confidence: 'none'
      };
    }
    
    if (chartType === mapping.primary) {
      return {
        suitable: true,
        reason: 'Primary recommendation for this question type',
        confidence: 'high'
      };
    }
    
    if (mapping.alternatives.includes(chartType)) {
      return {
        suitable: true,
        reason: 'Alternative visualization option',
        confidence: 'medium'
      };
    }
    
    return {
      suitable: false,
      reason: 'Not recommended for this question type',
      confidence: 'low'
    };
  }

  /**
   * Get visualization tips for a question type
   * @param {number} questionTypeId - Question type ID
   * @returns {Object} Visualization tips and best practices
   */
  static getVisualizationTips(questionTypeId) {
    const tips = {
      1: { // Short Text
        tips: [
          'Use word clouds to identify frequent keywords',
          'Consider filtering out common words (stop words)',
          'Group similar responses for better insights'
        ],
        colorStrategy: 'Sequential palette based on frequency',
        interactivity: 'Click words to see original responses'
      },
      2: { // Single Choice
        tips: [
          'Use bar charts for easy comparison',
          'Sort bars by frequency for clarity',
          'Avoid pie charts if more than 5-7 options'
        ],
        colorStrategy: 'Categorical palette for distinct options',
        interactivity: 'Hover to see exact counts and percentages'
      },
      3: { // Yes/No
        tips: [
          'Pie or donut charts work best for binary data',
          'Use contrasting colors for clear distinction',
          'Consider stacked bars for demographic comparisons'
        ],
        colorStrategy: 'Two contrasting colors',
        interactivity: 'Show percentages and counts'
      },
      4: { // Likert Scale
        tips: [
          'Use diverging stacked bars with neutral center',
          'Color code: negative (red) to positive (green)',
          'Show percentages for each response level'
        ],
        colorStrategy: 'Diverging palette (red-neutral-green)',
        interactivity: 'Hover to see response distribution'
      },
      5: { // Multiple Select
        tips: [
          'Use horizontal bars for long option labels',
          'Show count or percentage of selections',
          'Sort by frequency for easier reading'
        ],
        colorStrategy: 'Single color with varying intensity',
        interactivity: 'Filter to see combinations'
      },
      6: { // Paragraph
        tips: [
          'Use word clouds for theme extraction',
          'Consider sentiment analysis visualization',
          'Group responses by themes or topics'
        ],
        colorStrategy: 'Sentiment-based coloring',
        interactivity: 'Click to read full responses'
      },
      7: { // Numeric
        tips: [
          'Use histograms to show distribution',
          'Include mean, median, and outliers',
          'Consider box plots for statistical summary'
        ],
        colorStrategy: 'Sequential palette for ranges',
        interactivity: 'Show statistics on hover'
      },
      8: { // Percentage
        tips: [
          'Use sunburst for hierarchical percentages',
          'Ensure all percentages sum to 100%',
          'Show both percentages and absolute values'
        ],
        colorStrategy: 'Hierarchical color scheme',
        interactivity: 'Drill down into subcategories'
      },
      9: { // Flexible Input
        tips: [
          'Use tables with sorting and filtering',
          'Consider grouped bars for patterns',
          'Enable search functionality'
        ],
        colorStrategy: 'Minimal, focus on readability',
        interactivity: 'Sort, filter, and search'
      },
      10: { // Year Matrix
        tips: [
          'Use heatmaps for temporal patterns',
          'Color intensity shows value magnitude',
          'Include line charts for trend analysis'
        ],
        colorStrategy: 'Sequential palette (light to dark)',
        interactivity: 'Hover to see exact values'
      }
    };
    
    return tips[questionTypeId] || {
      tips: ['Choose appropriate chart type for your data'],
      colorStrategy: 'Use consistent color scheme',
      interactivity: 'Add tooltips for details'
    };
  }
}

export default ChartTypeRecommender;
