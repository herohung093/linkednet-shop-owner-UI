import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Link,
  Snackbar,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useNavigate } from "react-router";

interface BookingEventDialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  selectedEvent: ProcessedEvent | null;
  handleStatusChange: (value: string) => void;
  handleSubmit: () => void;
  isStatusModified: boolean;
}

const BookingEventDialog: React.FC<BookingEventDialogProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  selectedEvent,
  handleStatusChange,
  handleSubmit,
  isStatusModified,
}) => {
  const navigate = useNavigate();

  const [copyPhoneNumberSuccess, setCopyPhoneNumberSuccess] = useState(false);

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
    if (selectedEvent && selectedEvent.data) {
      navigate("/edit-booking", { state: selectedEvent.data });
    }
  };

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Dialog.Overlay className="overlay-dialog data-[state=open]:animate-overlayShow" />
      <Dialog.Content
        className="data-[state=open]:animate-contentShow content-dialog z-20"
        aria-describedby={undefined}
        style={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        <Dialog.Title className="text-slate-700 m-0 text-[17px] font-medium mb-5">
          Booking Details
        </Dialog.Title>
        <div>
          {selectedEvent && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div className="flex flex-wrap items-center gap-3 mb-[15px]">
                <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="w-[100px] text-left text-[15px]">
                    Booking ID
                  </label>
                  <label className="Input non-editable-label">
                    {selectedEvent.data.id}
                  </label>
                </fieldset>
                <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="w-[100px] text-left text-[15px] sm:text-right">
                    Staff
                  </label>
                  <label className="Input non-editable-label">
                    {selectedEvent.data.staff.nickname}
                  </label>
                </fieldset>
                <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="w-[100px] text-left text-[15px] sm:text-right">
                    Created At
                  </label>
                  <label className="Input non-editable-label">
                    {selectedEvent.data.createdTime}
                  </label>
                </fieldset>
              </div>
              <fieldset className="mb-[2px] flex items-center gap-3">
                <label className="w-[100px] text-left text-[15px]">
                  Booking Time
                </label>
                <div className="flex-grow flex items-center justify-between">
                  <IconButton
                    size="small"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleEditClick}
                    sx={{
                      color: "#284f5b",
                      borderRadius: "20px",
                      backgroundColor: "#d3eae2",
                      border: "1px solid #E5E7EB",
                      fontSize: "14px",
                      paddingRight: "0.5rem",
                      paddingLeft: "0.5rem",
                    }}
                  >
                    {selectedEvent.data.bookingTime.split(" ")[1]} -{" "}
                    {selectedEvent.data.endTime.split(" ")[1]} (
                    {selectedEvent.data.totalEstimatedTime} mins)
                    <EditIcon fontSize="medium" className="ml-1" />
                  </IconButton>
                </div>
              </fieldset>

              <fieldset className="mb-[15px] flex items-center gap-3">
                <label className="w-[100px] text-left text-[15px]">
                  Total Price
                </label>
                <label className="Input non-editable-label">
                  ${selectedEvent.data.totalPrice}
                </label>
              </fieldset>
              <fieldset className="mb-[15px] flex items-center gap-3">
                <label className="w-[100px] text-left text-[15px]">
                  Status
                </label>
                <Select.Root
                  value={selectedEvent.data.status}
                  onValueChange={handleStatusChange}
                >
                  <Select.Trigger className="SelectTrigger">
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
              </fieldset>

              <fieldset className="mb-[15px] flex items-center gap-3">
                <label className="w-[100px] text-left text-[15px]">
                  Customer
                </label>
                <label className="Input non-editable-label">
                  {selectedEvent.data.customer.firstName}{" "}
                  {selectedEvent.data.customer.lastName}
                </label>
              </fieldset>
              <div className="flex flex-wrap items-center gap-3 mb-[15px]">
                {selectedEvent.data.customer.email && (
                  <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="w-[100px] text-left text-[15px]">
                      Email
                    </label>
                    <label className="Input non-editable-label">
                      {selectedEvent.data.customer.email}
                    </label>
                  </fieldset>
                )}
                {selectedEvent.data.customer.phone && (
                  <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="w-[100px] text-left text-[15px] sm:text-right">
                      Phone
                    </label>
                    <Box display="flex" alignItems="center">
                      <Link
                        href={`tel:${selectedEvent.data.customer.phone}`}
                        className="Input clickable-label"
                        underline="always"
                      >
                        {`${selectedEvent.data.customer.phone.slice(
                          0,
                          4
                        )} ${selectedEvent.data.customer.phone.slice(
                          4,
                          7
                        )} ${selectedEvent.data.customer.phone.slice(7, 10)}`}
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
                    </Box>
                    <Snackbar
                      open={copyPhoneNumberSuccess}
                      autoHideDuration={3000}
                      onClose={handleCloseSnackbar}
                      message="Phone number copied to clipboard"
                    />
                  </fieldset>
                )}
                {selectedEvent.data.customer.blacklisted && (
                  <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="w-[100px] text-left text-[15px] sm:text-right">
                      Status
                    </label>
                    <Chip
                      label="Blacklisted"
                      color="error"
                      variant="outlined"
                    />
                  </fieldset>
                )}
              </div>
              <fieldset className="mb-[15px] flex items-center gap-3">
                <label className="w-[100px] text-left text-[15px]">Note</label>
                <label className="Input text-left break-words non-editable-label">
                  {selectedEvent.data.note}
                </label>
              </fieldset>
              <fieldset className="mb-[15px] flex items-center gap-3">
                <label className="w-[100px] text-left text-[15px]">
                  Service Items
                </label>
                <div className="bg-gray-100 p-3 rounded-md w-full">
                  <ul className="list-disc pl-5">
                    {selectedEvent.data.serviceItems.map(
                      (item, index: number) => (
                        <li key={index}>
                          {item.serviceName} - ({item.estimatedTime} mins)
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </fieldset>
            </div>
          )}
          <div className="mt-[25px] flex justify-end">
            <Dialog.Close asChild>
              {isStatusModified && (
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
          >
            <CloseSharpIcon />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default BookingEventDialog;
