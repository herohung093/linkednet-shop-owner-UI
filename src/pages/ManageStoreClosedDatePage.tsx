import React, { useEffect, useState } from "react";
import { axiosWithToken } from "../utils/axios";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { Calendar, AlertCircle, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import ActionResultDialog from "../components/dialogs/ActionResultDialog";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";

interface ClosedDateFormData {
  id?: number;
  reason: string;
  closedStartDate: string;
  closedEndDate: string;
  storeUuid: string;
  storeConfig: {
    id: number;
  };
}

const ManageStoreClosedDatePage: React.FC = () => {
  const [closedDates, setClosedDates] = useState<StoreClosedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<ClosedDateFormData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionResultOpen, setActionResultOpen] = useState(false);
  const [actionResultMessage, setActionResultMessage] = useState("");
  const [actionResultType, setActionResultType] = useState<"success" | "failure">("success");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<number | null>(null);
  
  const storeConfig = useSelector(
    (state: RootState) => state.storesList?.storesList?.[0]
  );

  const fetchClosedDates = async (page: number, size: number) => {
    setLoading(true);
    try {
      const response = await axiosWithToken.get("/storeConfig/closedDate", {
        params: {
          page,
          size,
          sort: "id,DESC",
        },
      });
      setClosedDates(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching closed dates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosedDates(page, pageSize);
  }, [page, pageSize]);

  const handleAdd = () => {
    setSelectedDate({
      reason: "",
      closedStartDate: moment().format("DD/MM/YYYY"),
      closedEndDate: moment().format("DD/MM/YYYY"),
      storeConfig: { id: storeConfig.id },
      storeUuid: storeConfig.storeUuid,
    });
    setOpenDialog(true);
  };

  const handleEdit = (row: StoreClosedDate) => {
    setSelectedDate({
      id: row.id,
      reason: row.reason,
      closedStartDate: row.closedStartDate,
      closedEndDate: row.closedEndDate,
      storeConfig: { id: storeConfig.id },
      storeUuid: storeConfig.storeUuid,
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: number) => {
    setDateToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!dateToDelete) return;
    
    try {
      await axiosWithToken.delete(`/storeConfig/closedDate/${dateToDelete}`);
      setActionResultMessage("Store closed date deleted successfully");
      setActionResultType("success");
      fetchClosedDates(page, pageSize);
    } catch (error) {
      setActionResultMessage("Failed to delete store closed date");
      setActionResultType("failure");
    } finally {
      setActionResultOpen(true);
      setDeleteConfirmOpen(false);
      setDateToDelete(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate) return;

    if (!selectedDate.reason.trim()) {
      setFormError("Please enter a reason");
      return;
    }

    const startDate = moment(selectedDate.closedStartDate);
    const endDate = moment(selectedDate.closedEndDate);
    selectedDate.storeConfig.id = storeConfig.id;
    selectedDate.storeUuid = storeConfig.storeUuid;

    if (endDate.isBefore(startDate)) {
      setFormError("End date cannot be before start date");
      return;
    }

    try {
      if (selectedDate.id) {
        await axiosWithToken.put(`/storeConfig/closedDate/${selectedDate.id}`, selectedDate);
        setActionResultMessage("Store closed date updated successfully");
      } else {
        await axiosWithToken.post("/storeConfig/closedDate", selectedDate);
        setActionResultMessage("Store closed date added successfully");
      }
      setActionResultType("success");
      fetchClosedDates(page, pageSize);
      setOpenDialog(false);
    } catch (error) {
      setActionResultMessage("Failed to save store closed date");
      setActionResultType("failure");
    } finally {
      setActionResultOpen(true);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Manage Store Closed Dates
            </h1>
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <span className="hidden sm:inline">Add Closed Date</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  </td>
                </tr>
              ) : closedDates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No closed dates found
                  </td>
                </tr>
              ) : (
                closedDates.map((date) => (
                  <tr key={date.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {date.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={date.reason}>
                        {date.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {moment(date.closedStartDate, "DD/MM/YYYY").format("MMM D, YYYY")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {moment(date.closedEndDate, "DD/MM/YYYY").format("MMM D, YYYY")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(date)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(date.id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-700">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDate?.id ? "Edit Closed Date" : "Add Closed Date"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Reason"
              fullWidth
              value={selectedDate?.reason || ""}
              onChange={(e) => {
                setSelectedDate(prev => prev ? { ...prev, reason: e.target.value } : null);
                setFormError(null);
              }}
              error={!!formError && !selectedDate?.reason}
              helperText={formError && !selectedDate?.reason ? formError : ""}
            />
            
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <DatePicker
                  label="Start Date"
                  format="DD/MM/YYYY"
                  value={moment(selectedDate?.closedStartDate, "DD/MM/YYYY")}
                  onChange={(date) => setSelectedDate(prev => 
                    prev ? { ...prev, closedStartDate: date?.format("DD/MM/YYYY") || "" } : null
                  )}
                  sx={{ flex: 1 }}
                  disablePast
                  minDate={moment()}
                />
                <DatePicker
                  label="End Date"
                  format="DD/MM/YYYY"
                  value={moment(selectedDate?.closedEndDate, "DD/MM/YYYY")}
                  onChange={(date) => setSelectedDate(prev => 
                    prev ? { ...prev, closedEndDate: date?.format("DD/MM/YYYY") || "" } : null
                  )}
                  sx={{ flex: 1 }}
                  disablePast
                  minDate={moment(selectedDate?.closedStartDate, "DD/MM/YYYY") || moment()}
                />
              </Box>
            </LocalizationProvider>

            {formError && formError.includes("date") && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "error.main" }}>
                <AlertCircle size={20} />
                <Typography variant="caption" color="error">
                  {formError}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: "black",
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
              },
            }}
          >
            {selectedDate?.id ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this closed date? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Result Dialog */}
      <ActionResultDialog
        open={actionResultOpen}
        onClose={() => setActionResultOpen(false)}
        message={actionResultMessage}
        type={actionResultType}
      />
    </div>
  );
};

export default ManageStoreClosedDatePage;