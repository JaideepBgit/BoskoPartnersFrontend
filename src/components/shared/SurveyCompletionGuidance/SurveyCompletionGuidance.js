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
  Person as PersonIcon,
  Menu as MenuIcon,
  ArrowForward as ArrowForwardIcon,
  Celebration as CelebrationIcon,
  Logout as LogoutIcon,
  ContactSupport as ContactSupportIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SurveyCompletionGuidance = ({ 
  open, 
  onClose, 
  surveyTitle = "Survey",
  onNavigateToProfile 
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

  const handleViewProfile = () => {
    onClose();
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      navigate('/profile');
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
          background: 'linear-gradient(135deg, #633394 0%, #967CB2 100%)',
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
          backgroundColor: '#633394',
          borderRadius: '50%',
          p: 2,
          boxShadow: '0 4px 20px rgba(99, 51, 148, 0.3)'
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
                color: '#633394', 
                mb: 2,
                filter: 'drop-shadow(0 2px 8px rgba(99, 51, 148, 0.3))'
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

        {/* Step 2: Profile & Logout Guidance */}
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
              <PersonIcon sx={{ fontSize: 32, mr: 1, color: '#967CB2' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                What's Next?
              </Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Visit your Profile page to manage your account or log out
            </Typography>
            
            {/* Reports Contact Information */}
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <ContactSupportIcon sx={{ fontSize: 20, mr: 1, color: '#967CB2' }} />
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  Need Survey Reports?
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8, textAlign: 'center', fontSize: '0.85rem' }}>
                Please contact your administrator to request survey reports and analytics
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              {/* Profile guidance */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Chip
                  icon={<PersonIcon />}
                  label="Go to Profile"
                  sx={{
                    backgroundColor: '#967CB2',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    '& .MuiChip-icon': {
                      color: 'white'
                    },
                    animation: 'pulse 2s infinite'
                  }}
                />
                <ArrowForwardIcon sx={{ mx: 1, opacity: 0.7 }} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  to manage your account
                </Typography>
              </Box>
              
              {/* Logout guidance */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Chip
                  icon={<MenuIcon />}
                  label="Click Menu (☰)"
                  sx={{
                    backgroundColor: '#633394',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    px: 1.5,
                    py: 0.5,
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
                <ArrowForwardIcon sx={{ mx: 1, opacity: 0.7 }} />
                <Chip
                  icon={<LogoutIcon />}
                  label="Logout"
                  sx={{
                    backgroundColor: '#967CB2',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    px: 1.5,
                    py: 0.5,
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              </Box>
              
              <Typography variant="body2" sx={{ opacity: 0.7, textAlign: 'center', fontSize: '0.85rem' }}>
                💡 Tip: Click the hamburger menu (☰) in the top navigation to access logout
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
          onClick={handleViewProfile}
          variant="contained"
          startIcon={<PersonIcon />}
          sx={{
            backgroundColor: '#967CB2',
            color: 'white',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#633394'
            }
          }}
        >
          Go to Profile
        </Button>
      </DialogActions>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(150, 124, 178, 0.7);
          }
          70% {
            transform: scale(1.05);
            box-shadow: 0 0 0 10px rgba(150, 124, 178, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(150, 124, 178, 0);
          }
        }
      `}</style>
    </Dialog>
  );
};

export default SurveyCompletionGuidance;
