import { Box, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";


const RevenueChart: React.FC = () => {

    const theme = useTheme();
    const isXxs = useMediaQuery('(max-width: 350px)');
    const isXs = useMediaQuery(theme.breakpoints.between('xs', 'sm'));
    const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const isLg = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
    const isXlg = useMediaQuery(theme.breakpoints.up('xl'));

    let chartWidth;
    if (isXxs) {
        chartWidth = 320;
    } else 
    if (isXs) {
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


    const generateMockData = () => {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];



        const data = [];
        for (let i = 0; i < months.length; i++) {
            data.push({
                month: months[i],
                [`revenue_${previousYear}`]: Math.floor(Math.random() * 10000) + 1000, // Random revenue between 1000 and 10000
                [`revenue_${currentYear}`]: Math.floor(Math.random() * 10000) + 1000, // Random revenue between 1000 and 10000
            });
        }
        return data;
    };

    const data = generateMockData();

    return (
        <Box>
            <Paper elevation={3} sx={{ padding: '16px', height: '100%' }}>
                <Typography variant="h6">Monthly</Typography>
                <LineChart
                    xAxis={[
                        {
                            dataKey: 'month',
                            label: 'Month',
                            scaleType: 'band', // Set scaleType to 'band'
                        },
                    ]}
                    series={[
                        {
                            dataKey: `revenue_${previousYear}`,
                            label: `Revenue ${previousYear}`,
                        },
                        {
                            dataKey: `revenue_${currentYear}`,
                            label: `Revenue ${currentYear}`,
                        },
                    ]}
                    width={chartWidth}
                    height={300}
                    dataset={data}
                />
            </Paper>
        </Box>
    );
}

export default RevenueChart;