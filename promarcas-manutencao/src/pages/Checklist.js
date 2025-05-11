import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';

const defaultItems = [
  { name: 'Óleo do Motor', type: 'maintenance' },
  { name: 'Fluido de Transmissão', type: 'maintenance' },
  { name: 'Engraxamento dos Cubos', type: 'maintenance' },
];

const Checklist = () => {
  const [checklists, setChecklists] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [error, setError] = useState('');
  const [costCenters, setCostCenters] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [mechanicObservations, setMechanicObservations] = useState('');
  const { user, companyId } = useAuth();

  // Fetch all required data on component mount
  useEffect(() => {
    fetchVehicles();
    fetchChecklists();
    fetchCostCenters();
    fetchMechanics();
    fetchProducts();
  }, []);

  const fetchCostCenters = async () => {
    try {
      const costCentersRef = collection(db, 'CentroCusto');
      const q = query(costCentersRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      setCostCenters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching cost centers:', error);
      setError('Erro ao carregar centros de custo');
    }
  };

  const fetchMechanics = async () => {
    try {
      const mechanicsRef = collection(db, 'MecanicoOperador');
      const q = query(mechanicsRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      setMechanics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching mechanics:', error);
      setError('Erro ao carregar mecânicos');
    }
  };

  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'Produtos');
      const q = query(productsRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Erro ao carregar produtos');
    }
  };

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

  const fetchChecklists = async () => {
    try {
      const checklistsRef = collection(db, 'Checklist');
      const q = query(checklistsRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      setChecklists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching checklists:', error);
      setError('Erro ao carregar checklists');
    }
  };

  const handleOpenDialog = (checklist = null) => {
    if (checklist) {
      setEditingChecklist(checklist);
      setSelectedVehicle(checklist.vehicleId);
      setSelectedCostCenter(checklist.costCenterId || '');
      setSelectedMechanic(checklist.mechanicId || '');
      setSelectedProducts(checklist.products || []);
      setMechanicObservations(checklist.mechanicObservations || '');
      setMaintenanceItems(checklist.items || defaultItems.map(item => ({
        ...item,
        status: 'pending',
        km: '',
        observation: ''
      })));
    } else {
      setEditingChecklist(null);
      setSelectedVehicle('');
      setSelectedCostCenter('');
      setSelectedMechanic('');
      setSelectedProducts([]);
      setMechanicObservations('');
      setMaintenanceItems(defaultItems.map(item => ({
        ...item,
        status: 'pending',
        km: '',
        observation: ''
      })));
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingChecklist(null);
    setSelectedVehicle('');
    setSelectedCostCenter('');
    setSelectedMechanic('');
    setSelectedProducts([]);
    setMechanicObservations('');
    setMaintenanceItems([]);
    setNewItemName('');
    setError('');
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    
    setMaintenanceItems([
      ...maintenanceItems,
      {
        name: newItemName,
        type: 'maintenance',
        status: 'pending',
        km: '',
        observation: ''
      }
    ]);
    setNewItemName('');
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...maintenanceItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setMaintenanceItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    setMaintenanceItems(maintenanceItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedVehicle) {
      setError('Selecione um veículo');
      return;
    }

    if (!selectedCostCenter) {
      setError('Selecione um centro de custo');
      return;
    }

    if (!selectedMechanic) {
      setError('Selecione um mecânico');
      return;
    }

    try {
      const checklistData = {
        vehicleId: selectedVehicle,
        costCenterId: selectedCostCenter,
        mechanicId: selectedMechanic,
        products: selectedProducts,
        mechanicObservations,
        companyId,
        items: maintenanceItems,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      if (editingChecklist) {
        await updateDoc(doc(db, 'Checklist', editingChecklist.id), checklistData);
      } else {
        await addDoc(collection(db, 'Checklist'), checklistData);
      }

      fetchChecklists();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving checklist:', error);
      setError('Erro ao salvar checklist');
    }
  };

  const handleComplete = async (checklistId) => {
    try {
      await updateDoc(doc(db, 'Checklist', checklistId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: user.uid
      });
      fetchChecklists();
    } catch (error) {
      console.error('Error completing checklist:', error);
      setError('Erro ao concluir checklist');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Checklist</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Checklist
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {checklists.map((checklist) => {
          const vehicle = vehicles.find(v => v.id === checklist.vehicleId);
          return (
            <Grid item xs={12} md={6} lg={4} key={checklist.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        {vehicle?.placa || 'Veículo não encontrado'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle?.modelo}
                      </Typography>
                    </Box>
                    <Chip
                      label={checklist.status === 'completed' ? 'Concluído' : 'Pendente'}
                      color={getStatusColor(checklist.status)}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    {/* Cost Center */}
                    {checklist.costCenterId && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Centro de Custo:</strong>{' '}
                        {costCenters.find(c => c.id === checklist.costCenterId)?.nome || 'Não encontrado'}
                      </Typography>
                    )}

                    {/* Mechanic */}
                    {checklist.mechanicId && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Mecânico:</strong>{' '}
                        {mechanics.find(m => m.id === checklist.mechanicId)?.nome || 'Não encontrado'}
                      </Typography>
                    )}

                    {/* Products */}
                    {checklist.products && checklist.products.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          <strong>Produtos utilizados:</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {checklist.products.map(productId => {
                            const product = products.find(p => p.id === productId);
                            return (
                              <Chip
                                key={productId}
                                label={product ? product.nome : 'Produto não encontrado'}
                                size="small"
                                variant="outlined"
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    )}

                    {/* Maintenance Items */}
                    <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                      <strong>Itens de manutenção:</strong>
                    </Typography>
                    {checklist.items?.map((item, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          • {item.name}: {item.status === 'changed' ? 'Trocado' : 'Verificado'}
                          {item.km && ` - ${item.km} km`}
                        </Typography>
                      </Box>
                    ))}

                    {/* Mechanic Observations */}
                    {checklist.mechanicObservations && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Observações:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {checklist.mechanicObservations}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {checklist.status !== 'completed' && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(checklist)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleComplete(checklist.id)}
                          color="success"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingChecklist ? 'Editar Checklist' : 'Novo Checklist'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Selection Fields */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Veículo</InputLabel>
                <Select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  label="Veículo"
                >
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.placa} - {vehicle.modelo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Centro de Custo</InputLabel>
                <Select
                  value={selectedCostCenter}
                  onChange={(e) => setSelectedCostCenter(e.target.value)}
                  label="Centro de Custo"
                >
                  {costCenters.map((center) => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Mecânico</InputLabel>
                <Select
                  value={selectedMechanic}
                  onChange={(e) => setSelectedMechanic(e.target.value)}
                  label="Mecânico"
                >
                  {mechanics.map((mechanic) => (
                    <MenuItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Produtos</InputLabel>
                <Select
                  multiple
                  value={selectedProducts}
                  onChange={(e) => setSelectedProducts(e.target.value)}
                  label="Produtos"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((productId) => {
                        const product = products.find(p => p.id === productId);
                        return (
                          <Chip 
                            key={productId} 
                            label={product ? product.nome : productId} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.nome} ({product.quantidade} {product.unidade})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Maintenance Items */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Itens de Manutenção
              </Typography>
              
              {maintenanceItems.map((item, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      {item.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={item.status}
                          onChange={(e) => handleItemChange(index, 'status', e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="pending">Pendente</MenuItem>
                          <MenuItem value="checked">Verificado</MenuItem>
                          <MenuItem value="changed">Trocado</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Quilometragem"
                        value={item.km}
                        onChange={(e) => handleItemChange(index, 'km', e.target.value)}
                        placeholder="KM"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Observação"
                        value={item.observation}
                        onChange={(e) => handleItemChange(index, 'observation', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Novo Item"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nome do novo item"
                />
                <Button
                  variant="outlined"
                  onClick={handleAddItem}
                  startIcon={<AddIcon />}
                >
                  Adicionar
                </Button>
              </Box>
            </Box>

            {/* Mechanic Observations */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Observações do Mecânico
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={mechanicObservations}
                onChange={(e) => setMechanicObservations(e.target.value)}
                placeholder="Digite aqui as observações sobre o serviço realizado..."
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Checklist;
