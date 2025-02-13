import React, { useEffect, useState } from "react";
import { Paper, Typography, Box, useMediaQuery, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { axiosWithToken } from "../utils/axios";
import { CalendarDays } from "lucide-react";

const BookingChart: React.FC = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("xs"));
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  let chartWidth;
  if (isXs) {
    chartWidth = 300;
  } else if (isSm) {
    chartWidth = 400;
  } else if (isMd) {
    chartWidth = 500;
  } else if (isLg) {
    chartWidth = 700;
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosWithToken("/dashboard/bookingCountsLast16Months");
        const formattedData = response.data.map(
          (item: { monthLabel: string; reservationCount: number }) => ({
            name: item.monthLabel,
            bookings: item.reservationCount,
          })
        );
        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box>
      <Paper 
        elevation={3} 
        sx={{ 
          padding: "24px",
          height: "100%",
          borderRadius: "16px",
          background: "linear-gradient(to right bottom, #ffffff, #f8f9fa)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
          <CalendarDays size={24} className="text-blue-600 mr-2" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#1a237e",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Monthly Booking Summary
          </Typography>
        </Box>

        <Box 
          sx={{ 
            width: "100%", 
            height: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {loading ? (
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center",
              gap: 2 
            }}>
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <Typography variant="body2" color="textSecondary">
                Loading chart data...
              </Typography>
            </Box>
          ) : data.length > 0 ? (
            <BarChart
              xAxis={[{
                dataKey: "name",
                label: "Month",
                scaleType: "band",
                tickLabelStyle: {
                  angle: 45,
                  textAnchor: 'start',
                  fontSize: 12
                }
              }]}
              series={[{
                dataKey: "bookings",
                label: "Bookings",
                color: "#3f51b5",
                highlightScope: {
                  highlighted: 'item',
                  faded: 'global'
                },
              }]}
              width={chartWidth}
              height={400}
              dataset={data}
              sx={{
                "& .MuiChartsAxis-line": {
                  stroke: "#9e9e9e"
                },
                "& .MuiChartsAxis-tick": {
                  stroke: "#9e9e9e"
                },
                "& .MuiChartsAxis-tickLabel": {
                  fill: "#616161"
                },
                "& .MuiChartsAxis-label": {
                  fill: "#424242",
                  fontWeight: 500
                }
              }}
            />
          ) : (
            <Typography variant="body1" color="textSecondary">
              No booking data available
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default BookingChart;