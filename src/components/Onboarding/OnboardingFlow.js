import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Container,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SignUpService from '../../services/Login/SignUpService';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Reusable dropdown ─────────────────────────────────────────────────────────
function DropdownField({ label, value, onChange, options, required }) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      margin="normal"
      required={required}
    >
      <MenuItem value=""><em>Select…</em></MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
      ))}
    </TextField>
  );
}

// ── Step 1 — Basic Information ────────────────────────────────────────────────
function Step1({ data, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other' },
  ];
  const maritalOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];
  const educationOptions = [
    { value: 'no_formal', label: 'No formal education' },
    { value: 'primary', label: 'Primary school' },
    { value: 'secondary', label: 'Secondary school' },
    { value: 'vocational', label: 'Vocational / Trade' },
    { value: 'associates', label: "Associate's degree" },
    { value: 'bachelors', label: "Bachelor's degree" },
    { value: 'masters', label: "Master's degree" },
    { value: 'doctorate', label: 'Doctorate / PhD' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];
  const employmentOptions = [
    { value: 'employed_full', label: 'Employed (full-time)' },
    { value: 'employed_part', label: 'Employed (part-time)' },
    { value: 'self_employed', label: 'Self-employed' },
    { value: 'student', label: 'Student' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'retired', label: 'Retired' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Tell Us About You
      </Typography>

      {/* Date of Birth */}
      <Typography variant="body2" sx={{ mt: 1, mb: 0.5, fontWeight: 500 }}>
        Date of Birth
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          select label="Month" value={data.dob_month || ''} fullWidth
          onChange={(e) => onChange('dob_month', e.target.value)}
        >
          <MenuItem value=""><em>Month</em></MenuItem>
          {months.map((m, i) => (
            <MenuItem key={m} value={String(i + 1).padStart(2, '0')}>{m}</MenuItem>
          ))}
        </TextField>
        <TextField
          select label="Day" value={data.dob_day || ''} fullWidth
          onChange={(e) => onChange('dob_day', e.target.value)}
        >
          <MenuItem value=""><em>Day</em></MenuItem>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <MenuItem key={d} value={String(d).padStart(2, '0')}>{d}</MenuItem>
          ))}
        </TextField>
        <TextField
          select label="Year" value={data.dob_year || ''} fullWidth
          onChange={(e) => onChange('dob_year', e.target.value)}
        >
          <MenuItem value=""><em>Year</em></MenuItem>
          {years.map((y) => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
        </TextField>
      </Box>

      <DropdownField label="Gender" value={data.gender || ''} options={genderOptions}
        onChange={(v) => onChange('gender', v)} />
      <DropdownField label="Marital Status" value={data.marital_status || ''} options={maritalOptions}
        onChange={(v) => onChange('marital_status', v)} />
      <DropdownField label="Highest Education Level" value={data.education_level || ''} options={educationOptions}
        onChange={(v) => onChange('education_level', v)} />
      <DropdownField label="Employment Status" value={data.employment_status || ''} options={employmentOptions}
        onChange={(v) => onChange('employment_status', v)} />

      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>Location</Typography>

      <TextField
        label="Country" value={data.country || ''} fullWidth margin="normal"
        onChange={(e) => onChange('country', e.target.value)}
      />
      <TextField
        label="State / Province" value={data.state_province || ''} fullWidth margin="normal"
        onChange={(e) => onChange('state_province', e.target.value)}
      />
      <TextField
        label="City (optional)" value={data.city || ''} fullWidth margin="normal"
        onChange={(e) => onChange('city', e.target.value)}
      />
    </Box>
  );
}

// ── Step 2 — Organizational Affiliation ──────────────────────────────────────
function Step2({ data, onChange, orgOptions }) {
  const makeAffiliation = (orgId, type) => ({ organization_id: orgId, affiliation_type: type });

  const handlePrimary = (org) => {
    onChange('primary_organization', org);
  };

  const handleSecondary = (orgs) => {
    onChange('secondary_organizations', orgs);
  };

  const handleAssociations = (orgs) => {
    onChange('association_memberships', orgs);
  };

  const handleDenominations = (orgs) => {
    onChange('denominations', orgs);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Your Organizational Connections
      </Typography>

      <Autocomplete
        options={orgOptions}
        getOptionLabel={(o) => o.name || ''}
        value={data.primary_organization || null}
        onChange={(_, val) => handlePrimary(val)}
        renderInput={(params) => (
          <TextField {...params} label="Primary Organization" margin="normal" fullWidth />
        )}
      />

      <Autocomplete
        multiple
        options={orgOptions}
        getOptionLabel={(o) => o.name || ''}
        value={data.secondary_organizations || []}
        onChange={(_, val) => handleSecondary(val)}
        renderInput={(params) => (
          <TextField {...params} label="Secondary Organizations (optional)" margin="normal" fullWidth />
        )}
      />

      <Autocomplete
        multiple
        options={orgOptions}
        getOptionLabel={(o) => o.name || ''}
        value={data.association_memberships || []}
        onChange={(_, val) => handleAssociations(val)}
        renderInput={(params) => (
          <TextField {...params} label="Association Membership (optional)" margin="normal" fullWidth />
        )}
      />

      <Autocomplete
        multiple
        options={orgOptions}
        getOptionLabel={(o) => o.name || ''}
        value={data.denominations || []}
        onChange={(_, val) => handleDenominations(val)}
        renderInput={(params) => (
          <TextField {...params} label="Denomination(s) (optional)" margin="normal" fullWidth />
        )}
      />
    </Box>
  );
}

// ── Step 3 — Institutional Role (conditional) ─────────────────────────────────
function Step3({ data, onChange }) {
  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'staff', label: 'Staff' },
    { value: 'alumni', label: 'Alumni' },
  ];
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'former', label: 'Former' },
  ];
  const gradeOptions = [
    { value: 'freshman', label: 'Freshman / Year 1' },
    { value: 'sophomore', label: 'Sophomore / Year 2' },
    { value: 'junior', label: 'Junior / Year 3' },
    { value: 'senior', label: 'Senior / Year 4' },
    { value: 'graduate', label: 'Graduate student' },
    { value: 'postgraduate', label: 'Post-graduate' },
  ];
  const currentYear = new Date().getFullYear();
  const gradYears = Array.from({ length: 60 }, (_, i) => currentYear - i);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Your Institutional Role
      </Typography>

      <DropdownField label="Organizational Role" value={data.institutional_role || ''} options={roleOptions}
        onChange={(v) => onChange('institutional_role', v)} />

      <DropdownField label="Status" value={data.institutional_status || ''} options={statusOptions}
        onChange={(v) => onChange('institutional_status', v)} />

      {data.institutional_role === 'student' && (
        <>
          <DropdownField label="Grade Level / Year" value={data.grade_level || ''} options={gradeOptions}
            onChange={(v) => onChange('grade_level', v)} />
          <TextField
            label="Program Enrolled" value={data.program_enrolled || ''} fullWidth margin="normal"
            onChange={(e) => onChange('program_enrolled', e.target.value)}
          />
        </>
      )}

      {(data.institutional_role === 'faculty' || data.institutional_role === 'staff') && (
        <TextField
          label="Department" value={data.department || ''} fullWidth margin="normal"
          onChange={(e) => onChange('department', e.target.value)}
        />
      )}

      {data.institutional_role === 'alumni' && (
        <TextField
          select label="Graduation Year" value={data.graduation_year || ''} fullWidth margin="normal"
          onChange={(e) => onChange('graduation_year', e.target.value)}
        >
          <MenuItem value=""><em>Select year…</em></MenuItem>
          {gradYears.map((y) => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
        </TextField>
      )}
    </Box>
  );
}

// ── Step 4 — Church / Faith Profile (conditional) ────────────────────────────
function Step4({ data, onChange }) {
  const memberStatusOptions = [
    { value: 'member', label: 'Member' },
    { value: 'attendee', label: 'Attendee' },
    { value: 'visitor', label: 'Visitor' },
  ];
  const churchRoleOptions = [
    { value: 'member', label: 'Member' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'staff', label: 'Staff' },
    { value: 'leadership', label: 'Leadership' },
  ];
  const yearsOptions = [
    { value: 'less_1', label: 'Less than 1 year' },
    { value: '1_3', label: '1–3 years' },
    { value: '4_6', label: '4–6 years' },
    { value: '7_10', label: '7–10 years' },
    { value: '11_20', label: '11–20 years' },
    { value: '20_plus', label: '20+ years' },
  ];
  const baptizedOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Your Church Involvement
      </Typography>

      <DropdownField label="Church Member Status" value={data.church_member_status || ''} options={memberStatusOptions}
        onChange={(v) => onChange('church_member_status', v)} />

      <DropdownField label="Role in Church" value={data.church_role || ''} options={churchRoleOptions}
        onChange={(v) => onChange('church_role', v)} />

      <DropdownField label="Years Affiliated" value={data.years_affiliated || ''} options={yearsOptions}
        onChange={(v) => onChange('years_affiliated', v)} />

      <DropdownField label="Baptized" value={data.baptized || ''} options={baptizedOptions}
        onChange={(v) => onChange('baptized', v)} />

      <FormControlLabel
        sx={{ mt: 1 }}
        control={
          <Checkbox
            checked={!!data.small_group_participation}
            onChange={(e) => onChange('small_group_participation', e.target.checked)}
            sx={{ color: '#633394', '&.Mui-checked': { color: '#633394' } }}
          />
        }
        label="I participate in a small group"
      />
    </Box>
  );
}

// ── Step 5 — Data Sharing & Permissions ──────────────────────────────────────
function Step5({ data, onChange }) {
  const check = (field) => (e) => onChange(field, e.target.checked);

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Data Sharing Preferences
      </Typography>

      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
        Share Survey Responses
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox checked={!!data.share_survey_responses} onChange={check('share_survey_responses')}
              sx={{ color: '#633394', '&.Mui-checked': { color: '#633394' } }} />
          }
          label="Allow my survey responses to be shared with affiliated organizations"
        />
      </FormGroup>

      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
        Share Profile Data
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox checked={!!data.share_profile_data} onChange={check('share_profile_data')}
              sx={{ color: '#633394', '&.Mui-checked': { color: '#633394' } }} />
          }
          label="Allow my profile information to be used for research and segmentation"
        />
      </FormGroup>

      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
        Communication Preferences
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox checked={!!data.comm_pref_email} onChange={check('comm_pref_email')}
              sx={{ color: '#633394', '&.Mui-checked': { color: '#633394' } }} />
          }
          label="Email surveys"
        />
        <FormControlLabel
          control={
            <Checkbox checked={!!data.comm_pref_sms} onChange={check('comm_pref_sms')}
              sx={{ color: '#633394', '&.Mui-checked': { color: '#633394' } }} />
          }
          label="SMS notifications"
        />
        <FormControlLabel
          control={
            <Checkbox checked={!!data.comm_pref_announcements} onChange={check('comm_pref_announcements')}
              sx={{ color: '#633394', '&.Mui-checked': { color: '#633394' } }} />
          }
          label="Organization announcements"
        />
      </FormGroup>
    </Box>
  );
}

// ── Determine which steps are active ─────────────────────────────────────────
function getActiveSteps(step2Data) {
  const linkedToInstitution = !!(
    step2Data.primary_organization ||
    (step2Data.secondary_organizations && step2Data.secondary_organizations.length > 0)
  );
  const linkedToChurch = !!(
    step2Data.denominations && step2Data.denominations.length > 0
  );

  // Always: 1, 2, 5.  Conditional: 3 (institution), 4 (church)
  const steps = [1, 2];
  if (linkedToInstitution) steps.push(3);
  if (linkedToChurch) steps.push(4);
  steps.push(5);
  return steps;
}

// ── Main OnboardingFlow ───────────────────────────────────────────────────────
const OnboardingFlow = () => {
  const navigate = useNavigate();
  const userId = parseInt(localStorage.getItem('userId') || '0', 10);

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [orgOptions, setOrgOptions] = useState([]);

  // Per-step data stores
  const [step1, setStep1] = useState({});
  const [step2, setStep2] = useState({});
  const [step3, setStep3] = useState({});
  const [step4, setStep4] = useState({});
  const [step5, setStep5] = useState({
    comm_pref_email: true,
    comm_pref_announcements: true,
  });

  const activeSteps = getActiveSteps(step2);
  const totalSteps = activeSteps.length;
  const stepIndex = activeSteps.indexOf(currentStep);
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  // Load organizations for Step 2 autocomplete
  useEffect(() => {
    axios.get(`${BASE_URL}/organizations`)
      .then((res) => {
        const orgs = res.data?.organizations || res.data || [];
        setOrgOptions(orgs);
      })
      .catch(() => setOrgOptions([]));
  }, []);

  // Load existing onboarding profile (resume support)
  useEffect(() => {
    if (!userId) return;
    SignUpService.getOnboardingProfile(userId)
      .then((profile) => {
        if (profile) {
          if (profile.gender !== undefined) setStep1((p) => ({ ...p, ...profileToStep1(profile) }));
          if (profile.onboarding_step) {
            const resumeStep = profile.onboarding_step;
            setCurrentStep(resumeStep > 5 ? 5 : resumeStep);
          }
        }
      })
      .catch(() => {}); // No profile yet — fresh start
  }, [userId]);

  const profileToStep1 = (p) => ({
    gender: p.gender || '',
    marital_status: p.marital_status || '',
    education_level: p.education_level || '',
    employment_status: p.employment_status || '',
    country: p.country || '',
    state_province: p.state_province || '',
    city: p.city || '',
    dob_month: p.date_of_birth ? p.date_of_birth.split('-')[1] : '',
    dob_day: p.date_of_birth ? p.date_of_birth.split('-')[2] : '',
    dob_year: p.date_of_birth ? p.date_of_birth.split('-')[0] : '',
  });

  const handleChange = useCallback((setter) => (field, value) => {
    setter((prev) => ({ ...prev, [field]: value }));
  }, []);

  const buildStep1Payload = () => {
    const dob = step1.dob_year && step1.dob_month && step1.dob_day
      ? `${step1.dob_year}-${step1.dob_month}-${step1.dob_day}`
      : null;
    return {
      date_of_birth: dob,
      gender: step1.gender || null,
      marital_status: step1.marital_status || null,
      education_level: step1.education_level || null,
      employment_status: step1.employment_status || null,
      country: step1.country || null,
      state_province: step1.state_province || null,
      city: step1.city || null,
    };
  };

  const buildStep3Payload = () => ({
    institutional_role: step3.institutional_role || null,
    institutional_status: step3.institutional_status || null,
    grade_level: step3.grade_level || null,
    program_enrolled: step3.program_enrolled || null,
    department: step3.department || null,
    graduation_year: step3.graduation_year || null,
  });

  const buildStep4Payload = () => ({
    church_member_status: step4.church_member_status || null,
    church_role: step4.church_role || null,
    years_affiliated: step4.years_affiliated || null,
    baptized: step4.baptized || null,
    small_group_participation: step4.small_group_participation ? 1 : 0,
  });

  const buildStep5Payload = () => ({
    share_survey_responses: step5.share_survey_responses ? 1 : 0,
    share_profile_data: step5.share_profile_data ? 1 : 0,
    comm_pref_email: step5.comm_pref_email ? 1 : 0,
    comm_pref_sms: step5.comm_pref_sms ? 1 : 0,
    comm_pref_announcements: step5.comm_pref_announcements ? 1 : 0,
  });

  const buildAffiliations = () => {
    const affiliations = [];
    if (step2.primary_organization?.id) {
      affiliations.push({ organization_id: step2.primary_organization.id, affiliation_type: 'primary' });
    }
    (step2.secondary_organizations || []).forEach((o) => {
      if (o?.id) affiliations.push({ organization_id: o.id, affiliation_type: 'secondary' });
    });
    (step2.association_memberships || []).forEach((o) => {
      if (o?.id) affiliations.push({ organization_id: o.id, affiliation_type: 'association' });
    });
    (step2.denominations || []).forEach((o) => {
      if (o?.id) affiliations.push({ organization_id: o.id, affiliation_type: 'denomination' });
    });
    return affiliations;
  };

  const saveCurrentStep = async (nextStep) => {
    setSaving(true);
    setError('');
    try {
      if (currentStep === 1) {
        await SignUpService.saveOnboardingStep(userId, 1, buildStep1Payload());
      } else if (currentStep === 2) {
        await SignUpService.saveOrgAffiliations(userId, buildAffiliations());
        await SignUpService.saveOnboardingStep(userId, 2, {});
      } else if (currentStep === 3) {
        await SignUpService.saveOnboardingStep(userId, 3, buildStep3Payload());
      } else if (currentStep === 4) {
        await SignUpService.saveOnboardingStep(userId, 4, buildStep4Payload());
      } else if (currentStep === 5) {
        // Best-effort save — navigate regardless
        try {
          await SignUpService.saveOnboardingStep(userId, 5, buildStep5Payload());
          await SignUpService.completeOnboarding(userId);
        } catch (_) {
          // ignore save errors on final step
        }
        navigate('/dashboard');
        return;
      }
      setCurrentStep(nextStep);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    const nextIndex = stepIndex + 1;
    // On the last step, pass null — saveCurrentStep handles navigate when currentStep === 5
    const nextStep = nextIndex < activeSteps.length ? activeSteps[nextIndex] : null;
    saveCurrentStep(nextStep);
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex < 0) return;
    setCurrentStep(activeSteps[prevIndex]);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isLastStep = stepIndex === activeSteps.length - 1;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f7' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          bgcolor: '#fff',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <img
          src={process.env.PUBLIC_URL + '/assets/saurara-high-resolution-logo-transparent.png'}
          alt="Saurara Logo"
          style={{ height: 36 }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleLogout}
          sx={{ borderColor: '#633394', color: '#633394', textTransform: 'none' }}
        >
          Log Out
        </Button>
      </Box>

      {/* Content */}
      <Container maxWidth="sm" sx={{ pt: 4, pb: 6 }}>
        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mb: 3,
            height: 6,
            borderRadius: 3,
            bgcolor: '#e0e0e0',
            '& .MuiLinearProgress-bar': { bgcolor: '#633394' },
          }}
        />

        {/* Card */}
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: 3,
            p: { xs: 2.5, sm: 4 },
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {currentStep === 1 && (
            <Step1 data={step1} onChange={handleChange(setStep1)} />
          )}
          {currentStep === 2 && (
            <Step2 data={step2} onChange={handleChange(setStep2)} orgOptions={orgOptions} />
          )}
          {currentStep === 3 && (
            <Step3 data={step3} onChange={handleChange(setStep3)} />
          )}
          {currentStep === 4 && (
            <Step4 data={step4} onChange={handleChange(setStep4)} />
          )}
          {currentStep === 5 && (
            <Step5 data={step5} onChange={handleChange(setStep5)} />
          )}

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
            {stepIndex > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={saving}
                sx={{ borderColor: '#633394', color: '#633394', textTransform: 'none' }}
              >
                Back
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleContinue}
              disabled={saving}
              sx={{
                backgroundColor: '#633394',
                '&:hover': { backgroundColor: '#4e2474' },
                textTransform: 'none',
                minWidth: 110,
              }}
            >
              {saving
                ? <CircularProgress size={20} color="inherit" />
                : isLastStep ? 'Finish' : 'Continue'
              }
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default OnboardingFlow;
