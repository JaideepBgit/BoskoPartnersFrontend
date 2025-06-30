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
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Reorder as ReorderIcon
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
  onEdit 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(template.survey_code);

  const handleClick = (e) => {
    if (isMultiSelectMode || isEditing) {
      return; // Don't select when in multi-select mode or editing
    }
    if (isMultiSelectMode) {
      onToggleSelect();
    } else {
      onSelect();
    }
  };

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedName(template.survey_code);
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (editedName.trim() && editedName !== template.survey_code) {
      onEdit(template.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditedName(template.survey_code);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit(e);
    } else if (e.key === 'Escape') {
      handleCancelEdit(e);
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
        backgroundColor: isSelected ? 'rgba(99, 51, 148, 0.15)' : '#f5f5f5',
        border: '1px solid',
        borderColor: isSelected ? '#633394' : '#e0e0e0',
        cursor: isEditing ? 'default' : 'pointer',
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
        {isEditing ? (
          <TextField
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleSaveEdit}
            autoFocus
            size="small"
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
                '&.Mui-focused fieldset': {
                  borderColor: '#633394',
                },
              },
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: isSelected ? 600 : 400,
              color: isSelected ? '#633394' : '#333',
              transition: 'color 0.2s ease-in-out',
            }}
          >
            {template.survey_code}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
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
          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            {new Date(template.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
      
      {!isMultiSelectMode && !isEditing && (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton 
            size="small" 
            color="primary" 
            onClick={handleStartEdit}
            sx={{ 
              color: '#633394',
              '&:hover': {
                backgroundColor: 'rgba(99, 51, 148, 0.08)',
              }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={(e) => {
              e.stopPropagation();
              console.log('Delete button clicked for template:', template.survey_code, 'ID:', template.id);
              if (window.confirm(`Delete template "${template.survey_code}"?`)) {
                console.log('User confirmed deletion, calling onDelete...');
                onDelete(template.id);
              } else {
                console.log('User cancelled deletion');
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
  onRefreshData 
}) => {
  const [templateVersions, setTemplateVersions] = useState(parentTemplateVersions);
  const [templates, setTemplates] = useState(parentTemplates);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTemplateData, setNewTemplateData] = useState({
    survey_code: '',
    version_id: '',
    questions: []
  });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentTemplateVersions.length, parentTemplates.length]);

  const fetchTemplateVersions = useCallback(async () => {
    if (onRefreshData) {
      onRefreshData(); // Use parent's refresh function
    } else {
      const data = await TemplateUtils.fetchTemplateVersions();
      setTemplateVersions(data);
    }
  }, [onRefreshData]);

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
      setNewTemplateData({ survey_code: '', version_id: '', questions: [] });
      fetchTemplates();
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

  const handleEditTemplate = async (templateId, newName) => {
    try {
      console.log('Attempting to edit template with ID:', templateId, 'to name:', newName);
      const success = await TemplateUtils.updateTemplateName(templateId, newName);
      console.log('Edit result:', success);
      
      if (success) {
        console.log('Template name updated successfully, updating UI...');
        // Update the templates list
        await fetchTemplates();
        
        // Update selected template if it's the one being edited
        if (selectedTemplate?.id === templateId) {
          const updatedTemplate = { ...selectedTemplate, survey_code: newName };
          setSelectedTemplate(updatedTemplate);
        }
        
        console.log('UI updated after template name change');
      } else {
        console.error('Failed to edit template:', templateId);
        alert('Failed to update template name. Please try again.');
      }
    } catch (error) {
      console.error('Error editing template:', error);
      alert('Error occurred while updating template name: ' + error.message);
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
      <Box 
        sx={{ 
          width: 240, 
          backgroundColor: '#f5f5f5', 
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
      
      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pl: 2 }}>
        {selectedVersion ? (
          <>
            {/* Templates section */}
            <Paper 
              sx={{ 
                p: 2, 
                mb: 2, 
                backgroundColor: '#f5f5f5', 
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
                          onEdit={handleEditTemplate}
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
                  backgroundColor: '#f5f5f5', 
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
                    Questions for {selectedTemplate.survey_code}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
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
          <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
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
    </Box>
  );
};

export default QuestionsTab;
