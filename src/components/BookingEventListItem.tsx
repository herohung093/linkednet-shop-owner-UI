import React from "react";
import {
  ListItem,
  ListItemButton,
  Paper,
  Typography,
  Avatar,
  Box,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import moment from "moment";
import { getEndTimeForFirstGuest, getFirstGuestServiceStaff, getGuestInfoAsString } from "../utils/ReservationUtils";
import {
  Person as PersonIcon,
  Groups as GroupsIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";

interface BookingEventListItemProps {
  event: {
    event_id: number;
    title: string;
    data: {
      id: number;
      customer: Customer;
      note: string;
      bookingTime: string;
      endTime: string;
      createdTime: string;
      status: string;
      totalEstimatedTime: number;
      totalPrice: number;
      guests: Guest[];
      communication: {
        FIRST_BOOKING_REMINDER: string;
        FINAL_BOOKING_REMINDER: string;
        BOOKING_ACK: string;
      };
    };
  };
  handleEventClick: (event: any) => void;
  getStatusBackgroundColorForAvata: (status: string) => string;
  displayDate?: boolean;
}

const BookingEventListItem: React.FC<BookingEventListItemProps> = ({
  event,
  handleEventClick,
  getStatusBackgroundColorForAvata,
  displayDate,
}) => {
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
        return {
          color: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          label: "Confirmed"
        };
      case "PENDING":
        return {
          color: "#ff9800",
          backgroundColor: "rgba(255, 152, 0, 0.1)",
          label: "Pending"
        };
      case "CANCELLED":
        return {
          color: "#f44336",
          backgroundColor: "rgba(244, 67, 54, 0.1)",
          label: "Cancelled"
        };
      default:
        return {
          color: "#9e9e9e",
          backgroundColor: "rgba(158, 158, 158, 0.1)",
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(event.data.status);

  return (
    <ListItemButton
      onClick={() => handleEventClick(event)}
      sx={{
        width: "100%",
        p: 0.5,
        "&:hover": {
          backgroundColor: "transparent",
          "& .MuiPaper-root": {
            transform: "translateY(-2px)",
            boxShadow: (theme) => theme.shadows[4],
          },
        },
      }}
    >
      <ListItem sx={{ p: 0, width: "100%" }}>
        <Paper
          elevation={2}
          sx={{
            width: "100%",
            p: 1.5,
            borderRadius: 1.5,
            transition: "all 0.2s ease-in-out",
            borderLeft: "4px solid",
            borderColor: statusConfig.color,
          }}
        >
          {/* Header Section */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                sx={{
                  bgcolor: getStatusBackgroundColorForAvata(event.data.status),
                  width: 28,
                  height: 28,
                }}
              >
                {event.data.guests.length === 1 ? (
                  <PersonIcon sx={{ fontSize: 16 }} />
                ) : (
                  <GroupsIcon sx={{ fontSize: 16 }} />
                )}
              </Avatar>
              {displayDate && (
                <Typography variant="caption" color="text.secondary">
                  {moment(event.data.bookingTime.split(" ")[0], "DD/MM/YYYY").format(
                    "ddd, DD MMM YYYY"
                  )}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={statusConfig.label}
                size="small"
                sx={{
                  color: statusConfig.color,
                  backgroundColor: statusConfig.backgroundColor,
                  fontWeight: 500,
                  height: "20px",
                  "& .MuiChip-label": {
                    px: 1,
                    fontSize: "0.75rem",
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                #{event.event_id}
              </Typography>
            </Box>
          </Box>

          {/* Service Details */}
          <Box sx={{ mb: 0.5 }}>
            <Typography variant="body2" fontWeight="medium">
              {getFirstGuestServiceStaff(event.data)}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ScheduleIcon sx={{ fontSize: 14 }} color="action" />
                <Typography variant="caption" color="text.secondary">
                  {event.data.bookingTime.split(" ")[1]} -{" "}
                  {getEndTimeForFirstGuest(event.data).split(" ")[1]}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <MoneyIcon sx={{ fontSize: 14 }} color="action" />
                <Typography variant="caption" color="text.secondary">
                  ${event.data.totalPrice}
                </Typography>
              </Box>
            </Box>
            {/* Show guest services */}
            <Box sx={{ mt: 0.5 }}>
              {event.data.guests.map((guest, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {getGuestInfoAsString(guest)}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Customer Details */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Customer: {event.data.customer.firstName} {event.data.customer.lastName}
            </Typography>
            <Tooltip title="Call Customer">
              <IconButton
                size="large"
                href={`tel:${event.data.customer.phone}`}
                onClick={(e) => e.stopPropagation()}
                sx={{ 
                  color: "text.secondary",
                  padding: 0.5,
                }}
              >
                <PhoneIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      </ListItem>
    </ListItemButton>
  );
};

export default BookingEventListItem;