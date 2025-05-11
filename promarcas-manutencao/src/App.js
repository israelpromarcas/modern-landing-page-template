import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import SuperUserRoute from './components/SuperUserRoute';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CompanyRegistration from './pages/CompanyRegistration';
import Setup from './pages/Setup';
import Users from './pages/Users';
import Empresas from './pages/Empresas';
import CentroCusto from './pages/CentroCusto';
import MecanicoOperador from './pages/MecanicoOperador';
import Veiculos from './pages/Veiculos';
import Produtos from './pages/Produtos';
import Checklist from './pages/Checklist';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
    },
    secondary: {
      main: '#FFD700',
      light: '#FFE44D',
      dark: '#CCB100',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
    divider: '#DFE6E9',
    action: {
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 0, 0, 0.08)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
        },
        contained: {
          backgroundColor: '#000000',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Navigation />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 4,
                bgcolor: 'background.default',
                ml: '280px', // Match drawer width
              }}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register-company" element={<CompanyRegistration />} />
                {process.env.NODE_ENV === 'development' && (
                  <Route path="/setup" element={<Setup />} />
                )}
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/empresas" element={<SuperUserRoute><Empresas /></SuperUserRoute>} />
                <Route path="/centrocusto" element={<PrivateRoute><CentroCusto /></PrivateRoute>} />
                <Route path="/mecanico" element={<PrivateRoute><MecanicoOperador /></PrivateRoute>} />
                <Route path="/veiculos" element={<PrivateRoute><Veiculos /></PrivateRoute>} />
                <Route path="/produtos" element={<PrivateRoute><Produtos /></PrivateRoute>} />
                <Route path="/checklist" element={<PrivateRoute><Checklist /></PrivateRoute>} />
                <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Box>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
