
import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { axiosWithToken } from "../utils/axios";

type TopCustomer = {
  customerid: number;
  firstname: string;
  lastname: string;
  reservationcount: number;
  totalreservationprice: number;
};

const TopCustomers: React.FC = () => {
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  const columns: GridColDef[] = [
    { field: "customerId", headerName: "ID", width: 50 },
    { field: "firstName", headerName: "First Name", flex: 1 },
    { field: "lastName", headerName: "Last Name", flex: 1 },
    { field: "reservationCount", headerName: "Bookings", width: 100 },
    { field: "totalReservationPrice", headerName: "Total Spent", width: 100 },
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

  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid rows={topCustomers} columns={columns} loading={loading} getRowId={(row) => row.customerId} />
    </div>
  );
};

export default TopCustomers;