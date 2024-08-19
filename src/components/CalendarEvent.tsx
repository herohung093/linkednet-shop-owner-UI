import React from 'react';
import { Box, Typography } from '@mui/material';
interface CalendarEventProps {
    reservation: Reservation;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({ reservation }) => {
    const { staff, bookingTime, endTime, status } = reservation;

    const getStatusBackgroundColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'springgreen';
            case 'PENDING':
                return 'darkorange';
            case 'CANCELLED':
                return 'crimson';
            default:
                return 'default';
        }
    };

    const getHoverBackgroundColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'success.dark';
            case 'PENDING':
                return 'warning.dark';
            case 'CANCELLED':
                return 'error.dark';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{
            width: 100,
            height: 100,
            borderRadius: 1,
            bgcolor: getStatusBackgroundColor(status),
            '&:hover': {
                bgcolor: getHoverBackgroundColor(status),
            },
        }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', marginBottom: '1px' }}>
                {staff.nickname}
            </Typography>
            <Typography variant="body2">
                {bookingTime.split(' ')[1]} - {endTime.split(' ')[1]}
            </Typography>
        </Box>

    );
};

export default CalendarEvent;