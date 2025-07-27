# Sample Survey Data for Report Generation Testing

This directory contains comprehensive sample survey data for testing the report generation functionality of the theological education assessment system.

## Files Overview

### 1. `survey-questions.json`
Contains the complete structure of all three survey types:
- **Church Survey**: For pastors and church leaders
- **Institution Survey**: For theological institution presidents/administrators  
- **Non-Formal Survey**: For ministry leaders with non-formal theological education

### 2. `church-survey-responses.json`
Sample responses from 12+ church pastors across Nigeria and Africa including:
- **Nigerian Churches**: Lagos, Kano, Port Harcourt, Enugu, Minna
- **African Churches**: Ghana (Accra), Kenya (Nairobi), Ethiopia (Addis Ababa), Uganda (Kampala), South Africa (Cape Town)
- **Denominations**: RCCG, Living Faith, MFM, Christ Embassy, Deeper Life, Presbyterian, Anglican, Orthodox, Pentecostal, Methodist, Assemblies of God, Dutch Reformed

### 3. `institution-survey-responses.json`
Sample responses from 3+ theological institutions:
- **Redeemers University School of Divinity** (Nigeria)
- **Trinity Theological Seminary** (Ghana) 
- **St. Paul's University Theological College** (Kenya)

### 4. `non-formal-survey-responses.json`
Sample responses from 5+ non-formal ministry leaders across:
- **Nigeria**: Lagos, Onitsha
- **Ghana**: Accra, Tema
- **Kenya**: Nairobi
- **Ethiopia**: Addis Ababa

## Data Structure Features

### Geographic Diversity
- **Nigerian States**: Lagos, Kano, Rivers, Enugu, Niger, Ogun, FCT
- **African Countries**: Nigeria, Ghana, Kenya, Uganda, South Africa, Ethiopia
- **Cities**: Major urban centers across West, East, and Southern Africa

### Demographic Variety
- **Age Groups**: 20-30, 31-40, 41-50, 51-60, Over 60
- **Experience Levels**: 1-3 years to 20+ years in ministry
- **Education Levels**: Certificate, Diploma, Bachelors, Masters, PhD
- **Institution Types**: ACTEA accredited and non-accredited institutions

### Response Patterns
- **Scale Responses**: Varied 1-5 scale responses across ministry competencies
- **Educational Backgrounds**: Mix of formal theological education and denominational training
- **Geographic Distribution**: Urban and rural contexts
- **Denominational Diversity**: Protestant, Pentecostal, Orthodox, Anglican, Presbyterian, Methodist

## How to Use for Testing

### 1. Load Data for Report Generation
```javascript
// Example: Load church survey responses
fetch('/sample-data/church-survey-responses.json')
  .then(response => response.json())
  .then(data => {
    // Use data.responses array for report generation
    console.log(`Loaded ${data.responses.length} church responses`);
  });
```

### 2. Filter by Geographic Location
```javascript
// Example: Filter responses by country
const nigerianResponses = data.responses.filter(r => r.country === 'Nigeria');
const ghanaianResponses = data.responses.filter(r => r.country === 'Ghana');
```

### 3. Analyze Training Effectiveness
```javascript
// Example: Calculate average ministry training scores
const averagePreachingScore = data.responses
  .map(r => r.ministry_training_scores.preaching)
  .reduce((sum, score) => sum + score, 0) / data.responses.length;
```

### 4. Compare by Education Level
```javascript
// Example: Group responses by education level
const byEducation = data.responses.reduce((groups, response) => {
  const level = response.education_level;
  groups[level] = groups[level] || [];
  groups[level].push(response);
  return groups;
}, {});
```

## Report Generation Ideas

### Possible Analysis Reports
1. **Geographic Distribution**: Ministry effectiveness by country/region
2. **Education Level Impact**: Correlation between formal education and ministry preparedness
3. **Institution Effectiveness**: Comparison of ACTEA vs non-ACTEA institutions
4. **Training Gaps**: Areas where pastors feel least prepared
5. **Denominational Patterns**: Training effectiveness by church denomination
6. **Experience vs Education**: How years in ministry correlates with training needs
7. **Support Systems**: Availability and effectiveness of ongoing ministerial support

### Sample Query Scenarios
- "How do Nigerian pastors rate their training in counseling vs. preaching?"
- "What is the difference in preparedness between formal and non-formal trained leaders?"
- "Which theological institutions produce the most well-prepared pastors?"
- "What are the top training needs across different age groups?"
- "How does geographic location affect access to ongoing ministerial support?"

## Data Quality Notes

- All names, institutions, and addresses are realistic but fictional
- Response patterns are based on typical survey distributions
- Geographic data reflects actual African cities and countries
- Institution names are inspired by real theological institutions but are not actual data
- Scale responses (1-5) follow realistic distribution patterns
- Text responses reflect common themes in theological education assessment

This sample data provides a robust foundation for testing all report generation functionality including role-based comparisons, geographic analysis, and visual report building features. 