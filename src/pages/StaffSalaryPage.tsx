import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Pagination,
  FormControlLabel,
  Switch,
  TableSortLabel,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { AttachMoney } from "@mui/icons-material";
import moment from "moment";
import { axiosWithToken } from "../utils/axios";
import withAuth from "../components/HOC/withAuth";
import ActionResultDialog from "../components/dialogs/ActionResultDialog";

interface StaffRate {
  id: number;
  staff: {
    id: number;
    firstName: string;
    lastName: string;
    nickname: string;
    // ...other staff properties
  };
  rate: number;
  effectiveDate: string;
  endDate: string | null;
}

interface RateFormData {
  staffId: number;
  rate: number;
  effectiveDate: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const StaffSalaryPage: React.FC = () => {
  const [staffRates, setStaffRates] = useState<StaffRate[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRate, setSelectedRate] = useState<StaffRate | null>(null);
  const [formData, setFormData] = useState<RateFormData>({
    staffId: 0,
    rate: 0,
    effectiveDate: moment().format("DD/MM/YYYY"),
  });
  const [formErrors, setFormErrors] = useState<{[key in keyof RateFormData]?: string}>({});
  const [actionResultOpen, setActionResultOpen] = useState(false);
  const [actionResultMessage, setActionResultMessage] = useState("");
  const [actionResultType, setActionResultType] = useState<"success" | "failure">("success");
  
  // Pagination and sorting state
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("effectiveDate");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [activeOnly, setActiveOnly] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchData();
  }, [page, size, sortBy, sortDirection, activeOnly]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffResponse, ratesResponse] = await Promise.all([
        axiosWithToken.get<Staff[]>("/staff/?isOnlyActive=true"),
        axiosWithToken.get<PaginatedResponse<StaffRate>>("/staff/rate/all", {
          params: {
            page,
            size,
            sortBy,
            sortDirection,
            activeOnly
          }
        }),
      ]);
      
      setStaffList(staffResponse.data);
      setStaffRates(ratesResponse.data.content);
      setTotalPages(ratesResponse.data.totalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1); // API uses 0-based index for pages
  };

  const handleSortChange = (property: string) => {
    // Map frontend column names to backend property names
    const propertyMap: { [key: string]: string } = {
      'staffName': 'staff.firstName',
      'nickname': 'staff.nickname',
      'rate': 'rate',
      'effectiveDate': 'effectiveDate',
      'endDate': 'endDate'
    };

    const backendProperty = propertyMap[property] || property;
    const isAsc = sortBy === backendProperty && sortDirection === "ASC";
    setSortDirection(isAsc ? "DESC" : "ASC");
    setSortBy(backendProperty);
  };

  const handleActiveOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setActiveOnly(event.target.checked);
    setPage(0); // Reset to first page when changing filter
  };

  const validateForm = (): boolean => {
    const errors: {[key in keyof RateFormData]?: string} = {};
    if (!formData.staffId) {
      errors.staffId = "Staff selection is required";
    }
    if (formData.rate <= 0) {
      errors.rate = "Rate must be a positive number";
    }
    if (moment(formData.effectiveDate, "DD/MM/YYYY").isBefore(moment(), "day")) {
      errors.effectiveDate = "Effective date cannot be in the past";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Always create new rate, even when "editing"
      await axiosWithToken.post(`/staff/rate/${formData.staffId}`, null, {
        params: {
          rate: formData.rate,
          effectiveDate: formData.effectiveDate
        }
      });
      setActionResultMessage("New rate added successfully");
      setActionResultType("success");
    } catch (error) {
      setActionResultType("failure");
      setActionResultMessage("Failed to save rate. Please try again.");
    } finally {
      // Always refresh data after submission attempt, even if there was an error
      await fetchData();
      setActionResultOpen(true);
      handleCloseDialog();
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRate(null);
    setFormData({
      staffId: 0,
      rate: 0,
      effectiveDate: moment().format("DD/MM/YYYY"),
    });
    setFormErrors({});
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" component="h1">
            Staff Salary Rates
          </Typography>
          <Button
            variant="contained"
            onClick={() => setOpenDialog(true)}
            startIcon={<AttachMoney />}
            sx={{
              backgroundColor: "black",
              "&:hover": { backgroundColor: "grey" },
            }}
          >
            Add New Rate
          </Button>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={activeOnly}
                onChange={handleActiveOnlyChange}
                color="primary"
              />
            }
            label="Show active rates only"
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'staff.firstName'}
                    direction={sortBy === 'staff.firstName' ? sortDirection.toLowerCase() as "asc" | "desc" : "asc"}
                    onClick={() => handleSortChange('staffName')}
                  >
                    Staff Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'staff.nickname'}
                    direction={sortBy === 'staff.nickname' ? sortDirection.toLowerCase() as "asc" | "desc" : "asc"}
                    onClick={() => handleSortChange('nickname')}
                  >
                    Nickname
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy === 'rate'}
                    direction={sortBy === 'rate' ? sortDirection.toLowerCase() as "asc" | "desc" : "asc"}
                    onClick={() => handleSortChange('rate')}
                  >
                    Rate
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'effectiveDate'}
                    direction={sortBy === 'effectiveDate' ? sortDirection.toLowerCase() as "asc" | "desc" : "asc"}
                    onClick={() => handleSortChange('effectiveDate')}
                  >
                    Effective Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'endDate'}
                    direction={sortBy === 'endDate' ? sortDirection.toLowerCase() as "asc" | "desc" : "asc"}
                    onClick={() => handleSortChange('endDate')}
                  >
                    End Date
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staffRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    {rate.staff.firstName} {rate.staff.lastName}
                  </TableCell>
                  <TableCell>{rate.staff.nickname}</TableCell>
                  <TableCell align="right">${rate.rate.toFixed(2)}</TableCell>
                  <TableCell>{moment(rate.effectiveDate, "DD/MM/YYYY").format("DD MMM YYYY")}</TableCell>
                  <TableCell>
                    {rate.endDate ? moment(rate.endDate, "DD/MM/YYYY").format("DD MMM YYYY") : "Current"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page + 1} // API uses 0-based index, UI uses 1-based
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedRate ? "Add New Rate for " + selectedRate.staff.firstName : "Add New Rate"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <FormControl fullWidth error={!!formErrors.staffId}>
              <InputLabel>Staff Member</InputLabel>
              <Select
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: Number(e.target.value) })}
                disabled={!!selectedRate}
              >
                {staffList.map((staff) => (
                  <MenuItem key={staff.id} value={String(staff.id)}>
                    {staff.firstName} {staff.lastName} ({staff.nickname})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.staffId && (
                <Typography color="error" variant="caption">
                  {formErrors.staffId}
                </Typography>
              )}
            </FormControl>

            <TextField
              label="Rate"
              type="number"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
              error={!!formErrors.rate}
              helperText={formErrors.rate}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Effective Date"
                value={moment(formData.effectiveDate, "DD/MM/YYYY")}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    effectiveDate: date ? date.format("DD/MM/YYYY") : moment().format("DD/MM/YYYY"),
                  })
                }
                format="DD/MM/YYYY"
                minDate={moment()} // Add this line to disable past dates
                slotProps={{
                  textField: {
                    error: !!formErrors.effectiveDate,
                    helperText: formErrors.effectiveDate,
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: "black",
              "&:hover": { backgroundColor: "grey" },
            }}
          >
            Add Rate
          </Button>
        </DialogActions>
      </Dialog>

      <ActionResultDialog
        open={actionResultOpen}
        onClose={() => setActionResultOpen(false)}
        message={actionResultMessage}
        type={actionResultType}
      />
    </Container>
  );
};

export default withAuth(StaffSalaryPage);