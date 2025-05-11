import React, { useState } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { setupSuperUser } from '../utils/setup-super-user';

const Setup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSetupSuperUser = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await setupSuperUser();
      setSuccess('Super usuário configurado com sucesso! Email: goes95@gmail.com, Senha: 654321');
    } catch (error) {
      console.error('Setup error:', error);
      setError('Erro ao configurar super usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Configuração Inicial
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={handleSetupSuperUser}
        disabled={loading}
      >
        {loading ? 'Configurando...' : 'Configurar Super Usuário'}
      </Button>
    </Box>
  );
};

export default Setup;
