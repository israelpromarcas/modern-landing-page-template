import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { user, loading, companyId } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!companyId) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6">
          Você ainda não está associado a uma empresa
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.href = '/register-company'}
        >
          Registrar Empresa
        </Button>
      </Box>
    );
  }

  return children;
};

export default PrivateRoute;
