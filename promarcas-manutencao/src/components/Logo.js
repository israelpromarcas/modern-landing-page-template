import React from 'react';
import { Box, Typography } from '@mui/material';

const Logo = ({ width = '200px' }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Circle with + symbol */}
        <Box
          sx={{
            width: width === '200px' ? '40px' : '50px',
            height: width === '200px' ? '40px' : '50px',
            borderRadius: '50%',
            bgcolor: '#FFD700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
          }}
        >
          <Typography
            sx={{
              color: '#000',
              fontSize: width === '200px' ? '28px' : '34px',
              fontWeight: 'bold',
              lineHeight: 1,
            }}
          >
            +
          </Typography>
        </Box>
        {/* PROMARCAS text */}
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: width === '200px' ? '1.8rem' : '2.2rem',
            color: '#000',
            letterSpacing: '-0.5px',
            lineHeight: 1
          }}
        >
          PROMARCAS
        </Typography>
    </Box>
  );
};

export default Logo;
