import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { axiosWithToken } from "../utils/axios";
import { Box, Paper, Typography, Skeleton } from "@mui/material";
import { Crown, Users } from "lucide-react";

type TopCustomer = {
  customerId: number;
  firstName: string;
  lastName: string;
  reservationCount: number;
  totalReservationPrice: number;
};

const TopCustomers: React.FC = () => {
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const columns: GridColDef[] = [
    { 
      field: "customerId", 
      headerName: "ID", 
      width: 70,
      align: 'center',
      headerAlign: 'center',
    },
    { 
      field: "firstName", 
      headerName: "First Name", 
      flex: 1,
      minWidth: 120,
    },
    { 
      field: "lastName", 
      headerName: "Last Name", 
      flex: 1,
      minWidth: 120,
    },
    { 
      field: "reservationCount", 
      headerName: "Bookings", 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: 'primary.50',
            color: 'primary.700',
            py: 0.5,
            px: 1.5,
            borderRadius: '12px',
            fontWeight: 'medium',
            minWidth: '40px',
            textAlign: 'center'
          }}
        >
          {params.value}
        </Box>
      ),
    },
    { 
      field: "totalReservationPrice", 
      headerName: "Total Spent", 
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box
          sx={{
            color: 'success.700',
            fontWeight: 'medium',
            fontFamily: 'monospace'
          }}
        >
          ${params.value.toFixed(2)}
        </Box>
      ),
    },
  ];

  useEffect(() => {
    const fetchTopCustomers = async () => {
      setLoading(true);
      try {
        const response = await axiosWithToken.get("/customer/top50");
        setTopCustomers(response.data);
      } catch (error) {
        console.error("Error fetching top customers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopCustomers();
  }, []);

  const renderLoadingState = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(5)].map((_, index) => (
        <Skeleton 
          key={index} 
          variant="rectangular" 
          height={40} 
          sx={{ 
            mb: 1,
            borderRadius: 1,
            opacity: 1 - (index * 0.15)
          }} 
        />
      ))}
    </Box>
  );

  return (
    <Box>
      <Paper 
        elevation={3} 
        sx={{ 
          height: "100%",
          borderRadius: "16px",
          background: "linear-gradient(to right bottom, #ffffff, #f8f9fa)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          overflow: "hidden"
        }}
      >
        <Box 
          sx={{ 
            p: 3,
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <Users size={24} className="text-amber-600 mr-1" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#1a237e",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Most Valuable Customers
            <Crown size={16} className="ml-2 inline-block text-amber-500" />
          </Typography>
        </Box>

        <Box sx={{ height: 400, width: "100%", p: 2 }}>
          {loading ? (
            renderLoadingState()
          ) : (
            <DataGrid 
              rows={topCustomers} 
              columns={columns} 
              getRowId={(row) => row.customerId}
              initialState={{
                pagination: { paginationModel: { pageSize: 5 } },
                sorting: {
                  sortModel: [{ field: 'totalReservationPrice', sort: 'desc' }],
                },
              }}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderColor: 'rgba(0, 0, 0, 0.05)',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                },
                '& .MuiDataGrid-row:nth-of-type(even)': {
                  backgroundColor: 'rgba(0, 0, 0, 0.01)',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                },
              }}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default TopCustomers;