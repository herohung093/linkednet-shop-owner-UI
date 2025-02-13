import React, { useState } from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import BookingChart from "../components/BookingCharts";
import StaffChart from "../components/StaffChart";
import RevenueChart from "../components/RevenueChart";
import UpComingBooking from "../components/UpComingBooking";
import withAuth from "../components/HOC/withAuth";
import WelcomeDialog from "../components/dialogs/WelcomeDialog";
import TopCustomers from "../components/TopCustomers";

const Dashboard: React.FC = () => {
  const storeConfigUuid = localStorage.getItem("storeUuid");
  const [openWelcomeDialog, setOpenWelcomeDialog] = useState<boolean>(() => {
    if (!storeConfigUuid) {
      return true;
    }
    return false;
  });

  const handleCloseWelcomeDialog = () => {
    setOpenWelcomeDialog(false);
  };

  return (
    <div>
      <Box sx={{ padding: "24px" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <BookingChart />
          </Grid>

          <Grid item xs={12} md={4}>
            <Box>
              <UpComingBooking />
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ height: "100%" }}>
              <TopCustomers />
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

      <WelcomeDialog
        open={openWelcomeDialog}
        onClose={handleCloseWelcomeDialog}
      />
    </div>
  );
};

export default withAuth(Dashboard);
