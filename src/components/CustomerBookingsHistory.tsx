import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { axiosWithToken } from "../utils/axios";
import moment from "moment";
import { useMediaQuery } from "@mui/material";
import ResponsiveBox from "./ResponsiveBox";
import DataGridNoRowsOverlay from "./DataGridNoRowsOverlay";

const CustomerBookingsHistory: React.FC = () => {
  const { customerId: urlCustomerId } = useParams<{ customerId: string }>();
  const customerId = urlCustomerId;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20); // Default page size
  const [rowCount, setRowCount] = useState(0); // Total number of rows
  const isLargeScreen = useMediaQuery("(min-width:1200px)");
  const isMobile = useMediaQuery("(max-width:600px)");

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
      field: "staff",
      headerName: "Staff",
      width: 150,
      valueGetter: (params: Staff) => params.nickname,
    },
    {
      field: "serviceItems",
      headerName: "Services",
      width: 300,
      valueGetter: (params: ServiceItem[]) =>
        params.map((item: any) => item.serviceName).join(", "),
    },
    {
      field: "note",
      headerName: "Booking Note",
      width: 300,
    },
  ];

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
        />
      </Box>
    </ResponsiveBox>
  );
};

export default CustomerBookingsHistory;
