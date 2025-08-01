// Question Types Configuration for Survey Platform
// Simplified to support only the nine core question formats without conditional logic

/**
 * @typedef {'short_text'|'single_choice'|'yes_no'|'likert5'|'multi_select'|'paragraph'|'numeric'|'percentage'|'year_matrix'} QuestionType
 */

export const QUESTION_TYPES = Object.freeze([
  'short_text',
  'single_choice', 
  'yes_no',
  'likert5',
  'multi_select',
  'paragraph',
  'numeric',
  'percentage',
  'flexible_input',
  'year_matrix'
]);

export const QUESTION_TYPE_MAP = Object.freeze({
  short_text: {
    id: 1,
    name: 'short_text',
    display_name: 'Short Text',
    description: 'Brief free-text responses and fill-in-the-blank fields',
    category: 'Core Questions',
    config_schema: {
      max_length: 255,
      placeholder: '',
      required: false
    }
  },
  single_choice: {
    id: 2,
    name: 'single_choice',
    display_name: 'Single Choice',
    description: 'Radio button selection from predefined categorical options',
    category: 'Core Questions',
    config_schema: {
      options: [],
      required: false
    }
  },
  yes_no: {
    id: 3,
    name: 'yes_no',
    display_name: 'Yes/No',
    description: 'Binary choice questions for clear decision points',
    category: 'Core Questions',
    config_schema: {
      yes_label: 'Yes',
      no_label: 'No',
      required: false
    }
  },
  likert5: {
    id: 4,
    name: 'likert5',
    display_name: 'Five-Point Likert Scale',
    description: 'Five-point scale from "A great deal" to "None"',
    category: 'Core Questions',
    config_schema: {
      scale_labels: {
        1: 'None',
        2: 'A little',
        3: 'A moderate amount',
        4: 'A lot',
        5: 'A great deal'
      },
      required: false
    }
  },
  multi_select: {
    id: 5,
    name: 'multi_select',
    display_name: 'Multiple Select',
    description: '"Select all that apply" checkbox questions',
    category: 'Core Questions',
    config_schema: {
      options: [],
      required: false
    }
  },
  paragraph: {
    id: 6,
    name: 'paragraph',
    display_name: 'Paragraph Text',
    description: 'Open-ended narrative and essay responses',
    category: 'Core Questions',
    config_schema: {
      max_length: 2000,
      placeholder: '',
      required: false
    }
  },
  numeric: {
    id: 7,
    name: 'numeric',
    display_name: 'Numeric Entry',
    description: 'Absolute number input with validation',
    category: 'Core Questions',
    config_schema: {
      number_type: 'integer',
      min_value: null,
      max_value: null,
      required: false
    }
  },
  percentage: {
    id: 8,
    name: 'percentage',
    display_name: 'Percentage Allocation',
    description: 'Distribution and allocation percentage questions',
    category: 'Core Questions',
    config_schema: {
      items: [],
      total_percentage: 100,
      required: false
    }
  },
  flexible_input: {
    id: 9,
    name: 'flexible_input',
    display_name: 'Flexible Input',
    description: 'Collect alphanumeric responses across multiple items',
    category: 'Core Questions',
    config_schema: {
      items: [],
      instructions: '',
      placeholder: 'Enter your response',
      required: false
    }
  },
  year_matrix: {
    id: 10,
    name: 'year_matrix',
    display_name: 'Year Matrix',
    description: 'Row-by-year grid for temporal data collection',
    category: 'Core Questions',
    config_schema: {
      rows: [],
      start_year: 2024,
      end_year: 2029,
      required: false
    }
  }
});

/**
 * @typedef {Object} Question
 * @property {string} id - Unique question identifier
 * @property {QuestionType} type - Question type from QUESTION_TYPES
 * @property {string} text - Question text/prompt
 * @property {string} section - Section name for grouping
 * @property {boolean} required - Whether answer is required
 * @property {number} order - Display order within section
 * @property {Object} config - Type-specific configuration
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

// Helper functions
export const getQuestionTypeById = (id) => {
  return Object.values(QUESTION_TYPE_MAP).find(type => type.id === id);
};

export const getQuestionTypeByName = (name) => {
  return QUESTION_TYPE_MAP[name];
};

export const isValidQuestionType = (type) => {
  return QUESTION_TYPES.includes(type);
};

export const getQuestionTypeOptions = () => {
  return Object.values(QUESTION_TYPE_MAP).map(type => ({
    value: type.name,
    label: type.display_name,
    description: type.description
  }));
};

export default QUESTION_TYPE_MAP; 