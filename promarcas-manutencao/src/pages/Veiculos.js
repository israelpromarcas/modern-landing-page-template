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

const Veiculos = () => {
  const [vehicles, setVehicles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, companyId, isAdmin } = useAuth();

  const fields = [
    { name: 'placa', label: 'Placa', required: true },
    { name: 'modelo', label: 'Modelo', required: true },
    { name: 'marca', label: 'Marca', required: true },
    { name: 'ano', label: 'Ano', type: 'number', required: true },
    { name: 'km', label: 'Quilometragem Atual', type: 'number', required: true },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Ativo' },
        { value: 'maintenance', label: 'Em Manutenção' },
        { value: 'inactive', label: 'Inativo' },
      ],
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
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const vehiclesRef = collection(db, 'Veiculos');
      const q = query(vehiclesRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Erro ao carregar veículos');
    }
  };

  const handleOpenDialog = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormValues(vehicle);
    } else {
      setEditingVehicle(null);
      setFormValues({
        status: 'active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);
    setFormValues({});
    setError('');
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setError('Apenas administradores podem editar veículos');
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
      const vehicleData = {
        ...formValues,
        companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      };

      if (editingVehicle) {
        await updateDoc(doc(db, 'Veiculos', editingVehicle.id), vehicleData);
      } else {
        vehicleData.createdAt = new Date().toISOString();
        vehicleData.createdBy = user.uid;
        await addDoc(collection(db, 'Veiculos'), vehicleData);
      }

      fetchVehicles();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setError('Erro ao salvar veículo');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'maintenance':
        return 'Em Manutenção';
      case 'inactive':
        return 'Inativo';
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Veículos</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Veículo
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {vehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {vehicle.placa}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={getStatusLabel(vehicle.status)}
                      color={getStatusColor(vehicle.status)}
                      size="small"
                    />
                    {isAdmin && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(vehicle)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {vehicle.marca} {vehicle.modelo} ({vehicle.ano})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quilometragem: {vehicle.km} km
                </Typography>
                {vehicle.observacoes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Obs: {vehicle.observacoes}
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
        title={editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
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

export default Veiculos;
