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
import { UserCheck, AlertCircle, Trash2, Plus, ChevronDown, ChevronLeft, ChevronRight, CalendarX } from "lucide-react";
import ActionResultDialog from "../components/dialogs/ActionResultDialog";

interface UnavailabilityFormData {
  staffId: number;
  date: string;
  note: string;
}

const ManageStaffUnavailabilityPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | "" | "all">("");
  const [records, setRecords] = useState<StaffUnavailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<UnavailabilityFormData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [actionResultOpen, setActionResultOpen] = useState(false);
  const [actionResultMessage, setActionResultMessage] = useState("");
  const [actionResultType, setActionResultType] = useState<"success" | "failure">("success");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchStaffList = async () => {
    try {
      const response = await axiosWithToken.get<Staff[]>("/staff/?isOnlyActive=true");
      setStaffList(response.data);
    } catch (error) {
      console.error("Error fetching staff list:", error);
    }
  };

  const fetchRecords = async (staffId: number) => {
    setLoading(true);
    try {
      const response = await axiosWithToken.get<StaffUnavailability[]>(
        `/staffUnavailability/${staffId}`
      );
      setRecords(
        response.data.sort((a, b) =>
          moment(a.date, "DD/MM/YYYY").diff(moment(b.date, "DD/MM/YYYY"))
        )
      );
    } catch (error) {
      console.error("Error fetching unavailability records:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRecords = async () => {
    setLoading(true);
    try {
      const response = await axiosWithToken.get<StaffUnavailability[]>(
        "/staffUnavailability/"
      );
      setRecords(
        response.data.sort((a, b) =>
          moment(a.date, "DD/MM/YYYY").diff(moment(b.date, "DD/MM/YYYY"))
        )
      );
    } catch (error) {
      console.error("Error fetching all unavailability records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    if (selectedStaffId === "all") {
      fetchAllRecords();
    } else if (selectedStaffId) {
      fetchRecords(selectedStaffId as number);
    } else {
      setRecords([]);
    }
  }, [selectedStaffId]);

  const handleAdd = () => {
    setFormData({
      staffId: selectedStaffId as number,
      date: moment().format("DD/MM/YYYY"),
      note: "",
    });
    setFormError(null);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: number) => {
    setRecordToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const refetchCurrent = () => {
    if (selectedStaffId === "all") {
      fetchAllRecords();
    } else {
      fetchRecords(selectedStaffId as number);
    }
  };

  const handleDelete = async () => {
    if (recordToDelete === null) return;
    try {
      await axiosWithToken.delete(`/staffUnavailability/${recordToDelete}`);
      setActionResultMessage("Day off removed successfully");
      setActionResultType("success");
      refetchCurrent();
    } catch (error) {
      setActionResultMessage("Failed to remove day off");
      setActionResultType("failure");
    } finally {
      setActionResultOpen(true);
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData) return;
    if (!formData.date) {
      setFormError("Please select a date");
      return;
    }
    try {
      await axiosWithToken.post("/staffUnavailability/", {
        staff: { id: formData.staffId },
        date: formData.date,
        note: formData.note,
      });
      setActionResultMessage("Day off added successfully");
      setActionResultType("success");
      refetchCurrent();
      setOpenDialog(false);
    } catch (error) {
      setActionResultMessage("Failed to add day off");
      setActionResultType("failure");
    } finally {
      setActionResultOpen(true);
    }
  };

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  const isPast = (dateStr: string) =>
    moment(dateStr, "DD/MM/YYYY").isBefore(moment(), "day");

  const totalPages = Math.ceil(records.length / pageSize);
  const paginatedRecords = records.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    const total = Math.ceil(records.length / pageSize);
    if (total > 0 && currentPage > total) {
      setCurrentPage(total);
    }
  }, [records.length, pageSize, currentPage]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

        {/* ── Header + Toolbar ── */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start gap-3 mb-5">
            <div className="mt-0.5 p-1.5 rounded-md bg-blue-50">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Staff Days Off</h1>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Manage days off and schedule exceptions for your team
              </p>
            </div>
          </div>

          {/* Selector + Button — same row, properly aligned */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:max-w-sm">
              <select
                value={selectedStaffId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStaffId(val === "" ? "" : val === "all" ? "all" : Number(val));
                }}
                className="w-full appearance-none bg-white border border-gray-200 rounded-md px-3 py-2 pr-8 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow cursor-pointer"
              >
                <option value="">Select a staff member</option>
                <option value="all">All Staff</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id as number}>
                    {staff.nickname} — {staff.firstName} {staff.lastName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={handleAdd}
              disabled={!selectedStaffId || selectedStaffId === "all"}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-700 active:bg-gray-800 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Date
            </button>
          </div>
        </div>

        {/* ── Table / States ── */}
        <div>

          {/* State: no staff selected */}
          {!selectedStaffId && (
            <div className="flex flex-col items-center justify-center gap-2.5 py-14 px-6">
              <div className="p-3 rounded-full bg-gray-100">
                <UserCheck className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-[13px] font-medium text-gray-700">No staff selected</p>
              <p className="text-[12px] text-gray-400 text-center max-w-xs leading-relaxed">
                Choose a team member or "All Staff" from the dropdown above to
                view their days off.
              </p>
            </div>
          )}

          {/* State: loading */}
          {selectedStaffId && loading && (
            <div className="flex items-center justify-center py-14">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
          )}

          {/* State: empty records */}
          {selectedStaffId && !loading && records.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2.5 py-14 px-6">
              <div className="p-3 rounded-full bg-gray-100">
                <CalendarX className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-[13px] font-medium text-gray-700">No days off</p>
              <p className="text-[12px] text-gray-400 text-center leading-relaxed">
                {selectedStaffId === "all"
                  ? "No team members have any days off set."
                  : `${selectedStaff?.nickname} has no days off set. Use the button above to add one.`}
              </p>
            </div>
          )}

          {/* State: data table */}
          {selectedStaffId && !loading && records.length > 0 && (
            <>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {selectedStaffId === "all" && (
                    <th className="text-left px-6 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                  )}
                  <th className="text-left px-6 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="w-14 px-6 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => {
                  const past = isPast(record.date);
                  const date = moment(record.date, "DD/MM/YYYY");
                  return (
                    <tr
                      key={record.id}
                      className={`border-t border-gray-100 transition-colors ${past ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-gray-50"}`}
                    >
                      {/* Date cell: badge + day name + past indicator */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold ${
                              past
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {date.format("MMM D, YYYY")}
                          </span>
                          <span className={`text-[12px] ${past ? "text-amber-600" : "text-gray-400"}`}>
                            {date.format("dddd")}
                          </span>
                          {past && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-200 text-amber-800">
                              Past
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Staff cell (only in "all" view) */}
                      {selectedStaffId === "all" && (
                        <td className="px-6 py-3">
                          <span className="text-[13px] text-gray-700 font-medium">{record.staff.nickname}</span>
                          <span className="text-[12px] text-gray-400 ml-1.5">{record.staff.firstName} {record.staff.lastName}</span>
                        </td>
                      )}

                      {/* Note cell */}
                      <td className="px-6 py-3">
                        {record.note ? (
                          <span className="text-[13px] text-gray-600">{record.note}</span>
                        ) : (
                          <span className="text-[13px] text-gray-400 italic">No note</span>
                        )}
                      </td>

                      {/* Action cell */}
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleDeleteClick(record.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── Pagination ── */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-gray-200 rounded-md px-3 py-1.5 pr-7 text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>

              <div className="flex items-center gap-3">
                <p className="text-[13px] text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {Math.min((currentPage - 1) * pageSize + 1, records.length)}
                  </span>
                  –
                  <span className="font-medium text-gray-700">
                    {Math.min(currentPage * pageSize, records.length)}
                  </span>
                  {" "}of{" "}
                  <span className="font-medium text-gray-700">{records.length}</span>
                </p>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* ── Add Dialog ── */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.9375rem" }}>
            Add Day Off
          </Typography>
          {selectedStaff && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {selectedStaff.nickname} · {selectedStaff.firstName} {selectedStaff.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Date"
                format="DD/MM/YYYY"
                value={formData ? moment(formData.date, "DD/MM/YYYY") : moment()}
                onChange={(date) =>
                  setFormData((prev) =>
                    prev ? { ...prev, date: date?.format("DD/MM/YYYY") || "" } : null
                  )
                }
                disablePast
                minDate={moment()}
              />
            </LocalizationProvider>
            <TextField
              label="Note"
              fullWidth
              size="small"
              value={formData?.note || ""}
              onChange={(e) => {
                setFormData((prev) =>
                  prev ? { ...prev, note: e.target.value } : null
                );
                setFormError(null);
              }}
              placeholder="e.g. Day off request"
            />
            {formError && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AlertCircle size={15} className="text-red-500" />
                <Typography variant="caption" color="error">{formError}</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            size="small"
            sx={{ color: "text.secondary", fontSize: "0.8125rem" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            size="small"
            variant="contained"
            sx={{
              backgroundColor: "#111827",
              color: "#fff",
              fontWeight: 500,
              fontSize: "0.8125rem",
              px: 2.5,
              "&:hover": { backgroundColor: "#374151" },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
            Remove this day off?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
            This staff member will show as available on that date again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            size="small"
            sx={{ color: "text.secondary", fontSize: "0.8125rem" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            size="small"
            variant="contained"
            color="error"
            sx={{ fontWeight: 500, fontSize: "0.8125rem", px: 2.5 }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Action Result ── */}
      <ActionResultDialog
        open={actionResultOpen}
        onClose={() => setActionResultOpen(false)}
        message={actionResultMessage}
        type={actionResultType}
      />
    </div>
  );
};

export default ManageStaffUnavailabilityPage;
