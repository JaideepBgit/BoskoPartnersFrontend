# Report Builder Documentation

## Overview

The Report Builder is a comprehensive tool for creating interactive reports and visualizations from survey data. It allows administrators to:

- Select data scope (surveys, date ranges, geography)
- Choose metrics (response counts, completion rates, averages)
- Define dimensions (grouping criteria)
- **NEW: Configure role-based comparisons and analysis**
- Configure visualizations (charts, tables, KPIs)
- Save and manage report templates
- Export results in multiple formats

## Component Structure

```
Reports/
├── ReportBuilder.js          # Advanced configuration-based report builder
├── VisualReportBuilder.js    # Tableau-like drag-and-drop interface
├── GeographicCircleSelector.js # Interactive map for region selection
├── ReportsPage.js            # Main reports landing page
├── README.md                 # This documentation
└── (future components)
    ├── ChartRenderer.js      # Specialized chart rendering
    ├── DataProcessor.js      # Data transformation utilities
    └── TemplateManager.js    # Template CRUD operations
```

## New Role-Based Comparison Features

### User Roles Supported
- **Pastor/Church Leader**: Senior pastor or church leader
- **Institution President**: President/Principal/Rector/Doyen of theological institution
- **Ministry Leader**: Leader in non-formal theological education
- **Faculty Member**: Teaching staff at theological institution
- **Administrator**: Administrative staff
- **Student**: Current student
- **Alumni**: Graduate

### Role Comparison Modes
1. **Within Role**: Compare users within the same role (e.g., presidents vs other presidents)
2. **Across Roles**: Compare different roles against each other
3. **Role vs Average**: Compare specific role performance against overall average

### Role-Specific Metrics
- **Role Comparison Score**: Comparative score against other roles
- **Role Distribution**: Distribution of responses by role
- **Demographic Breakdown**: Age, experience, education distribution by role
- **Competency Gaps**: Areas where roles score lower than average
- **Training Effectiveness**: Measure of training impact by role
- **Role Satisfaction**: Overall satisfaction levels by role

### Enhanced Dimensions
- **Role Demographics**: Age, experience, education within roles
- **Role Competency**: Training effectiveness by role
- **Role Comparison**: Cross-role performance comparison
- **Ministry Experience**: Years of experience in ministry
- **Education Level**: Educational qualifications
- **Age Group**: Age demographic grouping
- **Institutional Type**: Type of theological institution

### Role-Specific Chart Types
- **Role Comparison**: Bar chart with role averages and overall averages
- **Demographic Breakdown**: Stacked bar chart showing demographic distribution
- **Competency Matrix**: Scatter plot showing competency vs satisfaction
- **Training Effectiveness**: Line chart showing before/after training impact
- **Role Performance Heatmap**: Grid showing performance across different areas

### Geographic Chart Types
- **Geographic Map View**: Visual representation of selected regions and their boundaries
- **Regional Comparison**: Bar chart comparing responses inside vs outside selected regions
- **Distance Analysis**: Line chart showing correlation between distance from region centers and responses

## Pre-Built Role Templates

### 1. President Performance Dashboard
**Target**: Institution Presidents
**Purpose**: Compare institution presidents across key leadership metrics
**Features**: 
- Role comparison charts
- Demographic analysis
- Leadership competency assessment

### 2. Pastor Training Effectiveness
**Target**: Pastors/Church Leaders
**Purpose**: Analyze pastoral training outcomes and competency gaps
**Features**:
- Training effectiveness analysis
- Competency gap identification
- Ministry experience correlation

### 3. Cross-Role Competency Matrix
**Target**: All Roles
**Purpose**: Compare competencies across different ministry roles
**Features**:
- Multi-role comparison
- Competency mapping
- Cross-role insights

### 4. Ministry Leader Impact Assessment
**Target**: Ministry Leaders
**Purpose**: Evaluate non-formal theological education effectiveness
**Features**:
- Impact measurement
- Role-specific heatmaps
- Educational outcome analysis

### 5. Geographic Regional Analysis
**Target**: All Roles
**Purpose**: Compare survey responses across selected geographic regions
**Features**:
- Interactive map-based region selection
- Circle-based geographic filtering
- Regional comparison analysis
- Distance-based correlation studies

## Visual Report Builder (Tableau-like Interface)

### Overview
The Visual Report Builder provides an intuitive drag-and-drop interface similar to Tableau for creating reports and visualizations without complex configuration.

### Key Features
- **Drag-and-Drop Interface**: Intuitive field manipulation with visual feedback
- **Real-time Preview**: Instant chart updates as you build your report
- **Smart Drop Zones**: Intelligent field placement with type validation
- **Field Organization**: Categorized fields (Organization, Geography, Demographics, etc.)
- **Chart Type Selection**: Easy switching between visualization types
- **Interactive Canvas**: Visual report building workspace

### Field Types
- **Dimensions** (Purple): Categorical data for grouping (Organization, Country, Role, etc.)
- **Measures** (Green): Numerical data for analysis (Counts, Rates, Scores, etc.)

### Drop Zones
- **Columns**: Add measures (numerical data) for Y-axis values
- **Rows**: Add dimensions (categories) for X-axis grouping
- **Filters**: Add any field type to filter data
- **Colors**: Add dimensions to color-code visualizations

### User Interface
- **Left Panel**: Categorized field library with drag handles
- **Center Canvas**: Drop zones and chart preview area
- **Right Panel**: Chart settings and configuration options

### Visual Feedback
- **Hover Effects**: Fields lift and highlight on hover
- **Drag States**: Visual feedback during drag operations
- **Drop Zone Validation**: Color-coded zones show valid/invalid drops
- **Shimmer Animation**: Active drop zones display shimmer effect
- **Smart Tooltips**: Contextual help and field type indicators

## State Schema

### Enhanced State Structure

```javascript
const reportBuilderState = {
  // UI state
  currentTab: 0,              // Active configuration tab (0-5)
  loading: false,             // Loading indicator
  error: '',                  // Error message display
  
  // Data state
  reportData: [],             // Raw report results
  previewData: [],            // Processed data for visualization
  
  // Configuration state
  dataScope: {
    surveys: [],              // Array of survey template IDs
    sections: [],             // Array of section IDs/names
    dateRange: {
      start: '',              // ISO date string
      end: ''                 // ISO date string
    },
    geography: {
      continents: [],         // Array of continent names
      countries: [],          // Array of country names
      regions: [],            // Array of region names
      customGroups: [],       // Custom geographic groupings
      circles: []             // Geographic circles for regional filtering
    }
  },
  
  // Metrics and dimensions
  selectedMetrics: [],        // Array of metric IDs
  selectedDimensions: [],     // Array of dimension IDs
  
  // NEW: Role-based comparison state
  roleComparison: {
    enabled: false,           // Whether role comparison is active
    comparisonMode: 'within_role', // 'within_role', 'across_roles', 'role_vs_average'
    selectedRoles: [],        // Array of role IDs to compare
    selectedDemographics: [], // Array of demographic categories
    benchmarkRole: '',        // Role to use as benchmark
    showStatistics: true      // Whether to show statistical analysis
  },
  
  // Chart configuration
  chartConfig: {
    type: 'bar',              // Chart type (including new role-specific types)
    title: '',                // Chart title
    subtitle: '',             // Chart subtitle
    xAxis: '',                // X-axis label
    yAxis: '',                // Y-axis label
    colorPalette: 'default',  // Color scheme
    showMissingData: true,    // Include missing data
    legendPosition: 'right',  // Legend position
    sortOrder: 'asc'          // Sort order
  },
  
  // Template management
  templates: [],              // Saved templates
  roleSpecificTemplates: [],  // Pre-built role templates
  templateDialog: false,      // Template save dialog visibility
  templateName: '',           // New template name
  selectedTemplate: null,     // Currently loaded template
  
  // Available data options
  availableData: {
    surveys: [],              // Available survey templates
    sections: [],             // Available survey sections
    questions: [],            // Available questions
    organizations: [],        // Available organizations
    users: [],                // Available users
    geographicData: {
      continents: [],         // Geographic data
      countries: [],
      regions: []
    }
  }
};
```

## Usage Guide

### Setting Up Role-Based Comparisons

1. **Enable Role Comparison**: Navigate to the "Role Comparison" tab and check "Enable Role-Based Comparison"

2. **Select Comparison Mode**:
   - **Within Role**: Compare users within the same role
   - **Across Roles**: Compare different roles
   - **Role vs Average**: Compare against overall average

3. **Choose Roles**: Select which roles to include in the comparison

4. **Select Demographics**: Choose demographic categories to analyze (age, experience, education, etc.)

5. **Configure Metrics**: Select role-specific metrics like training effectiveness, competency gaps, etc.

6. **Choose Visualization**: Select appropriate chart type (role comparison, demographic breakdown, etc.)

### Using Pre-Built Templates

1. Navigate to the "Templates" tab
2. Expand "Role-Specific Templates"
3. Click the play button next to any template to load it
4. Customize as needed and generate the report

### Using Geographic Circle Selection

1. **Open Map Interface**: In the "Data Scope" tab, click "Select Geographic Regions on Map"

2. **Draw Circles**: 
   - Click "Draw Circle" to enter drawing mode
   - Click and drag on the map to create circular regions
   - Each circle represents a geographic area for filtering

3. **Edit Circles**:
   - Drag circles to move them
   - Drag circle edges to resize radius
   - Click visibility icon to show/hide circles
   - Edit names directly in the region list

4. **Configure Analysis**:
   - Select geographic-specific metrics (Geographic Distribution, Regional Comparison)
   - Choose geographic dimensions (Geographic Region, Distance from Center)
   - Use geographic chart types for visualization

5. **Generate Reports**: Create comparisons between selected regions and other areas

### Using the Visual Report Builder

1. **Access Interface**: Navigate to "Visual Builder" from the navigation menu or Reports page

2. **Browse Fields**: 
   - Left panel shows categorized fields (Organization, Geography, Demographics, etc.)
   - Purple icons = Dimensions (categories for grouping)
   - Green icons = Measures (numerical values for analysis)

3. **Build Reports**:
   - Drag **measures** to **Columns** zone (for Y-axis values)
   - Drag **dimensions** to **Rows** zone (for X-axis categories)
   - Drag fields to **Filters** zone to filter data
   - Drag dimensions to **Colors** zone for color coding

4. **Visual Feedback**:
   - Valid drop zones turn green with shimmer effect
   - Invalid zones turn red with error message
   - Real-time chart preview updates as you build

5. **Customize Charts**:
   - Right panel offers chart type selection
   - Toggle grid lines and legends
   - View field summary and counts
   - Quick actions for clearing and refreshing

6. **Save and Export**: Use toolbar buttons to save reports or export visualizations

### Interpreting Results

The enhanced report builder provides:
- **Role Insights Panel**: Shows selected roles, comparison mode, and quick statistics
- **Enhanced Charts**: Role-specific visualizations with comparative data
- **Statistical Analysis**: Averages, counts, and performance metrics
- **Recommendations**: Automated insights and suggested actions

## API Integration

The report builder sends enhanced requests to `/api/reports/data` with role comparison and geographic filtering:

```javascript
{
  dataScope: {
    surveys: [1, 2],
    sections: ["Personal Information", "Pastoral Formation"],
    dateRange: { start: "2024-01-01", end: "2024-12-31" },
    geography: {
      continents: ["Africa"],
      countries: ["Kenya", "Uganda"],
      regions: [],
      customGroups: [],
      circles: [
        {
          id: 1672531200000,
          name: "East Africa Region",
          center: { lat: -1.2921, lng: 36.8219 },
          radius: 500000, // 500 km radius
          visible: true,
          color: "#633394"
        }
      ]
    }
  },
  metrics: ['regional_comparison', 'response_count'],
  dimensions: ['geographic_region', 'user_role'],
  chartConfig: { type: 'regional_comparison', title: 'Regional Analysis' },
  roleComparison: {
    enabled: true,
    comparisonMode: 'within_role',
    selectedRoles: ['president', 'pastor'],
    selectedDemographics: ['age', 'experience'],
    showStatistics: true
  }
}
```

## Best Practices

1. **Start with Templates**: Use pre-built role templates as starting points
2. **Focus on Specific Roles**: Don't try to compare too many roles at once
3. **Use Appropriate Charts**: Different chart types work better for different comparisons
4. **Include Demographics**: Demographic analysis provides valuable context
5. **Enable Statistics**: Statistical analysis helps identify significant differences

**Visual Builder Best Practices**:
1. **Start Simple**: Begin with one measure and one dimension, then add complexity
2. **Use Appropriate Chart Types**: Bar charts for comparisons, line charts for trends, pie charts for proportions
3. **Group Related Fields**: Use the categorized field organization to find related data
4. **Validate Field Types**: Ensure you're using measures for numerical analysis and dimensions for grouping
5. **Preview Changes**: Watch the real-time preview to understand your data as you build
6. **Save Frequently**: Use save functionality to preserve complex report configurations

## Troubleshooting

**Common Issues**:
- **No Data**: Ensure surveys are selected and roles have sufficient responses
- **Missing Charts**: Check that appropriate metrics and dimensions are selected
- **Performance Issues**: Limit the number of roles and date ranges for better performance

**Error Messages**:
- "No role data available": Selected roles may not have survey responses
- "Insufficient data for comparison": Need more responses for statistical analysis
- "Failed to load Google Maps": Check internet connection and API key validity
- "No responses in selected regions": Selected geographic circles may not contain any survey responses

**Geographic Feature Issues**:
- **Map not loading**: Ensure stable internet connection and Google Maps API access
- **Circles not saving**: Check that circles are properly drawn and confirmed before closing the map dialog
- **No geographic data**: Verify that survey responses include valid latitude/longitude coordinates 