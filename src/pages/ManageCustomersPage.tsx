import React, { useState } from "react";
import {
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRowId,
  GridRowModel,
  GridRenderEditCellParams,
} from "@mui/x-data-grid";
import { axiosWithToken } from "../utils/axios";
import moment from "moment";
import { useMediaQuery } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Controller, set, useForm } from "react-hook-form";
import ActionResultDialog from "../components/dialogs/ActionResultDialog";

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  blacklisted: boolean;
}

const ManageCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20); // Default page size
  const [rowCount, setRowCount] = useState(0); // Total number of rows
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<null | GridRowId>(null);
  const [customerUpdateResultDialogOpen, setCustomerUpdateResultDialogOpen] =
    useState(false);
  const [resultDialogType, setResultDialogType] = useState<
    "success" | "failure"
  >("success");

  const { control, handleSubmit, getValues } = useForm({
    defaultValues: {
      searchString: "",
      filterBlacklisted: false,
    },
  });

  const formatPhoneNumber = (mobileNumber: string) => {
    if (!mobileNumber) {
      return "";
    }
    const part1 = mobileNumber.slice(0, 4); // First 2 digits
    const part2 = mobileNumber.slice(4, 7); // Next 4 digits
    const part3 = mobileNumber.slice(7, mobileNumber.length); // Last 4 digits
    return `${part1} ${part2} ${part3}`;
  };

  const BlacklistedEditCell = (params: GridRenderEditCellParams) => {
    const handleChange = (event: SelectChangeEvent) => {
      params.api.setEditCellValue({
        id: params.id,
        field: params.field,
        value: event.target.value === "Yes",
      });
    };

    return (
      <Select
        value={params.value ? "Yes" : "No"}
        onChange={handleChange}
        autoWidth
      >
        <MenuItem value="Yes">Yes</MenuItem>
        <MenuItem value="No">No</MenuItem>
      </Select>
    );
  };

  const mobileColumns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "firstName",
      headerName: "First Name",
      width: 150,
      editable: true,
    },
    { field: "lastName", headerName: "Last Name", width: 150, editable: true },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      valueFormatter: (params: string) => formatPhoneNumber(params),
      editable: true,
    },
    { field: "phone", headerName: "Phone", width: 150 },
    {
      field: "blacklisted",
      headerName: "Blocked",
      width: 150,
      renderCell: (params) => (params.value ? "Yes" : <></>),
      renderEditCell: BlacklistedEditCell,
      editable: true,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 150,
      valueFormatter: (params: { value: any }) =>
        moment(params.value).format("DD-MM-YYYY"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 70,
      renderCell: (params) => (
        <IconButton onClick={(event) => handleMenuOpen(event, params.id)}>
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  const desktopColumns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "firstName", headerName: "First Name", flex: 1, editable: true },
    { field: "lastName", headerName: "Last Name", flex: 1, editable: true },
    { field: "email", headerName: "Email", flex: 1, editable: true },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
      valueFormatter: (params: string) => formatPhoneNumber(params),
      editable: true,
    },
    {
      field: "blacklisted",
      headerName: "Blocked",
      flex: 1,
      renderCell: (params) => (params.value ? "Yes" : <></>),
      renderEditCell: BlacklistedEditCell,
      editable: true,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      flex: 1,
      valueFormatter: (params: { value: any }) =>
        moment(params.value).format("DD-MM-YYYY"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 70,
      renderCell: (params) => (
        <IconButton onClick={(event) => handleMenuOpen(event, params.id)}>
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  const isSmallOrMediumScreen = useMediaQuery("(max-width:960px)");
  const columns = isSmallOrMediumScreen ? mobileColumns : desktopColumns;

  const fetchCustomers = async (page: number, pageSize: number) => {
    const { searchString, filterBlacklisted } = getValues();
    setLoading(true);
    try {
      const response = await axiosWithToken.get(`/customer/search`, {
        params: {
          page: page,
          size: pageSize,
          sort: "id,DESC",
          filterBlacklisted: filterBlacklisted,
          searchString: searchString,
        },
      });
      setCustomers(response.data.content);
      setRowCount(response.data.totalElements);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    rowId: GridRowId
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(rowId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleMenuItemClick = (action: string) => {
    console.log(`Action: ${action}, Row ID: ${selectedRow}`);
    handleMenuClose();
  };

  const onSubmit = () => {
    fetchCustomers(page, pageSize);
  };

  const areRowsEqual = (row1: GridRowModel, row2: GridRowModel) => {
    return JSON.stringify(row1) === JSON.stringify(row2);
  };

  const processRowUpdate = async (
    newRow: GridRowModel,
    oldRow: GridRowModel
  ) => {
    if (areRowsEqual(newRow, oldRow)) {
      return oldRow;
    }
    try {
      // Ensure newRow contains the necessary Customer properties
      const updatedRow: Customer = {
        id: newRow.id,
        firstName: newRow.firstName,
        lastName: newRow.lastName,
        email: newRow.email,
        phone: newRow.phone,
        createdAt: newRow.createdAt,
        blacklisted: newRow.blacklisted,
      };

      // Optionally, make a PUT request to update the customer on the server
      const response = await axiosWithToken.put(
        `/customer/${newRow.id}`,
        updatedRow
      );

      // Update the state with the edited row
      setCustomers((prevCustomers) =>
        prevCustomers.map((row) => (row.id === newRow.id ? updatedRow : row))
      );

      setResultDialogType("success");
      return newRow;
    } catch (error) {
      console.error("Failed to update customer", error);
      setResultDialogType("failure");
      return oldRow;
    } finally {
      setCustomerUpdateResultDialogOpen(true);
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginBottom: 2,
            flexWrap: "wrap", // Allow wrapping on small screens
            "@media (min-width:600px)": {
              flexWrap: "nowrap", // No wrapping on medium and large screens
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%", // Full width on small screens
              marginBottom: 1, // Add margin bottom for small screens
              "@media (min-width:600px)": {
                width: "auto", // Auto width on medium and large screens
                marginRight: 2,
                marginBottom: 0, // Remove margin bottom for medium and large screens
              },
            }}
          >
            <Controller
              name="searchString"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Search Customers by Phone, Email, First Name, Last Name"
                  variant="outlined"
                  fullWidth
                  sx={{
                    marginRight: 2,
                    width: "100%", // Full width on small screens
                    "@media (min-width:600px)": {
                      width: "500px", // Width for medium and large screens
                    },
                  }}
                />
              )}
            />
            <Controller
              name="filterBlacklisted"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      color="primary"
                    />
                  }
                  label="Filter Blacklisted"
                  sx={{
                    marginRight: 2,
                    "@media (min-width:600px)": {
                      marginRight: 0,
                    },
                  }}
                />
              )}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            sx={{
              width: "100%", // Full width on small screens
              backgroundColor: "black",
              color: "white",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "black",
              },
              "@media (min-width:600px)": {
                width: "200px", // Width for medium and large screens
              },
            }}
          >
            Search
          </Button>
        </Box>
      </form>
      <DataGrid
        rows={customers}
        columns={columns}
        loading={loading}
        paginationMode="server"
        pagination
        hideFooterSelectedRowCount
        rowCount={rowCount} // Total number of rows for the pagination
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
          fetchCustomers(params.page, params.pageSize);
        }}
        editMode="row"
        showCellVerticalBorder={true}
        processRowUpdate={processRowUpdate}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuItemClick("Find Bookings")}>
          Find Bookings for Customer
        </MenuItem>
      </Menu>
      <ActionResultDialog
        open={customerUpdateResultDialogOpen}
        onClose={() => setCustomerUpdateResultDialogOpen(false)}
        message={
          resultDialogType == "success"
            ? "Customer updated successfully"
            : "Failed to update customer. Please try again!"
        }
        type={resultDialogType}
      />
    </Box>
  );
};

export default ManageCustomersPage;
