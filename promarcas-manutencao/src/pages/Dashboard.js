import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  LinearProgress,
  CardActionArea,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import BuildIcon from '@mui/icons-material/Build';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EngineeringIcon from '@mui/icons-material/Engineering';
import InventoryIcon from '@mui/icons-material/Inventory';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    inMaintenanceVehicles: 0,
    totalMechanics: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingChecklists: 0,
    completedChecklists: 0,
  });
  const [recentChecklists, setRecentChecklists] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { companyId, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const fetchMaintenanceData = useCallback(async () => {
    if (!companyId) {
      console.log('No companyId available for maintenance data fetch');
      return;
    }

    try {
      console.log('Fetching maintenance data for company:', companyId);
      const checklistsRef = collection(db, 'Checklist');
      const checklistsQuery = query(
        checklistsRef,
        where('companyId', '==', companyId)
      );
      const checklistsSnapshot = await getDocs(checklistsQuery);
      console.log('Fetched checklists count:', checklistsSnapshot.docs.length);
      
      const checklists = checklistsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Group by cost center and count maintenances
      const maintenanceByCenter = checklists.reduce((acc, checklist) => {
        try {
          const center = checklist.centroCusto || 'Não especificado';
          const date = checklist.createdAt 
            ? new Date(checklist.createdAt).toLocaleDateString('pt-BR')
            : 'Data não especificada';
          
          if (!acc[date]) {
            acc[date] = {};
          }
          
          if (!acc[date][center]) {
            acc[date][center] = 0;
          }
          
          acc[date][center]++;
        } catch (error) {
          console.error('Error processing checklist for maintenance data:', error);
        }
        return acc;
      }, {});

      // Transform data for the chart
      const chartData = Object.entries(maintenanceByCenter).map(([date, centers]) => ({
        date,
        ...centers
      }));

      setMaintenanceData(chartData);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      setError(prev => prev ? `${prev}\n` : '' + 'Erro ao carregar dados de manutenção');
    }
  }, [companyId]);

  const fetchDashboardData = useCallback(async () => {
    if (!companyId) {
      console.log('No companyId available for dashboard data fetch');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('Fetching dashboard data for company:', companyId);
      // Fetch vehicles data
      try {
        console.log('Fetching vehicles data...');
        const vehiclesRef = collection(db, 'Veiculos');
        const vehiclesQuery = query(vehiclesRef, where('companyId', '==', companyId));
        const vehiclesSnapshot = await getDocs(vehiclesQuery);
        const vehicles = vehiclesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        console.log(`Found ${vehicles.length} vehicles`);

        // Update vehicle stats
        const activeVehicles = vehicles.filter(v => v.status === 'active').length;
        const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
        setStats(prev => ({
          ...prev,
          totalVehicles: vehicles.length,
          activeVehicles,
          inMaintenanceVehicles: maintenanceVehicles
        }));
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setError(prev => prev ? `${prev}\n` : '' + 'Erro ao carregar dados dos veículos');
      }

      // Fetch mechanics data
      try {
        console.log('Fetching mechanics data...');
        const mechanicsRef = collection(db, 'MecanicoOperador');
        const mechanicsQuery = query(mechanicsRef, where('companyId', '==', companyId));
        const mechanicsSnapshot = await getDocs(mechanicsQuery);
        const mechanics = mechanicsSnapshot.docs.length;
        console.log(`Found ${mechanics} mechanics`);

        setStats(prev => ({
          ...prev,
          totalMechanics: mechanics
        }));
      } catch (error) {
        console.error('Error fetching mechanics:', error);
        setError(prev => prev ? `${prev}\n` : '' + 'Erro ao carregar dados dos mecânicos');
      }

      // Fetch products data
      try {
        console.log('Fetching products data...');
        const productsRef = collection(db, 'Produtos');
        const productsQuery = query(productsRef, where('companyId', '==', companyId));
        const productsSnapshot = await getDocs(productsQuery);
        const products = productsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        const lowStock = products.filter(product => 
          product.quantidade <= product.quantidadeMinima
        );
        console.log(`Found ${products.length} products, ${lowStock.length} low stock`);

        setStats(prev => ({
          ...prev,
          totalProducts: products.length,
          lowStockProducts: lowStock.length
        }));
        setLowStockItems(lowStock);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(prev => prev ? `${prev}\n` : '' + 'Erro ao carregar dados dos produtos');
      }

      // Fetch checklists data
      try {
        console.log('Fetching checklists data...');
        const checklistsRef = collection(db, 'Checklist');
        const checklistsQuery = query(checklistsRef, where('companyId', '==', companyId));
        const checklistsSnapshot = await getDocs(checklistsQuery);
        const checklists = checklistsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));

      // Recent checklists - sort in memory instead of using orderBy
      const recentChecklistsQuery = query(
        checklistsRef,
        where('companyId', '==', companyId)
      );
        const recentChecklistsSnapshot = await getDocs(recentChecklistsQuery);
        let recentChecklistsData = await Promise.all(
          recentChecklistsSnapshot.docs.map(async (doc) => {
            const checklist = { id: doc.id, ...doc.data() };
            try {
              if (checklist.vehicleId) {
                const vehicleDoc = await getDoc(doc(db, 'Veiculos', checklist.vehicleId));
                if (vehicleDoc.exists()) {
                  checklist.vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };
                }
              }
            } catch (error) {
              console.error('Error fetching vehicle for checklist:', error);
            }
            return checklist;
          })
        );

        // Sort in memory and take the 5 most recent
        recentChecklistsData = recentChecklistsData
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
          })
          .slice(0, 5);

        const pendingCount = checklists.filter(c => c.status === 'pending').length;
        const completedCount = checklists.filter(c => c.status === 'completed').length;
        console.log(`Found ${checklists.length} checklists, ${pendingCount} pending, ${completedCount} completed`);

        // Update stats and recent checklists
        setStats(prev => ({
          ...prev,
          pendingChecklists: pendingCount,
          completedChecklists: completedCount
        }));
        setRecentChecklists(recentChecklistsData);
      } catch (error) {
        console.error('Error fetching checklists:', error);
        setError(prev => prev ? `${prev}\n` : '' + 'Erro ao carregar dados dos checklists');
      }

    } catch (error) {
      console.error('Error in dashboard data fetch:', error);
      setError('Erro ao carregar dados do dashboard. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!authLoading && companyId) {
      fetchDashboardData();
      fetchMaintenanceData();
    }
  }, [authLoading, companyId, fetchDashboardData, fetchMaintenanceData]);

  // Rest of the component code remains the same...
  const StatCard = ({ icon, title, value, subtitle, color = 'primary', link }) => (
    <Card sx={{ 
      '&:hover': { 
        boxShadow: 6,
        transform: 'scale(1.02)',
        transition: 'all 0.2s ease-in-out'
      }
    }}>
      <CardActionArea onClick={() => navigate(link)}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="h4" color={`${color}.main`} gutterBottom>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );

  // Custom Speedometer Component using Recharts
  const SpeedometerChart = ({ value, maxValue }) => {
    const data = [
      { value: value },
      { value: maxValue - value }
    ];
    const COLORS = ['#0088FE', '#EEEEEE'];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <text
            x="50%"
            y="100%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={20}
            fill="#000"
          >
            {value}
          </text>
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', p: 3, bgcolor: 'background.default' }}>
      {(loading || authLoading) && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !authLoading && !error && companyId && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>

          {/* Top half */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* Left side - Statistics Cards */}
            <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <StatCard
                icon={<DirectionsCarIcon color="primary" />}
                title="Veículos"
                value={stats.totalVehicles}
                subtitle={`${stats.activeVehicles} ativos • ${stats.inMaintenanceVehicles} em manutenção`}
                link="/veiculos"
              />
              <StatCard
                icon={<EngineeringIcon color="primary" />}
                title="Mecânicos"
                value={stats.totalMechanics}
                link="/mecanico"
              />
              <StatCard
                icon={<InventoryIcon color="primary" />}
                title="Produtos"
                value={stats.totalProducts}
                subtitle={`${stats.lowStockProducts} com estoque baixo`}
                color={stats.lowStockProducts > 0 ? 'warning' : 'primary'}
                link="/produtos"
              />
              <StatCard
                icon={<BuildIcon color="primary" />}
                title="Checklists"
                value={stats.pendingChecklists}
                subtitle={`${stats.completedChecklists} concluídos`}
                color={stats.pendingChecklists > 0 ? 'warning' : 'success'}
                link="/checklist"
              />
            </Box>

            {/* Right side - Lists */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card>
                <CardActionArea onClick={() => navigate('/checklist')}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Checklists Recentes
                    </Typography>
                    <Box>
                      {recentChecklists.map((checklist) => (
                        <Box
                          key={checklist.id}
                          sx={{
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 0 },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle2">
                                {checklist.vehicle?.placa || 'Veículo não encontrado'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(checklist.createdAt).toLocaleDateString('pt-BR')}
                              </Typography>
                            </Box>
                            <Chip
                              label={checklist.status === 'completed' ? 'Concluído' : 'Pendente'}
                              color={checklist.status === 'completed' ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>

              <Card>
                <CardActionArea onClick={() => navigate('/produtos')}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Produtos com Estoque Baixo
                    </Typography>
                    <Box>
                      {lowStockItems.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 0 },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle2">
                                {item.nome}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Estoque: {item.quantidade} {item.unidade}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="error">
                              Mínimo: {item.quantidadeMinima} {item.unidade}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      {lowStockItems.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Nenhum produto com estoque baixo
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          </Box>

          {/* Bottom half - Charts */}
          <Box sx={{ display: 'flex', gap: 3, height: 400 }}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Manutenções por Centro de Resultado
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={maintenanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {maintenanceData[0] && Object.keys(maintenanceData[0])
                        .filter(key => key !== 'date')
                        .map((center, index) => (
                          <Line
                            key={center}
                            type="monotone"
                            dataKey={center}
                            stroke={`hsl(${index * 45}, 70%, 50%)`}
                            strokeWidth={2}
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  Taxa de Conclusão de Checklists
                </Typography>
                <SpeedometerChart
                  value={stats.completedChecklists}
                  maxValue={stats.completedChecklists + stats.pendingChecklists}
                />
                <Typography variant="body2" color="text.secondary" align="center">
                  {stats.completedChecklists} de {stats.completedChecklists + stats.pendingChecklists} checklists concluídos
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {!loading && !authLoading && !companyId && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Nenhuma empresa associada encontrada. Por favor, verifique suas permissões.
        </Alert>
      )}
    </Box>
  );
};

export default Dashboard;
