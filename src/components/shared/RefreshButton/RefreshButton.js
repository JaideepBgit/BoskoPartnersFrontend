import React from 'react';
import { Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Shared refresh button used across pages.
 */
export default function RefreshButton({
  onClick,
  disabled = false,
  label = 'Refresh',
  color = '#633394',
  hoverColor = '#967CB2',
  sx,
  size = 'medium',
}) {
  return (
    <Button
      variant="outlined"
      startIcon={<RefreshIcon />}
      onClick={onClick}
      disabled={disabled}
      size={size}
      sx={{
        color,
        borderColor: color,
        borderRadius: 2,
        textTransform: 'none',
        px: 2.5,
        '&:hover': {
          borderColor: hoverColor,
          backgroundColor: 'rgba(99, 51, 148, 0.04)',
        },
        ...sx,
      }}
    >
      {label}
    </Button>
  );
}

