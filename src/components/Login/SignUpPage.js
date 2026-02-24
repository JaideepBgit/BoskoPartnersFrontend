import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SignUpService from '../../services/Login/SignUpService';

const logoImage = process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png';

// ── Step 1: Email entry ──────────────────────────────────────────────────────
function EmailStep({ onNext }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const result = await SignUpService.checkEmail(email.trim());
      if (result.exists) {
        // Existing user → go to sign-in with email pre-filled
        onNext('signin', { email: email.trim() });
      } else {
        // New user → go to password creation
        onNext('password', { email: email.trim() });
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleContinue}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <img src={logoImage} alt="Saurara Logo" style={{ maxWidth: '160px', height: 'auto' }} />
      </Box>

      <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#212121' }}>
        Create an Account
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        label="your email address"
        variant="outlined"
        fullWidth
        margin="normal"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoFocus
        disabled={loading}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{
          mt: 2,
          backgroundColor: '#633394',
          '&:hover': { backgroundColor: '#4e2474' },
          py: 1.4,
          fontSize: '1rem',
          textTransform: 'none',
          borderRadius: 2,
        }}
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : 'Continue with Email'}
      </Button>

      <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
        By continuing, you agree to our{' '}
        <Link href="#" underline="hover">Terms of Service</Link>,{' '}
        <Link href="#" underline="hover">Privacy Policy</Link>, and{' '}
        <Link href="#" underline="hover">Cookie Use</Link>.
      </Typography>

      <Typography variant="body2" align="center" sx={{ mt: 3 }}>
        Already have an account?{' '}
        <Link
          component="button"
          type="button"
          underline="hover"
          sx={{ color: '#633394', fontWeight: 500 }}
          onClick={() => onNext('signin', { email })}
        >
          Sign In
        </Link>
      </Typography>
    </Box>
  );
}

// ── Step 2: Password creation (new user) ─────────────────────────────────────
function PasswordStep({ email, onBack, onSuccess }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Please enter a password'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const result = await SignUpService.createAccount({ email, password });
      onSuccess(result);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Account creation failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleCreate}>
      <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#212121' }}>
        Create an Account
      </Typography>
      <Typography variant="body2" align="center" sx={{ mb: 2, color: 'text.secondary' }}>
        {email}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        label="Enter password"
        variant="outlined"
        fullWidth
        margin="normal"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        disabled={loading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label="Confirm password"
        variant="outlined"
        fullWidth
        margin="normal"
        type={showConfirm ? 'text' : 'password'}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={loading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowConfirm((s) => !s)} edge="end">
                {showConfirm ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{
          mt: 2,
          backgroundColor: '#633394',
          '&:hover': { backgroundColor: '#4e2474' },
          py: 1.4,
          fontSize: '1rem',
          textTransform: 'none',
          borderRadius: 2,
        }}
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
      </Button>

      <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
        By continuing, you agree to our{' '}
        <Link href="#" underline="hover">Terms of Service</Link>,{' '}
        <Link href="#" underline="hover">Privacy Policy</Link>, and{' '}
        <Link href="#" underline="hover">Cookie Use</Link>.
      </Typography>

      <Typography variant="body2" align="center" sx={{ mt: 3 }}>
        Already have an account?{' '}
        <Link
          component="button"
          type="button"
          underline="hover"
          sx={{ color: '#633394', fontWeight: 500 }}
          onClick={onBack}
        >
          Sign In
        </Link>
      </Typography>
    </Box>
  );
}

// ── Step 2b: Sign-in (existing user detected) ────────────────────────────────
function SignInStep({ email, onBack }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Please enter your password'); return; }
    setLoading(true);
    try {
      const result = await SignUpService.signIn({ email, password });
      // Store auth identical to Login.js completeLogin
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(result));
      if (result.id) localStorage.setItem('userId', result.id);
      if (result.role) localStorage.setItem('userRole', result.role);
      if (result.organization_id) localStorage.setItem('organizationId', result.organization_id);
      if (result.survey_code) localStorage.setItem('surveyCode', result.survey_code);

      // Check for pending survey join (QR code / share link flow)
      const pendingJoin = localStorage.getItem('pendingSurveyJoin');
      if (pendingJoin) {
        try {
          const { surveyId } = JSON.parse(pendingJoin);
          navigate(`/survey/join/${surveyId}`, { replace: true });
          return;
        } catch (e) {
          localStorage.removeItem('pendingSurveyJoin');
        }
      }

      navigate(result.role === 'user' ? '/user' : '/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSignIn}>
      <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#212121' }}>
        Sign In
      </Typography>
      <Typography variant="body2" align="center" sx={{ mb: 2, color: 'text.secondary' }}>
        {email}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        label="Your email address"
        variant="outlined"
        fullWidth
        margin="normal"
        value={email}
        disabled
      />

      <TextField
        label="Your password"
        variant="outlined"
        fullWidth
        margin="normal"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        disabled={loading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{
          mt: 2,
          backgroundColor: '#633394',
          '&:hover': { backgroundColor: '#4e2474' },
          py: 1.4,
          fontSize: '1rem',
          textTransform: 'none',
          borderRadius: 2,
        }}
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
      </Button>

      <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
        By continuing, you agree to our{' '}
        <Link href="#" underline="hover">Terms of Service</Link>,{' '}
        <Link href="#" underline="hover">Privacy Policy</Link>, and{' '}
        <Link href="#" underline="hover">Cookie Use</Link>.
      </Typography>
    </Box>
  );
}

// ── Root component ───────────────────────────────────────────────────────────
const SignUpPage = () => {
  const navigate = useNavigate();
  // step: 'email' | 'password' | 'signin'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');

  const handleNext = (nextStep, data) => {
    if (data?.email) setEmail(data.email);
    setStep(nextStep);
  };

  const handleAccountCreated = (userData) => {
    // Store auth then redirect
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.id) localStorage.setItem('userId', userData.id);
    if (userData.role) localStorage.setItem('userRole', userData.role);
    if (userData.survey_code) localStorage.setItem('surveyCode', userData.survey_code);

    // Check for pending survey join (QR code / share link flow)
    const pendingJoin = localStorage.getItem('pendingSurveyJoin');
    if (pendingJoin) {
      try {
        const { surveyId } = JSON.parse(pendingJoin);
        navigate(`/survey/join/${surveyId}`, { replace: true });
        return;
      } catch (e) {
        localStorage.removeItem('pendingSurveyJoin');
      }
    }

    navigate('/onboarding');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#f5f5f7',
      }}
    >
      {/* Left panel – illustration placeholder */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#e8e8ef',
        }}
      >
        <Box
          sx={{
            width: 220,
            height: 180,
            bgcolor: '#b0b8c9',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#fff' }}>
            Illustration
          </Typography>
        </Box>
      </Box>

      {/* Right panel – form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: '#fff',
        }}
      >
        <Container maxWidth="xs">
          {step === 'email' && (
            <EmailStep onNext={handleNext} />
          )}
          {step === 'password' && (
            <PasswordStep
              email={email}
              onBack={() => setStep('email')}
              onSuccess={handleAccountCreated}
            />
          )}
          {step === 'signin' && (
            <SignInStep
              email={email}
              onBack={() => setStep('email')}
            />
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default SignUpPage;
