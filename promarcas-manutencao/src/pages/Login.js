import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  useTheme,
} from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Logo from '../components/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // If it's the super admin, proceed directly with login
      if (email === 'goes95@gmail.com') {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
        return;
      }

      // For other users, check company status
      const companiesRef = collection(db, 'Empresas');
      const q = query(companiesRef, where('emailAdmin', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const companyDoc = querySnapshot.docs[0];
        const company = companyDoc.data();
        
        // Check if company is active
        if (company.status !== 'active') {
          setError('Sua empresa ainda não foi ativada. Aguarde a aprovação do administrador.');
          setLoading(false);
          return;
        }

        // Sign in the user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if user document exists, if not create it
        const userDocRef = doc(db, 'Users', userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          // Create user document for company admin
          await setDoc(userDocRef, {
            uid: userCredential.user.uid,
            email: email,
            nome: company.razaoSocial,
            role: 'admin',
            status: 'active',
            companyId: companyDoc.id,
            cargo: 'Administrador',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // Regular user login
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Email ou senha incorretos.');
      } else {
        setError('Falha no login. Verifique suas credenciais.');
      }
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
          maxWidth: 400,
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
            Sistema de Manutenção
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Não tem uma conta?{' '}
            <Link
              component={RouterLink}
              to="/register-company"
              sx={{
                color: theme.palette.primary.main,
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Registre sua empresa
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
