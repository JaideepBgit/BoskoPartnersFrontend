import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  Alert,
  Chip,
  Paper,
  Grid,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Reorder as ReorderIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

import TemplateUtils from './shared/TemplateUtils';
import QuestionDialog from './QuestionDialog';
import SectionOrderDialog from './SectionOrderDialog';
import { getQuestionTypeById } from '../../../config/questionTypes';
import InventoryService from '../../../services/Admin/Inventory/InventoryService';

// Compact Question Item Component for question list display
const CompactQuestionItem = ({ question, index, onEdit, onDelete, getQuestionTypeName, sectionName }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${sectionName}-${question.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 0.5,
        backgroundColor: '#fff',
        border: isDragging ? '2px dashed #633394' : '1px solid #e0e0e0',
        borderRadius: 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(99, 51, 148, 0.15)',
          borderColor: '#633394',
          transform: isDragging ? 'none' : 'translateX(2px)',
        }
      }}
    >
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              mr: 1.5,
              cursor: 'grab',
              color: '#633394',
              borderRadius: 1,
              flexShrink: 0,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(99, 51, 148, 0.08)',
                transform: 'scale(1.1)',
              },
              '&:active': { cursor: 'grabbing' }
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: '#333',
                mb: 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.875rem'
              }}
            >
              {index + 1}. {question.question_text}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                label={getQuestionTypeName(question.question_type_id)}
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  borderColor: '#633394',
                  color: '#633394',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
              {question.is_required && (
                <Chip
                  label="Required"
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => onEdit(question)}
            sx={{
              p: 0.5,
              color: '#633394',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(99, 51, 148, 0.08)',
                transform: 'scale(1.1)',
              }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(question.id)}
            sx={{
              p: 0.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
                transform: 'scale(1.1)',
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

// Template Chip Component for the template selection list
const TemplateChip = ({
  template,
  isSelected,
  onSelect,
  onToggleSelect,
  isMultiSelectMode,
  isChecked,
  onDelete,
  onEdit,
  onPreview
}) => {
  const handleClick = (e) => {
    if (isMultiSelectMode) {
      onToggleSelect();
    } else {
      onSelect();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 1,
        p: 1,
        borderRadius: 1,
        backgroundColor: isSelected ? 'rgba(99, 51, 148, 0.15)' : '#FFFFFF',
        border: '1px solid',
        borderColor: isSelected ? '#633394' : '#e0e0e0',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(99, 51, 148, 0.2)',
          borderColor: '#633394',
          backgroundColor: isSelected ? 'rgba(99, 51, 148, 0.2)' : 'rgba(99, 51, 148, 0.05)',
        }
      }}
      onClick={handleClick}
    >
      {isMultiSelectMode && (
        <Checkbox
          checked={isChecked}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          sx={{
            p: 0.5,
            mr: 1,
            color: '#633394',
            '&.Mui-checked': {
              color: '#633394',
            },
          }}
        />
      )}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: isSelected ? 600 : 400,
            color: isSelected ? '#633394' : '#333',
            transition: 'color 0.2s ease-in-out',
            wordBreak: 'break-word',
            whiteSpace: 'normal'
          }}
        >
          {template.survey_code}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label={`${template.questions?.length || 0} Questions`}
            size="small"
            variant="outlined"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              borderColor: '#633394',
              color: '#633394',
              '& .MuiChip-label': { px: 1 }
            }}
          />
          {template.title_name && (
            <Chip
              label={template.title_name}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                backgroundColor: 'rgba(99, 51, 148, 0.1)',
                color: '#633394',
                fontWeight: 600,
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
          <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
            {new Date(template.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>

      {!isMultiSelectMode && (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onPreview && (
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(template);
              }}
              sx={{
                color: '#633394',
                '&:hover': {
                  backgroundColor: 'rgba(99, 51, 148, 0.08)',
                }
              }}
              title="Preview Survey"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(template);
            }}
            sx={{
              color: '#633394',
              '&:hover': {
                backgroundColor: 'rgba(99, 51, 148, 0.08)',
              }
            }}
            title="Edit Template"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete template "${template.survey_code}"?`)) {
                onDelete(template.id);
              }
            }}
            sx={{ ml: 0.5 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

const QuestionsTab = ({
  templateVersions: parentTemplateVersions = [],
  templates: parentTemplates = [],
  onRefreshData,
  currentVersion,
  hideSidebar = false,
  onClose,
  onPreview
}) => {
  const [templateVersions, setTemplateVersions] = useState(parentTemplateVersions);
  const [templates, setTemplates] = useState(parentTemplates);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTemplateData, setNewTemplateData] = useState({
    survey_code: '',
    version_id: '',
    title_id: null,
    new_title_name: '',
    questions: []
  });
  const [titles, setTitles] = useState([]);
  const [selectedTitleForNew, setSelectedTitleForNew] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Question dialog state
  const [openQDialog, setOpenQDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    questions: []
  });

  // Section ordering state
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [templateSections, setTemplateSections] = useState([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px of movement before drag starts
      },
    }),
  );

  // Update local state when parent data changes
  useEffect(() => {
    setTemplateVersions(parentTemplateVersions);
  }, [parentTemplateVersions]);

  useEffect(() => {
    setTemplates(parentTemplates);
  }, [parentTemplates]);

  useEffect(() => {
    // Initial data fetch if parent doesn't provide data
    if (parentTemplateVersions.length === 0 && parentTemplates.length === 0) {
      fetchTemplateVersions();
      fetchTemplates();
    }
    fetchTitles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentTemplateVersions.length, parentTemplates.length]);

  const fetchTitles = async () => {
    try {
      const data = await InventoryService.getTitles();
      setTitles(data);
    } catch (err) {
      console.error('Error fetching titles:', err);
    }
  };

  const fetchTemplateVersions = useCallback(async () => {
    if (onRefreshData) {
      onRefreshData(); // Use parent's refresh function
    } else {
      const data = await TemplateUtils.fetchTemplateVersions();
      setTemplateVersions(data);
    }
  }, [onRefreshData]);

  // Sync with parent's selected version
  useEffect(() => {
    if (currentVersion) {
      handleSelectVersion(currentVersion);
    }
  }, [currentVersion]);

  const fetchTemplates = useCallback(async () => {
    if (onRefreshData) {
      onRefreshData(); // Use parent's refresh function
    } else {
      const data = await TemplateUtils.fetchTemplates();
      setTemplates(data);
    }
  }, [onRefreshData]);

  const fetchTemplate = async (id) => {
    const data = await TemplateUtils.fetchTemplate(id);
    setSelectedTemplate(data);

    // Update the templates array with the latest data to ensure question count is correct
    setTemplates(prevTemplates =>
      prevTemplates.map(template =>
        template.id === id ? { ...template, questions: data.questions } : template
      )
    );
  };

  const handleAddTemplate = async () => {
    if (!newTemplateData.survey_code || !selectedVersion?.id) return;

    const templateToAdd = {
      ...newTemplateData,
      version_id: selectedVersion.id
    };

    const success = await TemplateUtils.addTemplate(templateToAdd);
    if (success) {
      setNewTemplateData({ survey_code: '', version_id: '', title_id: null, new_title_name: '', questions: [] });
      setSelectedTitleForNew(null);
      fetchTemplates();
      fetchTitles(); // Refresh titles in case a new one was created
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      console.log('Attempting to delete template with ID:', templateId);
      const success = await TemplateUtils.deleteTemplate(templateId);
      console.log('Delete result:', success);

      if (success) {
        console.log('Template deleted successfully, updating UI...');
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
        await fetchTemplates();
        console.log('UI updated after template deletion');
      } else {
        console.error('Failed to delete template:', templateId);
        alert('Failed to delete template. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error occurred while deleting template: ' + error.message);
    }
  };

  // Edit Template Dialog state
  const [openEditTemplateDialog, setOpenEditTemplateDialog] = useState(false);
  const [editTemplateData, setEditTemplateData] = useState({ id: null, survey_code: '', title_id: null, title_name: '' });
  const [editSelectedTitle, setEditSelectedTitle] = useState(null);

  const handleOpenEditTemplateDialog = (template) => {
    setEditTemplateData({
      id: template.id,
      survey_code: template.survey_code,
      title_id: template.title_id || null,
      title_name: template.title_name || ''
    });
    // Set the selected title object for the Autocomplete
    if (template.title_id && template.title_name) {
      setEditSelectedTitle({ id: template.title_id, name: template.title_name });
    } else {
      setEditSelectedTitle(null);
    }
    setOpenEditTemplateDialog(true);
  };

  const handleSaveEditTemplate = async () => {
    if (!editTemplateData.id || !editTemplateData.survey_code.trim()) return;

    try {
      // If a new title name was typed, create it first
      let titleId = editTemplateData.title_id;
      let titleName = editSelectedTitle?.name || null;
      
      if (editTemplateData.new_title_name && !titleId) {
        const result = await InventoryService.addTitle(editTemplateData.new_title_name.trim());
        titleId = result.id;
        titleName = result.name;
      }

      // Update name
      const nameChanged = editTemplateData.survey_code !== (templates.find(t => t.id === editTemplateData.id)?.survey_code);
      if (nameChanged) {
        await TemplateUtils.updateTemplateName(editTemplateData.id, editTemplateData.survey_code.trim());
      }

      // Update title_id via the API
      await InventoryService.updateTemplate(editTemplateData.id, {
        title_id: titleId
      });

      // Refresh data
      await fetchTemplates();
      fetchTitles();

      // Update selected template if it's the one being edited
      if (selectedTemplate?.id === editTemplateData.id) {
        setSelectedTemplate(prev => ({
          ...prev,
          survey_code: editTemplateData.survey_code.trim(),
          title_id: titleId,
          title_name: titleName
        }));
      }

      setOpenEditTemplateDialog(false);
    } catch (error) {
      console.error('Error editing template:', error);
      alert('Error occurred while updating template: ' + error.message);
    }
  };

  const handleDeleteSelectedTemplates = async () => {
    if (selectedTemplates.length === 0) return;

    // Delete selected templates one by one
    const deletePromises = selectedTemplates.map(templateId =>
      TemplateUtils.deleteTemplate(templateId)
    );

    try {
      await Promise.all(deletePromises);

      // Clear selection and refresh
      setSelectedTemplates([]);
      setIsMultiSelectMode(false);

      if (selectedTemplates.includes(selectedTemplate?.id)) {
        setSelectedTemplate(null);
      }

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting templates:', error);
    }
  };

  const handleSelectTemplate = (templateId) => {
    if (isMultiSelectMode) {
      return; // Don't select template in multi-select mode, just toggle checkbox
    }
    fetchTemplate(templateId);
  };

  const handleToggleSelectTemplate = (templateId) => {
    setSelectedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(prev => !prev);
    if (!isMultiSelectMode) {
      setSelectedTemplates([]);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id || !selectedTemplate) return;

    // Extract question IDs from the drag identifiers
    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeQuestionId = parseInt(activeId.split('-').pop());
    const overQuestionId = parseInt(overId.split('-').pop());

    // Find question indices
    const questions = [...selectedTemplate.questions];
    const oldIndex = questions.findIndex(q => q.id === activeQuestionId);
    const newIndex = questions.findIndex(q => q.id === overQuestionId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    // Reorder questions
    const reorderedQuestions = arrayMove(questions, oldIndex, newIndex);

    // Update order property
    const updatedQuestions = reorderedQuestions.map((q, index) => ({
      ...q,
      order: index
    }));

    // Update locally
    setSelectedTemplate(prev => ({
      ...prev,
      questions: updatedQuestions
    }));

    // Update templates array
    setTemplates(prev =>
      prev.map(t =>
        t.id === selectedTemplate.id
          ? { ...t, questions: updatedQuestions }
          : t
      )
    );

    // Save to backend
    try {
      await TemplateUtils.updateTemplateQuestions(selectedTemplate.id, updatedQuestions);
    } catch (error) {
      console.error('Error updating question order:', error);
      // Revert on error
      fetchTemplate(selectedTemplate.id);
    }
  };

  const handleOpenAdd = () => {
    setSelectedQuestion(null);
    setFormData({
      questions: []
    });
    setOpenQDialog(true);
  };

  const handleOpenSectionOrder = async () => {
    if (!selectedTemplate) return;

    try {
      // Get sections from the template
      const sections = await TemplateUtils.fetchTemplateSections(selectedTemplate.id);

      // If no sections from backend, derive from questions
      if (sections.length === 0) {
        const sectionOrder = selectedTemplate.sections || {};
        const questionsBySection = TemplateUtils.groupQuestionsBySectionWithOrder(selectedTemplate.questions, sectionOrder);
        const derivedSections = Object.keys(questionsBySection).map((sectionName, index) => ({
          name: sectionName,
          order: sectionOrder[sectionName] !== undefined ? sectionOrder[sectionName] : index,
          questionCount: questionsBySection[sectionName].length
        }));
        setTemplateSections(derivedSections.sort((a, b) => a.order - b.order));
      } else {
        // Add question count to sections
        const sectionOrder = selectedTemplate.sections || {};
        const questionsBySection = TemplateUtils.groupQuestionsBySectionWithOrder(selectedTemplate.questions, sectionOrder);
        const sectionsWithCount = sections.map(section => ({
          ...section,
          questionCount: questionsBySection[section.name]?.length || 0
        }));
        setTemplateSections(sectionsWithCount);
      }

      setOpenSectionDialog(true);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const handleSaveSectionOrder = async (orderedSections) => {
    if (!selectedTemplate) return;

    try {
      const success = await TemplateUtils.updateTemplateSectionsOrder(selectedTemplate.id, orderedSections);
      if (success) {
        console.log('Section order updated successfully');
        setOpenSectionDialog(false);
        // Optionally refresh the template to reflect new section order
        fetchTemplate(selectedTemplate.id);
      } else {
        console.error('Failed to update section order');
      }
    } catch (error) {
      console.error('Error updating section order:', error);
    }
  };

  const handleOpenEdit = (q) => {
    setSelectedQuestion(q);
    setFormData({
      question_text: q.question_text,
      question_type_id: q.question_type_id,
      section: q.section || '',
      order: q.order,
      is_required: q.is_required,
      config: q.config || null
    });
    setOpenQDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenQDialog(false);
  };

  const handleSaveQuestion = async (finalQuestionData) => {
    if (!selectedTemplate) return;

    const payload = finalQuestionData;

    let updatedQuestions = [...(selectedTemplate.questions || [])];

    if (selectedQuestion) {
      // Editing existing question
      const index = updatedQuestions.findIndex(q => q.id === selectedQuestion.id);
      if (index !== -1) {
        updatedQuestions[index] = { ...updatedQuestions[index], ...payload };
      }
    } else {
      // Adding new question - assign order within the section
      const sectionQuestions = updatedQuestions.filter(q =>
        (q.section || 'Uncategorized') === (payload.section || 'Uncategorized')
      );
      const newId = Math.max(0, ...updatedQuestions.map(q => q.id || 0)) + 1;
      updatedQuestions.push({
        id: newId,
        ...payload,
        order: updatedQuestions.length
      });
    }

    // Sort questions by section and order within section
    updatedQuestions.sort((a, b) => {
      const sectionA = a.section || 'Uncategorized';
      const sectionB = b.section || 'Uncategorized';
      if (sectionA !== sectionB) {
        return sectionA.localeCompare(sectionB);
      }
      return (a.order || 0) - (b.order || 0);
    });

    const success = await TemplateUtils.updateTemplateQuestions(selectedTemplate.id, updatedQuestions);
    if (success) {
      // Update local state
      const updatedTemplate = { ...selectedTemplate, questions: updatedQuestions };
      setSelectedTemplate(updatedTemplate);

      // Update templates array
      const updatedTemplates = templates.map(t =>
        t.id === selectedTemplate.id ? { ...t, questions: updatedQuestions } : t
      );
      setTemplates(updatedTemplates);

      setOpenQDialog(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!selectedTemplate) return;

    const success = await TemplateUtils.deleteTemplateQuestion(selectedTemplate.id, questionId);
    if (success) {
      // Update local state
      const updatedQuestions = selectedTemplate.questions.filter(q => q.id !== questionId);
      const updatedTemplate = { ...selectedTemplate, questions: updatedQuestions };
      setSelectedTemplate(updatedTemplate);

      // Update templates array
      const updatedTemplates = templates.map(t =>
        t.id === selectedTemplate.id ? { ...t, questions: updatedQuestions } : t
      );
      setTemplates(updatedTemplates);
    }
  };

  const handleSelectVersion = (version) => {
    setSelectedVersion(version);
    // Reset multi-select mode when changing version
    setIsMultiSelectMode(false);
    setSelectedTemplates([]);

    // Filter templates for this version
    const versionTemplates = templates.filter(t => t.version_id === version.id);
    if (versionTemplates.length > 0) {
      handleSelectTemplate(versionTemplates[0].id);
    } else {
      setSelectedTemplate(null);
    }
  };

  const getQuestionTypeName = (typeId) => {
    const questionType = getQuestionTypeById(typeId);
    return questionType ? questionType.display_name : 'Unknown Type';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 180px)' }}>
      {/* Left sidebar - Version selection */}
      {!hideSidebar && (
        <Box
          sx={{
            width: 240,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h6" sx={{ p: 2, color: '#633394', fontWeight: 'bold' }}>
            Template Versions
          </Typography>

          <Box sx={{ px: 2, pb: 2 }}>
            {templateVersions.map(version => (
              <Button
                key={version.id}
                fullWidth
                variant={selectedVersion?.id === version.id ? 'contained' : 'outlined'}
                onClick={() => handleSelectVersion(version)}
                sx={{
                  mb: 1,
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  backgroundColor: selectedVersion?.id === version.id ? '#633394' : 'transparent',
                  color: selectedVersion?.id === version.id ? 'white' : '#633394',
                  borderColor: '#633394',
                  fontWeight: selectedVersion?.id === version.id ? 600 : 400,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: selectedVersion?.id === version.id ? '#7c52a5' : 'rgba(99, 51, 148, 0.08)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 3px 5px rgba(99, 51, 148, 0.2)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 1px 3px rgba(99, 51, 148, 0.2)',
                  }
                }}
              >
                {version.name}
              </Button>
            ))}
          </Box>
        </Box>
      )}

      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pl: 2 }}>
        {selectedVersion ? (
          <>
            {/* Templates section */}
            <Paper
              sx={{
                p: 2,
                mb: 2,
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
                  Templates for {selectedVersion.name}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ mr: 2, color: '#633394', fontWeight: 'bold' }}>
                    List of Templates
                  </Typography>

                  {onClose && (
                    <IconButton
                      onClick={onClose}
                      sx={{
                        ml: 1,
                        color: '#633394',
                        border: '1px solid rgba(99, 51, 148, 0.5)',
                        '&:hover': {
                          backgroundColor: 'rgba(99, 51, 148, 0.08)',
                          borderColor: '#633394'
                        }
                      }}
                      title="Close View"
                    >
                      <CloseIcon />
                    </IconButton>
                  )}

                  <Box>
                    <IconButton
                      size="small"
                      onClick={toggleMultiSelectMode}
                      color={isMultiSelectMode ? "primary" : "default"}
                      sx={{
                        mr: 1,
                        backgroundColor: isMultiSelectMode ? 'rgba(99, 51, 148, 0.1)' : 'transparent',
                        '&:hover': {
                          backgroundColor: isMultiSelectMode ? 'rgba(99, 51, 148, 0.15)' : 'rgba(99, 51, 148, 0.05)'
                        }
                      }}
                    >
                      <Checkbox
                        checked={isMultiSelectMode}
                        sx={{
                          p: 0,
                          color: '#633394',
                          '&.Mui-checked': {
                            color: '#633394',
                          },
                        }}
                      />
                    </IconButton>

                    {selectedTemplates.length > 0 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={handleDeleteSelectedTemplates}
                        sx={{
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                            transform: 'scale(1.1)',
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex' }}>
                {/* Left side - Add template form */}
                <Box sx={{ width: '40%', pr: 2 }}>
                  <TextField
                    label="Template Name"
                    fullWidth
                    value={newTemplateData.survey_code}
                    onChange={e => setNewTemplateData(prev => ({
                      ...prev,
                      survey_code: e.target.value
                    }))}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#633394',
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#633394',
                      }
                    }}
                  />

                  <Autocomplete
                    fullWidth
                    freeSolo
                    options={titles}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') return option;
                      return option.name || '';
                    }}
                    value={selectedTitleForNew}
                    onChange={(event, newValue) => {
                      if (typeof newValue === 'string') {
                        setSelectedTitleForNew(null);
                        setNewTemplateData(prev => ({
                          ...prev,
                          title_id: null,
                          new_title_name: newValue
                        }));
                      } else if (newValue && newValue.id) {
                        setSelectedTitleForNew(newValue);
                        setNewTemplateData(prev => ({
                          ...prev,
                          title_id: newValue.id,
                          new_title_name: ''
                        }));
                      } else {
                        setSelectedTitleForNew(null);
                        setNewTemplateData(prev => ({
                          ...prev,
                          title_id: null,
                          new_title_name: ''
                        }));
                      }
                    }}
                    onInputChange={(event, newInputValue, reason) => {
                      if (reason === 'input') {
                        const match = titles.find(t => t.name.toLowerCase() === newInputValue.toLowerCase());
                        if (match) {
                          setNewTemplateData(prev => ({
                            ...prev,
                            title_id: match.id,
                            new_title_name: ''
                          }));
                        } else {
                          setNewTemplateData(prev => ({
                            ...prev,
                            title_id: null,
                            new_title_name: newInputValue
                          }));
                        }
                      }
                    }}
                    filterOptions={(options, params) => {
                      const filtered = options.filter(option =>
                        option.name.toLowerCase().includes(params.inputValue.toLowerCase())
                      );
                      if (params.inputValue !== '' && !filtered.some(o => o.name.toLowerCase() === params.inputValue.toLowerCase())) {
                        filtered.push({
                          id: null,
                          name: params.inputValue,
                          isNew: true
                        });
                      }
                      return filtered;
                    }}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id || `new-${option.name}`}>
                        {option.isNew ? (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#633394' }}>
                            + Add new title: "{option.name}"
                          </Typography>
                        ) : (
                          <Typography variant="body2">{option.name}</Typography>
                        )}
                      </Box>
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Title of User Taking the Survey"
                        placeholder="Search or type a new title..."
                        helperText="Select an existing title or type a new one"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: '#633394',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#633394',
                          }
                        }}
                      />
                    )}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddTemplate}
                    disabled={!newTemplateData.survey_code}
                    fullWidth
                    sx={{
                      backgroundColor: '#633394',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: '#7c52a5',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(99, 51, 148, 0.3)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                        boxShadow: '0 2px 4px rgba(99, 51, 148, 0.3)',
                      },
                      '&.Mui-disabled': { backgroundColor: '#d1c4e9' }
                    }}
                  >
                    Add Template
                  </Button>
                </Box>

                {/* Right side - Templates list */}
                <Box sx={{ width: '60%' }}>
                  <Box
                    sx={{
                      bgcolor: 'white',
                      borderRadius: 1,
                      p: 1,
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {templates
                      .filter(t => t.version_id === selectedVersion.id)
                      .map(template => (
                        <TemplateChip
                          key={template.id}
                          template={template}
                          isSelected={selectedTemplate?.id === template.id}
                          onSelect={() => handleSelectTemplate(template.id)}
                          onToggleSelect={() => handleToggleSelectTemplate(template.id)}
                          isMultiSelectMode={isMultiSelectMode}
                          isChecked={selectedTemplates.includes(template.id)}
                          onDelete={handleDeleteTemplate}
                          onEdit={handleOpenEditTemplateDialog}
                          onPreview={onPreview}
                        />
                      ))}

                    {templates.filter(t => t.version_id === selectedVersion.id).length === 0 && (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No templates available for this version.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Questions section */}
            {selectedTemplate && (
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
                      Questions for {selectedTemplate.survey_code}
                    </Typography>
                    {selectedTemplate.title_name && (
                      <Chip
                        label={`Title: ${selectedTemplate.title_name}`}
                        size="small"
                        sx={{
                          mt: 0.5,
                          backgroundColor: 'rgba(99, 51, 148, 0.1)',
                          color: '#633394',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {onPreview && (
                      <Button
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => onPreview(selectedTemplate)}
                        sx={{
                          borderColor: '#633394',
                          color: '#633394',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: '#7c52a5',
                            backgroundColor: 'rgba(99, 51, 148, 0.04)',
                            transform: 'translateY(-1px)',
                          },
                          '&:active': {
                            transform: 'translateY(0)',
                          }
                        }}
                      >
                        Preview
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<ReorderIcon />}
                      onClick={handleOpenSectionOrder}
                      sx={{
                        borderColor: '#633394',
                        color: '#633394',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: '#7c52a5',
                          backgroundColor: 'rgba(99, 51, 148, 0.04)',
                          transform: 'translateY(-1px)',
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                        }
                      }}
                    >
                      Reorder Sections
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenAdd}
                      sx={{
                        backgroundColor: '#633394 !important',
                        color: 'white !important',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: '#7c52a5 !important',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 8px rgba(99, 51, 148, 0.3)',
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                          boxShadow: '0 2px 4px rgba(99, 51, 148, 0.3)',
                        }
                      }}
                    >
                      Add Question
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ bgcolor: 'white', borderRadius: 1, p: 1, boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                  {selectedTemplate.questions?.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {(() => {
                          // Group questions by section with ordering
                          const sectionOrder = selectedTemplate.sections || {};
                          const questionsBySection = TemplateUtils.groupQuestionsBySectionWithOrder(selectedTemplate.questions, sectionOrder);

                          return Object.keys(questionsBySection).map(sectionName => {
                            const sectionQuestions = questionsBySection[sectionName]
                              .sort((a, b) => (a.order || 0) - (b.order || 0));

                            return (
                              <Box key={sectionName} sx={{ mb: 2 }}>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    mb: 1,
                                    color: '#633394',
                                    fontWeight: 'bold',
                                    borderBottom: '2px solid #633394',
                                    pb: 0.5
                                  }}
                                >
                                  {sectionName} ({sectionQuestions.length} questions)
                                </Typography>

                                <SortableContext
                                  items={sectionQuestions.map(q => `${sectionName}-${q.id}`)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {sectionQuestions.map((question, index) => (
                                      <CompactQuestionItem
                                        key={question.id}
                                        question={question}
                                        index={index}
                                        onEdit={handleOpenEdit}
                                        onDelete={handleDeleteQuestion}
                                        getQuestionTypeName={getQuestionTypeName}
                                        sectionName={sectionName}
                                      />
                                    ))}
                                  </Box>
                                </SortableContext>
                              </Box>
                            );
                          });
                        })()}
                      </Box>
                    </DndContext>
                  ) : (
                    <Alert severity="info">No questions added yet. Click "Add Question" to create one.</Alert>
                  )}
                </Box>
              </Paper>
            )}
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#FFFFFF', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
            <Typography variant="h6" color="text.secondary">
              Select a template version from the left panel to manage templates and questions
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Question Dialog */}
      <QuestionDialog
        open={openQDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveQuestion}
        editingQuestion={selectedQuestion}
        questionData={formData}
        setQuestionData={setFormData}
        selectedTemplate={selectedTemplate}
      />

      {/* Section Order Dialog */}
      <SectionOrderDialog
        open={openSectionDialog}
        onClose={() => setOpenSectionDialog(false)}
        onSave={handleSaveSectionOrder}
        sections={templateSections}
        templateName={selectedTemplate?.survey_code || ''}
      />

      {/* Edit Template Dialog */}
      <Dialog
        open={openEditTemplateDialog}
        onClose={() => setOpenEditTemplateDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: '#633394', fontWeight: 'bold' }}>Edit Template</DialogTitle>
        <DialogContent>
          <TextField
            label="Template Name"
            fullWidth
            margin="normal"
            value={editTemplateData.survey_code}
            onChange={(e) => setEditTemplateData(prev => ({ ...prev, survey_code: e.target.value }))}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': { borderColor: '#633394' },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#633394' }
            }}
          />
          <Autocomplete
            fullWidth
            freeSolo
            options={titles}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return option.name || '';
            }}
            value={editSelectedTitle}
            onChange={(event, newValue) => {
              if (typeof newValue === 'string') {
                // User typed a new title and pressed Enter
                setEditSelectedTitle({ id: null, name: newValue, isNew: true });
                setEditTemplateData(prev => ({ ...prev, title_id: null, new_title_name: newValue }));
              } else if (newValue && newValue.isNew) {
                // User selected the "+ Add new title" option
                setEditSelectedTitle({ id: null, name: newValue.name, isNew: true });
                setEditTemplateData(prev => ({ ...prev, title_id: null, new_title_name: newValue.name }));
              } else if (newValue && newValue.id) {
                setEditSelectedTitle(newValue);
                setEditTemplateData(prev => ({ ...prev, title_id: newValue.id, new_title_name: '' }));
              } else {
                setEditSelectedTitle(null);
                setEditTemplateData(prev => ({ ...prev, title_id: null, new_title_name: '' }));
              }
            }}
            onInputChange={(event, newInputValue, reason) => {
              if (reason === 'input') {
                const match = titles.find(t => t.name.toLowerCase() === newInputValue.toLowerCase());
                if (match) {
                  setEditTemplateData(prev => ({ ...prev, title_id: match.id, new_title_name: '' }));
                } else {
                  setEditTemplateData(prev => ({ ...prev, title_id: null, new_title_name: newInputValue }));
                }
              }
            }}
            filterOptions={(options, params) => {
              const filtered = options.filter(option =>
                option.name.toLowerCase().includes(params.inputValue.toLowerCase())
              );
              if (params.inputValue !== '' && !filtered.some(o => o.name.toLowerCase() === params.inputValue.toLowerCase())) {
                filtered.push({ id: null, name: params.inputValue, isNew: true });
              }
              return filtered;
            }}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id || `new-${option.name}`}>
                {option.isNew ? (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#633394' }}>
                    + Add new title: "{option.name}"
                  </Typography>
                ) : (
                  <Typography variant="body2">{option.name}</Typography>
                )}
              </Box>
            )}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Title of User Taking the Survey"
                margin="normal"
                placeholder="Search or type a new title..."
                helperText="Select an existing title or type a new one"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': { borderColor: '#633394' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#633394' }
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenEditTemplateDialog(false)}
            sx={{ color: '#633394' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEditTemplate}
            disabled={!editTemplateData.survey_code.trim()}
            sx={{
              backgroundColor: '#633394',
              '&:hover': { backgroundColor: '#7c52a5' },
              '&.Mui-disabled': { backgroundColor: '#d1c4e9' }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionsTab;
