import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, List, ListItem, ListItemText, Chip, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SurveysV2Service from '../../../../services/Admin/SurveysV2Service';

const SurveyDetailQuestions = ({ surveyId, survey, onRefresh }) => {
  const navigate = useNavigate();
  const questions = survey?.questions || [];
  const [questionTypes, setQuestionTypes] = useState([]);

  useEffect(() => {
    SurveysV2Service.getQuestionTypes().then(types => {
      if (Array.isArray(types)) setQuestionTypes(types);
    }).catch(() => {});
  }, []);

  const getTypeLabel = (typeId) => {
    const t = questionTypes.find(t => t.id === typeId || t.name === typeId);
    return t?.display_name || t?.label || t?.name || typeId || 'Unknown';
  };

  // Group questions by section
  const sections = {};
  questions.forEach(q => {
    const sec = q.section || 'General';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(q);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Questions ({questions.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/surveys-v2/${surveyId}/edit-questions`)}
          sx={{
            textTransform: 'none',
            backgroundColor: '#633394',
            '&:hover': { backgroundColor: '#967CB2' },
          }}
        >
          Edit Questions
        </Button>
      </Box>

      {questions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" sx={{ color: '#999' }}>No questions yet</Typography>
          <Typography variant="body2" sx={{ color: '#bbb', mt: 1 }}>
            Click "Edit Questions" to add questions to this survey.
          </Typography>
        </Box>
      ) : (
        Object.entries(sections).map(([sectionName, sectionQuestions]) => (
          <Paper key={sectionName} elevation={0} sx={{ mb: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#633394' }}>
              {sectionName}
            </Typography>
            <List dense disablePadding>
              {sectionQuestions.sort((a, b) => (a.order || 0) - (b.order || 0)).map((q, idx) => (
                <ListItem
                  key={q.id}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 0.5,
                    backgroundColor: 'white',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {idx + 1}. {q.question_text}
                        </Typography>
                        {q.is_required && (
                          <Chip label="Required" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                        )}
                      </Box>
                    }
                    secondary={getTypeLabel(q.question_type_id)}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ))
      )}
    </Box>
  );
};

export default SurveyDetailQuestions;
