/**
 * Sample Data Service for Testing Report Generation
 * Provides access to sample survey data for theological education assessment
 */

class SampleDataService {
    static async loadSurveyQuestions() {
        try {
            const response = await fetch('/sample-data/survey-questions.json');
            if (!response.ok) {
                throw new Error('Failed to load survey questions');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading survey questions:', error);
            throw error;
        }
    }

    static async loadChurchResponses() {
        try {
            const response = await fetch('/sample-data/church-survey-responses.json');
            if (!response.ok) {
                throw new Error('Failed to load church survey responses');
            }
            const data = await response.json();
            return data.responses;
        } catch (error) {
            console.error('Error loading church responses:', error);
            throw error;
        }
    }

    static async loadInstitutionResponses() {
        try {
            const response = await fetch('/sample-data/institution-survey-responses.json');
            if (!response.ok) {
                throw new Error('Failed to load institution survey responses');
            }
            const data = await response.json();
            return data.responses;
        } catch (error) {
            console.error('Error loading institution responses:', error);
            throw error;
        }
    }

    static async loadNonFormalResponses() {
        try {
            const response = await fetch('/sample-data/non-formal-survey-responses.json');
            if (!response.ok) {
                throw new Error('Failed to load non-formal survey responses');
            }
            const data = await response.json();
            return data.responses;
        } catch (error) {
            console.error('Error loading non-formal responses:', error);
            throw error;
        }
    }

    static async loadAllResponses() {
        try {
            const [churchResponses, institutionResponses, nonFormalResponses] = await Promise.all([
                this.loadChurchResponses(),
                this.loadInstitutionResponses(),
                this.loadNonFormalResponses()
            ]);

            return {
                church: churchResponses,
                institution: institutionResponses,
                nonFormal: nonFormalResponses,
                all: [...churchResponses, ...institutionResponses, ...nonFormalResponses]
            };
        } catch (error) {
            console.error('Error loading all responses:', error);
            throw error;
        }
    }

    // Helper methods for data analysis
    static filterByCountry(responses, country) {
        return responses.filter(response => response.country === country);
    }

    static filterByEducationLevel(responses, educationLevel) {
        return responses.filter(response => response.education_level === educationLevel);
    }

    static filterByAgeGroup(responses, ageGroup) {
        return responses.filter(response => response.age_group === ageGroup);
    }

    static filterByActeaAccreditation(responses, isActeaAccredited) {
        return responses.filter(response => {
            if (response.actea_accredited) {
                return isActeaAccredited ? response.actea_accredited === "Yes" : response.actea_accredited === "No";
            }
            return false;
        });
    }

    static getUniqueCountries(responses) {
        return [...new Set(responses.map(response => response.country))].sort();
    }

    static getUniqueCities(responses) {
        return [...new Set(responses.map(response => response.city))].sort();
    }

    static getUniqueEducationLevels(responses) {
        return [...new Set(responses.map(response => response.education_level))].filter(level => level).sort();
    }

    static calculateAverageTrainingScores(responses) {
        if (responses.length === 0) return {};

        const scoreFields = [
            'preaching', 'teaching', 'evangelism', 'community_impact', 'discipleship',
            'pastoral_care', 'church_administration', 'counseling', 'organization_leadership',
            'conflict_resolution', 'prayer_spiritual_formation', 'spiritual_warfare',
            'interpersonal_relations', 'written_communication', 'teamwork',
            'leadership_development', 'children_youth', 'self_care', 'marriage_family',
            'emotional_mental_health'
        ];

        const averages = {};
        
        scoreFields.forEach(field => {
            const scores = responses
                .map(response => response.ministry_training_scores?.[field])
                .filter(score => score !== undefined && score !== null);
            
            if (scores.length > 0) {
                averages[field] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            }
        });

        return averages;
    }

    static getTrainingGaps(responses) {
        const averages = this.calculateAverageTrainingScores(responses);
        const gaps = Object.entries(averages)
            .map(([field, average]) => ({ field, average, gap: 5 - average }))
            .sort((a, b) => b.gap - a.gap);
        
        return gaps;
    }

    static getGeographicDistribution(responses) {
        const distribution = {};
        
        responses.forEach(response => {
            const country = response.country;
            if (!distribution[country]) {
                distribution[country] = {
                    count: 0,
                    cities: new Set(),
                    denominations: new Set()
                };
            }
            
            distribution[country].count++;
            distribution[country].cities.add(response.city);
            if (response.church_name) {
                // Extract denomination from church name (simplified)
                const churchName = response.church_name.toLowerCase();
                if (churchName.includes('redeemed')) distribution[country].denominations.add('RCCG');
                else if (churchName.includes('living faith')) distribution[country].denominations.add('Living Faith');
                else if (churchName.includes('anglican')) distribution[country].denominations.add('Anglican');
                else if (churchName.includes('presbyterian')) distribution[country].denominations.add('Presbyterian');
                else if (churchName.includes('methodist')) distribution[country].denominations.add('Methodist');
                else if (churchName.includes('assemblies')) distribution[country].denominations.add('Assemblies of God');
                else distribution[country].denominations.add('Other');
            }
        });

        // Convert sets to arrays
        Object.keys(distribution).forEach(country => {
            distribution[country].cities = Array.from(distribution[country].cities);
            distribution[country].denominations = Array.from(distribution[country].denominations);
        });

        return distribution;
    }

    // Generate sample report data
    static generateSampleReportData(responses, chartType = 'bar', metrics = [], dimensions = [], roleComparison = null, individualFilters = null) {
        if (!responses || responses.length === 0) return [];

        // Apply individual response filtering if enabled
        if (individualFilters && individualFilters.includeIndividualResponses) {
            responses = this.applyIndividualFilters(responses, individualFilters);
        }

        // If role comparison is enabled, use role-based analysis
        if (roleComparison && roleComparison.enabled) {
            return this.generateRoleBasedReportData(responses, chartType, metrics, dimensions, roleComparison);
        }

        // If specific metrics and dimensions are provided, use them
        if (metrics.length > 0 && dimensions.length > 0) {
            return this.generateCustomReportData(responses, metrics, dimensions, chartType, individualFilters);
        }

        // Default behavior for backward compatibility
        const averages = this.calculateAverageTrainingScores(responses);
        
        switch (chartType) {
            case 'bar':
                return Object.entries(averages).map(([field, average]) => ({
                    name: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value: Number(average.toFixed(2))
                }));
                
            case 'pie':
                const educationDist = {};
                responses.forEach(r => {
                    const level = r.education_level || 'Unknown';
                    educationDist[level] = (educationDist[level] || 0) + 1;
                });
                return Object.entries(educationDist).map(([name, value]) => ({ name, value }));
                
            case 'line':
                const yearlyData = {};
                responses.forEach(r => {
                    const year = r.last_training_year || 'Unknown';
                    yearlyData[year] = (yearlyData[year] || 0) + 1;
                });
                return Object.entries(yearlyData)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([year, count]) => ({ year, count }));
                
            default:
                return [];
        }
    }

    /**
     * Generate custom report data based on specific metrics and dimensions
     */
    static generateCustomReportData(responses, metrics, dimensions, chartType, individualFilters = null) {
        if (!responses || responses.length === 0) return [];
        
        const result = [];
        const primaryDimension = dimensions[0] || 'organization';
        const primaryMetric = metrics[0] || 'response_count';
        
        // Group data by primary dimension
        const groupedData = {};
        
        responses.forEach(response => {
            let groupKey = 'Unknown';
            
            switch (primaryDimension) {
                case 'question':
                    groupKey = 'Sample Question';
                    break;
                case 'organization':
                    groupKey = response.organization_name || 'Unknown Organization';
                    break;
                case 'geographic_location':
                    groupKey = response.country || 'Unknown Country';
                    break;
                case 'organization_type':
                    groupKey = response.organization_type || 'Unknown Type';
                    break;
                case 'user_role':
                    groupKey = response.current_role || 'Unknown Role';
                    break;
                default:
                    groupKey = response.organization_name || 'Unknown';
            }
            
            if (!groupedData[groupKey]) {
                groupedData[groupKey] = {
                    responses: [],
                    count: 0,
                    effectiveness_scores: [],
                    education_levels: []
                };
            }
            
            groupedData[groupKey].responses.push(response);
            groupedData[groupKey].count++;
            
            // Collect effectiveness scores
            if (response.training_effectiveness) {
                const score = this.mapEffectivenessToScore(response.training_effectiveness);
                groupedData[groupKey].effectiveness_scores.push(score);
            }
            
            // Collect education levels
            if (response.highest_education_level) {
                groupedData[groupKey].education_levels.push(response.highest_education_level);
            }
        });
        
        // Calculate metric values for each group
        Object.entries(groupedData).forEach(([groupName, data]) => {
            let value = 0;
            
            switch (primaryMetric) {
                case 'response_count':
                    value = data.count;
                    break;
                case 'completion_rate':
                    value = Math.round((data.count / responses.length) * 100);
                    break;
                case 'average_rating':
                    if (data.effectiveness_scores.length > 0) {
                        value = Math.round(
                            data.effectiveness_scores.reduce((a, b) => a + b, 0) / data.effectiveness_scores.length * 10
                        ) / 10;
                    }
                    break;
                case 'training_effectiveness':
                    if (data.effectiveness_scores.length > 0) {
                        value = Math.round(
                            data.effectiveness_scores.reduce((a, b) => a + b, 0) / data.effectiveness_scores.length
                        );
                    }
                    break;
                default:
                    value = data.count;
            }
            
            result.push({
                name: groupName,
                value: value,
                count: data.count,
                percentage: Math.round((data.count / responses.length) * 100),
                _metadata: {
                    dimension: primaryDimension,
                    metric: primaryMetric,
                    total_responses: responses.length
                }
            });
        });
        
        // Sort by value descending
        return result.sort((a, b) => (b.value || 0) - (a.value || 0));
    }

    /**
     * Map training effectiveness text to numeric score
     */
    static mapEffectivenessToScore(effectiveness) {
        const mapping = {
            'Very Effective': 5,
            'Effective': 4,
            'Moderately Effective': 3,
            'Slightly Effective': 2,
            'Not Effective': 1
        };
        return mapping[effectiveness] || 3;
    }

    /**
     * Load all sample data for general testing
     */
    static async loadAllSampleData() {
        try {
            const [questions, churchResponses, institutionResponses, nonFormalResponses] = await Promise.all([
                this.loadSurveyQuestions(),
                this.loadChurchResponses(),
                this.loadInstitutionResponses(),
                this.loadNonFormalResponses()
            ]);

            return {
                success: true,
                questions: questions.length,
                responses: churchResponses.length + institutionResponses.length + nonFormalResponses.length,
                church_responses: churchResponses.length,
                institution_responses: institutionResponses.length,
                non_formal_responses: nonFormalResponses.length
            };
        } catch (error) {
            console.error('Error loading all sample data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load organization-specific sample data
     */
    static async loadOrganizationData(organizationType, organizationHeadId) {
        try {
            const questions = await this.loadSurveyQuestions();
            
            // Define organization heads (matching ReportBuilder definition)
            const organizationHeads = {
                'church': [
                    { id: 'pastor_john', name: 'Pastor John Williams', role: 'Senior Pastor', organization: 'Grace Community Church' },
                    { id: 'pastor_mary', name: 'Pastor Mary Johnson', role: 'Associate Pastor', organization: 'Unity Fellowship Church' },
                    { id: 'pastor_david', name: 'Pastor David Brown', role: 'Senior Pastor', organization: 'First Baptist Church' }
                ],
                'institution': [
                    { id: 'president_sarah', name: 'Dr. Sarah Thompson', role: 'President', organization: 'Theological Seminary of Excellence' },
                    { id: 'dean_michael', name: 'Dr. Michael Davis', role: 'Academic Dean', organization: 'Institute of Biblical Studies' },
                    { id: 'rector_james', name: 'Dr. James Wilson', role: 'Rector', organization: 'Christian University College' }
                ],
                'non_formal': [
                    { id: 'leader_anna', name: 'Anna Rodriguez', role: 'Program Director', organization: 'Community Bible Training Center' },
                    { id: 'coordinator_paul', name: 'Paul Martinez', role: 'Training Coordinator', organization: 'Outreach Ministry Institute' },
                    { id: 'director_rachel', name: 'Rachel Chen', role: 'Executive Director', organization: 'Rural Ministry Training Program' }
                ]
            };

            // Get the specific organization head
            const orgHeads = organizationHeads[organizationType];
            const selectedHead = orgHeads.find(head => head.id === organizationHeadId);
            
            if (!selectedHead) {
                throw new Error(`Invalid organization head ID: ${organizationHeadId}`);
            }

            let responses = [];
            let organizationName = '';
            
            switch (organizationType) {
                case 'church':
                    responses = await this.loadChurchResponses();
                    organizationName = 'Church';
                    break;
                case 'institution':
                    responses = await this.loadInstitutionResponses();
                    organizationName = 'Educational Institution';
                    break;
                case 'non_formal':
                    responses = await this.loadNonFormalResponses();
                    organizationName = 'Non-Formal Education';
                    break;
                default:
                    throw new Error('Invalid organization type');
            }

            // Assign responses to the selected organization head
            const assignedResponses = responses.map((response, index) => ({
                ...response,
                // Assign head information
                respondent_id: `${organizationHeadId}_${index + 1}`,
                respondent_name: selectedHead.name,
                head_role: selectedHead.role,
                organization_name: selectedHead.organization,
                organization_type: organizationType,
                
                // Role mapping for filtering
                role: this.mapOrganizationTypeToRole(organizationType),
                role_title: selectedHead.role,
                
                // Survey metadata
                survey_id: `${organizationType}_survey`,
                survey_respondent: selectedHead.name,
                response_date: new Date().toISOString().split('T')[0],
                
                // Additional metadata for role-based analysis
                is_organization_head: true,
                head_id: organizationHeadId,
                leadership_level: this.getLeadershipLevel(selectedHead.role)
            }));

            console.log(`📋 Loaded ${assignedResponses.length} responses for ${selectedHead.name} (${selectedHead.role})`);

            return {
                success: true,
                organizationType,
                organizationHeadId,
                organizationName,
                selectedHead: selectedHead,
                questions: questions.length,
                responses: assignedResponses.length,
                data: {
                    questions,
                    responses: assignedResponses
                }
            };
        } catch (error) {
            console.error('Error loading organization data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Map organization type to role for filtering
     */
    static mapOrganizationTypeToRole(organizationType) {
        const roleMap = {
            'church': 'pastor',
            'institution': 'president', 
            'non_formal': 'ministry_leader'
        };
        return roleMap[organizationType] || 'unknown';
    }

    /**
     * Get leadership level from role title
     */
    static getLeadershipLevel(roleTitle) {
        const seniorRoles = ['Senior Pastor', 'President', 'Executive Director', 'Rector'];
        const midRoles = ['Associate Pastor', 'Academic Dean', 'Program Director'];
        const coordRoles = ['Training Coordinator'];
        
        if (seniorRoles.some(role => roleTitle.includes(role))) return 'senior';
        if (midRoles.some(role => roleTitle.includes(role))) return 'mid';
        if (coordRoles.some(role => roleTitle.includes(role))) return 'coordinator';
        return 'other';
    }

    /**
     * Get role name from organization type (for display purposes)
     */
    static getRoleFromOrganizationType(organizationType) {
        const roleMap = {
            'church': 'Pastor',
            'institution': 'President', 
            'non_formal': 'Ministry Leader'
        };
        return roleMap[organizationType] || 'Unknown';
    }

    /**
     * Generate role-based comparison report data
     */
    static generateRoleBasedReportData(responses, chartType, metrics, dimensions, roleComparison) {
        console.log('🎭 Generating role-based comparison data...', roleComparison);
        
        // Add role information to responses (use existing role or map from organization type)
        const responsesWithRoles = responses.map(response => ({
            ...response,
            role: response.role || this.getRoleFromOrganizationType(response.organization_type),
            region: response.region || this.getRegionFromCountry(response.country),
            // Include head-specific information if available
            head_name: response.respondent_name || response.head_name,
            role_title: response.role_title || response.head_role,
            leadership_level: response.leadership_level || 'other'
        }));

        switch (roleComparison.comparisonMode) {
            case 'within_role':
                return this.compareWithinRole(responsesWithRoles, roleComparison, chartType);
            case 'across_roles':
                return this.compareAcrossRoles(responsesWithRoles, roleComparison, chartType);
            case 'role_vs_average':
                return this.compareRoleVsAverage(responsesWithRoles, roleComparison, chartType);
            case 'cross_regional':
                return this.compareCrossRegional(responsesWithRoles, roleComparison, chartType);
            default:
                return this.compareWithinRole(responsesWithRoles, roleComparison, chartType);
        }
    }

    /**
     * Compare responses within the same role
     */
    static compareWithinRole(responses, roleComparison, chartType) {
        const { selectedRoles, regionFilter, selectedRegions } = roleComparison;
        
        // Filter by selected roles
        let filteredResponses = responses.filter(r => 
            selectedRoles.length === 0 || selectedRoles.includes(r.role.toLowerCase())
        );

        // Apply region filter
        if (regionFilter === 'specific_regions' && selectedRegions.length > 0) {
            filteredResponses = filteredResponses.filter(r => 
                selectedRegions.includes(r.region)
            );
        }

        // Group by role and calculate averages
        const roleGroups = {};
        filteredResponses.forEach(response => {
            const role = response.role;
            if (!roleGroups[role]) {
                roleGroups[role] = [];
            }
            roleGroups[role].push(response);
        });

        // Calculate metrics for each role
        const result = Object.entries(roleGroups).map(([role, roleResponses]) => {
            const avgScore = this.calculateAverageTrainingScores(roleResponses);
            const overallAvg = Object.values(avgScore).reduce((sum, val) => sum + val, 0) / Object.values(avgScore).length;
            
            return {
                name: role,
                value: Number(overallAvg.toFixed(2)),
                count: roleResponses.length,
                region: roleResponses[0]?.region || 'Unknown',
                details: avgScore
            };
        });

        return result;
    }

    /**
     * Compare responses across different roles
     */
    static compareAcrossRoles(responses, roleComparison, chartType) {
        const roleMetrics = {};
        
        // Group responses by role
        responses.forEach(response => {
            const role = response.role;
            if (!roleMetrics[role]) {
                roleMetrics[role] = [];
            }
            roleMetrics[role].push(response);
        });

        // Calculate comparative metrics
        const result = Object.entries(roleMetrics).map(([role, roleResponses]) => {
            const avgScore = this.calculateAverageTrainingScores(roleResponses);
            const overallAvg = Object.values(avgScore).reduce((sum, val) => sum + val, 0) / Object.values(avgScore).length;
            
            return {
                name: role,
                value: Number(overallAvg.toFixed(2)),
                count: roleResponses.length,
                satisfactionScore: this.calculateSatisfactionScore(roleResponses),
                trainingEffectiveness: this.calculateTrainingEffectiveness(roleResponses)
            };
        });

        return result.sort((a, b) => b.value - a.value);
    }

    /**
     * Compare specific role vs overall average
     */
    static compareRoleVsAverage(responses, roleComparison, chartType) {
        const { benchmarkRole } = roleComparison;
        
        // Calculate overall average
        const overallAvg = this.calculateAverageTrainingScores(responses);
        const overallScore = Object.values(overallAvg).reduce((sum, val) => sum + val, 0) / Object.values(overallAvg).length;
        
        // Calculate benchmark role average
        const benchmarkResponses = responses.filter(r => r.role.toLowerCase() === benchmarkRole.toLowerCase());
        const benchmarkAvg = this.calculateAverageTrainingScores(benchmarkResponses);
        const benchmarkScore = Object.values(benchmarkAvg).reduce((sum, val) => sum + val, 0) / Object.values(benchmarkAvg).length;
        
        return [
            {
                name: 'Overall Average',
                value: Number(overallScore.toFixed(2)),
                count: responses.length,
                type: 'average'
            },
            {
                name: benchmarkRole,
                value: Number(benchmarkScore.toFixed(2)),
                count: benchmarkResponses.length,
                type: 'role',
                variance: Number((benchmarkScore - overallScore).toFixed(2))
            }
        ];
    }

    /**
     * Compare same role across different regions
     */
    static compareCrossRegional(responses, roleComparison, chartType) {
        const { selectedRoles } = roleComparison;
        
        // Filter by selected roles
        let filteredResponses = responses.filter(r => 
            selectedRoles.length === 0 || selectedRoles.includes(r.role.toLowerCase())
        );

        // Group by region and role
        const regionRoleGroups = {};
        filteredResponses.forEach(response => {
            const region = response.region;
            const role = response.role;
            const key = `${region}_${role}`;
            
            if (!regionRoleGroups[key]) {
                regionRoleGroups[key] = {
                    region,
                    role,
                    responses: []
                };
            }
            regionRoleGroups[key].responses.push(response);
        });

        // Calculate metrics for each region-role combination
        const result = Object.values(regionRoleGroups).map(group => {
            const avgScore = this.calculateAverageTrainingScores(group.responses);
            const overallAvg = Object.values(avgScore).reduce((sum, val) => sum + val, 0) / Object.values(avgScore).length;
            
            return {
                name: `${group.role} (${group.region})`,
                value: Number(overallAvg.toFixed(2)),
                count: group.responses.length,
                region: group.region,
                role: group.role
            };
        });

        return result.sort((a, b) => a.region.localeCompare(b.region));
    }

    /**
     * Calculate satisfaction score for a group of responses
     */
    static calculateSatisfactionScore(responses) {
        if (!responses || responses.length === 0) return 0;
        
        // Mock satisfaction calculation - in real implementation, this would use actual satisfaction metrics
        const scores = responses.map(r => {
            const effectiveness = r.training_effectiveness || 'Average';
            return this.mapEffectivenessToScore(effectiveness);
        });
        
        return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
    }

    /**
     * Calculate training effectiveness score for a group of responses
     */
    static calculateTrainingEffectiveness(responses) {
        if (!responses || responses.length === 0) return 0;
        
        const effectivenessScores = responses.map(r => {
            const effectiveness = r.training_effectiveness || 'Average';
            return this.mapEffectivenessToScore(effectiveness);
        });
        
        return Number((effectivenessScores.reduce((sum, score) => sum + score, 0) / effectivenessScores.length).toFixed(2));
    }

    /**
     * Get region from country name
     */
    static getRegionFromCountry(country) {
        const regionMap = {
            'Kenya': 'East Africa',
            'Uganda': 'East Africa',
            'Tanzania': 'East Africa',
            'Rwanda': 'East Africa',
            'Ethiopia': 'East Africa',
            'Nigeria': 'West Africa',
            'Ghana': 'West Africa',
            'Senegal': 'West Africa',
            'Mali': 'West Africa',
            'Burkina Faso': 'West Africa',
            'Cameroon': 'Central Africa',
            'Chad': 'Central Africa',
            'Central African Republic': 'Central Africa',
            'Democratic Republic of Congo': 'Central Africa',
            'South Africa': 'Southern Africa',
            'Botswana': 'Southern Africa',
            'Zimbabwe': 'Southern Africa',
            'Zambia': 'Southern Africa',
            'Egypt': 'North Africa',
            'Morocco': 'North Africa',
            'Algeria': 'North Africa',
            'Tunisia': 'North Africa'
        };
        
        return regionMap[country] || 'Unknown Region';
    }

    /**
     * Analyze demographics within roles
     */
    static analyzeDemographicsWithinRoles(responses, roleComparison) {
        const { selectedRoles, showRoleDemographics, compareExperienceLevels } = roleComparison;
        
        // Filter by selected roles
        let filteredResponses = responses.filter(r => 
            selectedRoles.length === 0 || selectedRoles.includes(r.role?.toLowerCase())
        );

        const demographicAnalysis = {};

        // Group by role and analyze demographics
        filteredResponses.forEach(response => {
            const role = response.role || 'Unknown';
            
            if (!demographicAnalysis[role]) {
                demographicAnalysis[role] = {
                    total: 0,
                    ageGroups: {},
                    experienceLevels: {},
                    educationLevels: {},
                    averageScores: {}
                };
            }

            demographicAnalysis[role].total++;

            // Age group analysis
            const ageGroup = this.getAgeGroup(response.age);
            demographicAnalysis[role].ageGroups[ageGroup] = (demographicAnalysis[role].ageGroups[ageGroup] || 0) + 1;

            // Experience level analysis
            const experienceLevel = this.getExperienceLevel(response.years_of_experience);
            demographicAnalysis[role].experienceLevels[experienceLevel] = (demographicAnalysis[role].experienceLevels[experienceLevel] || 0) + 1;

            // Education level analysis
            const educationLevel = response.education_level || 'Unknown';
            demographicAnalysis[role].educationLevels[educationLevel] = (demographicAnalysis[role].educationLevels[educationLevel] || 0) + 1;
        });

        // Calculate percentages and averages
        Object.keys(demographicAnalysis).forEach(role => {
            const roleData = demographicAnalysis[role];
            const total = roleData.total;

            // Convert counts to percentages
            roleData.ageGroupsPercentage = {};
            Object.keys(roleData.ageGroups).forEach(ageGroup => {
                roleData.ageGroupsPercentage[ageGroup] = Number(((roleData.ageGroups[ageGroup] / total) * 100).toFixed(1));
            });

            roleData.experienceLevelsPercentage = {};
            Object.keys(roleData.experienceLevels).forEach(level => {
                roleData.experienceLevelsPercentage[level] = Number(((roleData.experienceLevels[level] / total) * 100).toFixed(1));
            });

            roleData.educationLevelsPercentage = {};
            Object.keys(roleData.educationLevels).forEach(level => {
                roleData.educationLevelsPercentage[level] = Number(((roleData.educationLevels[level] / total) * 100).toFixed(1));
            });

            // Calculate average scores for this role
            const roleResponses = filteredResponses.filter(r => r.role === role);
            roleData.averageScores = this.calculateAverageTrainingScores(roleResponses);
        });

        return demographicAnalysis;
    }

    /**
     * Get age group from age
     */
    static getAgeGroup(age) {
        if (!age || age === 'Unknown') return 'Unknown';
        
        const ageNum = parseInt(age);
        if (isNaN(ageNum)) return 'Unknown';
        
        if (ageNum < 30) return 'Under 30';
        if (ageNum < 40) return '30-39';
        if (ageNum < 50) return '40-49';
        if (ageNum < 60) return '50-59';
        return '60+';
    }

    /**
     * Get experience level from years of experience
     */
    static getExperienceLevel(years) {
        if (!years || years === 'Unknown') return 'Unknown';
        
        const yearsNum = parseInt(years);
        if (isNaN(yearsNum)) return 'Unknown';
        
        if (yearsNum < 2) return 'Novice (0-2 years)';
        if (yearsNum < 5) return 'Developing (2-5 years)';
        if (yearsNum < 10) return 'Experienced (5-10 years)';
        if (yearsNum < 20) return 'Senior (10-20 years)';
        return 'Veteran (20+ years)';
    }

    /**
     * Compare roles by demographics
     */
    static compareRolesByDemographics(responses, roleComparison) {
        const { selectedRoles, comparisonMode } = roleComparison;
        
        const demographicAnalysis = this.analyzeDemographicsWithinRoles(responses, roleComparison);
        
        // Create comparison data structure
        const comparisonData = {
            ageGroups: {},
            experienceLevels: {},
            educationLevels: {},
            performanceByDemographic: {}
        };

        // Aggregate data across roles for comparison
        Object.keys(demographicAnalysis).forEach(role => {
            const roleData = demographicAnalysis[role];
            
            // Age group comparison
            Object.keys(roleData.ageGroupsPercentage).forEach(ageGroup => {
                if (!comparisonData.ageGroups[ageGroup]) {
                    comparisonData.ageGroups[ageGroup] = [];
                }
                comparisonData.ageGroups[ageGroup].push({
                    role: role,
                    percentage: roleData.ageGroupsPercentage[ageGroup],
                    count: roleData.ageGroups[ageGroup]
                });
            });

            // Experience level comparison
            Object.keys(roleData.experienceLevelsPercentage).forEach(level => {
                if (!comparisonData.experienceLevels[level]) {
                    comparisonData.experienceLevels[level] = [];
                }
                comparisonData.experienceLevels[level].push({
                    role: role,
                    percentage: roleData.experienceLevelsPercentage[level],
                    count: roleData.experienceLevels[level]
                });
            });

            // Education level comparison
            Object.keys(roleData.educationLevelsPercentage).forEach(level => {
                if (!comparisonData.educationLevels[level]) {
                    comparisonData.educationLevels[level] = [];
                }
                comparisonData.educationLevels[level].push({
                    role: role,
                    percentage: roleData.educationLevelsPercentage[level],
                    count: roleData.educationLevels[level]
                });
            });
        });

        return {
            roleAnalysis: demographicAnalysis,
            comparisonData: comparisonData
        };
    }

    /**
     * Generate role-specific KPIs
     */
    static generateRoleSpecificKPIs(responses, role) {
        const roleResponses = responses.filter(r => r.role?.toLowerCase() === role.toLowerCase());
        
        if (roleResponses.length === 0) {
            return {
                role: role,
                kpis: {},
                benchmarks: {},
                insights: []
            };
        }

        const kpis = {};
        const benchmarks = {};
        const insights = [];

        // Basic KPIs
        kpis.totalResponses = roleResponses.length;
        kpis.averageAge = this.calculateAverageAge(roleResponses);
        kpis.averageExperience = this.calculateAverageExperience(roleResponses);
        kpis.satisfactionScore = this.calculateSatisfactionScore(roleResponses);
        kpis.trainingEffectiveness = this.calculateTrainingEffectiveness(roleResponses);

        // Role-specific KPIs
        const avgScores = this.calculateAverageTrainingScores(roleResponses);
        const overallAvg = Object.values(avgScores).reduce((sum, val) => sum + val, 0) / Object.values(avgScores).length;
        kpis.overallPerformance = Number(overallAvg.toFixed(2));

        // Benchmarks (compare against all responses)
        const allAvgScores = this.calculateAverageTrainingScores(responses);
        const allOverallAvg = Object.values(allAvgScores).reduce((sum, val) => sum + val, 0) / Object.values(allAvgScores).length;
        
        benchmarks.overallPerformance = Number(allOverallAvg.toFixed(2));
        benchmarks.performanceVariance = Number((kpis.overallPerformance - benchmarks.overallPerformance).toFixed(2));

        // Generate insights
        if (benchmarks.performanceVariance > 0.5) {
            insights.push(`${role} performs above average by ${benchmarks.performanceVariance} points`);
        } else if (benchmarks.performanceVariance < -0.5) {
            insights.push(`${role} performs below average by ${Math.abs(benchmarks.performanceVariance)} points`);
        }

        if (kpis.averageExperience > 15) {
            insights.push('High experience level in this role');
        } else if (kpis.averageExperience < 5) {
            insights.push('Relatively new workforce in this role');
        }

        return {
            role: role,
            kpis: kpis,
            benchmarks: benchmarks,
            insights: insights
        };
    }

    /**
     * Calculate average age from responses
     */
    static calculateAverageAge(responses) {
        const ages = responses.map(r => parseInt(r.age)).filter(age => !isNaN(age));
        if (ages.length === 0) return 0;
        return Number((ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1));
    }

    /**
     * Calculate average experience from responses
     */
    static calculateAverageExperience(responses) {
        const experience = responses.map(r => parseInt(r.years_of_experience)).filter(exp => !isNaN(exp));
        if (experience.length === 0) return 0;
        return Number((experience.reduce((sum, exp) => sum + exp, 0) / experience.length).toFixed(1));
    }

    /**
     * Apply individual response filtering
     */
    static applyIndividualFilters(responses, filters) {
        console.log('🔍 Applying individual response filters:', filters);
        
        let filteredResponses = [...responses];

        // Add individual response metadata
        filteredResponses = filteredResponses.map(response => ({
            ...response,
            respondent_id: response.respondent_id || `resp_${Math.random().toString(36).substr(2, 9)}`,
            survey_id: response.survey_id || 'sample_survey',
            response_date: response.response_date || new Date().toISOString().split('T')[0]
        }));

        // Filter by role
        if (filters.filterByRole && filters.selectedRoles.length > 0) {
            filteredResponses = filteredResponses.filter(response => {
                // Check both the 'role' field and mapped organization type
                const responseRole = response.role || this.mapOrganizationTypeToRole(response.organization_type);
                return filters.selectedRoles.includes(responseRole);
            });
        }

        // Filter by organization
        if (filters.filterByOrganization && filters.selectedOrganizations.length > 0) {
            filteredResponses = filteredResponses.filter(response => {
                const orgName = response.organization_name || response.organization || 'Unknown';
                return filters.selectedOrganizations.includes(orgName);
            });
        }

        // Filter by demographics
        if (filters.filterByDemographics) {
            // Age range filter
            if (filters.ageRange.min || filters.ageRange.max) {
                filteredResponses = filteredResponses.filter(response => {
                    const age = parseInt(response.age);
                    if (isNaN(age)) return false;
                    
                    const minAge = parseInt(filters.ageRange.min) || 0;
                    const maxAge = parseInt(filters.ageRange.max) || 999;
                    
                    return age >= minAge && age <= maxAge;
                });
            }

            // Experience range filter
            if (filters.experienceRange.min || filters.experienceRange.max) {
                filteredResponses = filteredResponses.filter(response => {
                    const experience = parseInt(response.years_of_experience);
                    if (isNaN(experience)) return false;
                    
                    const minExp = parseInt(filters.experienceRange.min) || 0;
                    const maxExp = parseInt(filters.experienceRange.max) || 999;
                    
                    return experience >= minExp && experience <= maxExp;
                });
            }

            // Education level filter
            if (filters.educationLevels.length > 0) {
                filteredResponses = filteredResponses.filter(response => {
                    const educationLevel = response.education_level || 'Unknown';
                    return filters.educationLevels.includes(educationLevel);
                });
            }
        }

        // Filter by region
        if (filters.filterByRegion && filters.selectedRegions.length > 0) {
            filteredResponses = filteredResponses.filter(response => {
                const region = response.region || this.getRegionFromCountry(response.country);
                return filters.selectedRegions.includes(region);
            });
        }

        console.log('🔍 Filtered responses:', filteredResponses.length, 'from', responses.length, 'total');

        // If individual comparison is enabled, return individual comparison data
        if (filters.compareAcrossIndividuals) {
            return this.generateIndividualComparisonData(filteredResponses, filters);
        }

        return filteredResponses;
    }

    /**
     * Generate individual comparison data
     */
    static generateIndividualComparisonData(responses, filters) {
        console.log('👥 Generating individual comparison data for', responses.length, 'responses');
        
        // Group responses by survey question or section
        const individualComparisons = {};
        
        responses.forEach(response => {
            const respondentId = response.respondent_id;
            const respondentName = response.respondent_name || 
                                 response.name || 
                                 `${response.organization_type} ${respondentId.substr(-4)}`;
            
            if (!individualComparisons[respondentId]) {
                individualComparisons[respondentId] = {
                    respondent_id: respondentId,
                    respondent_name: respondentName,
                    role: response.role || 'Unknown',
                    organization: response.organization || 'Unknown',
                    organization_type: response.organization_type || 'Unknown',
                    region: response.region || this.getRegionFromCountry(response.country),
                    age: response.age || 'Unknown',
                    experience: response.years_of_experience || 'Unknown',
                    education: response.education_level || 'Unknown',
                    averageScores: this.calculateAverageTrainingScores([response]),
                    responseCount: 1
                };
            }
        });

        // Convert to array and calculate overall performance score
        const comparisonData = Object.values(individualComparisons).map(individual => {
            const avgScores = individual.averageScores;
            const overallScore = Object.values(avgScores).reduce((sum, val) => sum + val, 0) / Object.values(avgScores).length;
            
            return {
                name: individual.respondent_name,
                value: Number(overallScore.toFixed(2)),
                respondent_id: individual.respondent_id,
                role: individual.role,
                organization: individual.organization,
                region: individual.region,
                demographics: {
                    age: individual.age,
                    experience: individual.experience,
                    education: individual.education
                },
                details: avgScores,
                responseCount: individual.responseCount
            };
        });

        // Sort by performance score
        comparisonData.sort((a, b) => b.value - a.value);

        return comparisonData;
    }

    /**
     * Get individual response details for a specific respondent
     */
    static getIndividualResponseDetails(responses, respondentId) {
        const respondentResponses = responses.filter(r => r.respondent_id === respondentId);
        
        if (respondentResponses.length === 0) {
            return null;
        }

        const respondent = respondentResponses[0];
        const avgScores = this.calculateAverageTrainingScores(respondentResponses);
        
        return {
            respondent_id: respondentId,
            respondent_name: respondent.respondent_name || respondent.name || 'Unknown',
            role: respondent.role || 'Unknown',
            organization: respondent.organization || 'Unknown',
            demographics: {
                age: respondent.age || 'Unknown',
                experience: respondent.years_of_experience || 'Unknown',
                education: respondent.education_level || 'Unknown',
                country: respondent.country || 'Unknown',
                region: respondent.region || this.getRegionFromCountry(respondent.country)
            },
            performance: {
                averageScores: avgScores,
                overallScore: Object.values(avgScores).reduce((sum, val) => sum + val, 0) / Object.values(avgScores).length,
                responseCount: respondentResponses.length
            },
            responses: respondentResponses
        };
    }

    /**
     * Compare specific individuals
     */
    static compareSpecificIndividuals(responses, respondentIds) {
        const individualDetails = respondentIds.map(id => 
            this.getIndividualResponseDetails(responses, id)
        ).filter(detail => detail !== null);

        // Calculate comparative metrics
        const comparisonData = individualDetails.map(individual => {
            const overallAverage = individualDetails.reduce((sum, ind) => 
                sum + ind.performance.overallScore, 0) / individualDetails.length;
            
            return {
                name: individual.respondent_name,
                value: individual.performance.overallScore,
                variance: individual.performance.overallScore - overallAverage,
                role: individual.role,
                organization: individual.organization,
                region: individual.demographics.region,
                demographics: individual.demographics,
                details: individual.performance.averageScores
            };
        });

        return comparisonData;
    }

    /**
     * Enhanced Test Mode Support - Get users by role
     */
    static async getUsersByRole(role) {
        console.log('🎭 Getting users by role:', role);
        
        // Sample users data with multiple users per role
        const sampleUsers = {
            'pastor': [
                { 
                    id: 'pastor_john_w', 
                    name: 'Pastor John Williams', 
                    organization: 'Grace Community Church',
                    location: 'Nairobi, Kenya',
                    experience: '15 years',
                    education: 'Master of Divinity'
                },
                { 
                    id: 'pastor_mary_j', 
                    name: 'Pastor Mary Johnson', 
                    organization: 'Unity Fellowship Church',
                    location: 'Lagos, Nigeria',
                    experience: '8 years',
                    education: 'Bachelor of Theology'
                },
                { 
                    id: 'pastor_david_b', 
                    name: 'Pastor David Brown', 
                    organization: 'First Baptist Church',
                    location: 'Accra, Ghana',
                    experience: '12 years',
                    education: 'Master of Theology'
                },
                { 
                    id: 'pastor_grace_m', 
                    name: 'Pastor Grace Mwangi', 
                    organization: 'New Hope Church',
                    location: 'Kampala, Uganda',
                    experience: '6 years',
                    education: 'Certificate in Ministry'
                }
            ],
            'president': [
                { 
                    id: 'president_sarah_t', 
                    name: 'Dr. Sarah Thompson', 
                    organization: 'Theological Seminary of Excellence',
                    location: 'Cape Town, South Africa',
                    experience: '20 years',
                    education: 'PhD in Theology'
                },
                { 
                    id: 'president_michael_d', 
                    name: 'Dr. Michael Davis', 
                    organization: 'Institute of Biblical Studies',
                    location: 'Addis Ababa, Ethiopia',
                    experience: '18 years',
                    education: 'PhD in Biblical Studies'
                },
                { 
                    id: 'president_james_w', 
                    name: 'Dr. James Wilson', 
                    organization: 'Christian University College',
                    location: 'Harare, Zimbabwe',
                    experience: '22 years',
                    education: 'PhD in Systematic Theology'
                }
            ],
            'ministry_leader': [
                { 
                    id: 'leader_anna_r', 
                    name: 'Anna Rodriguez', 
                    organization: 'Community Bible Training Center',
                    location: 'Dar es Salaam, Tanzania',
                    experience: '10 years',
                    education: 'Master of Arts in Ministry'
                },
                { 
                    id: 'leader_paul_m', 
                    name: 'Paul Martinez', 
                    organization: 'Outreach Ministry Institute',
                    location: 'Kigali, Rwanda',
                    experience: '7 years',
                    education: 'Bachelor of Ministry'
                },
                { 
                    id: 'leader_rachel_c', 
                    name: 'Rachel Chen', 
                    organization: 'Rural Ministry Training Program',
                    location: 'Lusaka, Zambia',
                    experience: '9 years',
                    education: 'Diploma in Pastoral Care'
                }
            ],
            'faculty': [
                { 
                    id: 'faculty_peter_k', 
                    name: 'Dr. Peter Kamau', 
                    organization: 'Africa Theological Seminary',
                    location: 'Nairobi, Kenya',
                    experience: '14 years',
                    education: 'PhD in New Testament Studies'
                },
                { 
                    id: 'faculty_rebecca_o', 
                    name: 'Dr. Rebecca Okafor', 
                    organization: 'West Africa Bible College',
                    location: 'Abuja, Nigeria',
                    experience: '11 years',
                    education: 'PhD in Old Testament Studies'
                }
            ],
            'administrator': [
                { 
                    id: 'admin_joseph_n', 
                    name: 'Joseph Nkomo', 
                    organization: 'Southern Africa Theological Institute',
                    location: 'Gaborone, Botswana',
                    experience: '5 years',
                    education: 'Master of Administration'
                }
            ]
        };
        
        return sampleUsers[role] || [];
    }

    /**
     * Get surveys by user
     */
    static async getSurveysByUser(userId) {
        console.log('📋 Getting surveys by user:', userId);
        
        // Sample surveys data - each user has taken different surveys
        const userSurveys = {
            'pastor_john_w': [
                { 
                    id: 'church_leadership_2024', 
                    title: 'Church Leadership Effectiveness Survey 2024',
                    responses: 150,
                    completion_rate: 95,
                    date_taken: '2024-03-15'
                },
                { 
                    id: 'theological_education_eval', 
                    title: 'Theological Education Evaluation',
                    responses: 89,
                    completion_rate: 87,
                    date_taken: '2024-02-10'
                }
            ],
            'pastor_mary_j': [
                { 
                    id: 'church_leadership_2024', 
                    title: 'Church Leadership Effectiveness Survey 2024',
                    responses: 132,
                    completion_rate: 92,
                    date_taken: '2024-03-20'
                },
                { 
                    id: 'ministry_impact_assessment', 
                    title: 'Ministry Impact Assessment',
                    responses: 76,
                    completion_rate: 84,
                    date_taken: '2024-01-25'
                }
            ],
            'pastor_david_b': [
                { 
                    id: 'church_leadership_2024', 
                    title: 'Church Leadership Effectiveness Survey 2024',
                    responses: 201,
                    completion_rate: 98,
                    date_taken: '2024-03-18'
                }
            ],
            'pastor_grace_m': [
                { 
                    id: 'church_leadership_2024', 
                    title: 'Church Leadership Effectiveness Survey 2024',
                    responses: 98,
                    completion_rate: 89,
                    date_taken: '2024-03-22'
                }
            ],
            'president_sarah_t': [
                { 
                    id: 'institutional_effectiveness_2024', 
                    title: 'Institutional Effectiveness Survey 2024',
                    responses: 245,
                    completion_rate: 96,
                    date_taken: '2024-02-28'
                },
                { 
                    id: 'academic_leadership_eval', 
                    title: 'Academic Leadership Evaluation',
                    responses: 187,
                    completion_rate: 91,
                    date_taken: '2024-01-15'
                }
            ],
            'president_michael_d': [
                { 
                    id: 'institutional_effectiveness_2024', 
                    title: 'Institutional Effectiveness Survey 2024',
                    responses: 198,
                    completion_rate: 94,
                    date_taken: '2024-03-05'
                }
            ],
            'president_james_w': [
                { 
                    id: 'institutional_effectiveness_2024', 
                    title: 'Institutional Effectiveness Survey 2024',
                    responses: 267,
                    completion_rate: 97,
                    date_taken: '2024-02-20'
                }
            ],
            'leader_anna_r': [
                { 
                    id: 'nonformal_education_impact', 
                    title: 'Non-Formal Education Impact Study',
                    responses: 143,
                    completion_rate: 88,
                    date_taken: '2024-03-10'
                }
            ],
            'leader_paul_m': [
                { 
                    id: 'nonformal_education_impact', 
                    title: 'Non-Formal Education Impact Study',
                    responses: 167,
                    completion_rate: 93,
                    date_taken: '2024-03-08'
                }
            ],
            'leader_rachel_c': [
                { 
                    id: 'nonformal_education_impact', 
                    title: 'Non-Formal Education Impact Study',
                    responses: 134,
                    completion_rate: 85,
                    date_taken: '2024-03-12'
                }
            ]
        };
        
        return userSurveys[userId] || [];
    }

    /**
     * Get specific user survey data
     */
    static async getUserSurveyData(userId, surveyId) {
        console.log('📊 Getting user survey data for:', userId, surveyId);
        
        try {
            // Load appropriate base responses based on survey type
            let baseResponses = [];
            
            if (surveyId.includes('church') || surveyId.includes('leadership')) {
                baseResponses = await this.loadChurchResponses();
            } else if (surveyId.includes('institutional') || surveyId.includes('academic')) {
                baseResponses = await this.loadInstitutionResponses();
            } else if (surveyId.includes('nonformal')) {
                baseResponses = await this.loadNonFormalResponses();
            } else {
                // Default to church responses
                baseResponses = await this.loadChurchResponses();
            }
            
            // Get user info
            const userInfo = await this.getUserInfo(userId);
            
            // Customize responses for this specific user
            const userResponses = baseResponses.slice(0, 5).map((response, index) => ({
                ...response,
                respondent_id: `${userId}_response_${index + 1}`,
                respondent_name: userInfo.name,
                survey_id: surveyId,
                user_id: userId,
                organization_name: userInfo.organization,
                role: this.getUserRole(userId),
                role_title: userInfo.role_title || 'Leadership Position',
                location: userInfo.location,
                experience_years: parseInt(userInfo.experience) || 10,
                education_level: userInfo.education || 'Master Degree',
                response_date: this.getRandomRecentDate(),
                // Add slight variations to make responses unique to this user
                ...this.addUserVariations(response, userId)
            }));
            
            return {
                success: true,
                userId,
                surveyId,
                userInfo,
                responses: userResponses.length,
                data: {
                    responses: userResponses
                }
            };
        } catch (error) {
            console.error('Error loading user survey data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get other users in the same role for comparison
     */
    static async getOtherUsersInRole(role, currentUserId) {
        console.log('👥 Getting other users in role:', role, 'excluding:', currentUserId);
        
        const allUsers = await this.getUsersByRole(role);
        return allUsers.filter(user => user.id !== currentUserId);
    }

    /**
     * Get comparison data for role
     */
    static async getComparisonDataForRole(role, currentUserId, compareUsers) {
        console.log('🔄 Getting comparison data for role:', role);
        
        try {
            let allComparisonResponses = [];
            
            // Load responses for each comparison user
            for (const user of compareUsers) {
                // Get the user's surveys
                const userSurveys = await this.getSurveysByUser(user.id);
                
                if (userSurveys.length > 0) {
                    // Use the first survey for comparison
                    const userData = await this.getUserSurveyData(user.id, userSurveys[0].id);
                    
                    if (userData.success) {
                        allComparisonResponses = [...allComparisonResponses, ...userData.data.responses];
                    }
                }
            }
            
            return {
                success: true,
                role,
                currentUserId,
                compareUsers: compareUsers.length,
                responses: allComparisonResponses.length,
                data: {
                    responses: allComparisonResponses
                }
            };
        } catch (error) {
            console.error('Error loading comparison data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Helper method to get user info
     */
    static async getUserInfo(userId) {
        const allRoles = ['pastor', 'president', 'ministry_leader', 'faculty', 'administrator'];
        
        for (const role of allRoles) {
            const users = await this.getUsersByRole(role);
            const user = users.find(u => u.id === userId);
            if (user) {
                return {
                    ...user,
                    role: role,
                    role_title: this.getRoleTitleFromId(userId)
                };
            }
        }
        
        return {
            name: 'Unknown User',
            organization: 'Unknown Organization',
            location: 'Unknown Location',
            experience: '5 years',
            education: 'Bachelor Degree',
            role: 'unknown'
        };
    }

    /**
     * Helper method to get role from user ID
     */
    static getUserRole(userId) {
        if (userId.includes('pastor')) return 'pastor';
        if (userId.includes('president')) return 'president';
        if (userId.includes('leader')) return 'ministry_leader';
        if (userId.includes('faculty')) return 'faculty';
        if (userId.includes('admin')) return 'administrator';
        return 'unknown';
    }

    /**
     * Helper method to get role title from user ID
     */
    static getRoleTitleFromId(userId) {
        const titleMap = {
            'pastor_john_w': 'Senior Pastor',
            'pastor_mary_j': 'Associate Pastor',
            'pastor_david_b': 'Senior Pastor',
            'pastor_grace_m': 'Youth Pastor',
            'president_sarah_t': 'President',
            'president_michael_d': 'Academic Dean',
            'president_james_w': 'Rector',
            'leader_anna_r': 'Program Director',
            'leader_paul_m': 'Training Coordinator',
            'leader_rachel_c': 'Executive Director',
            'faculty_peter_k': 'Professor',
            'faculty_rebecca_o': 'Associate Professor',
            'admin_joseph_n': 'Administrative Manager'
        };
        
        return titleMap[userId] || 'Leadership Position';
    }

    /**
     * Add user-specific variations to responses
     */
    static addUserVariations(response, userId) {
        // Add slight variations based on user characteristics
        const variations = {};
        
        // Vary training effectiveness based on user experience
        if (response.training_effectiveness) {
            const experienceBoost = userId.includes('president') ? 0.1 : 
                                  userId.includes('pastor') ? 0.05 : 0;
            variations.training_effectiveness = response.training_effectiveness;
        }
        
        // Add user-specific metadata
        variations.user_experience_level = this.getUserExperienceLevel(userId);
        variations.institutional_type = this.getInstitutionalType(userId);
        
        return variations;
    }

    /**
     * Get user experience level
     */
    static getUserExperienceLevel(userId) {
        if (userId.includes('president') || userId.includes('faculty')) return 'senior';
        if (userId.includes('david') || userId.includes('anna')) return 'experienced';
        return 'developing';
    }

    /**
     * Get institutional type
     */
    static getInstitutionalType(userId) {
        if (userId.includes('pastor')) return 'church';
        if (userId.includes('president') || userId.includes('faculty')) return 'seminary';
        if (userId.includes('leader')) return 'training_center';
        return 'other';
    }

    /**
     * Get random recent date
     */
    static getRandomRecentDate() {
        const dates = [
            '2024-03-15', '2024-03-10', '2024-02-28', '2024-02-20', '2024-01-15'
        ];
        return dates[Math.floor(Math.random() * dates.length)];
    }
}

export default SampleDataService; 