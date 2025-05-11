import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Alert,
  Chip,
  Avatar,
} from '@mui/material';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import EditDialog from '../components/EditDialog';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user: currentUser, companyId, isAdmin, companyData } = useAuth();

  const fields = [
    { name: 'nome', label: 'Nome Completo', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    {
      name: 'role',
      label: 'Função',
      type: 'select',
      required: true,
      options: [
        { value: 'admin', label: 'Administrador' },
        { value: 'user', label: 'Usuário' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Ativo' },
        { value: 'inactive', label: 'Inativo' },
      ],
    },
    { 
      name: 'cargo', 
      label: 'Cargo',
      required: true,
    },
    { 
      name: 'departamento', 
      label: 'Departamento',
    },
    { 
      name: 'observacoes', 
      label: 'Observações', 
      fullWidth: true,
      multiline: true,
      rows: 3,
    },
  ];

  // Only show password field for new users
  const newUserFields = [
    ...fields,
    { 
      name: 'password', 
      label: 'Senha', 
      type: 'password',
      required: true,
    },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'Users');
      const q = query(usersRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      const usersData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const userData = { id: doc.id, ...doc.data() };
          return userData;
        })
      );
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Erro ao carregar usuários');
    }
  };

  const handleOpenDialog = (user = null) => {
    if (!isAdmin) {
      setError('Apenas administradores podem gerenciar usuários');
      return;
    }

    if (user) {
      setEditingUser(user);
      setFormValues(user);
    } else {
      setEditingUser(null);
      setFormValues({
        role: 'user',
        status: 'active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormValues({});
    setError('');
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setError('Apenas administradores podem gerenciar usuários');
      return;
    }

    // Validate required fields
    const requiredFields = editingUser ? fields : newUserFields;
    const missingFields = requiredFields
      .filter(field => field.required && !formValues[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const userData = {
        ...formValues,
        companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
      };

      if (editingUser) {
        await updateDoc(doc(db, 'Users', editingUser.id), userData);
      } else {
        // Create new user in Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formValues.email,
          formValues.password
        );

        // Create user document in Firestore
        userData.uid = userCredential.user.uid;
        userData.createdAt = new Date().toISOString();
        userData.createdBy = currentUser.uid;
        await addDoc(collection(db, 'Users'), userData);
      }

      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      setError(
        error.code === 'auth/email-already-in-use'
          ? 'Este email já está em uso'
          : 'Erro ao salvar usuário'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error';
  };

  const getStatusLabel = (status) => {
    return status === 'active' ? 'Ativo' : 'Inativo';
  };

  const getRoleLabel = (role) => {
    return role === 'admin' ? 'Administrador' : 'Usuário';
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Usuários</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Usuário
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: user.role === 'admin' ? 'primary.main' : 'secondary.main', mr: 2 }}>
                    {getInitials(user.nome)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      {user.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  {isAdmin && user.id !== currentUser.uid && (
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(user)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={getRoleLabel(user.role)}
                    size="small"
                    color="primary"
                    variant={user.role === 'admin' ? 'filled' : 'outlined'}
                  />
                  <Chip
                    label={getStatusLabel(user.status)}
                    size="small"
                    color={getStatusColor(user.status)}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cargo: {user.cargo}
                </Typography>
                {user.departamento && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Departamento: {user.departamento}
                  </Typography>
                )}
                {user.observacoes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {user.observacoes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <EditDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        fields={editingUser ? fields : newUserFields}
        values={formValues}
        onChange={setFormValues}
        onSave={handleSave}
        error={error}
        loading={loading}
      />
    </Box>
  );
};

export default Users;
