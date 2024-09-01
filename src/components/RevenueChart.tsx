import { Box, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { axiosWithToken } from "../utils/axios";
import { useEffect, useState } from "react";

const RevenueChart: React.FC = () => {
  const [data, setData] = useState([]);
  const theme = useTheme();
  const isXxs = useMediaQuery("(max-width: 370px)");
  const isXs = useMediaQuery(theme.breakpoints.between("xs", "sm"));
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isLg = useMediaQuery(theme.breakpoints.between("lg", "xl"));
  const isXlg = useMediaQuery(theme.breakpoints.up("xl"));

  let chartWidth;
  if (isXxs) {
    chartWidth = 320;
  } else if (isXs) {
    chartWidth = 360;
  } else if (isSm) {
    chartWidth = 750;
  } else if (isMd) {
    chartWidth = 350;
  } else if (isLg) {
    chartWidth = 400;
  } else if (isXlg) {
    chartWidth = 500;
  }

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  // const generateMockData = () => {
  //     const months = [
  //         'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  //     ];

  //     const data = [];
  //     for (let i = 0; i < months.length; i++) {
  //         data.push({
  //             month: months[i],
  //             [`revenue_${previousYear}`]: Math.floor(Math.random() * 10000) + 1000, // Random revenue between 1000 and 10000
  //             [`revenue_${currentYear}`]: Math.floor(Math.random() * 10000) + 1000, // Random revenue between 1000 and 10000
  //         });
  //     }
  //     return data;
  // };

  // const data = generateMockData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosWithToken.get(
          "/dashboard/mostRecentYearsMonthlyRevenue"
        );
        const [previousYearData, currentYearData] = response.data;

        const transformedData = previousYearData.map(
          (
            prevMonth: { monthName: string; totalRevenue: number },
            index: number
          ) => ({
            monthName: prevMonth.monthName.trim(),
            [`revenue_${new Date().getFullYear() - 1}`]: prevMonth.totalRevenue,
            [`revenue_${new Date().getFullYear()}`]:
              currentYearData[index].totalRevenue,
          })
        );

        setData(transformedData);
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
          Monthly Revenue
        </Typography>
        <LineChart
          xAxis={[
            {
              dataKey: "monthName",
              label: "Month",
              scaleType: "band",
            },
          ]}
          series={[
            {
              dataKey: `revenue_${previousYear}`,
              label: `${previousYear}`,
            },
            {
              dataKey: `revenue_${currentYear}`,
              label: `${currentYear}`,
            },
          ]}
          width={chartWidth}
          height={300}
          dataset={data}
        />
      </Paper>
    </Box>
  );
};

export default RevenueChart;
