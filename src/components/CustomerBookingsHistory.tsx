import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, CircularProgress, Tooltip } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { axiosWithToken } from "../utils/axios";
import moment from "moment";
import ResponsiveBox from "./ResponsiveBox";
import DataGridNoRowsOverlay from "./DataGridNoRowsOverlay";
import BookingEventDialog from "./BookingEventDialog";
import { getEndTimeForFirstGuest, getGuestInfoAsString } from "../utils/ReservationUtils";

const CustomerBookingsHistory: React.FC = () => {
  const { customerId: urlCustomerId } = useParams<{ customerId: string }>();
  const customerId = urlCustomerId;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20); // Default page size
  const [rowCount, setRowCount] = useState(0); // Total number of rows
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Reservation | null>(null);
  const [isStatusModified, setIsStatusModified] = useState(false);

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "springgreen";
      case "PENDING":
        return "darkorange";
      case "CANCELLED":
        return "crimson";
      default:
        return "inherit";
    }
  };

  const fetchReservations = async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const response = await axiosWithToken.get(
        `/reservation/customer/${customerId}`,
        {
          params: {
            page: page,
            size: pageSize,
            sort: "id,DESC",
          },
        }
      );
      setReservations(response.data.content);
      setRowCount(response.data.totalElements);
    } catch (err) {
      setError("Failed to fetch reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations(page, pageSize);
  }, [customerId]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "Booking Id", width: 90 },
    {
      field: "bookingTime",
      headerName: "Booking Time",
      width: 150,
      sortComparator: (v1, v2) =>
        moment(v1, "DD/MM/YYYY HH:mm").valueOf() -
        moment(v2, "DD/MM/YYYY HH:mm").valueOf(),
    },
    {
      field: "totalEstimatedTime",
      headerName: "Duration",
      width: 80,
      valueFormatter: (params) => `${params} mins`,
      sortComparator: (v1, v2) => Number(v1) - Number(v2),
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: getStatusBackgroundColor(params.value),
            color: "white",
            textAlign: "center",
          }}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: "totalPrice",
      headerName: "Total Price",
      width: 100,
      valueFormatter: (params) => `$${params}`,
      sortComparator: (v1, v2) => Number(v1) - Number(v2),
    },
    {
      field: "guests",
      headerName: "Guests Booking Details", 
      width: 400,
      renderCell: (params) => {
        const guests: Guest[] = params.row.guests;
        const fullText = guests.map(getGuestInfoAsString).join("\n");
        return (
          <Tooltip title={<pre>{fullText}</pre>} arrow>
            <span className="cell-truncate">{fullText}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "note",
      headerName: "Booking Note",
      width: 300,
    },
  ];

  const convertReservationToProcessedEvent = (reservation: Reservation) => {
    if (reservation) {
      return {
        event_id: reservation.id,
        title: reservation.customer.firstName,
        start: new Date(reservation.bookingTime),
        end: new Date(getEndTimeForFirstGuest(reservation)),
        data: reservation,
      };
    } else return null;
  }

  const handleBookingStatusChange = (e: any) => {
    if (selectedEvent) {
      setSelectedEvent({
        ...selectedEvent,
        status: e,
      });
    }

    setIsStatusModified(selectedEvent?.status !== e);
    }

    const updateEventData = (response: Reservation) => {
      setReservations((prevReservations) =>
        prevReservations.map((reservation) =>
          reservation.id === response.id ? response : reservation
        )
      );
    };

    const updateReservationEvent = async (selectedEvent: Reservation) => {
      const url = `/reservation/`;
      const response = await axiosWithToken.put(url, selectedEvent);
  
      if (!response.data) {
        throw new Error("Failed to update reservation event");
      }
  
      updateEventData(response.data);
    };

    const handleSubmitUpdateBooking = () => {
      updateReservationEvent(selectedEvent!);
    };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveBox
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Customer Bookings History
      </Typography>
      <Typography variant="body1" gutterBottom>
        Customer ID: {customerId}
      </Typography>
      <Box sx={{}}>
        <DataGrid
          rows={reservations}
          columns={columns}
          loading={loading}
          paginationMode="server"
          pagination
          hideFooterSelectedRowCount
          rowCount={rowCount}
          showCellVerticalBorder={true}
          initialState={{
            density: "compact",
            pagination: {
              paginationModel: {
                pageSize: pageSize,
                page: page,
              },
            },
          }}
          pageSizeOptions={[20, 50, 100]}
          onPaginationModelChange={(params) => {
            setPage(params.page);
            setPageSize(params.pageSize);
            fetchReservations(params.page, params.pageSize);
          }}
          sx={{
            height: "80vh",
            minHeight: 400,
            maxWidth: 1300
          }}
          slots={{
            noRowsOverlay: DataGridNoRowsOverlay,
          }}
          onRowClick={(params) => {
            setIsBookingDialogOpen(true);
            setSelectedEvent(params.row);
          }}
        />
      </Box>
      <BookingEventDialog
          isDialogOpen={isBookingDialogOpen}
          setIsDialogOpen={setIsBookingDialogOpen}
          selectedEvent={convertReservationToProcessedEvent(selectedEvent!)}
          handleStatusChange={handleBookingStatusChange}
          handleSubmit={handleSubmitUpdateBooking}
          isStatusModified={isStatusModified}
        />
    </ResponsiveBox>
  );
};

export default CustomerBookingsHistory;
