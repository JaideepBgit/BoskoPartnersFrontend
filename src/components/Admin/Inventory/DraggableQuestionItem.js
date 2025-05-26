import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const DraggableQuestionItem = ({ 
  question, 
  index, 
  onEdit, 
  onDelete, 
  getQuestionTypeName 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Accordion 
        sx={{ 
          mb: 1, 
          backgroundColor: '#fff',
          border: isDragging ? '2px dashed #633394' : 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(99, 51, 148, 0.2)'
          }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{
            '& .MuiAccordionSummary-content': {
              alignItems: 'center'
            }
          }}
        >
          <Box 
            {...attributes}
            {...listeners}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mr: 2,
              cursor: 'grab',
              '&:active': {
                cursor: 'grabbing'
              }
            }}
          >
            <DragIndicatorIcon sx={{ color: '#633394' }} />
          </Box>
          <Typography sx={{ width: '70%', flexShrink: 0 }}>
            {index + 1}. {question.question_text}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Type: {getQuestionTypeName(question.question_type_id)}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2">
                Required: {question.is_required ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2">
                Order: {question.order}
              </Typography>
              {question.section && (
                <Typography variant="body2">
                  Section: {question.section}
                </Typography>
              )}
              {question.config && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Config: {JSON.stringify(question.config)}
                </Typography>
              )}
            </Box>
            <Box>
              <IconButton color="primary" onClick={() => onEdit(question)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => onDelete(question.id)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default DraggableQuestionItem; 