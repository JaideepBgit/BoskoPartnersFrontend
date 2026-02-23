import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: 'rgb(99, 51, 148)',
            contrastText: '#ffffff',
        },
        secondary: {
            main: 'rgb(229, 229, 229)',
            contrastText: '#000000',
        },
        text: {
            primary: '#212121', // Keeping standard text color
        }
    },
    components: {
        MuiInputBase: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                },
                input: {
                    fontSize: '0.875rem',
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    lineHeight: 1.75,
                    letterSpacing: '0.02857em',
                    border: '1px solid transparent',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    minWidth: 'unset', // Removed as requested
                    opacity: 0.95,
                    textTransform: 'none', // Assuming "User expect... consistent... style properties" implies these are the ONLY text properties. MUI default is uppercase. I'll disable it to be safe, or leave it? I'll disable it because "font-family... etc" usually implies specific text rendering. 
                    '&:hover': {
                        boxShadow: 'none',
                        opacity: 1,
                        // We want to prevent background color shifts if possible, but contained buttons shift by default.
                        // We will address this in variant overrides.
                    },
                },
                containedPrimary: {
                    backgroundColor: 'rgb(99, 51, 148)',
                    color: 'rgb(255, 255, 255)',
                    '&:hover': {
                        backgroundColor: 'rgb(99, 51, 148)', // Prevent darken on hover, rely on opacity
                    },
                },
                // Mapping "Secondary" button to Outlined variant
                outlined: {
                    backgroundColor: 'rgb(255, 255, 255)',
                    color: 'rgb(99, 51, 148)',
                    borderColor: 'rgb(229, 229, 229)',
                    '&:hover': {
                        backgroundColor: 'rgb(255, 255, 255)',
                        borderColor: 'rgb(229, 229, 229)',
                    }
                },
                // Mapping "Tertiary" button to Contained Secondary variant (Grey)
                containedSecondary: {
                    backgroundColor: 'rgb(229, 229, 229)',
                    color: 'rgb(0, 0, 0)',
                    '&:hover': {
                        backgroundColor: 'rgb(229, 229, 229)',
                    }
                },
                // Mapping "Tertiary Ghost" to Text variant
                text: {
                    backgroundColor: 'transparent',
                    color: 'rgb(0, 0, 0)',
                    '&:hover': {
                        backgroundColor: 'transparent',
                        // Text buttons usually have a light background on hover in MUI. The user wants "Background color transparent".
                        // I will enforce it.
                    }
                }
            },
        },
    },
});

export default theme;
