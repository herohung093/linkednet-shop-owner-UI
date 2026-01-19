import React from 'react';
// Direct imports for better tree-shaking
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const CustomPageLoading: React.FC = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      position="fixed"
      top={0}
      left={0}
      width="100%"
      bgcolor="background.default"
      zIndex={9999}
    >
      <CircularProgress />
    </Box>
  );
};

export default CustomPageLoading;
