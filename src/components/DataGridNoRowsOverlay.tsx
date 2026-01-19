import React from 'react';
// Direct imports for better tree-shaking
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

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