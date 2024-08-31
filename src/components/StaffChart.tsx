import { Box, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import { PieChart } from '@mui/x-charts/PieChart';

const StaffChart: React.FC = () => {

    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down('xs'));
    const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const isLg = useMediaQuery(theme.breakpoints.up('lg'));

    const generateStaffData = () => {
        return [
            { name: 'Alice', bookings: 120 },
            { name: 'Bob', bookings: 150 },
            { name: 'Charlie', bookings: 80 },
            { name: 'David', bookings: 100 },
            { name: 'Eve', bookings: 90 },
        ];
    };

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

    const staffData = generateStaffData();

    return (
        <Box>
            <Paper elevation={3} sx={{ padding: '16px', height: '100%' }}>
                <Typography variant="h6">Staff On Fire &#128293; </Typography>
                <Box flexGrow={1} sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'top',
                    height: '100%',
                }}>
                    <PieChart
                        series={[
                            {
                                data: staffData.map(staff => ({ id: staff.name, value: staff.bookings, label: staff.name })),
                            },
                        ]}
                        width={chartWidth}
                        height={300}
                    />
                </Box>
            </Paper>
        </Box>
    );
}

export default StaffChart;