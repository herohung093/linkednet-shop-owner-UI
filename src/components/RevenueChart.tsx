// Direct imports for better tree-shaking
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';
import { LineChart } from "@mui/x-charts/LineChart";
import { axiosWithToken } from "../utils/axios";
import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";

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
      <Box sx={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
          <DollarSign size={24} className="text-green-600 mr-2" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#1a237e",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Monthly Revenue Comparison
          </Typography>
        </Box>
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
