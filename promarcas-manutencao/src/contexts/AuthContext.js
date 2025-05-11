import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Box, CircularProgress } from '@mui/material';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setUser(user);

      if (user) {
        try {
          // Skip company checks for super admin
          if (user.email === 'goes95@gmail.com') {
            setCompanyId(null);
            setCompanyData(null);
            setIsAdmin(true);
            setLoading(false);
            return;
          }

          // For other users, check if they are a company admin
          const adminQuery = query(
            collection(db, 'Empresas'),
            where('emailAdmin', '==', user.email)
          );
          const adminSnapshot = await getDocs(adminQuery);
          
          if (!adminSnapshot.empty) {
            // User is a company admin
            const companyDoc = adminSnapshot.docs[0];
            const companyData = companyDoc.data();
            
            // Check if company is active
            if (companyData.status !== 'active') {
              console.log('Company not active, signing out user');
              await auth.signOut();
              setCompanyId(null);
              setCompanyData(null);
              setIsAdmin(false);
              return;
            }
            
            setCompanyId(companyDoc.id);
            setCompanyData(companyData);
            setIsAdmin(true);
          } else {
            // Check if user is associated with a company
            const userDoc = await getDoc(doc(db, 'Users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setCompanyId(userData.companyId);
              
              // Get company data
              if (userData.companyId) {
                const companyDoc = await getDoc(doc(db, 'Empresas', userData.companyId));
                if (companyDoc.exists()) {
                  setCompanyData(companyDoc.data());
                }
              }
              
              setIsAdmin(userData.role === 'admin');
            }
          }
        } catch (error) {
          console.error('Error fetching user/company data:', error);
        }
      } else {
        setCompanyId(null);
        setCompanyData(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check if user is super user (you might want to store this in a more secure way)
  const isSuperUser = user?.email === 'goes95@gmail.com' || user?.email === 'admin@promarcas.com';

  const value = {
    user,
    loading,
    isSuperUser,
    companyId,
    companyData,
    isAdmin
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
