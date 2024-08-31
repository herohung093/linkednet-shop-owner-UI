import React from 'react';
import { Grid, Paper, Typography, Box, Button, useMediaQuery, useTheme } from '@mui/material';
import BookingChart from '../components/BookingCharts';
import StaffChart from '../components/StaffChart';
import { LineChart } from '@mui/x-charts/LineChart';
import RevenueChart from '../components/RevenueChart';



const Dashboard: React.FC = () => {
  

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('xs'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));

  let chartWidth;
  if (isXs) {
    chartWidth = 300;
  } else if (isSm) {
    chartWidth = 400;
  } else if (isMd) {
    chartWidth = 500;
  } else if (isLg) {
    chartWidth = 600;
  }

  return (
    <Box sx={{ padding: '24px' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <BookingChart />
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ padding: '16px', height: '100%' }}>
            <Typography variant="h6">New bookings</Typography>
            <Box sx={{ marginTop: '16px' }}>
              {['Booking #3201', 'Booking #3210', 'Booking #3248', 'Booking #3202'].map((booking, index) => (
                <Box
                  key={index}
                  sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
                >
                  <Typography>{booking}</Typography>
                  <Button variant="contained" size="small">Open</Button>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ padding: '16px', height: '100%' }}>
            <Typography variant="h6">Most Frequent Customers</Typography>
            {/* Add analytics content here */}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <RevenueChart />
        </Grid>

        <Grid item xs={12} md={4}>
          <StaffChart />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
