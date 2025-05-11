import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from '@mui/material';
import { collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const steps = ['Dados da Empresa', 'Confirmação'];

const CompanyRegistration = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleNext = () => {
    if (activeStep === 0) {
      if (!razaoSocial.trim() || !cnpj.trim() || !emailAdmin.trim() || !passwordAdmin.trim()) {
        setError('Todos os campos são obrigatórios');
        return;
      }
      setError('');
      setActiveStep(1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Create admin user in Firebase Authentication
      await createUserWithEmailAndPassword(auth, emailAdmin, passwordAdmin);

      // Add company document
      await addDoc(collection(db, 'Empresas'), {
        razaoSocial,
        cnpj,
        emailAdmin,
        status: 'Pendente',
        createdAt: new Date().toISOString(),
      });

      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setError('Erro ao registrar empresa. Tente novamente.');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Logo width="220px" />
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.text.secondary,
              mt: 2
            }}
          >
            Registro de Empresa
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Razão Social"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="CNPJ"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Email do Administrador"
              type="email"
              value={emailAdmin}
              onChange={(e) => setEmailAdmin(e.target.value)}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Senha do Administrador"
              type="password"
              value={passwordAdmin}
              onChange={(e) => setPasswordAdmin(e.target.value)}
              required
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Confirme os dados
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Razão Social: {razaoSocial}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              CNPJ: {cnpj}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Email: {emailAdmin}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            {loading
              ? 'Processando...'
              : activeStep === steps.length - 1
              ? 'Registrar'
              : 'Próximo'}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Já tem uma conta?{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                color: theme.palette.primary.main,
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Faça login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default CompanyRegistration;
