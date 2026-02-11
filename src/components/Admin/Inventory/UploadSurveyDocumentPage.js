import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import InternalHeader from '../../shared/Headers/InternalHeader';
import CreateQuestionnaireWizard from './CreateQuestionnaireWizard';

function UploadSurveyDocumentPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  return (
    <>
      <InternalHeader
        title="Upload Document"
        leftActions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/inventory')}
          >
            Surveys
          </Button>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#212121' }}>
              Upload a document to generate survey questions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Accepted file types: .doc, .docx, .txt, .pdf
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<UploadFileIcon />}
                sx={{
                  backgroundColor: '#633394',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { backgroundColor: '#967CB2' }
                }}
              >
                Choose File
                <input
                  type="file"
                  hidden
                  accept=".doc,.docx,.txt,.pdf"
                  onChange={(e) => {
                    const next = e.target.files?.[0] || null;
                    setFile(next);
                    // allow selecting the same file again
                    e.target.value = '';
                  }}
                />
              </Button>

              <Button
                component="a"
                href="/survey-document-formatting-guidelines.md"
                download
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{
                  color: '#633394',
                  borderColor: '#633394',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { borderColor: '#7c52a5', backgroundColor: 'rgba(99, 51, 148, 0.04)' }
                }}
              >
                Download formatting guidelines
              </Button>

              <Button
                component="a"
                href="/survey-document-sample.txt"
                download
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{
                  color: '#633394',
                  borderColor: '#633394',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': { borderColor: '#7c52a5', backgroundColor: 'rgba(99, 51, 148, 0.04)' }
                }}
              >
                Download sample file
              </Button>

              {file && (
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  Selected: <strong>{file.name}</strong>
                </Typography>
              )}
            </Box>
          </Paper>

          {file ? (
            <CreateQuestionnaireWizard
              variant="page"
              mode="upload"
              initialFile={file}
              onClose={() => navigate('/inventory')}
              onComplete={() => navigate('/inventory')}
            />
          ) : (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Choose a file to begin.
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>
    </>
  );
}

export default UploadSurveyDocumentPage;

