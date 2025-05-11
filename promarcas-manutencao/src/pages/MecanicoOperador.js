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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import EditDialog from '../components/EditDialog';

const MecanicoOperador = () => {
  const [mechanics, setMechanics] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, companyId, isAdmin } = useAuth();

  const fields = [
    { name: 'nome', label: 'Nome Completo', required: true },
    { name: 'cpf', label: 'CPF', required: true },
    { name: 'telefone', label: 'Telefone', required: true },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'mecanico', label: 'Mecânico' },
        { value: 'operador', label: 'Operador' },
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
        { value: 'vacation', label: 'Férias' },
      ],
    },
    { 
      name: 'especialidades', 
      label: 'Especialidades',
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
    fetchMechanics();
  }, []);

  const fetchMechanics = async () => {
    try {
      const mechanicsRef = collection(db, 'MecanicoOperador');
      const q = query(mechanicsRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      setMechanics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching mechanics:', error);
      setError('Erro ao carregar mecânicos/operadores');
    }
  };

  const handleOpenDialog = (mechanic = null) => {
    if (mechanic) {
      setEditingMechanic(mechanic);
      setFormValues(mechanic);
    } else {
      setEditingMechanic(null);
      setFormValues({
        tipo: 'mecanico',
        status: 'active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMechanic(null);
    setFormValues({});
    setError('');
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setError('Apenas administradores podem editar mecânicos/operadores');
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
      const mechanicData = {
        ...formValues,
        companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      };

      if (editingMechanic) {
        await updateDoc(doc(db, 'MecanicoOperador', editingMechanic.id), mechanicData);
      } else {
        mechanicData.createdAt = new Date().toISOString();
        mechanicData.createdBy = user.uid;
        await addDoc(collection(db, 'MecanicoOperador'), mechanicData);
      }

      fetchMechanics();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving mechanic:', error);
      setError('Erro ao salvar mecânico/operador');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'vacation':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'vacation':
        return 'Férias';
      default:
        return status;
    }
  };

  const getTypeLabel = (tipo) => {
    return tipo === 'mecanico' ? 'Mecânico' : 'Operador';
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
        <Typography variant="h4">Mecânicos e Operadores</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Mecânico/Operador
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {mechanics.map((mechanic) => (
          <Grid item xs={12} sm={6} md={4} key={mechanic.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: mechanic.tipo === 'mecanico' ? 'primary.main' : 'secondary.main', mr: 2 }}>
                    {getInitials(mechanic.nome)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      {mechanic.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getTypeLabel(mechanic.tipo)}
                    </Typography>
                  </Box>
                  {isAdmin && (
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(mechanic)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={getStatusLabel(mechanic.status)}
                    color={getStatusColor(mechanic.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  CPF: {mechanic.cpf}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Telefone: {mechanic.telefone}
                </Typography>
                
                {mechanic.especialidades && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Especialidades: {mechanic.especialidades}
                  </Typography>
                )}
                
                {mechanic.observacoes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Obs: {mechanic.observacoes}
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
        title={editingMechanic ? 'Editar Mecânico/Operador' : 'Novo Mecânico/Operador'}
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

export default MecanicoOperador;
