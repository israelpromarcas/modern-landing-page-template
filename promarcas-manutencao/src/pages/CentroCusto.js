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

const CentroCusto = () => {
  const [costCenters, setCostCenters] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, companyId, isAdmin } = useAuth();

  const fields = [
    { name: 'nome', label: 'Nome do Centro de Custo', required: true },
    { name: 'codigo', label: 'Código', required: true },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'departamento', label: 'Departamento' },
        { value: 'projeto', label: 'Projeto' },
        { value: 'filial', label: 'Filial' },
        { value: 'outros', label: 'Outros' },
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
      name: 'responsavel', 
      label: 'Responsável',
      required: true,
    },
    { 
      name: 'orcamento', 
      label: 'Orçamento Mensal (R$)',
      type: 'number',
      required: true,
    },
    { 
      name: 'descricao', 
      label: 'Descrição', 
      fullWidth: true,
      multiline: true,
      rows: 3,
    },
  ];

  useEffect(() => {
    fetchCostCenters();
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

  const handleOpenDialog = (costCenter = null) => {
    if (costCenter) {
      setEditingCostCenter(costCenter);
      setFormValues(costCenter);
    } else {
      setEditingCostCenter(null);
      setFormValues({
        tipo: 'departamento',
        status: 'active',
        orcamento: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCostCenter(null);
    setFormValues({});
    setError('');
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setError('Apenas administradores podem editar centros de custo');
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
      // Check for existing cost center with same name or code
      const costCentersRef = collection(db, 'CentroCusto');
      const q = query(
        costCentersRef,
        where('companyId', '==', companyId),
        where('nome', '==', formValues.nome)
      );
      const snapshot = await getDocs(q);
      
      // If editing, filter out the current document from duplicate check
      const duplicates = snapshot.docs.filter(doc => 
        !editingCostCenter || doc.id !== editingCostCenter.id
      );

      if (duplicates.length > 0) {
        setError('Já existe um centro de custo com este nome nesta empresa');
        setLoading(false);
        return;
      }

      // Also check for duplicate code
      const qCode = query(
        costCentersRef,
        where('companyId', '==', companyId),
        where('codigo', '==', formValues.codigo)
      );
      const snapshotCode = await getDocs(qCode);
      
      const duplicateCodes = snapshotCode.docs.filter(doc => 
        !editingCostCenter || doc.id !== editingCostCenter.id
      );

      if (duplicateCodes.length > 0) {
        setError('Já existe um centro de custo com este código nesta empresa');
        setLoading(false);
        return;
      }

      const costCenterData = {
        ...formValues,
        companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      };

      if (editingCostCenter) {
        await updateDoc(doc(db, 'CentroCusto', editingCostCenter.id), costCenterData);
      } else {
        costCenterData.createdAt = new Date().toISOString();
        costCenterData.createdBy = user.uid;
        await addDoc(collection(db, 'CentroCusto'), costCenterData);
      }

      fetchCostCenters();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving cost center:', error);
      setError('Erro ao salvar centro de custo');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (tipo) => {
    const types = {
      departamento: 'Departamento',
      projeto: 'Projeto',
      filial: 'Filial',
      outros: 'Outros',
    };
    return types[tipo] || tipo;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Centros de Custo</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Centro de Custo
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {costCenters.map((costCenter) => (
          <Grid item xs={12} sm={6} md={4} key={costCenter.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {costCenter.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Código: {costCenter.codigo}
                    </Typography>
                  </Box>
                  {isAdmin && (
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(costCenter)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={getTypeLabel(costCenter.tipo)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={costCenter.status === 'active' ? 'Ativo' : 'Inativo'}
                    size="small"
                    color={costCenter.status === 'active' ? 'success' : 'error'}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Responsável: {costCenter.responsavel}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Orçamento Mensal: {formatCurrency(costCenter.orcamento)}
                </Typography>
                
                {costCenter.descricao && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {costCenter.descricao}
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
        title={editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
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

export default CentroCusto;
