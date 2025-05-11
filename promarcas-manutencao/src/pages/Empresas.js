import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EditDialog from '../components/EditDialog';

const Empresas = () => {
  const [companies, setCompanies] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [activatingCompany, setActivatingCompany] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isSuperUser } = useAuth();

  const fields = [
    { name: 'razaoSocial', label: 'Razão Social', required: true },
    { name: 'cnpj', label: 'CNPJ', required: true },
    { name: 'emailAdmin', label: 'Email do Administrador', type: 'email', required: true },
    { name: 'adminPassword', label: 'Senha do Administrador', type: 'password', required: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'pending', label: 'Pendente' },
        { value: 'active', label: 'Ativa' },
        { value: 'inactive', label: 'Inativa' },
      ],
    },
    { 
      name: 'telefone', 
      label: 'Telefone',
    },
    { 
      name: 'endereco', 
      label: 'Endereço',
      fullWidth: true,
    },
    { 
      name: 'observacoes', 
      label: 'Observações', 
      fullWidth: true,
      multiline: true,
      rows: 3,
    },
  ];

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const companiesRef = collection(db, 'Empresas');
      const snapshot = await getDocs(companiesRef);
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Erro ao carregar empresas');
    }
  };

  const handleOpenDialog = (company = null) => {
    if (!isSuperUser) {
      setError('Acesso restrito a super usuários');
      return;
    }

    if (company) {
      setEditingCompany(company);
      setFormValues(company);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCompany(null);
    setActivatingCompany(null);
    setFormValues({});
    setError('');
  };

  const handleSave = async () => {
    if (!isSuperUser) {
      setError('Acesso restrito a super usuários');
      return;
    }

    // Validate required fields
    const missingFields = fields
      .filter(field => field.required && !formValues[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const companyData = {
        ...formValues,
        updatedAt: new Date().toISOString(),
      };

      // If activating company or updating to active status, create admin user
      if (activatingCompany || formValues.status === 'active') {
        try {
          // Create Firebase auth user
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formValues.emailAdmin, 
            formValues.adminPassword
          );

          // Create user document in Users collection
          const userData = {
            uid: userCredential.user.uid,
            email: formValues.emailAdmin,
            nome: formValues.razaoSocial, // Use company name as initial user name
            role: 'admin',
            status: 'active',
            companyId: activatingCompany ? activatingCompany.id : editingCompany.id,
            cargo: 'Administrador',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await addDoc(collection(db, 'Users'), userData);

        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            console.log('Admin user already exists');
          } else {
            throw authError;
          }
        }
      }

      const companyId = activatingCompany ? activatingCompany.id : editingCompany.id;
      await updateDoc(doc(db, 'Empresas', companyId), companyData);
      
      fetchCompanies();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving company:', error);
      setError('Erro ao salvar empresa: ' + error.message);
    } finally {
      setLoading(false);
      setActivatingCompany(null);
    }
  };

  const handleUpdateStatus = async (companyId, newStatus) => {
    if (!isSuperUser) {
      setError('Acesso restrito a super usuários');
      return;
    }

    const company = companies.find(c => c.id === companyId);
    
    if (newStatus === 'active') {
      // Open edit dialog with password field for activation
      setActivatingCompany(company);
      setFormValues({
        ...company,
        adminPassword: '', // Add empty password field
        status: newStatus
      });
      setOpenDialog(true);
      return;
    }

    try {
      await updateDoc(doc(db, 'Empresas', companyId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      
      fetchCompanies();
    } catch (error) {
      console.error('Error updating company status:', error);
      setError('Erro ao atualizar status da empresa: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'inactive':
        return 'Inativa';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Empresas</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {companies.map((company) => (
          <Grid item xs={12} sm={6} md={4} key={company.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {company.razaoSocial}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      CNPJ: {company.cnpj}
                    </Typography>
                  </Box>
                  {isSuperUser && (
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(company)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={getStatusLabel(company.status)}
                    size="small"
                    color={getStatusColor(company.status)}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Admin: {company.emailAdmin}
                </Typography>
                {company.telefone && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Telefone: {company.telefone}
                  </Typography>
                )}
                {company.endereco && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Endereço: {company.endereco}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cadastro: {formatDate(company.createdAt)}
                </Typography>

                {isSuperUser && company.status !== 'active' && (
                  <Button
                    startIcon={<CheckCircleIcon />}
                    color="success"
                    size="small"
                    onClick={() => handleUpdateStatus(company.id, 'active')}
                    sx={{ mt: 2, mr: 1 }}
                  >
                    Ativar
                  </Button>
                )}
                {isSuperUser && company.status !== 'inactive' && (
                  <Button
                    startIcon={<BlockIcon />}
                    color="error"
                    size="small"
                    onClick={() => handleUpdateStatus(company.id, 'inactive')}
                    sx={{ mt: 2 }}
                  >
                    Inativar
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <EditDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title="Editar Empresa"
        fields={fields}
        values={formValues}
        onChange={setFormValues}
        onSave={handleSave}
        error={error}
        loading={loading}
      />
    </Box>
  );
};

export default Empresas;
