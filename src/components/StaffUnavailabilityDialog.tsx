import React, { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { Trash2, Plus, X, CalendarDays } from "lucide-react";
import { axiosWithToken } from "../utils/axios";
import ActionResultDialog from "./dialogs/ActionResultDialog";

interface StaffUnavailabilityDialogProps {
  staffId: number;
  staffName: string;
  open: boolean;
  onClose: () => void;
}

const StaffUnavailabilityDialog: React.FC<StaffUnavailabilityDialogProps> = ({
  staffId,
  staffName,
  open,
  onClose,
}) => {
  const [records, setRecords] = useState<StaffUnavailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState<moment.Moment | null>(moment());
  const [newNote, setNewNote] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [actionResultOpen, setActionResultOpen] = useState(false);
  const [actionResultMessage, setActionResultMessage] = useState("");
  const [actionResultType, setActionResultType] = useState<"success" | "failure">("success");

  const fetchRecords = useCallback(async () => {
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
      console.error("Error fetching staff unavailability:", error);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    if (open) {
      fetchRecords();
      setShowAddForm(false);
      setNewNote("");
      setNewDate(moment());
    }
  }, [open, fetchRecords]);

  const handleAdd = async () => {
    if (!newDate) return;
    try {
      await axiosWithToken.post("/staffUnavailability/", {
        staff: { id: staffId },
        date: newDate.format("DD/MM/YYYY"),
        note: newNote,
      });
      setActionResultMessage("Day off added");
      setActionResultType("success");
      setShowAddForm(false);
      setNewNote("");
      setNewDate(moment());
      fetchRecords();
    } catch (error) {
      setActionResultMessage("Failed to add day off");
      setActionResultType("failure");
    } finally {
      setActionResultOpen(true);
    }
  };

  const handleDeleteClick = (id: number) => {
    setRecordToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (recordToDelete === null) return;
    try {
      await axiosWithToken.delete(`/staffUnavailability/${recordToDelete}`);
      setActionResultMessage("Day off removed");
      setActionResultType("success");
      fetchRecords();
    } catch (error) {
      setActionResultMessage("Failed to remove day off");
      setActionResultType("failure");
    } finally {
      setActionResultOpen(true);
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  const isPast = (dateStr: string) =>
    moment(dateStr, "DD/MM/YYYY").isBefore(moment(), "day");

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>

        {/* ── Custom title bar ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            px: 3,
            pt: 2.5,
            pb: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 0.75,
                borderRadius: 1,
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
              }}
            >
              <CalendarDays size={18} color="#2563eb" />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                Days Off
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {staffName}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Plus size={12} />
                Add
              </button>
            )}
            <IconButton
              size="small"
              onClick={onClose}
              sx={{ color: "text.disabled", "&:hover": { color: "text.primary", backgroundColor: "grey.100" } }}
            >
              <X size={16} />
            </IconButton>
          </Box>
        </Box>

        {/* ── Body ── */}
        <DialogContent sx={{ p: 0 }}>

          {/* Add form panel */}
          {showAddForm && (
            <Box
              sx={{
                m: 2,
                p: 2.5,
                borderRadius: 1.5,
                backgroundColor: "#f9fafb",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "0.6875rem",
                  mb: 1.5,
                  display: "block",
                }}
              >
                New date
              </Typography>

              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="Date"
                  format="DD/MM/YYYY"
                  value={newDate}
                  onChange={(date) => setNewDate(date)}
                  disablePast
                  sx={{
                    width: "100%",
                    mb: 1.5,
                    "& .MuiInputBase-root": { backgroundColor: "#fff" },
                  }}
                />
              </LocalizationProvider>

              <TextField
                label="Note"
                fullWidth
                size="small"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Day off request"
                sx={{
                  mb: 2,
                  "& .MuiInputBase-root": { backgroundColor: "#fff" },
                }}
              />

              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  size="small"
                  onClick={() => setShowAddForm(false)}
                  sx={{ color: "text.secondary", fontSize: "0.78125rem" }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleAdd}
                  disabled={!newDate}
                  sx={{
                    backgroundColor: "#111827",
                    color: "#fff",
                    fontWeight: 500,
                    fontSize: "0.78125rem",
                    px: 2,
                    "&:hover": { backgroundColor: "#374151" },
                  }}
                >
                  Add
                </Button>
              </Box>
            </Box>
          )}

          {/* Loading */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </Box>
          )}

          {/* Empty */}
          {!loading && records.length === 0 && (
            <Box sx={{ textAlign: "center", py: 5, px: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
                <Box sx={{ p: 2, borderRadius: "50%", backgroundColor: "#f3f4f6" }}>
                  <CalendarDays size={18} color="#9ca3af" />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary", mb: 0.5 }}>
                No days off set
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {showAddForm ? "Fill in the form above to add one" : "Tap Add to mark days off"}
              </Typography>
            </Box>
          )}

          {/* Record list */}
          {!loading && records.length > 0 && (
            <Box sx={{ py: 1 }}>
              {records.map((record, index) => {
                const past = isPast(record.date);
                const date = moment(record.date, "DD/MM/YYYY");
                return (
                  <Box
                    key={record.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 3,
                      py: 2,
                      borderBottom: index < records.length - 1 ? "1px solid" : "none",
                      borderColor: "divider",
                      backgroundColor: past ? "#fffbeb" : "transparent",
                      transition: "background-color 0.15s",
                      "&:hover": { backgroundColor: past ? "#fef3c7" : "#f9fafb" },
                    }}
                  >
                    {/* Mini calendar column + text */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                      {/* Day / Month block */}
                      <Box
                        sx={{
                          textAlign: "center",
                          minWidth: 36,
                          p: "4px 6px",
                          borderRadius: 1,
                          backgroundColor: past ? "#fef3c7" : "#eff6ff",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: past ? "#92400e" : "#2563eb",
                            display: "block",
                            lineHeight: 1.2,
                            fontSize: "0.8125rem",
                          }}
                        >
                          {date.format("D")}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: past ? "#d97706" : "#60a5fa",
                            fontSize: "0.625rem",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {date.format("MMM [']YY")}
                        </Typography>
                      </Box>

                      {/* Day name + note */}
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: past ? "#92400e" : "text.primary", lineHeight: 1.4 }}>
                            {date.format("dddd")}
                          </Typography>
                          {past && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-200 text-amber-800">
                              Past
                            </span>
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {record.note || "No note"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Delete button */}
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(record.id)}
                      sx={{
                        color: "text.disabled",
                        "&:hover": { color: "#dc2626", backgroundColor: "rgba(220, 38, 38, 0.06)" },
                        transition: "color 0.15s, background-color 0.15s",
                      }}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>

        {/* ── Footer ── */}
        <DialogActions sx={{ borderTop: "1px solid", borderColor: "divider", px: 3, py: 1.5 }}>
          <Button
            onClick={onClose}
            size="small"
            sx={{ color: "text.secondary", fontSize: "0.8125rem" }}
          >
            Close
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
        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
            Remove day off?
          </Typography>
        </Box>
        <DialogContent sx={{ px: 3, pt: 0.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
            This staff member will show as available on that date again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            size="small"
            sx={{ color: "text.secondary", fontSize: "0.78125rem" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            size="small"
            variant="contained"
            color="error"
            sx={{ fontWeight: 500, fontSize: "0.78125rem", px: 2 }}
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
    </>
  );
};

export default StaffUnavailabilityDialog;
