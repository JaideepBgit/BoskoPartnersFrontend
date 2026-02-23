// ============================================================================
// CREATE/EDIT AUDIENCE PAGE
// ============================================================================
// Full page for creating or editing audiences with segmented filter UI
// Supports Member, Organization, and Behavioral segmentation
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Collapse,
  Chip,
  Autocomplete
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Close as CloseIcon,
  InfoOutlined as InfoIcon,
  CheckCircleOutline as CheckIcon,
  FilterList as FilterIcon,
  TuneOutlined as TuneIcon
} from '@mui/icons-material';
import InternalHeader from '../../shared/Headers/InternalHeader';
import AudienceService from '../../../services/Admin/AudienceService';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const COLORS = {
  primary: '#633394',
  primaryLight: '#f0ebf5',
  primaryHover: '#7a4bab',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  text: '#212121',
  textSecondary: '#757575',
  white: '#ffffff',
  background: '#f5f5f7',
  sectionBg: '#fafafe',
  tabActive: '#633394',
  tabInactive: '#757575',
  tabUnderline: '#633394',
  chipBg: '#e8def8',
  chipText: '#633394',
  success: '#4caf50',
  donut: '#e0d4f0',
  donutActive: '#633394',
};

// Segment tab definitions
const SEGMENT_TABS = [
  { key: 'member', label: 'Member' },
  { key: 'organization', label: 'Organization' },
  { key: 'behavior', label: 'Behavior' }
];

// Member segmentation sections
const MEMBER_SECTIONS = [
  {
    key: 'demographics',
    label: 'DEMOGRAPHICS',
    fields: [
      {
        key: 'age_range', label: 'Age Range', placeholder: 'All Ages', type: 'select', options: [
          { value: '', label: 'All Ages' },
          { value: '18-24', label: '18 - 24' },
          { value: '25-34', label: '25 - 34' },
          { value: '35-44', label: '35 - 44' },
          { value: '45-54', label: '45 - 54' },
          { value: '55-64', label: '55 - 64' },
          { value: '65+', label: '65+' }
        ]
      },
      {
        key: 'gender', label: 'Gender', placeholder: 'All Genders', type: 'select', options: [
          { value: '', label: 'All Genders' },
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        key: 'marital_status', label: 'Marital Status', placeholder: 'All Marital Statuses', type: 'select', options: [
          { value: '', label: 'All Marital Statuses' },
          { value: 'single', label: 'Single' },
          { value: 'married', label: 'Married' },
          { value: 'divorced', label: 'Divorced' },
          { value: 'widowed', label: 'Widowed' }
        ]
      },
      {
        key: 'education_level', label: 'Education Level', placeholder: 'All Education Levels', type: 'select', options: [
          { value: '', label: 'All Education Levels' },
          { value: 'high_school', label: 'High School' },
          { value: 'bachelors', label: "Bachelor's Degree" },
          { value: 'masters', label: "Master's Degree" },
          { value: 'doctorate', label: 'Doctorate' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        key: 'employment_status', label: 'Employment Status', placeholder: 'All Employment Statuses', type: 'select', options: [
          { value: '', label: 'All Employment Statuses' },
          { value: 'employed', label: 'Employed' },
          { value: 'self_employed', label: 'Self-Employed' },
          { value: 'unemployed', label: 'Unemployed' },
          { value: 'student', label: 'Student' },
          { value: 'retired', label: 'Retired' }
        ]
      }
    ]
  },
  {
    key: 'location',
    label: 'LOCATION',
    fields: [
      {
        key: 'continent', label: 'Continent', placeholder: 'All Continents', type: 'select', options: [
          { value: '', label: 'All Continents' },
          { value: 'africa', label: 'Africa' },
          { value: 'asia', label: 'Asia' },
          { value: 'europe', label: 'Europe' },
          { value: 'north_america', label: 'North America' },
          { value: 'south_america', label: 'South America' },
          { value: 'oceania', label: 'Oceania' }
        ]
      },
      { key: 'country', label: 'Country', placeholder: 'All Countries', type: 'select', dynamicKey: 'countries' },
      { key: 'state', label: 'State', placeholder: 'All States', type: 'select', dynamicKey: 'states' },
      { key: 'region', label: 'Region', placeholder: 'All Regions', type: 'select', dynamicKey: 'regions' }
    ]
  },
  {
    key: 'church_participation',
    label: 'CHURCH PARTICIPATION',
    fields: [
      { key: 'denomination', label: 'Denomination', placeholder: 'All Denominations', type: 'select', dynamicKey: 'denominations' },
      {
        key: 'church_member_status', label: 'Church Member Status', placeholder: 'All Statuses', type: 'select', options: [
          { value: '', label: 'All Statuses' },
          { value: 'member', label: 'Member' },
          { value: 'visitor', label: 'Visitor' },
          { value: 'inactive', label: 'Inactive' }
        ]
      },
      {
        key: 'role_in_church', label: 'Role Within the Church', placeholder: 'All Roles', type: 'select', options: [
          { value: '', label: 'All Roles' },
          { value: 'member', label: 'Member' },
          { value: 'volunteer', label: 'Volunteer' },
          { value: 'staff', label: 'Staff' },
          { value: 'leadership', label: 'Leadership' }
        ]
      },
      {
        key: 'years_affiliated', label: 'Years Affiliated', placeholder: 'All Ranges', type: 'select', options: [
          { value: '', label: 'All Ranges' },
          { value: '0-1', label: 'Less than 1 year' },
          { value: '1-5', label: '1 - 5 years' },
          { value: '5-10', label: '5 - 10 years' },
          { value: '10+', label: '10+ years' }
        ]
      },
      {
        key: 'baptized', label: 'Baptized', placeholder: 'All', type: 'select', options: [
          { value: '', label: 'All' },
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' }
        ]
      },
      {
        key: 'small_group', label: 'Small Group Participation', placeholder: 'All', type: 'select', options: [
          { value: '', label: 'All' },
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' }
        ]
      }
    ]
  },
  {
    key: 'institution',
    label: 'INSTITUTION',
    fields: [
      { key: 'institution_id', label: 'Institution', placeholder: 'All Institutions', type: 'select', dynamicKey: 'institutions' },
      {
        key: 'affiliation_type', label: 'Affiliation Type', placeholder: 'All Types', type: 'select', options: [
          { value: '', label: 'All Types' },
          { value: 'student', label: 'Student' },
          { value: 'faculty', label: 'Faculty' },
          { value: 'staff', label: 'Staff' },
          { value: 'alumni', label: 'Alumni' }
        ]
      },
      { key: 'grade_level', label: 'Grade Level', placeholder: 'All Levels', type: 'select', dynamicKey: 'gradeLevels' },
      { key: 'department', label: 'Department', placeholder: 'All Departments', type: 'select', dynamicKey: 'departments' },
      { key: 'program_enrolled', label: 'Program Enrolled', placeholder: 'All Programs', type: 'select', dynamicKey: 'programs' }
    ]
  },
  {
    key: 'organization_affiliation',
    label: 'ORGANIZATION AFFILIATION',
    fields: [
      { key: 'primary_organization', label: 'Primary Organization', placeholder: 'All Organizations', type: 'select', dynamicKey: 'organizations' },
      { key: 'secondary_organizations', label: 'Secondary Organizations', placeholder: 'All Organizations', type: 'multi-select', dynamicKey: 'organizations' },
      { key: 'denomination_affiliation', label: 'Denomination', placeholder: 'All Denominations', type: 'select', dynamicKey: 'denominations' },
      { key: 'association_membership', label: 'Association Membership', placeholder: 'All Associations', type: 'select', dynamicKey: 'associations' }
    ]
  }
];

// Organization segmentation sections
const ORGANIZATION_SECTIONS = [
  {
    key: 'org_type',
    label: 'ORGANIZATION TYPE',
    fields: [
      {
        key: 'org_type_filter', label: 'Type', placeholder: 'All Types', type: 'select', options: [
          { value: '', label: 'All Types' },
          { value: 'institution', label: 'Institution' },
          { value: 'church', label: 'Church' },
          { value: 'non_formal', label: 'Non-Formal Organization' }
        ]
      }
    ]
  },
  {
    key: 'org_metadata',
    label: 'ORGANIZATION METADATA',
    fields: [
      {
        key: 'org_size', label: 'Size (Members/Students)', placeholder: 'All Sizes', type: 'select', options: [
          { value: '', label: 'All Sizes' },
          { value: 'small', label: 'Small (< 50)' },
          { value: 'medium', label: 'Medium (50 - 200)' },
          { value: 'large', label: 'Large (200 - 1000)' },
          { value: 'xlarge', label: 'Extra Large (1000+)' }
        ]
      },
      { key: 'geo_region', label: 'Geographic Region', placeholder: 'All Regions', type: 'select', dynamicKey: 'regions' },
      {
        key: 'setting', label: 'Setting', placeholder: 'All Settings', type: 'select', options: [
          { value: '', label: 'All Settings' },
          { value: 'urban', label: 'Urban' },
          { value: 'suburban', label: 'Suburban' },
          { value: 'rural', label: 'Rural' }
        ]
      },
      { key: 'org_denomination', label: 'Denomination Affiliation', placeholder: 'All Denominations', type: 'select', dynamicKey: 'denominations' },
      { key: 'org_association', label: 'Association Membership', placeholder: 'All Associations', type: 'select', dynamicKey: 'associations' },
      {
        key: 'org_status', label: 'Status', placeholder: 'All', type: 'select', options: [
          { value: '', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      }
    ]
  }
];

// Behavioral segmentation sections
const BEHAVIOR_SECTIONS = [
  {
    key: 'survey_participation',
    label: 'PRIOR SURVEY PARTICIPATION',
    fields: [
      { key: 'completed_survey', label: 'Completed Survey', placeholder: 'Select Survey...', type: 'select', dynamicKey: 'surveyTemplates' },
      { key: 'not_completed_survey', label: 'Did NOT Complete Survey', placeholder: 'Select Survey...', type: 'select', dynamicKey: 'surveyTemplates' },
      { key: 'abandoned_survey', label: 'Started but Abandoned', placeholder: 'Select Survey...', type: 'select', dynamicKey: 'surveyTemplates' },
      {
        key: 'responded_within', label: 'Responded Within', placeholder: 'Any Time', type: 'select', options: [
          { value: '', label: 'Any Time' },
          { value: '7', label: 'Last 7 Days' },
          { value: '30', label: 'Last 30 Days' },
          { value: '60', label: 'Last 60 Days' },
          { value: '90', label: 'Last 90 Days' },
          { value: '365', label: 'Last Year' }
        ]
      }
    ]
  },
  {
    key: 'specific_answers',
    label: 'SPECIFIC ANSWERS GIVEN',
    fields: [
      { key: 'answer_survey', label: 'From Survey', placeholder: 'Select Survey...', type: 'select', dynamicKey: 'surveyTemplates' },
      { key: 'answer_question', label: 'Question', placeholder: 'Select Question...', type: 'select', dynamicKey: 'questions' },
      { key: 'answer_value', label: 'Answer Contains', placeholder: 'Enter value...', type: 'text' }
    ]
  },
  {
    key: 'pattern_filters',
    label: 'PATTERN-BASED FILTERS',
    fields: [
      {
        key: 'engagement_level', label: 'Engagement Level', placeholder: 'All Levels', type: 'select', options: [
          { value: '', label: 'All Levels' },
          { value: 'high', label: 'High Engagement' },
          { value: 'medium', label: 'Medium Engagement' },
          { value: 'low', label: 'Low Engagement' }
        ]
      },
      {
        key: 'multi_survey', label: 'Multi-Survey Participants', placeholder: 'Any', type: 'select', options: [
          { value: '', label: 'Any' },
          { value: 'yes', label: 'Yes (2+ Surveys)' },
          { value: 'no', label: 'No (Single Survey)' }
        ]
      },
      {
        key: 'dissatisfaction_trend', label: 'Dissatisfaction Trend', placeholder: 'Any', type: 'select', options: [
          { value: '', label: 'Any' },
          { value: 'high', label: 'High Dissatisfaction' },
          { value: 'moderate', label: 'Moderate Dissatisfaction' }
        ]
      }
    ]
  },
  {
    key: 'score_segments',
    label: 'SCORE-BASED SEGMENTS',
    fields: [
      {
        key: 'nps_score', label: 'NPS Score', placeholder: 'All Scores', type: 'select', options: [
          { value: '', label: 'All Scores' },
          { value: 'promoter', label: 'Promoter (9-10)' },
          { value: 'passive', label: 'Passive (7-8)' },
          { value: 'detractor', label: 'Detractor (0-6)' }
        ]
      },
      {
        key: 'leadership_score', label: 'Leadership Score', placeholder: 'All Ranges', type: 'select', options: [
          { value: '', label: 'All Ranges' },
          { value: '80+', label: 'Above 80' },
          { value: '60-79', label: '60 - 79' },
          { value: 'below_60', label: 'Below 60' }
        ]
      },
      {
        key: 'risk_indicator', label: 'Risk Indicator', placeholder: 'All', type: 'select', options: [
          { value: '', label: 'All' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' }
        ]
      }
    ]
  }
];

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    gap: 0,
  },
  // Left sidebar
  sidebar: {
    width: 320,
    minWidth: 320,
    backgroundColor: COLORS.white,
    borderRight: `1px solid ${COLORS.border}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '20px 20px 12px 20px',
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: '4px',
  },
  sidebarSubtitle: {
    fontSize: '12px',
    color: COLORS.textSecondary,
    marginBottom: '16px',
    lineHeight: 1.4,
  },
  // Segment tabs
  tabsContainer: {
    display: 'flex',
    gap: '0',
    padding: '0 20px',
    borderBottom: `2px solid ${COLORS.borderLight}`,
  },
  tab: (isActive) => ({
    padding: '8px 0',
    marginRight: '20px',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    color: isActive ? COLORS.tabActive : COLORS.tabInactive,
    cursor: 'pointer',
    borderBottom: isActive ? `2px solid ${COLORS.tabUnderline}` : '2px solid transparent',
    marginBottom: '-2px',
    transition: 'all 0.2s ease',
    background: 'none',
    border: 'none',
    fontFamily: 'inherit',
    '&:hover': {
      color: COLORS.tabActive,
    }
  }),
  // Sections list
  sectionsContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  // Section accordion
  sectionHeader: (isOpen) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: COLORS.primaryLight,
    }
  }),
  sectionIcon: {
    fontSize: '18px',
    color: COLORS.textSecondary,
    marginRight: '8px',
    transition: 'transform 0.2s ease',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: COLORS.text,
    letterSpacing: '0.5px',
    flex: 1,
  },
  sectionAddBtn: {
    width: 22,
    height: 22,
    minWidth: 22,
    borderRadius: '50%',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    padding: 0,
    '&:hover': {
      backgroundColor: COLORS.primaryHover,
    }
  },
  sectionContent: {
    padding: '4px 20px 16px 46px',
  },
  // Fields
  fieldContainer: {
    marginBottom: '12px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: '4px',
    letterSpacing: '0.3px',
  },
  fieldSelect: {
    '& .MuiOutlinedInput-root': {
      fontSize: '13px',
      backgroundColor: COLORS.white,
      '& fieldset': {
        borderColor: COLORS.border,
      },
      '&:hover fieldset': {
        borderColor: COLORS.primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: COLORS.primary,
      },
    },
    '& .MuiSelect-select': {
      padding: '8px 12px',
    },
  },
  // Right panel
  mainPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  // Audience size card
  audienceSizeCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '24px 32px',
    backgroundColor: COLORS.primaryLight,
    borderBottom: `1px solid ${COLORS.border}`,
    gap: '24px',
  },
  donutContainer: {
    position: 'relative',
    width: 72,
    height: 72,
    flexShrink: 0,
  },
  audienceSizeInfo: {
    flex: 1,
  },
  audienceSizeLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: COLORS.textSecondary,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  audienceSizeValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: COLORS.text,
    lineHeight: 1.1,
    marginBottom: '4px',
  },
  audienceSizeDesc: {
    fontSize: '13px',
    color: COLORS.textSecondary,
    lineHeight: 1.4,
  },
  // Main content area
  mainContent: {
    flex: 1,
    padding: '24px 32px',
    overflowY: 'auto',
    backgroundColor: COLORS.primaryLight,
  },
  // Audience info form in right panel
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    padding: '24px',
    marginBottom: '20px',
  },
  formTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: COLORS.text,
    marginBottom: '16px',
  },
  // Active filters display
  activeFiltersCard: {
    backgroundColor: COLORS.white,
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    padding: '24px',
  },
  filterChip: {
    margin: '4px',
    backgroundColor: COLORS.chipBg,
    color: COLORS.chipText,
    fontWeight: 500,
    fontSize: '12px',
    '& .MuiChip-deleteIcon': {
      color: COLORS.chipText,
      '&:hover': {
        color: COLORS.primary,
      }
    }
  },
};

// ============================================================================
// DONUT CHART COMPONENT
// ============================================================================

const DonutChart = ({ percentage = 0, size = 72, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={COLORS.donut}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={COLORS.donutActive}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

// ============================================================================
// SEGMENT SECTION COMPONENT
// ============================================================================

const SegmentSection = ({ section, filters, onFilterChange, dynamicOptions, isOpen, onToggle }) => {
  return (
    <Box>
      {/* Section Header */}
      <Box
        sx={styles.sectionHeader(isOpen)}
        onClick={onToggle}
      >
        {isOpen ? (
          <ExpandMoreIcon sx={styles.sectionIcon} />
        ) : (
          <ChevronRightIcon sx={styles.sectionIcon} />
        )}
        <Typography sx={styles.sectionLabel}>
          {section.label}
        </Typography>
        {isOpen && (
          <Box
            sx={styles.sectionAddBtn}
            component="span"
            title="Add filter"
          >
            <AddIcon sx={{ fontSize: 14 }} />
          </Box>
        )}
      </Box>

      {/* Section Fields */}
      <Collapse in={isOpen} timeout={200}>
        <Box sx={styles.sectionContent}>
          {section.fields.map((field) => (
            <Box key={field.key} sx={styles.fieldContainer}>
              <Typography sx={styles.fieldLabel}>
                {field.label}
              </Typography>

              {field.type === 'text' ? (
                <TextField
                  fullWidth
                  size="small"
                  placeholder={field.placeholder}
                  value={filters[field.key] || ''}
                  onChange={(e) => onFilterChange(field.key, e.target.value)}
                  sx={styles.fieldSelect}
                />
              ) : field.type === 'multi-select' ? (
                <Autocomplete
                  multiple
                  size="small"
                  options={field.dynamicKey ? (dynamicOptions[field.dynamicKey] || []) : (field.options || []).filter(o => o.value)}
                  getOptionLabel={(option) => option.label || option.name || ''}
                  value={filters[field.key] || []}
                  onChange={(e, newValue) => onFilterChange(field.key, newValue)}
                  renderInput={(params) => (
                    <TextField {...params} placeholder={field.placeholder} sx={styles.fieldSelect} />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        key={index}
                        label={option.label || option.name}
                        {...getTagProps({ index })}
                        size="small"
                        sx={styles.filterChip}
                      />
                    ))
                  }
                />
              ) : (
                <FormControl fullWidth size="small" sx={styles.fieldSelect}>
                  <Select
                    value={filters[field.key] || ''}
                    onChange={(e) => onFilterChange(field.key, e.target.value)}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) return <span style={{ color: COLORS.textSecondary }}>{field.placeholder}</span>;
                      // Find label from options
                      const staticOpt = (field.options || []).find(o => o.value === value);
                      if (staticOpt) return staticOpt.label;
                      const dynOpts = dynamicOptions[field.dynamicKey] || [];
                      const dynOpt = dynOpts.find(o => (o.value || o.id) === value);
                      return dynOpt ? (dynOpt.label || dynOpt.name) : value;
                    }}
                  >
                    {field.options ? (
                      field.options.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))
                    ) : (
                      [
                        <MenuItem key="__all__" value="">
                          {field.placeholder}
                        </MenuItem>,
                        ...(dynamicOptions[field.dynamicKey] || []).map((opt) => (
                          <MenuItem key={opt.value || opt.id} value={opt.value || opt.id}>
                            {opt.label || opt.name}
                          </MenuItem>
                        ))
                      ]
                    )}
                  </Select>
                </FormControl>
              )}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CreateAudiencePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeSegmentTab, setActiveSegmentTab] = useState('member');
  const [openSections, setOpenSections] = useState({});

  // Form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // All segment filters stored in a flat object
  const [filters, setFilters] = useState({});

  // Dynamic options loaded from API
  const [dynamicOptions, setDynamicOptions] = useState({
    organizations: [],
    associations: [],
    surveyTemplates: [],
    institutions: [],
    denominations: [],
    countries: [],
    states: [],
    regions: [],
    gradeLevels: [],
    departments: [],
    programs: [],
    questions: [],
  });

  // Estimated audience size (computed)
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [totalUsers, setTotalUsers] = useState(null);
  const [estimatingSize, setEstimatingSize] = useState(false);
  const [audiencePercentage, setAudiencePercentage] = useState(0);
  const estimateTimerRef = useRef(null);

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  useEffect(() => {
    loadOptions();
    if (isEdit && id) {
      loadAudienceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, id]);

  // Debounced audience size estimation - runs on mount and when filters change
  useEffect(() => {
    // Clear previous timer
    if (estimateTimerRef.current) {
      clearTimeout(estimateTimerRef.current);
    }

    // Debounce API call by 500ms
    estimateTimerRef.current = setTimeout(() => {
      fetchEstimatedSize(filters);
    }, 500);

    return () => {
      if (estimateTimerRef.current) {
        clearTimeout(estimateTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchEstimatedSize = async (currentFilters) => {
    try {
      setEstimatingSize(true);
      const result = await AudienceService.estimateAudienceSize(currentFilters);
      setEstimatedSize(result.estimated_size);
      setTotalUsers(result.total_users);
      setAudiencePercentage(result.percentage || 0);
    } catch (err) {
      console.error('Failed to estimate audience size:', err);
      // Don't show error to user — this is a non-critical feature
    } finally {
      setEstimatingSize(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [orgsData, orgTypesData, templatesData] = await Promise.all([
        AudienceService.getAllOrganizations(),
        AudienceService.getOrganizationTypes(),
        AudienceService.getSurveyTemplates()
      ]);

      const orgs = orgsData.organizations || orgsData || [];
      const orgTypes = orgTypesData.organization_types || orgTypesData || [];
      const templates = templatesData.templates || templatesData || [];

      setDynamicOptions(prev => ({
        ...prev,
        organizations: orgs.map(o => ({ value: o.id, label: o.name, ...o })),
        associations: orgTypes.map(ot => ({ value: ot.id, label: ot.name, ...ot })),
        surveyTemplates: templates.map(t => ({ value: t.id, label: t.name || t.survey_code, ...t })),
        institutions: orgs.filter(o => o.type === 'institution' || o.organization_type === 'Institution').map(o => ({ value: o.id, label: o.name })),
      }));
    } catch (err) {
      setError('Failed to load options: ' + err.message);
    }
  };

  const loadAudienceData = async () => {
    try {
      setLoading(true);
      const data = await AudienceService.getAudience(id);
      setName(data.name);
      setDescription(data.description || '');

      // Restore active segment tab from saved audience_type
      const tabMap = { users: 'member', organizations: 'organization', mixed: 'behavior', associations: 'organization' };
      if (data.audience_type && tabMap[data.audience_type]) {
        setActiveSegmentTab(tabMap[data.audience_type]);
      }

      // Restore filters if saved
      if (data.filters) {
        setFilters(typeof data.filters === 'string' ? JSON.parse(data.filters) : data.filters);
      }
    } catch (err) {
      setError('Failed to load audience data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        delete updated[key];
      } else {
        updated[key] = value;
      }
      return updated;
    });
  }, []);

  const handleToggleSection = useCallback((sectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }, []);

  const handleRemoveFilter = useCallback((key) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!name.trim()) {
        setError('Audience name is required');
        setSaving(false);
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const audienceData = {
        name: name.trim(),
        description: description.trim(),
        audience_type: activeSegmentTab,
        created_by: currentUser.id,
        filters: JSON.stringify(filters),
        // Also pass legacy fields for backward compatibility
        organization_ids: filters.primary_organization ? JSON.stringify([filters.primary_organization]) : null,
      };

      if (isEdit) {
        await AudienceService.updateAudience(id, audienceData);
        setSuccess('Audience updated successfully');
      } else {
        await AudienceService.createAudience(audienceData);
        setSuccess('Audience created successfully');
      }

      setTimeout(() => {
        navigate('/audiences');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const activeFilters = Object.entries(filters).filter(([_, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== null && v !== undefined;
  });

  const activeFilterCount = activeFilters.length;

  // Get sections for current tab
  const getCurrentSections = () => {
    switch (activeSegmentTab) {
      case 'member': return MEMBER_SECTIONS;
      case 'organization': return ORGANIZATION_SECTIONS;
      case 'behavior': return BEHAVIOR_SECTIONS;
      default: return MEMBER_SECTIONS;
    }
  };

  // Find the label for a filter value
  const getFilterDisplayLabel = (key) => {
    const allSections = [...MEMBER_SECTIONS, ...ORGANIZATION_SECTIONS, ...BEHAVIOR_SECTIONS];
    for (const section of allSections) {
      for (const field of section.fields) {
        if (field.key === key) {
          const val = filters[key];
          if (Array.isArray(val)) {
            return `${field.label}: ${val.map(v => v.label || v.name || v).join(', ')}`;
          }
          if (field.options) {
            const opt = field.options.find(o => o.value === val);
            if (opt) return `${field.label}: ${opt.label}`;
          }
          const dynOpts = dynamicOptions[field.dynamicKey] || [];
          const dynOpt = dynOpts.find(o => (o.value || o.id) === val);
          if (dynOpt) return `${field.label}: ${dynOpt.label || dynOpt.name}`;
          return `${field.label}: ${val}`;
        }
      }
    }
    return `${key}: ${filters[key]}`;
  };

  // Build description summary
  const getAudienceSummary = () => {
    if (activeFilterCount === 0) {
      return 'No filters selected. Select segment filters to define your audience.';
    }
    const parts = [];
    if (filters.country) parts.push('in selected countries');
    if (filters.continent) parts.push('on selected continents');
    parts.push(`and ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} selected`);
    return `Members on Saurara ${parts.join(' ')}.`;
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Box sx={styles.pageContainer}>
      {/* Header */}
      <InternalHeader
        title={isEdit ? 'Edit Audience' : 'Create New Audience'}
        leftActions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/audiences')}
            sx={{
              borderColor: COLORS.border,
              color: COLORS.text,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { borderColor: COLORS.primary, color: COLORS.primary },
            }}
          >
            Audiences
          </Button>
        }
        rightActions={
          <>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading || !name.trim()}
              sx={{
                backgroundColor: COLORS.primary,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': { backgroundColor: COLORS.primaryHover },
                '&.Mui-disabled': { backgroundColor: '#ccc' },
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      />

      {/* Alerts */}
      {(error || success) && (
        <Box sx={{ px: 3, pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 1 }}>
              {success}
            </Alert>
          )}
        </Box>
      )}

      {/* Main Content - Two Panel Layout */}
      <Box sx={styles.contentWrapper}>
        {/* ============================================================ */}
        {/* LEFT SIDEBAR - Segments Panel */}
        {/* ============================================================ */}
        <Box sx={styles.sidebar}>
          {/* Sidebar Header */}
          <Box sx={styles.sidebarHeader}>
            <Typography sx={styles.sidebarTitle}>
              Segments
            </Typography>
            <Typography sx={styles.sidebarSubtitle}>
              Optionally refine your audience by selecting filters below. All filters are optional — expand a section to configure it.
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: '#f0f7ff',
              borderRadius: '6px',
              border: '1px solid #d0e3f7',
            }}>
              <InfoIcon sx={{ fontSize: 14, color: '#1976d2' }} />
              <Typography sx={{ fontSize: '11px', color: '#1565c0', lineHeight: 1.4 }}>
                All filters are optional. Click any section to expand it.
              </Typography>
            </Box>
          </Box>

          {/* Segment Tabs */}
          <Box sx={styles.tabsContainer}>
            {SEGMENT_TABS.map((tab) => (
              <Box
                key={tab.key}
                component="button"
                sx={styles.tab(activeSegmentTab === tab.key)}
                onClick={() => {
                  setActiveSegmentTab(tab.key);
                  // Auto-open first section of new tab
                  const sections = tab.key === 'member' ? MEMBER_SECTIONS
                    : tab.key === 'organization' ? ORGANIZATION_SECTIONS
                      : BEHAVIOR_SECTIONS;
                  if (sections.length > 0) {
                    setOpenSections(prev => ({ ...prev, [sections[0].key]: true }));
                  }
                }}
              >
                {tab.label}
              </Box>
            ))}
          </Box>

          {/* Sections List */}
          <Box sx={styles.sectionsContainer}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} sx={{ color: COLORS.primary }} />
              </Box>
            ) : (
              getCurrentSections().map((section) => (
                <SegmentSection
                  key={section.key}
                  section={section}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  dynamicOptions={dynamicOptions}
                  isOpen={!!openSections[section.key]}
                  onToggle={() => handleToggleSection(section.key)}
                />
              ))
            )}
          </Box>
        </Box>

        {/* ============================================================ */}
        {/* RIGHT PANEL - Audience Size + Config */}
        {/* ============================================================ */}
        <Box sx={styles.mainPanel}>
          {/* Estimated Audience Size */}
          <Box sx={styles.audienceSizeCard}>
            <Box sx={styles.donutContainer}>
              <DonutChart percentage={activeFilterCount > 0 ? audiencePercentage : (estimatedSize !== null ? 100 : 0)} />
            </Box>
            <Box sx={styles.audienceSizeInfo}>
              <Typography sx={styles.audienceSizeLabel}>
                ESTIMATED AUDIENCE SIZE
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <Typography sx={styles.audienceSizeValue}>
                  {estimatingSize ? '...' : (estimatedSize !== null ? estimatedSize.toLocaleString() : '—')}
                </Typography>
                {totalUsers !== null && estimatedSize !== null && !estimatingSize && (
                  <Typography sx={{ fontSize: '14px', color: COLORS.textSecondary, fontWeight: 500 }}>
                    of {totalUsers.toLocaleString()} total users{activeFilterCount > 0 ? ` (${audiencePercentage}%)` : ''}
                  </Typography>
                )}
              </Box>
              <Typography sx={styles.audienceSizeDesc}>
                {estimatingSize ? 'Calculating...' : getAudienceSummary()}
              </Typography>
            </Box>
          </Box>

          {/* Main Content Area */}
          <Box sx={styles.mainContent}>
            {/* Getting Started Guide */}
            <Box sx={{
              ...styles.formCard,
              background: 'linear-gradient(135deg, #f8f4ff 0%, #f0ebf5 100%)',
              border: `1px solid ${COLORS.primary}22`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 2 }}>
                <InfoIcon sx={{ fontSize: 20, color: COLORS.primary }} />
                <Typography sx={{ ...styles.formTitle, mb: 0 }}>
                  How to Create an Audience
                </Typography>
              </Box>

              {/* Step 1 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px', mb: 2 }}>
                <Box sx={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: name.trim() ? COLORS.success : COLORS.primary,
                  color: '#fff', fontSize: '12px', fontWeight: 700, mt: '2px',
                }}>
                  {name.trim() ? <CheckIcon sx={{ fontSize: 16 }} /> : '1'}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>
                    Enter an Audience Name <span style={{ color: '#d32f2f' }}>*</span>
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: COLORS.textSecondary, lineHeight: 1.4 }}>
                    This is the only required field. Give your audience a descriptive name.
                  </Typography>
                </Box>
              </Box>

              {/* Step 2 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px', mb: 2 }}>
                <Box sx={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: description.trim() ? COLORS.success : '#bdbdbd',
                  color: '#fff', fontSize: '12px', fontWeight: 700, mt: '2px',
                }}>
                  {description.trim() ? <CheckIcon sx={{ fontSize: 16 }} /> : '2'}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>
                    Add a Description <Typography component="span" sx={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 400 }}>(optional)</Typography>
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: COLORS.textSecondary, lineHeight: 1.4 }}>
                    Briefly describe who this audience represents.
                  </Typography>
                </Box>
              </Box>

              {/* Step 3 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px', mb: 1 }}>
                <Box sx={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: activeFilterCount > 0 ? COLORS.success : '#bdbdbd',
                  color: '#fff', fontSize: '12px', fontWeight: 700, mt: '2px',
                }}>
                  {activeFilterCount > 0 ? <CheckIcon sx={{ fontSize: 16 }} /> : '3'}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>
                    Add Segment Filters <Typography component="span" sx={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 400 }}>(optional)</Typography>
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: COLORS.textSecondary, lineHeight: 1.4 }}>
                    Use the Segments panel on the left to narrow down your audience by demographics, location, organization, or behavior.
                  </Typography>
                </Box>
              </Box>

              {/* Step 4 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Box sx={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#bdbdbd',
                  color: '#fff', fontSize: '12px', fontWeight: 700, mt: '2px',
                }}>
                  4
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>
                    Click Save
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: COLORS.textSecondary, lineHeight: 1.4 }}>
                    Once you've entered a name, the Save button becomes active. Filters can always be edited later.
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Audience Info Form */}
            <Box sx={styles.formCard}>
              <Typography sx={styles.formTitle}>
                Audience Details
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Audience Name"
                placeholder="Enter audience name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                helperText="Required — this is the only field you must fill in to save."
                sx={{ mb: 2, ...styles.fieldSelect, '& .MuiFormHelperText-root': { color: COLORS.textSecondary, fontSize: '11px' } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Description (optional)"
                placeholder="Describe this audience segment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                sx={styles.fieldSelect}
              />
            </Box>

            {/* Active Filters Summary */}
            <Box sx={styles.activeFiltersCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 1 }}>
                <FilterIcon sx={{ fontSize: 18, color: COLORS.primary }} />
                <Typography sx={{ ...styles.formTitle, mb: 0 }}>
                  Active Filters ({activeFilterCount})
                </Typography>
              </Box>
              {activeFilterCount === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px dashed #e0e0e0' }}>
                  <TuneIcon sx={{ fontSize: 18, color: '#bdbdbd' }} />
                  <Typography sx={{ fontSize: '13px', color: COLORS.textSecondary }}>
                    No filters selected. Use the <strong>Segments</strong> panel on the left to optionally narrow your audience.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {activeFilters.map(([key]) => (
                    <Chip
                      key={key}
                      label={getFilterDisplayLabel(key)}
                      onDelete={() => handleRemoveFilter(key)}
                      deleteIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
                      sx={styles.filterChip}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateAudiencePage;
