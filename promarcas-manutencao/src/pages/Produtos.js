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

const Produtos = () => {
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, companyId, isAdmin } = useAuth();

  const fields = [
    { name: 'nome', label: 'Nome do Produto', required: true },
    { name: 'codigo', label: 'Código', required: true },
    {
      name: 'categoria',
      label: 'Categoria',
      type: 'select',
      required: true,
      options: [
        { value: 'oleo', label: 'Óleo' },
        { value: 'filtro', label: 'Filtro' },
        { value: 'peca', label: 'Peça' },
        { value: 'outros', label: 'Outros' },
      ],
    },
    { 
      name: 'quantidade', 
      label: 'Quantidade em Estoque', 
      type: 'number',
      required: true 
    },
    { 
      name: 'quantidadeMinima', 
      label: 'Quantidade Mínima', 
      type: 'number',
      required: true 
    },
    { 
      name: 'unidade', 
      label: 'Unidade de Medida',
      type: 'select',
      required: true,
      options: [
        { value: 'un', label: 'Unidade' },
        { value: 'l', label: 'Litro' },
        { value: 'kg', label: 'Quilograma' },
        { value: 'pc', label: 'Peça' },
      ],
    },
    { 
      name: 'fornecedor', 
      label: 'Fornecedor',
      required: true,
    },
    { 
      name: 'localizacao', 
      label: 'Localização no Estoque',
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
    fetchProducts();
  }, []);

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

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormValues(product);
    } else {
      setEditingProduct(null);
      setFormValues({
        categoria: 'outros',
        unidade: 'un',
        quantidade: 0,
        quantidadeMinima: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormValues({});
    setError('');
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setError('Apenas administradores podem editar produtos');
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
      const productData = {
        ...formValues,
        companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'Produtos', editingProduct.id), productData);
      } else {
        productData.createdAt = new Date().toISOString();
        productData.createdBy = user.uid;
        await addDoc(collection(db, 'Produtos'), productData);
      }

      fetchProducts();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (categoria) => {
    const categories = {
      oleo: 'Óleo',
      filtro: 'Filtro',
      peca: 'Peça',
      outros: 'Outros',
    };
    return categories[categoria] || categoria;
  };

  const getStockStatus = (quantidade, quantidadeMinima) => {
    if (quantidade <= 0) {
      return { label: 'Sem Estoque', color: 'error' };
    }
    if (quantidade <= quantidadeMinima) {
      return { label: 'Estoque Baixo', color: 'warning' };
    }
    return { label: 'Em Estoque', color: 'success' };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Produtos</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Produto
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {products.map((product) => {
          const stockStatus = getStockStatus(product.quantidade, product.quantidadeMinima);
          return (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {product.nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Código: {product.codigo}
                      </Typography>
                    </Box>
                    {isAdmin && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(product)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={getCategoryLabel(product.categoria)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={stockStatus.label}
                      size="small"
                      color={stockStatus.color}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Quantidade: {product.quantidade} {product.unidade}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Mínimo: {product.quantidadeMinima} {product.unidade}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Fornecedor: {product.fornecedor}
                  </Typography>
                  
                  {product.localizacao && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Localização: {product.localizacao}
                    </Typography>
                  )}
                  
                  {product.observacoes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Obs: {product.observacoes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <EditDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
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

export default Produtos;
