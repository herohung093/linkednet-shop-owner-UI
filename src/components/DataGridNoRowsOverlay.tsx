import React from 'react';
import { Box, Typography } from '@mui/material';

const DataGridNoRowsOverlay: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="h5" color="textSecondary">
        No results found.
      </Typography>
    </Box>
  );
};

export default DataGridNoRowsOverlay;