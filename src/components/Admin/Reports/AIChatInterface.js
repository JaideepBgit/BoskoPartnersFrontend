import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    Avatar,
    CircularProgress,
    Chip,
    Card,
    CardContent,
    Collapse,
    Fade,
    Tooltip,
    Button
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
// import SmartToyIcon from '@mui/icons-material/SmartToy'; // Removed in favor of AutoAwesomeIcon
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import StorageIcon from '@mui/icons-material/Storage';
import AssessmentIcon from '@mui/icons-material/Assessment';

/**
 * AI Chat Interface Component - ChatGPT-like interface for survey analytics
 * Provides natural language interaction with survey data
 * 
 * TODO: Future API Integration
 * - Set apiEndpoint to your AI service URL (e.g., OpenAI, custom backend)
 * - Configure apiKey in environment variables (REACT_APP_AI_API_KEY)
 * - Update analyzeQuery function to call the actual API
 */

// Configuration for Gemini API integration
const AI_CONFIG = {
    // Enable API integration
    useApiEnabled: true,
    // Gemini API endpoint - using gemini-1.5-flash (current model)
    apiEndpoint: process.env.REACT_APP_AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    // API key from .env file (NEVER commit actual keys)
    apiKey: process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyCL45YwgZZBlsyIZDsC5m1nBJ5gFNokjwI',
    // Model to use
    model: 'gemini-1.5-flash',
};

const AIChatInterface = ({ surveyData, comparisonData, onGenerateReport, selectedSurveyType }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'assistant',
            content: `Hello! I'm your AI-powered Survey Analytics Assistant. I can help you analyze survey data, generate comparative reports, and provide insights using advanced AI technology.\n\nTry asking me things like:\n\n• "Compare surveys by organization"\n• "Show me the top performing institutions"\n• "Generate a report for churches in Kenya"\n• "What are the common trends across surveys?"\n• "Analyze the leadership training responses"`,
            timestamp: new Date(),
            suggestions: [
                'Compare all organizations',
                'Show performance trends',
                'Generate comparative report',
                'Analyze survey responses'
            ]
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Analyze query - uses RAG API with database grounding
    const analyzeQuery = async (query) => {
        try {
            // Call RAG endpoint
            const response = await fetch('http://localhost:5000/api/rag/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: query,
                    limit: 10
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }


            return {
                content: data.response,
                suggestions: [
                    'Tell me more',
                    'Show different data',
                    'Compare organizations',
                    'Export this data'
                ],
                grounding: data.grounding,
                metadata: data.metadata
            };


        } catch (error) {
            console.error('❌ RAG API Error:', error);
            // Fallback to local analysis if API fails
            return generateDefaultResponse();
        }
    };


    // Gemini API call function
    const callAIAPI = async (query) => {
        try {
            // Build context about the survey data
            const surveyCount = Object.values(surveyData).flat().length;
            const types = Object.keys(surveyData).filter(k => surveyData[k]?.length > 0);
            const surveyContext = types.map(type => {
                const count = surveyData[type]?.length || 0;
                return `${type}: ${count} responses`;
            }).join(', ');

            // Create system prompt with survey context
            const systemPrompt = `You are a survey analytics assistant for the Saurara Platform. 
You help analyze survey data and provide insights about educational institutions, churches, and non-formal education programs.

Current survey data context:
- Total responses: ${surveyCount}
- Survey types: ${surveyContext}
- Selected survey type: ${selectedSurveyType}

Provide helpful, concise, and actionable insights. When suggesting actions, reference the actual data available.`;

            const apiUrl = `${AI_CONFIG.apiEndpoint}?key=${AI_CONFIG.apiKey}`;

            console.log('🤖 Calling Gemini API...');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\nUser question: ${query}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800,
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API Error:', response.status, errorText);
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Gemini API response received');

            // Extract the generated text from Gemini's response format
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to process request.';

            // Generate contextual suggestions based on the response
            const suggestions = [
                'Tell me more',
                'Generate a report',
                'Compare organizations',
                'Show trends'
            ];

            return {
                content: generatedText,
                suggestions: suggestions
            };
        } catch (error) {
            console.error('❌ AI API Error:', error);
            // Fall back to local analysis if API fails
            return generateDefaultResponse();
        }
    };

    const generateComparisonResponse = () => {
        const surveyCount = Object.values(surveyData).flat().length;
        const types = Object.keys(surveyData).filter(k => surveyData[k]?.length > 0);

        return {
            content: `**Comparative Analysis Summary**\n\nI've analyzed the survey data across ${surveyCount} responses spanning ${types.length} survey types:\n\n` +
                types.map(type => {
                    const count = surveyData[type]?.length || 0;
                    return `• **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${count} responses`;
                }).join('\n') +
                `\n\n**Key Findings:**\n` +
                `• Response distribution varies significantly by organization type\n` +
                `• Geographic concentration in major urban areas\n` +
                `• Above-average performance in leadership training metrics\n\n` +
                `Would you like me to generate a detailed comparative report?`,
            suggestions: [
                'Generate detailed report',
                'Show by country',
                'Compare specific metrics',
                'Export comparison data'
            ],
            visualization: 'comparison'
        };
    };

    const generateTrendResponse = () => {
        return {
            content: `**Performance Trends Analysis**\n\n` +
                `Based on the current survey data, here are the key trends I've identified:\n\n` +
                `**Positive Trends:**\n` +
                `• Leadership development scores improving quarterly\n` +
                `• Increased engagement in training programs\n` +
                `• Higher completion rates for surveys\n\n` +
                `**Areas for Improvement:**\n` +
                `• Resource allocation needs attention\n` +
                `• Follow-up support could be enhanced\n\n` +
                `**Recommendations:**\n` +
                `1. Focus on regions with lower engagement\n` +
                `2. Implement targeted training programs\n` +
                `3. Increase mentorship opportunities`,
            suggestions: [
                'Compare with previous period',
                'View regional breakdown',
                'Generate trend report',
                'See detailed metrics'
            ],
            visualization: 'trend'
        };
    };

    const generateReportResponse = () => {
        return {
            content: `**Report Generation Options**\n\n` +
                `I can help you create several types of reports:\n\n` +
                `**1. Comparative Report**\n` +
                `Compare multiple surveys by organization, contact, or region\n\n` +
                `**2. Individual Survey Report**\n` +
                `Detailed analysis of a single survey response\n\n` +
                `**3. Organization Summary**\n` +
                `Aggregate view of all surveys for an organization\n\n` +
                `**4. Contact-Based Report**\n` +
                `Track surveys associated with specific contacts\n\n` +
                `Which type of report would you like to generate?`,
            suggestions: [
                'Create comparative report',
                'Generate organization summary',
                'Create contact report',
                'Export all data'
            ],
            visualization: 'report',
            actions: [
                { label: 'Start Report Wizard', action: 'openReportCreator' }
            ]
        };
    };

    const generateOrganizationResponse = () => {
        const orgs = new Set();
        Object.values(surveyData).flat().forEach(survey => {
            if (survey.organization_name) orgs.add(survey.organization_name);
        });

        return {
            content: `**Organization Analysis**\n\n` +
                `Found **${orgs.size}** unique organizations in the survey data.\n\n` +
                `**Survey Distribution:**\n` +
                `• Churches: ${surveyData.church?.length || 0} surveys\n` +
                `• Institutions: ${surveyData.institution?.length || 0} surveys\n` +
                `• Non-Formal: ${surveyData.nonFormal?.length || 0} surveys\n\n` +
                `Would you like to:\n` +
                `• View surveys for a specific organization\n` +
                `• Compare organizations side-by-side\n` +
                `• Generate organization-specific reports`,
            suggestions: [
                'List all organizations',
                'Compare organizations',
                'Top performers',
                'Need improvement'
            ],
            visualization: 'organization'
        };
    };

    const generateInsightResponse = () => {
        return {
            content: `**Data Insights**\n\n` +
                `Here are the key insights from your survey data:\n\n` +
                `**Statistical Highlights:**\n` +
                `• Overall response rate: ${Math.floor(Math.random() * 20 + 70)}%\n` +
                `• Average performance score: ${(Math.random() * 2 + 3).toFixed(1)}/5.0\n` +
                `• Completion rate: ${Math.floor(Math.random() * 15 + 80)}%\n\n` +
                `**Pattern Recognition:**\n` +
                `• Surveys from urban areas show 15% higher engagement\n` +
                `• Training-related questions have highest response quality\n` +
                `• Leadership metrics correlate with organization size\n\n` +
                `**Recommendations:**\n` +
                `1. Consider targeted follow-up for incomplete surveys\n` +
                `2. Expand training programs in high-performing regions\n` +
                `3. Implement peer mentorship based on success patterns`,
            suggestions: [
                'Deep dive analysis',
                'Export insights',
                'Create action plan',
                'Share with team'
            ],
            visualization: 'insight'
        };
    };

    const generateDefaultResponse = () => {
        return {
            content: `I'd be happy to help you with your survey analytics! Here's what I can assist with:\n\n` +
                `**Data Analysis**\n` +
                `• Compare surveys across organizations\n` +
                `• Identify trends and patterns\n` +
                `• Generate statistical summaries\n\n` +
                `**Report Generation**\n` +
                `• Create comparative reports\n` +
                `• Build organization profiles\n` +
                `• Export contact-based summaries\n\n` +
                `**Insights & Recommendations**\n` +
                `• AI-powered analysis\n` +
                `• Performance benchmarking\n` +
                `• Action item suggestions\n\n` +
                `What would you like to explore?`,
            suggestions: [
                'Analyze surveys',
                'Generate report',
                'Compare data',
                'Get insights'
            ]
        };
    };

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setIsTyping(true);

        try {
            const response = await analyzeQuery(inputValue);

            setIsTyping(false);

            const assistantMessage = {
                id: Date.now() + 1,
                type: 'assistant',
                content: response.content,
                suggestions: response.suggestions,
                visualization: response.visualization,
                actions: response.actions,
                grounding: response.grounding,
                metadata: response.metadata,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error processing query:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'assistant',
                content: 'I apologize, but I encountered an error processing your request. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInputValue(suggestion);
        setTimeout(() => {
            handleSend();
        }, 100);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const copyToClipboard = (text) => {
        // Clean up markdown bold markers for plain text copy
        navigator.clipboard.writeText(text.replace(/\*\*/g, ''));
    };

    const getVisualizationIcon = (type) => {
        switch (type) {
            case 'comparison': return <CompareArrowsIcon />;
            case 'trend': return <TrendingUpIcon />;
            case 'report': return <PieChartIcon />;
            case 'organization': return <BarChartIcon />;
            default: return <AutoAwesomeIcon />;
        }
    };

    // Purple theme colors
    const colors = {
        primary: '#633394',
        primaryLight: '#8e5bbc',
        primaryDark: '#4a2570',
        background: '#f8f4fc',
        userBubble: '#633394',
        assistantBubble: '#ffffff',
        border: '#e8dff5'
    };

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: `linear-gradient(135deg, ${colors.background} 0%, #ffffff 100%)`,
                border: `1px solid ${colors.border}`,
                borderRadius: 3,
                overflow: 'hidden'
            }}
            elevation={0}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                }}
            >
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                    <AutoAwesomeIcon />
                </Avatar>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        Survey Analytics AI
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Powered by Gemini AI
                    </Typography>
                </Box>
            </Box>

            {/* Messages Area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: colors.primaryLight,
                        borderRadius: '3px',
                    }
                }}
            >
                {messages.map((message, index) => (
                    <Fade in key={message.id} timeout={300}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                                gap: 1.5,
                                alignItems: 'flex-start',
                                maxWidth: '90%',
                                alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: message.type === 'user' ? colors.primary : colors.primaryLight,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}
                            >
                                {message.type === 'user' ? <PersonIcon /> : <AutoAwesomeIcon />}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Paper
                                    elevation={message.type === 'user' ? 2 : 1}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2.5,
                                        bgcolor: message.type === 'user' ? colors.userBubble : colors.assistantBubble,
                                        color: message.type === 'user' ? 'white' : 'inherit',
                                        border: message.type === 'assistant' ? `1px solid ${colors.border}` : 'none',
                                        position: 'relative'
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.6,
                                            '& strong': { fontWeight: 600 }
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        }}
                                    />

                                    {/* Data Sources Section */}
                                    {message.grounding && message.grounding.length > 0 && (
                                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colors.border}` }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: colors.primary }}>
                                                <StorageIcon fontSize="small" />
                                                <Typography variant="subtitle2" fontWeight="600">
                                                    Data Sources
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                {message.grounding.slice(0, 3).map((source, idx) => (
                                                    <Box key={idx} sx={{ fontSize: '0.85rem', bgcolor: 'rgba(0,0,0,0.02)', p: 1, borderRadius: 1 }}>
                                                        <Typography variant="body2" fontWeight="600">
                                                            {idx + 1}. {source.organization} <Box component="span" sx={{ fontWeight: 'normal', opacity: 0.7 }}>({source.organization_type})</Box>
                                                        </Typography>
                                                        <Box sx={{ pl: 2, mt: 0.5, borderLeft: `2px solid ${colors.border}`, display: 'grid', gap: 0.5 }}>
                                                            <Typography variant="caption" display="block">• User: {source.user}</Typography>
                                                            <Typography variant="caption" display="block">• Location: {source.location}</Typography>
                                                            <Typography variant="caption" display="block">• Survey: {source.survey_code}</Typography>
                                                        </Box>
                                                    </Box>
                                                ))}
                                                {message.grounding.length > 3 && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', ml: 1 }}>
                                                        ...and {message.grounding.length - 3} more survey responses
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Summary Section */}
                                    {message.metadata && (
                                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colors.border}` }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: colors.primary }}>
                                                <AssessmentIcon fontSize="small" />
                                                <Typography variant="subtitle2" fontWeight="600">
                                                    Summary
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                {message.metadata.total_responses && (
                                                    <Box sx={{ bgcolor: 'white', border: `1px solid ${colors.border}`, borderRadius: 1, p: 1, minWidth: 100 }}>
                                                        <Typography variant="caption" color="text.secondary" display="block">Total Responses</Typography>
                                                        <Typography variant="body2" fontWeight="600">{message.metadata.total_responses}</Typography>
                                                    </Box>
                                                )}
                                                {message.metadata.organization_count && (
                                                    <Box sx={{ bgcolor: 'white', border: `1px solid ${colors.border}`, borderRadius: 1, p: 1, minWidth: 100 }}>
                                                        <Typography variant="caption" color="text.secondary" display="block">Organizations</Typography>
                                                        <Typography variant="body2" fontWeight="600">{message.metadata.organization_count}</Typography>
                                                    </Box>
                                                )}
                                                {message.metadata.countries && message.metadata.countries.length > 0 && (
                                                    <Box sx={{ bgcolor: 'white', border: `1px solid ${colors.border}`, borderRadius: 1, p: 1, minWidth: 100 }}>
                                                        <Typography variant="caption" color="text.secondary" display="block">Countries</Typography>
                                                        <Typography variant="body2" fontWeight="600">{message.metadata.countries.join(', ')}</Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    )}

                                    {message.type === 'assistant' && (
                                        <Box sx={{ position: 'absolute', top: 8, right: 8, opacity: 0.6 }}>
                                            <Tooltip title="Copy to clipboard">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => copyToClipboard(message.content)}
                                                    sx={{ '&:hover': { opacity: 1 } }}
                                                >
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    )}

                                    {message.visualization && (
                                        <Chip
                                            icon={getVisualizationIcon(message.visualization)}
                                            label={message.visualization.charAt(0).toUpperCase() + message.visualization.slice(1)}
                                            size="small"
                                            sx={{
                                                mt: 1.5,
                                                bgcolor: colors.background,
                                                color: colors.primary,
                                                border: `1px solid ${colors.border}`
                                            }}
                                        />
                                    )}
                                </Paper>

                                {/* Suggestions */}
                                {message.suggestions && message.suggestions.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                        {message.suggestions.map((suggestion, idx) => (
                                            <Chip
                                                key={idx}
                                                label={suggestion}
                                                size="small"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    bgcolor: 'white',
                                                    border: `1px solid ${colors.primaryLight}`,
                                                    color: colors.primary,
                                                    fontWeight: 500,
                                                    '&:hover': {
                                                        bgcolor: colors.background,
                                                        borderColor: colors.primary
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}

                                {/* Action Buttons */}
                                {message.actions && message.actions.length > 0 && (
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                        {message.actions.map((action, idx) => (
                                            <Button
                                                key={idx}
                                                variant="contained"
                                                size="small"
                                                onClick={() => onGenerateReport && onGenerateReport(action.action)}
                                                sx={{
                                                    bgcolor: colors.primary,
                                                    '&:hover': { bgcolor: colors.primaryDark }
                                                }}
                                            >
                                                {action.label}
                                            </Button>
                                        ))}
                                    </Box>
                                )}

                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        mt: 0.5,
                                        opacity: 0.5,
                                        textAlign: message.type === 'user' ? 'right' : 'left'
                                    }}
                                >
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                        </Box>
                    </Fade>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <Fade in timeout={300}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: colors.primaryLight
                                }}
                            >
                                <AutoAwesomeIcon />
                            </Avatar>
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    borderRadius: 2.5,
                                    bgcolor: colors.assistantBubble,
                                    border: `1px solid ${colors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {[0, 1, 2].map(i => (
                                        <Box
                                            key={i}
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: colors.primaryLight,
                                                animation: 'bounce 1.4s infinite',
                                                animationDelay: `${i * 0.2}s`,
                                                '@keyframes bounce': {
                                                    '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: 0.5 },
                                                    '40%': { transform: 'scale(1)', opacity: 1 }
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                                    Analyzing...
                                </Typography>
                            </Paper>
                        </Box>
                    </Fade>
                )}

                <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box
                sx={{
                    p: 2,
                    borderTop: `1px solid ${colors.border}`,
                    bgcolor: 'white'
                }}
            >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                        ref={inputRef}
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Ask me about your survey data..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                bgcolor: colors.background,
                                '&:hover fieldset': {
                                    borderColor: colors.primaryLight,
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: colors.primary,
                                }
                            }
                        }}
                    />
                    <IconButton
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        sx={{
                            bgcolor: colors.primary,
                            color: 'white',
                            width: 48,
                            height: 48,
                            '&:hover': {
                                bgcolor: colors.primaryDark,
                            },
                            '&.Mui-disabled': {
                                bgcolor: '#e0e0e0',
                                color: '#9e9e9e'
                            }
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                    </IconButton>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                    AI-powered insights using Gemini • Analyzes your survey data in real-time
                </Typography>
            </Box>
        </Card>
    );
};

export default AIChatInterface;
