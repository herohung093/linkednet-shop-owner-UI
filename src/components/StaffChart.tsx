// Direct imports for better tree-shaking
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';
import { PieChart } from "@mui/x-charts/PieChart";
import { useEffect, useState } from "react";
import { axiosWithToken } from "../utils/axios";
import { Flame, Users } from "lucide-react";

const StaffChart: React.FC = () => {
  const [staffData, setStaffData] = useState([]);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("xs"));
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg"));
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosWithToken.get(
          "/dashboard/totalServeByStaff30Days"
        );
        const formattedData = response.data;
        setStaffData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Box>
      <Paper elevation={3} sx={{ padding: "16px", height: "100%" }}>
      <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          marginBottom: 3,
          flexWrap: "wrap"
        }}>
          <Users size={24} className="text-purple-600 mr-2" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#1a237e",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Staff Performance
            <Box 
              component="span" 
              sx={{ 
                display: "inline-flex",
                alignItems: "center",
                ml: 1,
                color: "#ff6b6b"
              }}
            >
              <Flame size={20} className="ml-1" />
              Last 30 Days
            </Box>
          </Typography>
        </Box>
        <Box
          flexGrow={1}
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "top",
            height: "100%",
          }}
        >
          <PieChart
            margin={{ bottom: 35, left: 15, right: 5 }}
            series={[
              {
                data: staffData.map(
                  (
                    staff: { nickName: string; totalServe: number },
                    index
                  ) => ({
                    id: index,
                    value: staff.totalServe,
                    label: staff.nickName,
                  })
                ),
              },
            ]}
            width={chartWidth}
            height={400}
            slotProps={{
              legend: {
                direction: "row",
                position: { vertical: "bottom", horizontal: "middle" },
                padding: 0,
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default StaffChart;
