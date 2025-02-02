import React from "react";
import {
  Box,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  Avatar,
} from "@mui/material";
import moment from "moment";
import { getEndTimeForFirstGuest, getFirstGuestServiceStaff } from "../utils/ReservationUtils";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";

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
  return (
    <ListItemButton
      sx={{
        width: "100%",
        textAlign: "left",
        "&:hover": {
          backgroundColor: "rgba(0, 0, 0, 0.08)",
        },
      }}
      onClick={() => handleEventClick(event)}
    >
      <ListItem sx={{ padding: "0px" }}>
        <Paper
          elevation={3}
          sx={{ padding: "10px", borderRadius: "10px", width: "100%" }}
        >
          <ListItemAvatar>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  bgcolor: getStatusBackgroundColorForAvata(event.data.status),
                  width: 20,
                  height: 20,
                }}
              >
                {event.data.guests.length === 1 ? (
                  <PersonIcon fontSize="small" />
                ) : (
                  <GroupsIcon fontSize="small" />
                )}
              </Avatar>
              {displayDate && (
                <Typography variant="body2" sx={{ marginLeft: "8px" }}>
                  {moment(
                    event.data.bookingTime.split(" ")[0],
                    "DD/MM/YYYY"
                  ).format("ddd, DD MMM YYYY")}
                </Typography>
              )}
              <Box sx={{ flexGrow: 1 }} />{" "}
              <Typography variant="body2">#{event.event_id}</Typography>
            </Box>
          </ListItemAvatar>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <ListItemText
              primary={<Typography variant="body1">{getFirstGuestServiceStaff(event.data)}</Typography>}
            />
            <ListItemText
              primary={
                <Typography variant="body2" color="textSecondary" align="right">
                  {event.data.bookingTime.split(" ")[1] +
                    " - " +
                    getEndTimeForFirstGuest(event.data).split(" ")[1] +
                    " ($" +
                    event.data.totalPrice +
                    ")"}
                </Typography>
              }
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <ListItemText
              secondary={
                <Typography variant="body1">
                  Cust: {event.data.customer.firstName}
                </Typography>
              }
            />
            <ListItemText
              secondary={
                <Typography variant="body2" color="textSecondary" align="right">
                  {`${event.data.customer.phone.slice(
                    0,
                    4
                  )} ${event.data.customer.phone.slice(
                    4,
                    7
                  )} ${event.data.customer.phone.slice(7, 10)}`}
                </Typography>
              }
            />
          </Box>
        </Paper>
      </ListItem>
    </ListItemButton>
  );
};

export default BookingEventListItem;
