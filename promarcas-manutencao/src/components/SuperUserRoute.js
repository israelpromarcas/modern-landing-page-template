import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const SuperUserRoute = ({ children }) => {
  const { user, loading, isSuperUser } = useAuth();

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

  if (!isSuperUser) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Acesso Restrito
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Esta área é restrita para super usuários.
        </Typography>
      </Box>
    );
  }

  return children;
};

export default SuperUserRoute;
