import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stepper,
    Step,
    StepLabel,
    Button,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    CircularProgress,
    Paper,
    Divider,
    Alert,
    Grid
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';
import QuestionForm from './QuestionForm';
import { QUESTION_TYPE_MAP } from '../../../config/questionTypes';

const steps = ['Organization & Version', 'Template Details', 'Add Questions'];

const CreateQuestionnaireWizard = ({
    open,
    onClose,
    onComplete,
    initialFile,
    mode = 'blank',
    variant = 'dialog' // 'dialog' | 'page'
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState(null);

    // Data States
    const [organizations, setOrganizations] = useState([]);
    const [organizationId, setOrganizationId] = useState('');
    const [versionName, setVersionName] = useState('');
    const [versionDescription, setVersionDescription] = useState('');
    const [baseVersionId, setBaseVersionId] = useState('');
    const [orgVersions, setOrgVersions] = useState([]);

    const [surveyCode, setSurveyCode] = useState('');

    // Created IDs
    const [createdVersionId, setCreatedVersionId] = useState(null);
    const [createdTemplateId, setCreatedTemplateId] = useState(null);

    // Questions State
    const [questions, setQuestions] = useState([]);
    const [pendingQuestions, setPendingQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        type: 'short_text',
        section: '',
        is_required: false,
        config: {}
    });
    const [existingSections, setExistingSections] = useState([]);

    useEffect(() => {
        const shouldInitialize = variant === 'page' || open;
        if (shouldInitialize) {
            fetchOrganizations();
            resetForm();
            if (initialFile) {
                processUploadedFile(initialFile);
            }
        }
    }, [open, initialFile, mode, variant]);

    const processUploadedFile = async (file) => {
        setLoading(true);
        setLoadingMessage('Analyzing document and generating survey questions...');
        try {
            // Suggest version name from filename
            const name = file.name.split('.')[0];
            setVersionName(name + " (Imported)");

            const result = await InventoryService.parseDocument(file);
            console.log("Parsed questions:", result);
            if (result.success && result.questions) {
                // Map/Transform questions if needed.
                // The expected structure is { question_text, question_type_id, section, is_required, config }
                // The parser returns almost this directly, but question_type_id is integer.
                // We need to fetch question types and maybe double check ID validity or map properly?
                // The parser logic attempts to match ID.
                // Let's store them to be added in Step 2.

                // We'll store them in a temporary state or directly in `questions` if Step 2 is reached?
                // Actually, if we just set `questions`, they will appear in Step 2.
                // But we can't save them to backend until Template is created (Step 1).
                // So we'll hold them in `questions` state (local), and `handleNext` can choose to save them...
                // Wait, `questions` state is displayed in Step 2. 
                // BUT `handleAddQuestion` *saves to backend*.
                // The current flow saves questions ONE BY ONE.
                // It would be better to Bulk Save or simply pre-populate local state and have a "Save All" mechanism.
                // However, the existing wizard adds questions individually to backend.
                // We should adapt `handleNext` (Finish) or a "Bulk Add" button.
                // Let's modify the wizard to allow holding questions in memory until efficient save?
                // NO, for consistency, let's keep the existing logic:
                // When we reach Step 2, we display these questions.
                // User can review.
                // BUT, they are not in backend yet.
                // We need a mechanism to batch save them when entering Step 2 or finishing.

                // Simplified: Store in `questions`. 
                // Modifications to `questions` display in Step 2 need to reflect "Saved" vs "Unsaved"?
                // Currently `questions` comes from backend when using `DocumentUpload`... No wait.
                // In generic usage, `questions` is updated after `handleAddQuestion` success.
                // So `questions` = Backend State.

                // We need a `pendingQuestions` state.
                setPendingQuestions(result.questions);
            }
        } catch (err) {
            console.error("File processing error:", err);
            setError("Failed to process document: " + err.message);
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };


    useEffect(() => {
        if (organizationId) {
            fetchOrgVersions(organizationId);
        } else {
            setOrgVersions([]);
        }
    }, [organizationId]);

    const fetchOrganizations = async () => {
        try {
            const data = await InventoryService.getOrganizations();
            setOrganizations(data);
        } catch (err) {
            console.error('Error fetching organizations:', err);
            setError('Failed to load organizations.');
        }
    };

    const fetchOrgVersions = async (orgId) => {
        try {
            // For "Use Template" we need a base template from a DIFFERENT organization,
            // because the backend copy endpoint rejects copying into the same org.
            if (mode === 'template') {
                const allVersions = await InventoryService.getTemplateVersions();
                const filtered = (allVersions || []).filter(v => String(v.organization_id) !== String(orgId));
                setOrgVersions(filtered);
                return;
            }

            // For blank/upload flows we don't need base templates here
            setOrgVersions([]);
        } catch (err) {
            console.error("Error fetching versions", err);
        }
    };

    const resetForm = () => {
        setActiveStep(0);
        setOrganizationId('');
        setVersionName('');
        setVersionDescription('');
        setBaseVersionId('');
        setSurveyCode('');
        setCreatedVersionId(null);
        setCreatedTemplateId(null);
        setQuestions([]);
        setError(null);
        setLoadingMessage('');
        setCurrentQuestion({
            text: '',
            type: 'short_text',
            section: '',
            is_required: false,
            config: {}
        });
    };

    const handleNext = async () => {
        setError(null);
        setLoading(true);

        try {
            if (activeStep === 0) {
                setLoadingMessage('Creating template version...');
                // Create Template Version
                if (!organizationId || !versionName) {
                    setError('Please fill in all required fields.');
                    setLoading(false);
                    return;
                }
                if (mode === 'template' && !baseVersionId) {
                    setError('Please select a base template.');
                    setLoading(false);
                    return;
                }

                // Check if we already created one in this session to avoid duplicates if user goes back/forth (simple logic: create new if null)
                let vId = createdVersionId;
                if (!vId) {
                    if (mode === 'template' && baseVersionId) {
                        // Copy an existing version from a different organization
                        const res = await InventoryService.copyTemplateVersion(baseVersionId, organizationId, versionName);
                        vId = res.id;
                    } else {
                        // Create new
                        const res = await InventoryService.addTemplateVersion(versionName, versionDescription, organizationId);
                        vId = res.data?.id || res.id;
                    }
                    setCreatedVersionId(vId);
                }
                setActiveStep(1);
            } else if (activeStep === 1) {
                setLoadingMessage('Initializing template...');
                // Create Template
                if (!surveyCode) {
                    setError('Please enter a Survey Code/Name.');
                    setLoading(false);
                    return;
                }

                let tId = createdTemplateId;
                if (!tId) {
                    const payload = {
                        survey_code: surveyCode,
                        version_id: createdVersionId,
                        questions: []
                    };
                    const res = await InventoryService.addTemplate(payload);
                    tId = res.data?.id || res.id;
                    setCreatedTemplateId(tId);
                }
                setActiveStep(2);
            } else if (activeStep === 2) {
                // Questions are added one by one, so "Next" here means "Finish"
                if (onComplete) onComplete();
                onClose();
            }
        } catch (err) {
            console.error('Error in wizard step:', err);
            setError('An error occurred. Please try again. ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const handleBulkAddQuestions = async () => {
        if (pendingQuestions.length === 0) return;
        setLoading(true);
        setLoadingMessage('Saving all imported questions...');
        try {
            // Fetch current questions first to act as base
            const templateData = await InventoryService.getTemplate(createdTemplateId);
            let currentQuestions = templateData.questions || [];
            let startOrder = currentQuestions.length;

            // Prepare new questions
            const newQuestionsPayload = pendingQuestions.map((q, idx) => ({
                ...q,
                order: startOrder + idx,
                // Ensure IDs are numeric if present, or let backend assign?
                // For updateTemplate, we usually send the whole list.
                // We need to ensure types are correct.
            }));

            const fullList = [...currentQuestions, ...newQuestionsPayload];

            await InventoryService.updateTemplate(createdTemplateId, { questions: fullList });

            setQuestions(fullList);
            setPendingQuestions([]);

            // Update sections
            const newSections = [...new Set([...existingSections, ...newQuestionsPayload.map(q => q.section).filter(Boolean)])];
            setExistingSections(newSections);

        } catch (err) {
            console.error("Error saving bulk questions:", err);
            setError("Failed to save imported questions: " + err.message);
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleAddQuestion = async () => {
        if (!currentQuestion.text || !currentQuestion.section) {
            setError("Question Text and Section are required.");
            return;
        }

        try {
            setLoading(true);
            setLoadingMessage('Adding question...');
            // Construct payload compatible with InventoryService/Backend
            // Backend usually expects: question_text, question_type_id, section, order, is_required, config

            // Map type string to ID
            // We need to find the ID for the type string (e.g., 'short_text')
            // Assuming we have a helper or we can fetch types. 
            // For now, let's fetch types once or find it from a map if available.
            // We'll trust the backend handles type string or we need to look it up.
            // Checking InventoryService.js... it has getQuestionTypes.

            // Optimization: Fetch question types on mount or assume we have the map.
            // Let's get the ID.
            const types = await InventoryService.getQuestionTypes(); // This might be heavy to do every time.
            const selectedTypeObj = types.find(t => t.name === currentQuestion.type || t.type_name === currentQuestion.type);

            if (!selectedTypeObj) {
                throw new Error(`Invalid question type: ${currentQuestion.type}`);
            }

            const newQuestion = {
                question_text: currentQuestion.text,
                question_type_id: selectedTypeObj.id,
                section: currentQuestion.section,
                is_required: currentQuestion.is_required,
                config: currentQuestion.config,
                order: questions.length // Append to end
            };

            // We need to update the template with this new question.
            // InventoryService.updateTemplate(id, { questions: [...] }) replaces all?
            // Let's check InventoryService.js.
            // getTemplate fetches questions. updateTemplate sends "questions".
            // It seems we need to send the WHOLE list.

            // Actually, let's look at QuestionsTab.js => handleSaveQuestion
            // It fetches current questions, appends, and sends updateTemplate.

            // Optimized approach: Keep local list `questions`, and when adding:
            // 1. Add to local list.
            // 2. Send full list to backend.

            const updatedQuestions = [...questions, { ...newQuestion, id: Date.now() }]; // Temporary ID for UI

            // We need to transform for backend (it might expect existing IDs or sanitized objects)
            // Backend `update_template` usually handles list.
            // IMPORTANT: We need formatted list for backend.

            // Wait, currentQuestion doesn't have an ID.
            // Use a backend endpoint to add *one* question if available?
            // InventoryService has `addQuestion(versionId)` (legacy).
            // `updateTemplate` seems to be the way.

            // Let's fetch the LATEST template state first to be safe, although in wizard we are the only creator.
            // We can just push to our local state if we trust it, but safer to fetch.

            const templateData = await InventoryService.getTemplate(createdTemplateId);
            const currentQuestions = templateData.questions || [];

            const nextOrder = currentQuestions.length;
            const questionPayload = {
                ...newQuestion,
                order: nextOrder
            };

            const newQuestionsList = [...currentQuestions, questionPayload];

            await InventoryService.updateTemplate(createdTemplateId, { questions: newQuestionsList });

            // Update local state
            setQuestions(newQuestionsList);
            if (!existingSections.includes(currentQuestion.section)) {
                setExistingSections(prev => [...prev, currentQuestion.section]);
            }

            // Reset current question form
            setCurrentQuestion({
                text: '',
                type: 'short_text',
                section: currentQuestion.section, // Keep section for convenience
                is_required: false,
                config: {}
            });
            setError(null);

        } catch (err) {
            console.error("Error adding question:", err);
            setError("Failed to add question: " + err.message);
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Organization</InputLabel>
                            <Select
                                value={organizationId}
                                label="Organization"
                                onChange={(e) => setOrganizationId(e.target.value)}
                            >
                                {organizations.map((org) => (
                                    <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {mode === 'template' && (
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Base Template</InputLabel>
                                <Select
                                    value={baseVersionId}
                                    label="Base Template"
                                    onChange={(e) => setBaseVersionId(e.target.value)}
                                    disabled={!organizationId || orgVersions.length === 0}
                                >
                                    <MenuItem value="">
                                        <em>Select a template</em>
                                    </MenuItem>
                                    {orgVersions.map((v) => (
                                        <MenuItem key={v.id} value={v.id}>
                                            {v.name}{v.organization_name ? ` — ${v.organization_name}` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <TextField
                            fullWidth
                            label="New Version Name"
                            margin="normal"
                            value={versionName}
                            onChange={(e) => setVersionName(e.target.value)}
                            placeholder="e.g. Q1 2024 Survey"
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            margin="normal"
                            multiline
                            rows={3}
                            value={versionDescription}
                            onChange={(e) => setVersionDescription(e.target.value)}
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" gutterBottom>
                            Creating template for version: <strong>{versionName}</strong>
                        </Typography>
                        <TextField
                            fullWidth
                            label="Survey Code / Template Name"
                            margin="normal"
                            value={surveyCode}
                            onChange={(e) => setSurveyCode(e.target.value)}
                            placeholder="e.g. EMP-SAT-2024"
                            helperText="A unique code or name for this specific template."
                        />
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Paper variant="outlined" sx={{ p: 2, height: '100%', overflow: 'auto', maxHeight: '60vh' }}>
                                    <Typography variant="h6" gutterBottom>Added Questions ({questions.length})</Typography>

                                    {pendingQuestions.length > 0 && (
                                        <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" color="primary">
                                                {pendingQuestions.length} questions imported.
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={handleBulkAddQuestions}
                                                disabled={loading}
                                                sx={{ mt: 1 }}
                                            >
                                                Save Imported Questions
                                            </Button>
                                        </Box>
                                    )}

                                    {questions.length === 0 && <Typography variant="body2" color="text.secondary">No questions yet.</Typography>}
                                    {questions.map((q, idx) => (
                                        <Box key={idx} sx={{ mb: 2, p: 1, bgcolor: '#FFFFFF', borderRadius: 1 }}>
                                            <Typography variant="subtitle2">{idx + 1}. {q.question_text}</Typography>
                                            <Typography variant="caption" display="block">Type: {q.question_text_type_id || q.question_type_id || 'Unknown'}</Typography>
                                            <Typography variant="caption" display="block">Section: {q.section}</Typography>
                                        </Box>
                                    ))}
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Paper elevation={0} sx={{ p: 2, border: '1px solid #ddd' }}>
                                    <Typography variant="h6" gutterBottom>New Question</Typography>
                                    <TextField
                                        fullWidth
                                        label="Section"
                                        margin="normal"
                                        value={currentQuestion.section}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, section: e.target.value })}
                                        placeholder="e.g. Demographics"
                                    />
                                    <QuestionForm
                                        questionData={{
                                            text: currentQuestion.text,
                                            type: currentQuestion.type,
                                            config: currentQuestion.config,
                                            is_required: currentQuestion.is_required
                                        }}
                                        onChange={(newData) => setCurrentQuestion(prev => ({
                                            ...prev,
                                            text: newData.text,
                                            type: newData.type || prev.type, // QuestionTypeSelector might be inside QuestionForm or not
                                            config: newData.config,
                                            is_required: newData.is_required
                                        }))}
                                    // need to pass QuestionType handler if QuestionForm doesn't expose it well, 
                                    // but QuestionForm takes 'questionData' and 'onChange'. 
                                    // Wait, QuestionForm usually renders specific config. Logic for selecting type is often outside.
                                    />

                                    {/* We need a Type Selector if QuestionForm doesn't have it. 
                            Looking at QuestionForm.js, it seems to just render config based on `questionData.type`. 
                            It doesn't seem to have a dropdown to CHANGE the type.
                        */}
                                    <FormControl fullWidth margin="normal">
                                        <InputLabel>Question Type</InputLabel>
                                        <Select
                                            value={currentQuestion.type}
                                            label="Question Type"
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value, config: {} })}
                                        >
                                            {Object.entries(QUESTION_TYPE_MAP).map(([key, value]) => (
                                                <MenuItem key={key} value={key}>{value.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={handleAddQuestion}
                                            disabled={loading}
                                        >
                                            Add Question
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };


    const wizardBody = (
        <>
            <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                    <CircularProgress size={48} sx={{ mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        {loadingMessage || 'Loading...'}
                    </Typography>
                </Box>
            )}
            {!loading && renderStepContent(activeStep)}
        </>
    );

    const wizardActions = (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
            <Button onClick={handleNext} variant="contained" color="primary">
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
        </Box>
    );

    if (variant === 'page') {
        return (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                {wizardBody}
                {wizardActions}
            </Paper>
        );
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>Create New Questionnaire</DialogTitle>
            <DialogContent>
                {wizardBody}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
                <Button onClick={handleNext} variant="contained" color="primary">
                    {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateQuestionnaireWizard;
