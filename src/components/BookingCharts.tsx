import React, { useEffect, useState } from "react";
import { Paper, Typography, Box, useMediaQuery, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { axiosWithToken } from "../utils/axios";

// const generateMockData = () => {
//     const months = [
//         'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
//     ];

//     const currentYear = new Date().getFullYear();
//     const previousYear = currentYear - 1;

//     const data = [];
//     const startMonthIndex = new Date().getMonth() - 2; // Start from 15 months ago

//     for (let i = 0; i < 15; i++) {
//         const monthIndex = (startMonthIndex + i) % 12;
//         const year = (startMonthIndex + i) < 12 ? previousYear : currentYear;
//         data.push({
//             name: `${months[monthIndex]} ${year}`,
//             bookings: Math.floor(Math.random() * 100) + 1 // Random bookings between 1 and 100
//         });
//     }

//     return data;
// };

// const data = generateMockData();

const BookingChart: React.FC = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("xs"));
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));
  const [data, setData] = useState([]);

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
      try {
        const response = await axiosWithToken(
          "/dashboard/bookingCountsLast16Months"
        );
        const formattedData = response.data.map(
          (item: { monthLabel: string; reservationCount: number }) => ({
            name: item.monthLabel,
            bookings: item.reservationCount,
          })
        );
        setData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Box>
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
          Monthly booking summary
        </Typography>
        <Box sx={{ width: "100%", height: 400 }}>
          <BarChart
            xAxis={[
              {
                dataKey: "name",
                label: "Month",
                scaleType: "band",
              },
            ]}
            series={[
              {
                dataKey: "bookings",
                label: "Bookings",
              },
            ]}
            width={chartWidth}
            height={400}
            dataset={data}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default BookingChart;
