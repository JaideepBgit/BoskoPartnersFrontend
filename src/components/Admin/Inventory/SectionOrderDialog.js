import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper
} from '@mui/material';
import {
  DragIndicator as DragIndicatorIcon,
  Close as CloseIcon
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

// Sortable Section Item Component
const SortableSectionItem = ({ section, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        backgroundColor: 'white',
        borderRadius: 1,
        border: '1px solid #e0e0e0',
        cursor: isDragging ? 'grabbing' : 'grab',
        '&:hover': {
          backgroundColor: '#f5f5f5',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }
      }}
    >
      <IconButton
        {...attributes}
        {...listeners}
        sx={{
          mr: 1,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' }
        }}
      >
        <DragIndicatorIcon />
      </IconButton>
      <ListItemText
        primary={
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {section.name}
          </Typography>
        }
        secondary={
          <Typography variant="caption" color="text.secondary">
            {section.questionCount} questions
          </Typography>
        }
      />
      <Typography variant="body2" sx={{ color: '#633394', fontWeight: 500 }}>
        #{index + 1}
      </Typography>
    </ListItem>
  );
};

const SectionOrderDialog = ({
  open,
  onClose,
  onSave,
  sections = [],
  templateName = ''
}) => {
  const [orderedSections, setOrderedSections] = useState([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Initialize sections when dialog opens
  useEffect(() => {
    if (open && sections.length > 0) {
      setOrderedSections([...sections]);
    }
  }, [open, sections]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedSections((items) => {
        const oldIndex = items.findIndex(item => item.name === active.id);
        const newIndex = items.findIndex(item => item.name === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    // Convert to the format expected by the backend
    const sectionsWithOrder = orderedSections.map((section, index) => ({
      name: section.name,
      order: index
    }));
    onSave(sectionsWithOrder);
  };

  const handleClose = () => {
    setOrderedSections([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#633394', fontWeight: 'bold' }}>
            Reorder Sections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {templateName}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag and drop sections to reorder them. The order will affect how questions are displayed in the survey.
        </Typography>

        <Paper sx={{ p: 1, backgroundColor: '#FFFFFF' }}>
          {orderedSections.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedSections.map(s => s.name)}
                strategy={verticalListSortingStrategy}
              >
                <List sx={{ py: 0 }}>
                  {orderedSections.map((section, index) => (
                    <SortableSectionItem
                      key={section.name}
                      section={section}
                      index={index}
                    />
                  ))}
                </List>
              </SortableContext>
            </DndContext>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No sections available to reorder
              </Typography>
            </Box>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={handleClose} sx={{ color: '#666' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={orderedSections.length === 0}
          sx={{
            backgroundColor: '#633394',
            '&:hover': { backgroundColor: '#7c52a5' }
          }}
        >
          Save Order
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SectionOrderDialog; 