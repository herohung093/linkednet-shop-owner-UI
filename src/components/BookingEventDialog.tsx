import React, { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useNavigate } from "react-router";
import { CheckCircle, Error, HourglassEmpty } from "@mui/icons-material";
import { getEndTimeForFirstGuest } from "../utils/ReservationUtils";
import CreateReservationDialog from "./CreateReservationDialog";
import moment from "moment";

interface BookingEventDialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  selectedEvent: ProcessedEvent | null;
  handleStatusChange: (value: string) => void;
  handleSubmit: () => void;
  isStatusModified: boolean;
  onReservationUpdated?: () => void;
}

const BookingEventDialog: React.FC<BookingEventDialogProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  selectedEvent,
  handleStatusChange,
  handleSubmit,
  isStatusModified,
  onReservationUpdated,
}) => {
  const navigate = useNavigate();
  const [copyPhoneNumberSuccess, setCopyPhoneNumberSuccess] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Flag to prevent focus conflicts
  const [isTransitioningToEdit, setIsTransitioningToEdit] = useState(false);

  // State for draggable dialog
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  // Ref points back to Dialog.Content
  const dialogRef = useRef<HTMLDivElement>(null); 

  // Check if booking is in the past
  const isBookingInPast = () => {
    if (selectedEvent?.data?.bookingTime) {
      const bookingDateTime = moment(selectedEvent.data.bookingTime, "DD/MM/YYYY HH:mm");
      return bookingDateTime.isBefore(moment());
    }
    return false;
  };

  const isPastBooking = isBookingInPast();

  // Reset position state when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setPosition({ x: 0, y: 0 }); 
    }
  }, [isDialogOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if the drag handle (title) was clicked
    if ((e.target as HTMLElement).closest('.dialog-title')) {
      setIsDragging(true);
      // Calculate initial mouse position relative to the element's current offset
      setInitialMousePos({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.preventDefault(); 
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - initialMousePos.x,
        y: e.clientY - initialMousePos.y
      });
      e.preventDefault(); 
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    // Add/remove listeners on the window
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    // Cleanup listeners
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleCopyPhoneNumber = () => {
    if (selectedEvent && selectedEvent.data && selectedEvent.data.customer) {
      navigator.clipboard.writeText(selectedEvent.data.customer.phone);
    }
    setCopyPhoneNumberSuccess(true);
  };

  const handleCloseSnackbar = () => {
    setCopyPhoneNumberSuccess(false);
  };

  const handleEditClick = () => {
    if (selectedEvent && selectedEvent.data && !isPastBooking) {
      // Set flag to prevent focus conflicts
      setIsTransitioningToEdit(true);
      // Close the current dialog first
      setIsDialogOpen(false);
      
      // Give time for the first dialog to properly close before opening the edit dialog
      setTimeout(() => {
        setIsEditDialogOpen(true);
        setIsTransitioningToEdit(false);
      }, 100);
    }
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
  };

  const handleReservationEdited = () => {
    setIsEditDialogOpen(false);
    if (onReservationUpdated) {
      onReservationUpdated();
    }
  };

  // Clean up when dialog state changes
  useEffect(() => {
    return () => {
      // Clean up any potential focus traps when unmounting
      if (!isDialogOpen && !isEditDialogOpen) {
        setIsTransitioningToEdit(false);
      }
    };
  }, [isDialogOpen, isEditDialogOpen]);

  const renderCommunicationStatus = (status: string) => {
    switch (status) {
      case "SUCCESS":
      case "Delivered":
        return <CheckCircle style={{ color: "green" }} />;
      case "Undelivered":
        return <Error style={{ color: "red" }} />;
      default:
        return <HourglassEmpty style={{ color: "gray" }} />;
    }
  };

  // Parse the selectedDate from bookingTime
  const getSelectedDate = () => {
    if (selectedEvent && selectedEvent.data) {
      const dateStr = selectedEvent.data.bookingTime.split(" ")[0]; // "DD/MM/YYYY"
      return moment(dateStr, "DD/MM/YYYY");
    }
    return null;
  };

  return (
    <>
      {/* Only render main dialog if not transitioning to edit */}
      {!isTransitioningToEdit && (
        <Dialog.Root 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            // Only allow changing if not transitioning
            if (!isTransitioningToEdit) {
              setIsDialogOpen(open);
            }
          }}
        >
          <Dialog.Overlay className="overlay-dialog data-[state=open]:animate-overlayShow" />
          {/* Apply drag logic directly to Dialog.Content */}
          <Dialog.Content
            ref={dialogRef} // Attach ref here
            className="data-[state=open]:animate-contentShow content-dialog z-20"
            aria-describedby={undefined}
            style={{
              maxHeight: "80vh",
              maxWidth: "min(90vw, 480px)",
              width: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              // Combine Radix's centering transform with our drag transform
              // Note: Radix applies translate(-50%, -50%) via CSS class 'content-dialog'
              // We add our drag offset to that.
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
              cursor: isDragging ? "grabbing" : "auto",
              // Apply transition only when not dragging
              transition: isDragging ? "none" : "transform 0.1s ease",
              // Ensure Radix's default top/left are applied (usually 50%)
              // These should be handled by the 'content-dialog' class
            }}
            onMouseDown={handleMouseDown} // Attach mouse down handler here
          >
            {/* Remove the inner wrapper div */}
            <Dialog.Title 
              className="text-slate-700 m-0 text-[17px] font-medium mb-5 dialog-title" 
              style={{ cursor: "grab", userSelect: 'none' }} 
            >
              Booking Details
            </Dialog.Title>
            {/* Keep the rest of the content directly inside Dialog.Content */}
            <div>
              {selectedEvent && (
                <div className="grid gap-3" style={{ gridTemplateColumns: "90px 1fr" }}>
                  {/* Booking ID */}
                  <label className="text-[14px] text-slate-600 py-1">Booking ID</label>
                  <div className="flex items-center">
                    <span className="Input">{selectedEvent.data.id}</span>
                  </div>

                  {/* Created At */}
                  <label className="text-[14px] text-slate-600 py-1">Created At</label>
                  <div className="flex items-center">
                    <span className="Input">{selectedEvent.data.createdTime}</span>
                  </div>

                  {/* Booking Time */}
                  <label className="text-[14px] text-slate-600 py-1">Booking Time</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <IconButton
                      size="small"
                      aria-label="edit booking time"
                      onClick={handleEditClick}
                      disabled={isPastBooking}
                      sx={{
                        color: "#284f5b",
                        borderRadius: "20px",
                        backgroundColor: isPastBooking ? "#e0e0e0" : "#d3eae2",
                        border: "1px solid #E5E7EB",
                        fontSize: "13px",
                        paddingRight: "0.5rem",
                        paddingLeft: "0.5rem",
                        whiteSpace: "nowrap",
                        '&.Mui-disabled': {
                          color: 'rgba(0, 0, 0, 0.38)',
                        },
                      }}
                    >
                      {selectedEvent.data.bookingTime} - {getEndTimeForFirstGuest(selectedEvent.data).split(" ")[1]} ({selectedEvent.data.guests[0]?.totalEstimatedTime}m)
                      <EditIcon fontSize="small" sx={{ ml: 0.5 }} />
                    </IconButton>
                    {isPastBooking && (
                      <Chip
                        label="Past"
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </div>

                  {/* Total Price */}
                  <label className="text-[14px] text-slate-600 py-1">Total Price</label>
                  <div className="flex items-center">
                    <span className="Input">${selectedEvent.data.totalPrice}</span>
                  </div>

                  {/* Status */}
                  <label className="text-[14px] text-slate-600 py-1">Status</label>
                  <div className="flex items-center gap-2">
                    <Select.Root
                      value={selectedEvent.data.status}
                      onValueChange={handleStatusChange}
                      disabled={isPastBooking}
                    >
                      <Select.Trigger className="SelectTrigger" style={{ opacity: isPastBooking ? 0.7 : 1 }}>
                        <Select.Value placeholder="Select a status…" />
                        <Select.Icon className="SelectIcon">
                          <ChevronDownIcon />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Content className="SelectContent" position="popper">
                        <Select.Viewport className="SelectViewport">
                          <Select.Item className="SelectItem" value="PENDING">
                            <Select.ItemText>Pending</Select.ItemText>
                            <Select.ItemIndicator className="SelectItemIndicator">
                              <CheckIcon />
                            </Select.ItemIndicator>
                          </Select.Item>
                          <Select.Item className="SelectItem" value="CONFIRMED">
                            <Select.ItemText>Confirmed</Select.ItemText>
                            <Select.ItemIndicator className="SelectItemIndicator">
                              <CheckIcon />
                            </Select.ItemIndicator>
                          </Select.Item>
                          <Select.Item className="SelectItem" value="CANCELLED">
                            <Select.ItemText>Cancelled</Select.ItemText>
                            <Select.ItemIndicator className="SelectItemIndicator">
                              <CheckIcon />
                            </Select.ItemIndicator>
                          </Select.Item>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Root>
                    {selectedEvent.data.walkInBooking && (
                      <Chip label="Walk-in" color="info" variant="outlined" size="small" />
                    )}
                  </div>

                  {/* Customer */}
                  <label className="text-[14px] text-slate-600 py-1">Customer</label>
                  <div className="flex items-center gap-2">
                    <span className="Input">
                      {selectedEvent.data.customer.firstName}{" "}
                      {selectedEvent.data.customer.lastName}
                    </span>
                    {selectedEvent.data.customer.blacklisted && (
                      <Chip label="Blacklisted" color="error" variant="outlined" size="small" />
                    )}
                    <Tooltip title={isPastBooking ? "Cannot edit past bookings" : "Edit Booking"}>
                      <span>
                        <IconButton
                          aria-label="edit booking"
                          onClick={handleEditClick}
                          size="small"
                          disabled={isPastBooking}
                          sx={{
                            color: "#284f5b",
                            backgroundColor: isPastBooking ? "#e0e0e0" : "#d3eae2",
                            border: "1px solid #E5E7EB",
                            '&:hover': {
                              backgroundColor: isPastBooking ? "#e0e0e0" : "#b5d0c7"
                            },
                            '&.Mui-disabled': {
                              color: 'rgba(0, 0, 0, 0.38)',
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </div>

                  {/* Phone */}
                  {selectedEvent.data.customer.phone && (
                    <>
                      <label className="text-[14px] text-slate-600 py-1">Phone</label>
                      <div className="flex items-center">
                        <Link
                          href={`tel:${selectedEvent.data.customer.phone}`}
                          className="Input clickable-label"
                          underline="always"
                        >
                          {`${selectedEvent.data.customer.phone.slice(0, 4)} ${selectedEvent.data.customer.phone.slice(4, 7)} ${selectedEvent.data.customer.phone.slice(7, 10)}`}
                        </Link>
                        <Tooltip title="Copy Phone Number">
                          <IconButton
                            aria-label="copy phone number"
                            onClick={handleCopyPhoneNumber}
                            size="small"
                          >
                            <ContentCopyIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Snackbar
                          open={copyPhoneNumberSuccess}
                          autoHideDuration={3000}
                          onClose={handleCloseSnackbar}
                          message="Phone number copied to clipboard"
                        />
                      </div>
                    </>
                  )}

                  {/* Email */}
                  {selectedEvent.data.customer.email && (
                    <>
                      <label className="text-[14px] text-slate-600 py-1">Email</label>
                      <div className="flex items-center">
                        <span className="Input">{selectedEvent.data.customer.email}</span>
                      </div>
                    </>
                  )}

                  {/* Note */}
                  <label className="text-[14px] text-slate-600 py-1">Note</label>
                  <div className="flex items-center">
                    <span className="Input text-left break-words">{selectedEvent.data.note}</span>
                  </div>

                  {/* Guests Details */}
                  <label className="text-[14px] text-slate-600 py-1">Guests</label>
                  <div>
                    {selectedEvent.data.guests.map((guest) => (
                      <Box key={guest.name + guest.id} sx={{ mb: 1 }}>
                        <Typography variant="body1" color="text.primary" fontWeight={500}>
                          {guest.name === "Me"
                            ? selectedEvent.data.customer.firstName
                            : guest.name || "Guest"}{" "}
                          - {guest.totalEstimatedTime} mins
                        </Typography>
                        <List sx={{ pt: 0, pb: 0 }}>
                          {guest.guestServices?.map((guestService) => (
                            <ListItem
                              key={guest.name + guestService.serviceItem.id}
                              sx={{ pt: 0, pb: 0 }}
                            >
                              <ListItemText
                                primary={
                                  <Box display="flex" justifyContent="space-between" width="100%">
                                    <Typography variant="body2" color="text.primary">
                                      {guestService.serviceItem.serviceName}{" "}
                                      {guestService.staff && `(${guestService.staff.nickname})`}
                                    </Typography>
                                    <Typography variant="caption" color="text.primary">
                                      ${guestService.serviceItem.servicePrice.toFixed(2)}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                        <Divider sx={{ my: 1 }} />
                      </Box>
                    ))}
                  </div>

                  {/* SMS Communication */}
                  <label className="text-[14px] text-slate-600 py-1">SMS</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto auto",
                      gap: "4px 8px",
                      alignItems: "center",
                      color: "#334155"
                    }}
                  >
                    <span>Booking Acknowledgement:</span>
                    {renderCommunicationStatus(selectedEvent?.data?.communication?.BOOKING_ACK)}
                    <span>First Reminder:</span>
                    {renderCommunicationStatus(selectedEvent?.data?.communication?.FIRST_BOOKING_REMINDER)}
                    <span>Final Reminder:</span>
                    {renderCommunicationStatus(selectedEvent?.data?.communication?.FINAL_BOOKING_REMINDER)}
                  </div>
                </div>
              )}
              <div className="mt-[25px] flex justify-end">
                <Dialog.Close asChild>
                  {isStatusModified && !isPastBooking && (
                    <Button
                      variant="contained"
                      color="inherit"
                      className="h-[35px] w-[135px] sm:w-[100px] rounded-md px-[15px]"
                      sx={{
                        backgroundColor: "black",
                        color: "white",
                        borderRadius: "20px",
                        marginLeft: "1rem",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "grey",
                        },
                      }}
                      onClick={handleSubmit}
                    >
                      Submit
                    </Button>
                  )}
                </Dialog.Close>
                <Dialog.Close asChild>
                  <Button
                    variant="contained"
                    color="inherit"
                    className="h-[35px] w-[135px] sm:w-[100px] rounded-md px-[15px]"
                    sx={{
                      backgroundColor: "black",
                      color: "white",
                      borderRadius: "20px",
                      marginLeft: "1rem",
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "grey",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="absolute top-[10px] right-[10px] inline-flex h-[35px] w-[35px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                aria-label="Close"
                onMouseDown={(e) => e.stopPropagation()} 
              >
                <CloseSharpIcon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Root>
      )}
      
      {/* Only render edit dialog when it should actually be open */}
      {isEditDialogOpen && !isDialogOpen && selectedEvent && (
        <CreateReservationDialog
          isCreateDialogOpen={isEditDialogOpen}
          handleCreateDialogClose={handleEditDialogClose}
          selectedDate={getSelectedDate()}
          onReservationCreated={handleReservationEdited}
          isEditMode={true}
          existingReservation={selectedEvent.data}
        />
      )}
    </>
  );
};

export default BookingEventDialog;
