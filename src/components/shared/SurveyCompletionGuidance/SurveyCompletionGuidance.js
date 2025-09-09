import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  IconButton,
  Fade,
  Slide,
  Paper,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Assessment as ReportsIcon,
  ArrowForward as ArrowForwardIcon,
  Celebration as CelebrationIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SurveyCompletionGuidance = ({ 
  open, 
  onClose, 
  surveyTitle = "Survey",
  onNavigateToReports 
}) => {
  const navigate = useNavigate();
  const [showSecondStep, setShowSecondStep] = useState(false);

  useEffect(() => {
    if (open) {
      // Show the second step after a brief delay
      const timer = setTimeout(() => {
        setShowSecondStep(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowSecondStep(false);
    }
  }, [open]);

  const handleViewReports = () => {
    onClose();
    if (onNavigateToReports) {
      onNavigateToReports();
    } else {
      navigate('/reports');
    }
  };

  const handleClose = () => {
    setShowSecondStep(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'visible',
          background: 'linear-gradient(135deg, #633394 0%, #7c52a5 100%)',
          color: 'white',
          position: 'relative'
        }
      }}
    >
      {/* Celebration Icon */}
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4caf50',
          borderRadius: '50%',
          p: 2,
          boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)'
        }}
      >
        <CelebrationIcon sx={{ fontSize: 40, color: 'white' }} />
      </Box>

      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'white',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ pt: 6, pb: 3, textAlign: 'center' }}>
        {/* Step 1: Completion Confirmation */}
        <Fade in={open} timeout={800}>
          <Box>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 60, 
                color: '#4caf50', 
                mb: 2,
                filter: 'drop-shadow(0 2px 8px rgba(76, 175, 80, 0.3))'
              }} 
            />
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              Survey Completed!
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
              Thank you for completing "{surveyTitle}"
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mb: 3 }}>
              Your responses have been successfully submitted and saved.
            </Typography>
          </Box>
        </Fade>

        {/* Step 2: Reports Guidance */}
        <Slide direction="up" in={showSecondStep} timeout={600}>
          <Paper
            sx={{
              mt: 3,
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <ReportsIcon sx={{ fontSize: 32, mr: 1, color: '#ffd54f' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                What's Next?
              </Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              View your survey results and analytics in the Reports section
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Chip
                icon={<ReportsIcon />}
                label="Click on Reports Tab"
                sx={{
                  backgroundColor: '#ffd54f',
                  color: '#333',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  px: 2,
                  py: 1,
                  '& .MuiChip-icon': {
                    color: '#333'
                  },
                  animation: 'pulse 2s infinite'
                }}
              />
              <ArrowForwardIcon sx={{ mx: 1, opacity: 0.7 }} />
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                in the navigation menu
              </Typography>
            </Box>
          </Paper>
        </Slide>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center', gap: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Close
        </Button>
        <Button
          onClick={handleViewReports}
          variant="contained"
          startIcon={<ReportsIcon />}
          sx={{
            backgroundColor: '#ffd54f',
            color: '#333',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#ffcc02'
            }
          }}
        >
          View Reports
        </Button>
      </DialogActions>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 213, 79, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(255, 213, 79, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(255, 213, 79, 0);
          }
        }
      `}</style>
    </Dialog>
  );
};

export default SurveyCompletionGuidance;
