import { Box, ChakraProvider, Stack, Text } from "@chakra-ui/react";
import React from 'react';

interface CalendarEventProps {
    reservation: Reservation;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({ reservation }) => {
    const { staff, bookingTime, endTime, status, customer } = reservation;

    const getStatusBackgroundColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'springgreen';
            case 'PENDING':
                return 'darkorange';
            case 'CANCELLED':
                return 'crimson';
            default:
                return 'gray';
        }
    };

    return (
        <ChakraProvider>
            <Box bg={getStatusBackgroundColor(status)} p={1} height="100%" color="black">
                <Stack spacing={1} flexDirection="column" alignItems="flex-start">
                    <Text fontSize="xs" as='samp'>{staff.firstName}</Text>
                    <Text fontSize="xs" as='samp'>{bookingTime.split(' ')[1]} - {endTime.split(' ')[1]}</Text>
                    <Text fontSize="xs" as='samp'>{customer.firstName}</Text>
                </Stack>
            </Box>
        </ChakraProvider>

    );
};

export default CalendarEvent;