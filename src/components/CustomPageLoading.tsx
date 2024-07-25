import React from 'react';
import { CircularProgress, Box } from '@mui/material';

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
