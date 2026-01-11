import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: 'hsl(210, 55%, 25%)', // Deep Navy
      contrastText: 'hsl(45, 33%, 97%)',
    },
    secondary: {
      main: 'hsl(168, 60%, 45%)', // Seafoam Teal
      contrastText: '#ffffff',
    },
    background: {
      default: 'hsl(45, 33%, 97%)', // Warm cream
      paper: '#ffffff',
    },
    error: {
      main: 'hsl(12, 75%, 55%)', // Coral
    },
    warning: {
      main: 'hsl(38, 90%, 55%)', // Amber
    },
    success: {
      main: 'hsl(158, 65%, 40%)', // Sea green
    },
    text: {
      primary: 'hsl(210, 50%, 20%)', // Deep navy text
      secondary: 'hsl(210, 25%, 45%)', // Muted text
    },
  },
  typography: {
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 600 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12, // 0.75rem = 12px
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px -2px rgba(23, 42, 69, 0.1)',
        },
      },
    },
  },
});

export default theme;
