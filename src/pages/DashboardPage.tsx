import React, { useEffect, useMemo, useState } from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import BookingChart from "../components/BookingCharts";
import StaffChart from "../components/StaffChart";
import RevenueChart from "../components/RevenueChart";
import UpComingBooking from "../components/UpComingBooking";
import withAuth from "../components/HOC/withAuth";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import WelcomeDialog from "../components/dialogs/WelcomeDialog";

const Dashboard: React.FC = () => {
  const [openWelcomeDialog, setOpenWelcomeDialog] = useState<boolean>(false);

  const storeConfigRedux = useSelector((state: RootState) => state.storesList.storesList);

  const handleCloseWelcomeDialog = () => {
    setOpenWelcomeDialog(false);
  };

  useEffect(() => {
    if (storeConfigRedux.length === 0) {
      setOpenWelcomeDialog(true);
    }
  }, [storeConfigRedux]);

  return (
    <div>
      <Box sx={{ padding: "24px" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <BookingChart />
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "16px", height: "100%" }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  marginTop: "5px",
                  textTransform: "uppercase",
                  borderBottom: "2px solid",
                  borderColor: "primary.main",
                }}
              >
                Up Coming Bookings
              </Typography>
              <Box sx={{ marginTop: "1rem" }}>
                <UpComingBooking />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ padding: "16px", height: "100%" }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  marginTop: "5px",
                  textTransform: "uppercase",
                  borderBottom: "2px solid",
                  borderColor: "primary.main",
                }}
              >
                Most Value Customers
              </Typography>
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

      <WelcomeDialog
        open={openWelcomeDialog}
        onClose={handleCloseWelcomeDialog}
      />
    </div>
  );
};

export default withAuth(Dashboard);
