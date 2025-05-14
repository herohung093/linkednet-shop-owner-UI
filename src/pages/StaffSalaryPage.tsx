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
  IconButton,
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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { Edit as EditIcon, AttachMoney } from "@mui/icons-material";
import moment from "moment";
import { axiosWithToken } from "../utils/axios";
import withAuth from "../components/HOC/withAuth";
import ActionResultDialog from "../components/dialogs/ActionResultDialog";

interface StaffRate {
  id: number;
  staffId: number;
  rate: number;
  effectiveDate: string;
  endDate: string | null;
}

interface RateFormData {
  staffId: number;
  rate: number;
  effectiveDate: string;
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
  const [formErrors, setFormErrors] = useState<Partial<RateFormData>>({});
  const [actionResultOpen, setActionResultOpen] = useState(false);
  const [actionResultMessage, setActionResultMessage] = useState("");
  const [actionResultType, setActionResultType] = useState<"success" | "failure">("success");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffResponse, ratesResponse] = await Promise.all([
          axiosWithToken.get<Staff[]>("/staff/?isOnlyActive=true"),
          axiosWithToken.get<StaffRate[]>("/staff/rate"),
        ]);
        setStaffList(staffResponse.data);
        setStaffRates(ratesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const validateForm = (): boolean => {
    const errors: Partial<RateFormData> = {};
    if (!formData.staffId) {
      errors.staffId = "Staff selection is required";
    }
    if (formData.rate <= 0) {
      errors.rate = "Rate must be a positive number";
    }
    if (moment(formData.effectiveDate, "DD/MM/YYYY").isBefore(moment(), "day")) {
      errors.effectiveDate = "Effective date cannot be in the past";
    }

    // Check for overlapping dates
    const existingRates = staffRates.filter(
      (rate) => rate.staffId === formData.staffId && (!rate.endDate || moment(rate.endDate, "DD/MM/YYYY").isAfter(formData.effectiveDate))
    );
    if (existingRates.length > 0 && !selectedRate) {
      errors.effectiveDate = "Date range overlaps with existing rate";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (selectedRate) {
        await axiosWithToken.put(`/staff/rate/${selectedRate.id}`, formData);
        setActionResultMessage("Rate updated successfully");
      } else {
        await axiosWithToken.post(`/staff/rate/${formData.staffId}`, formData);
        setActionResultMessage("New rate added successfully");
      }
      setActionResultType("success");
      
      // Refresh rates
      const response = await axiosWithToken.get<StaffRate[]>("/staff/rate");
      setStaffRates(response.data);
      
      handleCloseDialog();
    } catch (error) {
      setActionResultType("failure");
      setActionResultMessage("Failed to save rate. Please try again.");
    } finally {
      setActionResultOpen(true);
    }
  };

  const handleEdit = (rate: StaffRate) => {
    setSelectedRate(rate);
    setFormData({
      staffId: rate.staffId,
      rate: rate.rate,
      effectiveDate: rate.effectiveDate,
    });
    setOpenDialog(true);
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

  const getStaffName = (staffId: number) => {
    const staff = staffList.find((s) => s.id === staffId);
    return staff ? `${staff.firstName} ${staff.lastName}` : "Unknown";
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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff Name</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell>Effective Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staffRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{getStaffName(rate.staffId)}</TableCell>
                  <TableCell align="right">${rate.rate.toFixed(2)}</TableCell>
                  <TableCell>{moment(rate.effectiveDate, "DD/MM/YYYY").format("DD MMM YYYY")}</TableCell>
                  <TableCell>
                    {rate.endDate ? moment(rate.endDate, "DD/MM/YYYY").format("DD MMM YYYY") : "Current"}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleEdit(rate)} size="small">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedRate ? "Edit Rate" : "Add New Rate"}</DialogTitle>
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
                  <MenuItem key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName}
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
            {selectedRate ? "Update" : "Save"}
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