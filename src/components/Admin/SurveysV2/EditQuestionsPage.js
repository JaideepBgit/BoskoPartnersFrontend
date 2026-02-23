import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, List, ListItem, ListItemText,
  Chip, CircularProgress, Alert, IconButton, TextField, FormControl,
  InputLabel, Select, MenuItem, FormControlLabel, Checkbox,
  Autocomplete, Grid, Menu, MenuItem as MenuItemMUI
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LinearProgress from '@mui/material/LinearProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
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
import { CSS } from '@dnd-kit/utilities';
import SurveysV2Service from '../../../services/Admin/SurveysV2Service';
import SectionOrderDialog from '../Inventory/SectionOrderDialog';

// ─── Draggable Question Row ───────────────────────────────────────────────────

const DraggableQuestionItem = ({ question, index, onEdit, onDelete, getTypeLabel, sectionName, isSelected, onSelect }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

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

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    handleMenuClose();
    onEdit(question);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    handleMenuClose();
    if (window.confirm('Are you sure you want to delete this question?')) {
      onDelete(question.id);
    }
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(question)}
      sx={{
        mb: 0.5,
        backgroundColor: isSelected ? '#f0e6fa' : '#fff',
        border: isDragging ? '2px dashed #633394' : isSelected ? '2px solid #633394' : '1px solid #e0e0e0',
        borderRadius: 1,
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          borderColor: isSelected ? '#633394' : '#d0d0d0',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, mr: 1.5, cursor: 'grab', color: '#999',
              borderRadius: 1, flexShrink: 0, transition: 'all 0.2s ease-in-out',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)', color: '#666' },
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600, color: '#333', mb: 0.25,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem'
              }}
            >
              {index + 1}. {question.question_text}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#888',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}
            >
              {getTypeLabel(question.question_type_id)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {question.is_required && (
            <Chip
              label="Required" size="small" variant="outlined"
              sx={{
                height: 18, fontSize: '0.65rem', borderColor: '#999', color: '#666',
                flexShrink: 0, '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{
              p: 0.5, color: '#999',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { color: '#633394', backgroundColor: 'rgba(99,51,148,0.08)' }
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                borderRadius: 1,
              }
            }}
          >
            <MenuItemMUI onClick={handleEdit} sx={{ color: '#633394', fontSize: '0.875rem' }}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItemMUI>
            <MenuItemMUI onClick={handleDelete} sx={{ color: '#d32f2f', fontSize: '0.875rem' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItemMUI>
          </Menu>
        </Box>
      </Box>
    </Paper>
  );
};

// ─── Question Details Panel ──────────────────────────────────────────────────

const QuestionDetailsPanel = ({ question, getTypeLabel }) => {
  if (!question) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography sx={{ color: '#9575cd', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 500 }}>
          SELECT A QUESTION
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>
          Question Text
        </Typography>
        <Typography variant="body1" sx={{ color: '#333', fontWeight: 600, lineHeight: 1.6 }}>
          {question.question_text}
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>
            Type
          </Typography>
          <Typography variant="body2" sx={{ color: '#333' }}>
            {getTypeLabel(question.question_type_id)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>
            Section
          </Typography>
          <Typography variant="body2" sx={{ color: '#333' }}>
            {question.section || 'General'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>
            Required
          </Typography>
          <Chip
            label={question.is_required ? 'Yes' : 'No'}
            size="small"
            variant="outlined"
            sx={{
              borderColor: question.is_required ? '#d32f2f' : '#999',
              color: question.is_required ? '#d32f2f' : '#666'
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>
            Order
          </Typography>
          <Typography variant="body2" sx={{ color: '#333' }}>
            {(question.order || 0) + 1}
          </Typography>
        </Box>
      </Box>

      {question.config && Object.keys(question.config).length > 0 && (
        <Box sx={{ pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle1" sx={{ color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, mb: 1.5 }}>
            Configuration
          </Typography>
          {question.config.options && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#999', fontWeight: 600, display: 'block', mb: 1 }}>
                Options:
              </Typography>
              {question.config.options.map((opt, idx) => (
                <Typography key={idx} variant="body2" sx={{ color: '#333', ml: 1, mb: 0.5 }}>
                  • {opt.label || opt.value}
                </Typography>
              ))}
            </Box>
          )}
          {question.config.yes_label && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#333' }}>
                <strong>Yes:</strong> {question.config.yes_label}
              </Typography>
              <Typography variant="body2" sx={{ color: '#333' }}>
                <strong>No:</strong> {question.config.no_label}
              </Typography>
            </Box>
          )}
          {question.config.max_length && (
            <Typography variant="body2" sx={{ color: '#333', mb: 1 }}>
              <strong>Max Length:</strong> {question.config.max_length}
            </Typography>
          )}
          {question.config.min_value !== undefined && (
            <Box>
              <Typography variant="body2" sx={{ color: '#333' }}>
                <strong>Min:</strong> {question.config.min_value}
              </Typography>
              <Typography variant="body2" sx={{ color: '#333' }}>
                <strong>Max:</strong> {question.config.max_value}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// ─── Question Editor Panel (inline in right panel) ────────────────────────────

const QuestionEditorPanel = ({ question, questionTypes, existingSections, onSave, onCancel, getTypeLabel }) => {
  const [form, setForm] = useState({
    question_text: question?.question_text || '',
    question_type_id: question?.question_type_id || '',
    section: question?.section || '',
    is_required: question?.is_required || false,
  });
  const [config, setConfig] = useState(question?.config || {});
  const [saving, setSaving] = useState(false);

  // Sync form state when question changes
  useEffect(() => {
    if (question?.id) {
      setForm({
        question_text: question.question_text || '',
        question_type_id: question.question_type_id || '',
        section: question.section || '',
        is_required: question.is_required || false,
      });
      setConfig(question.config || {});
    }
  }, [question?.id]);

  const getTypeName = (typeId) => {
    const t = questionTypes.find(t => t.id === typeId || t.name === typeId);
    return t?.name || '';
  };

  const canSave = form.question_text.trim() && form.question_type_id;
  const typeName = getTypeName(form.question_type_id);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({ ...form, config });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!question?.id) return;
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      // Note: This assumes onCancel will handle cleanup after deletion via parent component
      await onSave({ ...form, config, _deleteId: question.id });
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#333' }}>
          {question?.id ? 'Edit Question' : 'Add New Question'}
        </Typography>
        <IconButton size="small" onClick={onCancel} sx={{ p: 0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Form Content - Scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, pr: 1 }}>

        {/* Question Type - Priority */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
            Question Type
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={form.question_type_id}
              onChange={e => setForm(f => ({ ...f, question_type_id: e.target.value }))}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select a question type</em>
              </MenuItem>
              {questionTypes.map(t => (
                <MenuItem key={t.id} value={t.id}>
                  {t.display_name || t.label || t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Question Text */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
            Question Text
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={form.question_text}
            onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
            placeholder="Enter your question"
            size="small"
          />
        </Box>

        {/* Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
            Section
          </Typography>
          <Autocomplete
            freeSolo
            options={existingSections}
            value={form.section}
            onChange={(_, v) => setForm(f => ({ ...f, section: v || '' }))}
            onInputChange={(_, v) => setForm(f => ({ ...f, section: v || '' }))}
            renderInput={params => (
              <TextField {...params} placeholder="Type a new section name or select from existing sections" size="small" />
            )}
          />
        </Box>

        {/* Required */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_required}
                onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
              />
            }
            label="Required"
          />
        </Box>

        {/* Type-Specific Config */}
        {form.question_type_id && typeName && (
          <Box sx={{ mb: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <QuestionConfigFields
              questionTypeName={typeName}
              config={config}
              onChange={setConfig}
            />
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: '1px solid #e0e0e0' }}>
        {question?.id && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            sx={{ textTransform: 'none', borderColor: '#d32f2f', color: '#d32f2f' }}
          >
            Delete
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{ color: '#633394', borderColor: '#e0e0e0', textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !canSave}
          sx={{ textTransform: 'none', backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
        >
          {saving ? 'Saving...' : question?.id ? 'Update Question' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
};

// ─── Question Config Renderers (mirrors Inventory/QuestionDialog) ─────────────

const QuestionConfigFields = ({ questionTypeName, config, onChange }) => {
  const handleChange = (key, value) => onChange({ ...config, [key]: value });

  const renderOptions = (fieldKey) => {
    const options = config[fieldKey] || [];
    const addOption = () => onChange({ ...config, [fieldKey]: [...options, { value: `option_${options.length + 1}`, label: '' }] });
    const updateOption = (i, k, v) => { const o = [...options]; o[i] = { ...o[i], [k]: v }; onChange({ ...config, [fieldKey]: o }); };
    const removeOption = (i) => onChange({ ...config, [fieldKey]: options.filter((_, idx) => idx !== i) });

    return (
      <>
        <Typography variant="body2" sx={{ mb: 1 }}>Options:</Typography>
        <List dense disablePadding>
          {options.map((opt, i) => (
            <ListItem key={i} sx={{ px: 0 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={5}><TextField fullWidth size="small" label="Value" value={opt.value || ''} onChange={e => updateOption(i, 'value', e.target.value)} /></Grid>
                <Grid item xs={5}><TextField fullWidth size="small" label="Label" value={opt.label || ''} onChange={e => updateOption(i, 'label', e.target.value)} /></Grid>
                <Grid item xs={2}><IconButton size="small" onClick={() => removeOption(i)}><DeleteIcon fontSize="small" /></IconButton></Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
        <Button size="small" startIcon={<AddIcon />} onClick={addOption} sx={{ mt: 0.5 }}>Add Option</Button>
      </>
    );
  };

  switch (questionTypeName) {
    case 'short_text':
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Short Text Configuration</Typography>
          <TextField fullWidth type="number" label="Maximum Length" value={config.max_length || 255} onChange={e => handleChange('max_length', parseInt(e.target.value) || 255)} margin="normal" />
          <TextField fullWidth label="Placeholder Text" value={config.placeholder || ''} onChange={e => handleChange('placeholder', e.target.value)} margin="normal" />
        </Box>
      );
    case 'single_choice':
      return <Box sx={{ mt: 2 }}><Typography variant="subtitle2" gutterBottom>Single Choice Configuration</Typography>{renderOptions('options')}</Box>;
    case 'yes_no':
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Yes/No Configuration</Typography>
          <TextField fullWidth label="Yes Label" value={config.yes_label || 'Yes'} onChange={e => handleChange('yes_label', e.target.value)} margin="normal" />
          <TextField fullWidth label="No Label" value={config.no_label || 'No'} onChange={e => handleChange('no_label', e.target.value)} margin="normal" />
        </Box>
      );
    case 'likert5':
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Five-Point Likert Scale</Typography>
          <Typography variant="body2" color="text.secondary">Standard: 1 – None, 2 – A little, 3 – A moderate amount, 4 – A lot, 5 – A great deal</Typography>
        </Box>
      );
    case 'multi_select':
      return <Box sx={{ mt: 2 }}><Typography variant="subtitle2" gutterBottom>Multiple Select Configuration</Typography>{renderOptions('options')}</Box>;
    case 'paragraph':
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Paragraph Configuration</Typography>
          <TextField fullWidth type="number" label="Maximum Length" value={config.max_length || 2000} onChange={e => handleChange('max_length', parseInt(e.target.value) || 2000)} margin="normal" />
          <TextField fullWidth label="Placeholder Text" value={config.placeholder || ''} onChange={e => handleChange('placeholder', e.target.value)} margin="normal" />
        </Box>
      );
    case 'numeric':
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Numeric Configuration</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Number Type</InputLabel>
            <Select value={config.number_type || 'integer'} onChange={e => handleChange('number_type', e.target.value)} label="Number Type">
              <MenuItem value="integer">Integer</MenuItem>
              <MenuItem value="decimal">Decimal</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth type="number" label="Minimum Value" value={config.min_value || ''} onChange={e => handleChange('min_value', e.target.value ? parseFloat(e.target.value) : null)} margin="normal" />
          <TextField fullWidth type="number" label="Maximum Value" value={config.max_value || ''} onChange={e => handleChange('max_value', e.target.value ? parseFloat(e.target.value) : null)} margin="normal" />
        </Box>
      );
    case 'percentage': {
      const items = config.items || [];
      const addItem = () => onChange({ ...config, items: [...items, { value: `item_${items.length + 1}`, label: '' }] });
      const updateItem = (i, k, v) => { const it = [...items]; it[i] = { ...it[i], [k]: v }; onChange({ ...config, items: it }); };
      const removeItem = (i) => onChange({ ...config, items: items.filter((_, idx) => idx !== i) });
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Percentage Configuration</Typography>
          <TextField fullWidth type="number" label="Total Percentage" value={config.total_percentage || 100} onChange={e => handleChange('total_percentage', parseInt(e.target.value) || 100)} margin="normal" />
          <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>Items:</Typography>
          <List dense disablePadding>
            {items.map((item, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={5}><TextField fullWidth size="small" label="Value" value={item.value || ''} onChange={e => updateItem(i, 'value', e.target.value)} /></Grid>
                  <Grid item xs={5}><TextField fullWidth size="small" label="Label" value={item.label || ''} onChange={e => updateItem(i, 'label', e.target.value)} /></Grid>
                  <Grid item xs={2}><IconButton size="small" onClick={() => removeItem(i)}><DeleteIcon fontSize="small" /></IconButton></Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
          <Button size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ mt: 0.5 }}>Add Item</Button>
        </Box>
      );
    }
    case 'flexible_input': {
      const items = config.items || [];
      const addItem = () => onChange({ ...config, items: [...items, { value: `item_${items.length + 1}`, label: '' }] });
      const updateItem = (i, k, v) => { const it = [...items]; it[i] = { ...it[i], [k]: v }; onChange({ ...config, items: it }); };
      const removeItem = (i) => onChange({ ...config, items: items.filter((_, idx) => idx !== i) });
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Flexible Input Configuration</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>Items:</Typography>
          {items.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField size="small" label="Value" value={item.value || ''} onChange={e => updateItem(i, 'value', e.target.value)} sx={{ flex: 1 }} />
              <TextField size="small" label="Label" value={item.label || ''} onChange={e => updateItem(i, 'label', e.target.value)} sx={{ flex: 1 }} />
              <IconButton size="small" color="error" onClick={() => removeItem(i)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          ))}
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addItem} sx={{ mb: 2 }}>Add Item</Button>
          <TextField fullWidth label="Instructions" value={config.instructions || ''} onChange={e => handleChange('instructions', e.target.value)} margin="normal" />
          <TextField fullWidth label="Placeholder Text" value={config.placeholder || ''} onChange={e => handleChange('placeholder', e.target.value)} margin="normal" />
        </Box>
      );
    }
    case 'year_matrix': {
      const rows = config.rows || [];
      const addRow = () => onChange({ ...config, rows: [...rows, { value: `row_${rows.length + 1}`, label: '' }] });
      const updateRow = (i, k, v) => { const r = [...rows]; r[i] = { ...r[i], [k]: v }; onChange({ ...config, rows: r }); };
      const removeRow = (i) => onChange({ ...config, rows: rows.filter((_, idx) => idx !== i) });
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Year Matrix Configuration</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth type="number" label="Start Year" value={config.start_year || 2024} onChange={e => handleChange('start_year', parseInt(e.target.value) || 2024)} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="End Year" value={config.end_year || 2029} onChange={e => handleChange('end_year', parseInt(e.target.value) || 2029)} /></Grid>
          </Grid>
          <Typography variant="body2" sx={{ mt: 2, mb: 0.5 }}>Rows:</Typography>
          <List dense disablePadding>
            {rows.map((row, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={5}><TextField fullWidth size="small" label="Value" value={row.value || ''} onChange={e => updateRow(i, 'value', e.target.value)} /></Grid>
                  <Grid item xs={5}><TextField fullWidth size="small" label="Label" value={row.label || ''} onChange={e => updateRow(i, 'label', e.target.value)} /></Grid>
                  <Grid item xs={2}><IconButton size="small" onClick={() => removeRow(i)}><DeleteIcon fontSize="small" /></IconButton></Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
          <Button size="small" startIcon={<AddIcon />} onClick={addRow} sx={{ mt: 0.5 }}>Add Row</Button>
        </Box>
      );
    }
    default:
      return null;
  }
};


// ─── Preview Panel (inline, not a dialog) ────────────────────────────────────

const PreviewPanel = ({ survey, questions, getTypeLabel }) => {
  const [selectedSection, setSelectedSection] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});

  // Group questions by section
  const sections = {};
  questions.forEach(q => {
    const sec = q.section || 'General';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(q);
  });
  // Sort questions within each section
  Object.values(sections).forEach(sqs => sqs.sort((a, b) => (a.order || 0) - (b.order || 0)));

  const sectionCount = Object.keys(sections).length;
  const questionCount = questions.length;
  const estimatedTime = questionCount; // 1 min per question

  const handleOpenSection = (sectionName, sqs) => {
    setSelectedSection({ name: sectionName, questions: sqs });
    setCurrentQuestionIndex(0);
  };

  const handleCloseSection = () => {
    setSelectedSection(null);
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const surveyProgress = selectedSection
    ? ((currentQuestionIndex + 1) / selectedSection.questions.length) * 100
    : 0;

  const handleNextQuestion = () => {
    if (!selectedSection) return;
    if (currentQuestionIndex < selectedSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleCloseSection();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const renderQuestionContent = (question) => {
    switch (question.question_type_id) {
      case 1: // short_text
        return (
          <TextField fullWidth label="Your answer" variant="outlined"
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.config?.placeholder || ''}
            inputProps={{ maxLength: question.config?.max_length || 255 }}
            sx={{ mt: 2 }} required={question.is_required} />
        );
      case 2: // single_choice
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <RadioGroup value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}>
              {question.config?.options?.map((option, idx) => (
                <FormControlLabel key={idx}
                  value={typeof option === 'object' ? option.value : option}
                  control={<Radio />}
                  label={typeof option === 'object' ? option.label : option}
                  sx={{ my: 0.5 }} />
              ))}
            </RadioGroup>
          </FormControl>
        );
      case 3: // yes_no
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <RadioGroup value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)} row>
              <FormControlLabel value="yes" control={<Radio />}
                label={question.config?.yes_label || 'Yes'} sx={{ mr: 4 }} />
              <FormControlLabel value="no" control={<Radio />}
                label={question.config?.no_label || 'No'} />
            </RadioGroup>
          </FormControl>
        );
      case 4: // likert5
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <RadioGroup value={responses[question.id] || ''}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}>
              {[1, 2, 3, 4, 5].map((value) => {
                const defaultLabels = { 1: 'None', 2: 'A little', 3: 'A moderate amount', 4: 'A lot', 5: 'A great deal' };
                const labels = question.config?.scale_labels || defaultLabels;
                const labelText = labels[value] || defaultLabels[value] || `Option ${value}`;
                return (
                  <FormControlLabel key={value} value={value.toString()} control={<Radio />}
                    label={`${value} - ${labelText}`} sx={{ my: 0.5 }} />
                );
              })}
            </RadioGroup>
          </FormControl>
        );
      case 5: // multi_select
        return (
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }} required={question.is_required}>
            <FormGroup>
              <FormLabel component="legend">Select all that apply</FormLabel>
              {question.config?.options?.map((option, idx) => {
                const selectedOptions = responses[question.id] || [];
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                return (
                  <FormControlLabel key={idx}
                    control={
                      <Checkbox checked={selectedOptions.includes(optionValue)}
                        onChange={(e) => {
                          const current = responses[question.id] || [];
                          handleResponseChange(question.id,
                            e.target.checked ? [...current, optionValue] : current.filter(item => item !== optionValue)
                          );
                        }} />
                    }
                    label={optionLabel} sx={{ my: 0.5 }} />
                );
              })}
            </FormGroup>
          </FormControl>
        );
      case 6: // paragraph
        return (
          <TextField fullWidth label="Your answer" variant="outlined" multiline rows={4}
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.config?.placeholder || ''}
            inputProps={{ maxLength: question.config?.max_length || 2000 }}
            sx={{ mt: 2 }} required={question.is_required} />
        );
      case 7: // numeric
        return (
          <TextField fullWidth label="Your answer" variant="outlined" type="number"
            value={responses[question.id] || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={`Enter a ${question.config?.number_type || 'integer'} value`}
            inputProps={{
              min: question.config?.min_value, max: question.config?.max_value,
              step: question.config?.number_type === 'decimal' ? 0.01 : 1
            }}
            sx={{ mt: 2 }} required={question.is_required} />
        );
      case 8: // percentage
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Allocate percentages (Total must equal {question.config?.total_percentage || 100}%)
            </Typography>
            {question.config?.items?.map((item, idx) => {
              const itemValue = typeof item === 'object' ? item.value : item;
              const itemLabel = typeof item === 'object' ? item.label : item;
              const currentResponses = responses[question.id] || {};
              return (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>{itemLabel}</Typography>
                  <TextField type="number" value={currentResponses[itemValue] || ''}
                    onChange={(e) => {
                      handleResponseChange(question.id, { ...currentResponses, [itemValue]: parseFloat(e.target.value) || 0 });
                    }}
                    inputProps={{ min: 0, max: question.config?.total_percentage || 100, step: 1 }}
                    sx={{ width: 100 }} size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>%</Typography>
                </Box>
              );
            })}
            <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
              Total: {Object.values(responses[question.id] || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)}%
            </Typography>
          </Box>
        );
      case 9: // flexible_input
        return (
          <Box sx={{ mt: 2 }}>
            {question.config?.instructions && (
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>{question.config.instructions}</Typography>
            )}
            {question.config?.items?.map((item, idx) => {
              const itemValue = typeof item === 'object' ? item.value : item;
              const itemLabel = typeof item === 'object' ? item.label : item;
              const currentResponses = responses[question.id] || {};
              return (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{itemLabel}</Typography>
                  <TextField fullWidth value={currentResponses[itemValue] || ''}
                    onChange={(e) => handleResponseChange(question.id, { ...currentResponses, [itemValue]: e.target.value })}
                    placeholder={question.config?.placeholder || 'Enter your response'} size="small" />
                </Box>
              );
            })}
          </Box>
        );
      case 10: // year_matrix
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Year Matrix ({question.config?.start_year || 2024} - {question.config?.end_year || 2029})
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#FAFAFA' }}>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Item</TableCell>
                    {Array.from(
                      { length: (question.config?.end_year || 2029) - (question.config?.start_year || 2024) + 1 },
                      (_, i) => (question.config?.start_year || 2024) + i
                    ).map(year => (
                      <TableCell key={year} align="center" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{year}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {question.config?.rows?.map((row, rowIdx) => {
                    const rowValue = typeof row === 'object' ? row.value : row;
                    const rowLabel = typeof row === 'object' ? row.label : row;
                    return (
                      <TableRow key={rowIdx}>
                        <TableCell>{rowLabel}</TableCell>
                        {Array.from(
                          { length: (question.config?.end_year || 2029) - (question.config?.start_year || 2024) + 1 },
                          (_, i) => (question.config?.start_year || 2024) + i
                        ).map(year => (
                          <TableCell key={year} align="center">
                            <TextField size="small" type="number"
                              value={responses[question.id]?.[rowValue]?.[year] || ''}
                              onChange={(e) => {
                                const currentMatrix = responses[question.id] || {};
                                const currentRow = currentMatrix[rowValue] || {};
                                handleResponseChange(question.id, {
                                  ...currentMatrix,
                                  [rowValue]: { ...currentRow, [year]: parseFloat(e.target.value) || 0 }
                                });
                              }}
                              sx={{ width: 80 }} />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      default:
        return (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            This question type is not yet implemented.
          </Typography>
        );
    }
  };

  // ── Section Overview (default view) ──
  if (!selectedSection) {
    return (
      <Box sx={{ height: '100%', overflowY: 'auto' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{
            color: '#212121', fontWeight: 600, fontSize: '1.125rem',
            display: 'flex', alignItems: 'center', gap: 1, mb: 2
          }}>
            <AssignmentIcon sx={{ fontSize: '1.25rem' }} />
            {survey?.name} - Template Preview
          </Typography>

          <Typography variant="body1" sx={{ mb: 2, color: '#555', lineHeight: 1.6 }}>
            <strong>Admin Preview Mode:</strong> This is how your survey template will appear to respondents.
            You can navigate through sections and test question interactions to ensure everything works as expected.
          </Typography>

          <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.5, mb: 3 }}>
            <strong>Tip:</strong> Click on any section below to experience the survey flow from a user's perspective.
            Your test responses won't be saved to the database.
          </Typography>

          {/* Survey Overview Stats */}
          <Box sx={{ backgroundColor: '#f8f9fa', borderRadius: '4px', mb: 3, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
              Survey Overview:
            </Typography>
            <Box sx={{
              p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderRadius: '4px', mb: 1, backgroundColor: '#fff', border: '1px solid #e0e0e0'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ListAltIcon sx={{ color: '#633394', fontSize: '1.25rem', mr: 1 }} />
                <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
                  <strong>{sectionCount}</strong> Sections
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 2, height: '20px' }} />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <QuizIcon sx={{ color: '#633394', fontSize: '1.25rem', mr: 1 }} />
                <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
                  <strong>{questionCount}</strong> Questions
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 2, height: '20px' }} />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ color: '#633394', fontSize: '1.25rem', mr: 1 }} />
                <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
                  <strong>{estimatedTime}</strong> min
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Section Details */}
          <Typography variant="subtitle2" sx={{ mb: 2, color: '#333', fontWeight: 600 }}>
            Section Details:
          </Typography>

          {questions.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No questions added yet.</Typography>
          ) : (
            Object.entries(sections).map(([sectionName, sqs]) => (
              <Box key={sectionName}
                sx={{
                  mb: 2, borderRadius: '4px', overflow: 'hidden', cursor: 'pointer',
                  border: '1px solid #e0e0e0', transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }
                }}
                onClick={() => handleOpenSection(sectionName, sqs)}
              >
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 2, backgroundColor: '#f9f9f9', borderBottom: '1px solid #e0e0e0'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      display: 'flex', p: 0.5, borderRadius: '4px',
                      backgroundColor: 'rgba(99, 51, 148, 0.1)'
                    }}>
                      <AssignmentIcon fontSize="small" sx={{ color: '#633394' }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                      Section {sectionName}
                    </Typography>
                  </Box>
                  <Chip label={`${sqs.length} questions`} size="small"
                    sx={{
                      height: '24px', fontSize: '0.75rem',
                      backgroundColor: 'rgba(99, 51, 148, 0.08)', color: '#633394',
                      fontWeight: 500, borderRadius: '4px'
                    }} />
                </Box>
                <Box sx={{
                  p: 2, display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', backgroundColor: 'white'
                }}>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                    {sqs.filter(q => q.is_required).length} required questions
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: '#5c68c3', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      Start Section
                    </Typography>
                    <ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
    );
  }

  // ── Survey Flow (section selected) ──
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{
        px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #e0e0e0', backgroundColor: '#fff', flexShrink: 0
      }}>
        <Typography variant="subtitle1" sx={{
          fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', fontSize: '0.95rem'
        }}>
          <Box component="span" sx={{
            display: 'inline-flex', mr: 1.5, color: '#633394',
            bgcolor: 'rgba(99, 51, 148, 0.1)', p: 0.5, borderRadius: '4px'
          }}>
            <AssignmentIcon fontSize="small" />
          </Box>
          Section {selectedSection.name}
        </Typography>
        <IconButton onClick={handleCloseSection} size="small"
          sx={{ color: '#666', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Progress bar */}
      <Box sx={{ px: 3, py: 1.5, width: '100%', boxSizing: 'border-box', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
            Question {currentQuestionIndex + 1} of {selectedSection.questions.length}
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
            {Math.round(surveyProgress)}% Complete
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={surveyProgress}
          sx={{
            height: 4, borderRadius: 2, backgroundColor: '#f0f0f0',
            '& .MuiLinearProgress-bar': { backgroundColor: '#633394' }, width: '100%'
          }} />
      </Box>

      {/* Question content */}
      <Box sx={{ py: 4, px: 3, flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', overflow: 'auto' }}>
        {selectedSection.questions[currentQuestionIndex] && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{
                color: '#333', mb: 0.5, fontWeight: 500, fontSize: '1.125rem', lineHeight: 1.4
              }}>
                {currentQuestionIndex + 1}. {selectedSection.questions[currentQuestionIndex].question_text}
              </Typography>
              {selectedSection.questions[currentQuestionIndex].is_required && (
                <Typography variant="caption" sx={{ color: '#d32f2f', fontSize: '0.75rem' }}>* Required</Typography>
              )}
            </Box>
            <Box sx={{ width: '100%', maxWidth: '900px' }}>
              {renderQuestionContent(selectedSection.questions[currentQuestionIndex])}
            </Box>
          </>
        )}
      </Box>

      {/* Footer navigation */}
      <Box sx={{
        px: 3, py: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
      }}>
        <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}
          startIcon={<ArrowBackIcon fontSize="small" />}
          sx={{
            color: '#633394', textTransform: 'none', fontWeight: 500, fontSize: '0.875rem',
            '&.Mui-disabled': { color: 'rgba(0, 0, 0, 0.26)' }
          }}>
          Previous
        </Button>
        <Box>
          <Button onClick={handleCloseSection}
            sx={{ mr: 2, color: '#666', textTransform: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
            Save & Exit
          </Button>
          <Button onClick={handleNextQuestion} endIcon={<ArrowForwardIcon fontSize="small" />}
            variant="contained" disableElevation
            sx={{
              backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' },
              px: 2.5, py: 0.75, borderRadius: '4px', textTransform: 'none', fontWeight: 500, fontSize: '0.875rem'
            }}>
            {currentQuestionIndex < selectedSection.questions.length - 1 ? 'Next' : 'Finish'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const EditQuestionsPage = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionTypes, setQuestionTypes] = useState([]);

  // Right panel view: { type: 'none' } | { type: 'view', question } | { type: 'edit', question } | { type: 'add' } | { type: 'preview' }
  const [activeView, setActiveView] = useState({ type: 'none' });
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [sectionOrder, setSectionOrder] = useState({});

  // dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [surveyData, types] = await Promise.all([
        SurveysV2Service.getSurvey(surveyId),
        SurveysV2Service.getQuestionTypes().catch(() => []),
      ]);
      setSurvey(surveyData);
      setQuestions(surveyData.questions || []);
      if (Array.isArray(types) && types.length > 0) setQuestionTypes(types);
    } catch (err) {
      console.error('Error loading survey:', err);
      setError('Failed to load survey.');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getTypeLabel = (typeId) => {
    const t = questionTypes.find(t => t.id === typeId || t.name === typeId);
    return t?.display_name || t?.label || t?.name || typeId || 'Unknown';
  };

  const existingSections = [...new Set(questions.map(q => q.section).filter(Boolean))];

  const groupedBySection = () => {
    const grouped = {};
    questions.forEach(q => {
      const sec = q.section || 'General';
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push(q);
    });

    // Apply section ordering
    const sorted = {};
    Object.keys(grouped)
      .sort((a, b) => {
        const oa = sectionOrder[a] !== undefined ? sectionOrder[a] : 999;
        const ob = sectionOrder[b] !== undefined ? sectionOrder[b] : 999;
        return oa - ob;
      })
      .forEach(k => { sorted[k] = grouped[k].sort((a, b) => (a.order || 0) - (b.order || 0)); });
    return sorted;
  };

  // ── Question CRUD ─────────────────────────────────────────────────────────

  const handleSaveQuestion = async (formData) => {
    try {
      if (activeView.type === 'edit' && activeView.question?.id) {
        await SurveysV2Service.updateQuestion(surveyId, activeView.question.id, formData);
      } else {
        await SurveysV2Service.addQuestion(surveyId, {
          ...formData,
          order: questions.length,
        });
      }
      setActiveView({ type: 'none' });
      await loadData();
    } catch (err) {
      console.error('Error saving question:', err);
      setError('Failed to save question.');
      throw err;
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await SurveysV2Service.deleteQuestion(surveyId, questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      // If we were viewing/editing the deleted question, clear the panel
      if ((activeView.type === 'view' || activeView.type === 'edit') && activeView.question?.id === questionId) {
        setActiveView({ type: 'none' });
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Failed to delete question.');
    }
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const activeQuestionId = parseInt(active.id.toString().split('-').pop());
    const overQuestionId   = parseInt(over.id.toString().split('-').pop());

    const oldIndex = questions.findIndex(q => q.id === activeQuestionId);
    const newIndex = questions.findIndex(q => q.id === overQuestionId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({ ...q, order: i }));
    setQuestions(reordered);

    try {
      await SurveysV2Service.updateSurvey(surveyId, { questions: reordered });
    } catch (err) {
      console.error('Error saving question order:', err);
      await loadData();
    }
  };

  // ── Section Reorder ───────────────────────────────────────────────────────

  const handleOpenSectionOrder = async () => {
    setSectionDialogOpen(true);
  };

  const buildSectionItems = () => {
    const grouped = groupedBySection();
    return Object.keys(grouped).map((name, idx) => ({
      name,
      order: sectionOrder[name] !== undefined ? sectionOrder[name] : idx,
      questionCount: grouped[name].length,
    }));
  };

  const handleSaveSectionOrder = async (orderedSections) => {
    const newOrder = {};
    orderedSections.forEach((s, i) => { newOrder[s.name] = i; });
    setSectionOrder(newOrder);

    try {
      await SurveysV2Service.updateSections(surveyId, orderedSections);
    } catch (err) {
      console.error('Error saving section order:', err);
    }
    setSectionDialogOpen(false);
  };

  const handleSaveSurvey = async () => {
    try {
      await SurveysV2Service.updateSurvey(surveyId, { questions });
      setError(null);
      alert('Survey saved successfully!');
    } catch (err) {
      console.error('Error saving survey:', err);
      setError('Failed to save survey.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress sx={{ color: '#633394' }} />
        </Box>
      </Box>
    );
  }

  const sections = groupedBySection();

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Header Bar */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 1.5,
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          flexShrink: 0
        }}>
          {/* Left: Back Button */}
          <Box sx={{ flex: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/surveys-v2/${surveyId}`)}
              sx={{ color: '#633394', borderColor: '#e0e0e0', textTransform: 'none', fontSize: '0.875rem' }}
            >
              Survey
            </Button>
          </Box>

          {/* Center: Title */}
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, textAlign: 'center', color: '#333' }}>
            Edit Survey
          </Typography>

          {/* Right: Preview + Save Buttons */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant={activeView.type === 'preview' ? 'contained' : 'outlined'}
              onClick={() => setActiveView(activeView.type === 'preview' ? { type: 'none' } : { type: 'preview' })}
              sx={{
                textTransform: 'none',
                ...(activeView.type === 'preview'
                  ? { backgroundColor: '#633394', color: '#fff', '&:hover': { backgroundColor: '#7c52a5' } }
                  : { color: '#633394', borderColor: '#e0e0e0' })
              }}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveSurvey}
              sx={{ textTransform: 'none', backgroundColor: '#633394', '&:hover': { backgroundColor: '#7c52a5' } }}
            >
              Save
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ px: 3, py: 1.5 }} onClose={() => setError(null)}>{error}</Alert>}

        {/* Two-Column Body */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* LEFT PANEL - Questions Sidebar */}
          <Box sx={{ width: 280, flexShrink: 0, borderRight: '1px solid #e0e0e0', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Left Panel Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                Questions
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setActiveView({ type: 'add' })}
                sx={{ textTransform: 'none', backgroundColor: '#633394', fontSize: '0.75rem', py: 0.5, '&:hover': { backgroundColor: '#7c52a5' } }}
              >
                Add
              </Button>
            </Box>

            {/* Question List - Scrollable */}
            {questions.length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                <Typography variant="caption" sx={{ color: '#999', textAlign: 'center' }}>
                  No questions yet
                </Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {Object.entries(sections).map(([sectionName, sectionQuestions]) => (
                      <Box key={sectionName}>
                        <Typography variant="caption" sx={{
                          px: 1, py: 0.5, display: 'block', color: '#999', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase'
                        }}>
                          {sectionName}
                        </Typography>
                        <SortableContext
                          items={sectionQuestions.map(q => `${sectionName}-${q.id}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {sectionQuestions.map((question, idx) => (
                              <DraggableQuestionItem
                                key={question.id}
                                question={question}
                                index={idx}
                                sectionName={sectionName}
                                onEdit={q => setActiveView({ type: 'edit', question: q })}
                                onDelete={handleDeleteQuestion}
                                getTypeLabel={getTypeLabel}
                                isSelected={
                                  (activeView.type === 'view' || activeView.type === 'edit') &&
                                  activeView.question?.id === question.id
                                }
                                onSelect={q => setActiveView({ type: 'view', question: q })}
                              />
                            ))}
                          </Box>
                        </SortableContext>
                      </Box>
                    ))}
                  </Box>
                </DndContext>
              </Box>
            )}
          </Box>

          {/* RIGHT PANEL - View / Edit / Add / Preview */}
          <Box sx={{ flex: 1, backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid #e0e0e0' }}>
            {activeView.type === 'edit' || activeView.type === 'add' ? (
              <QuestionEditorPanel
                key={activeView.type === 'edit' ? `edit-${activeView.question?.id}` : 'add-new'}
                question={activeView.type === 'edit' ? activeView.question : {}}
                questionTypes={questionTypes}
                existingSections={existingSections}
                onSave={handleSaveQuestion}
                onCancel={() => setActiveView({ type: 'none' })}
                getTypeLabel={getTypeLabel}
              />
            ) : activeView.type === 'view' ? (
              <QuestionDetailsPanel question={activeView.question} getTypeLabel={getTypeLabel} />
            ) : activeView.type === 'preview' ? (
              <PreviewPanel
                survey={survey}
                questions={questions}
                getTypeLabel={getTypeLabel}
              />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography sx={{ color: '#9575cd', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 500 }}>
                  CONTENT
                </Typography>
              </Box>
            )}
          </Box>

        </Box>
      </Box>

      {/* Section Order Dialog (reused from Inventory) */}
      <SectionOrderDialog
        open={sectionDialogOpen}
        onClose={() => setSectionDialogOpen(false)}
        onSave={handleSaveSectionOrder}
        sections={buildSectionItems()}
        templateName={survey?.name || ''}
      />
    </>
  );
};

export default EditQuestionsPage;
