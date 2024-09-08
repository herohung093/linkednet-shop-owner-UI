import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import EventRescheduleTimePicker from "../components/EventRescheduleTimePicker";
import moment from "moment";
import { axiosWithToken } from "../utils/axios";
import LoadingButton from "@mui/lab/LoadingButton";

const EditBookingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reservation = location.state as Reservation;
  const [expandAccordion, setExpandccordion] = useState<string | false>(
    "panel2"
  );
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [isEditBookingError, setIsEditBookingError] = useState<boolean>(false);
  const [isUpdatingBooking, setIsUpdatingBooking] = useState<boolean>(false);

  const handleConfirmCancel = () => {
    setConfirmDialogOpen(false);
  };

  const handleConfirmYes = async () => {
    setIsUpdatingBooking(true);
    const response = await axiosWithToken.put(
      "/reservation/",
      newTimeReservations
    );
    setConfirmDialogOpen(false);
    if (response.status !== 200) {
      setIsEditBookingError(true);
      return;
    } else {
      // @ts-ignore
      navigate(-1, { replace: true });
    }
    setIsUpdatingBooking(false);
  };

  useEffect(() => {
    if (!reservation) {
      navigate("/404");
    }
  }, [reservation, navigate]);

  if (!reservation) {
    return null; // Render nothing while redirecting
  }

  const [updatedReservation] =
    React.useState<Reservation>(reservation);
  const [newTimeReservations, setNewTimeReservations] =
    useState<Reservation | null>();

  const handleAccordionChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandccordion(isExpanded ? panel : false);
    };

  const handleIconButtonClick = () => {
    setExpandccordion("panel2");
  };

  return (
    <Box>
      <Accordion
        expanded={expandAccordion === "panel1"}
        onChange={handleAccordionChange("panel1")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="booking-details-content"
          id="booking-details-header"
        >
          <Typography variant="h6" fontWeight="bold">
            Booking Details
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className="max-w-80">
            {reservation && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div className="flex flex-wrap items-center gap-3 mb-[15px]">
                  <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="w-[100px] text-left text-[15px]">
                      Booking ID
                    </label>
                    <label className="Input non-editable-label">
                      {updatedReservation.id}
                    </label>
                  </fieldset>
                  <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="w-[100px] text-left text-[15px] sm:text-right">
                      Staff
                    </label>
                    <label className="Input non-editable-label">
                      {updatedReservation.staff.nickname}
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
                      onClick={handleIconButtonClick}
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
                      {updatedReservation.bookingTime.split(" ")[1]} -{" "}
                      {updatedReservation.endTime.split(" ")[1]} (
                      {updatedReservation.totalEstimatedTime} mins)
                      <EditIcon fontSize="medium" className="ml-1" />
                    </IconButton>
                  </div>
                </fieldset>

                <fieldset className="mb-[15px] flex items-center gap-3">
                  <label className="w-[100px] text-left text-[15px]">
                    Total Price
                  </label>
                  <label className="Input non-editable-label">
                    ${updatedReservation.totalPrice}
                  </label>
                </fieldset>
                <fieldset className="mb-[15px] flex items-center gap-3">
                  <label className="w-[100px] text-left text-[15px]">
                    Status
                  </label>
                  <label className="Input non-editable-label">
                    {updatedReservation.status}
                  </label>
                </fieldset>
                <fieldset className="mb-[15px] flex items-center gap-3">
                  <label className="w-[100px] text-left text-[15px]">
                    Customer
                  </label>
                  <label className="Input non-editable-label">
                    {updatedReservation.customer.firstName}{" "}
                    {updatedReservation.customer.lastName}
                  </label>
                </fieldset>
                <div className="flex flex-wrap items-center gap-3 mb-[15px]">
                  {updatedReservation.customer.email && (
                    <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="w-[100px] text-left text-[15px]">
                        Email
                      </label>
                      <label className="Input non-editable-label">
                        {updatedReservation.customer.email}
                      </label>
                    </fieldset>
                  )}
                  {updatedReservation.customer.phone && (
                    <fieldset className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="w-[100px] text-left text-[15px] sm:text-right">
                        Phone
                      </label>
                      <label className="Input non-editable-label">
                        {`${updatedReservation.customer.phone.slice(
                          0,
                          4
                        )} ${updatedReservation.customer.phone.slice(
                          4,
                          7
                        )} ${updatedReservation.customer.phone.slice(7, 10)}`}
                      </label>
                    </fieldset>
                  )}
                  {updatedReservation.customer.blacklisted && (
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
                  <label className="w-[100px] text-left text-[15px]">
                    Note
                  </label>
                  <label className="Input text-left break-words non-editable-label">
                    {updatedReservation.note}
                  </label>
                </fieldset>
                <fieldset className="mb-[15px] flex items-center gap-3">
                  <label className="w-[100px] text-left text-[15px]">
                    Service Items
                  </label>
                  <div className="bg-gray-100 p-3 rounded-md w-full">
                    <ul className="list-disc pl-5">
                      {updatedReservation.serviceItems.map(
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
          </div>
        </AccordionDetails>
      </Accordion>
      <Accordion
        defaultExpanded
        expanded={expandAccordion === "panel2"}
        onChange={handleAccordionChange("panel2")}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="booking-time-content"
          id="booking-time-header"
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Select Booking Time
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ marginTop: "1px", marginBottom: "1px", marginLeft: "10px" }}
            >
              {moment(
                updatedReservation.bookingTime.split(" ")[0],
                "DD/MM/YYYY"
              ).format("ddd, DD MMM YYYY")}{" "}
              - {updatedReservation.bookingTime.split(" ")[1]}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <EventRescheduleTimePicker
            reservation={updatedReservation}
            onUpdateReservation={function (
              updatedReservation: Reservation
            ): void {
              setNewTimeReservations(updatedReservation);
              setConfirmDialogOpen(true);
            }}
          />
        </AccordionDetails>
      </Accordion>
      <Dialog open={confirmDialogOpen} onClose={handleConfirmCancel}>
        <DialogTitle>Confirm New Booking Time</DialogTitle>
        <DialogContent>
          <Typography>
            Reschedule the booking time to {" "}
            {moment(
              newTimeReservations?.bookingTime.split(" ")[0],
              "DD/MM/YYYY"
            ).format("dddd, DD MMM YYYY")}{" "}
            at {newTimeReservations?.bookingTime.split(" ")[1]}?
          </Typography>
          {isEditBookingError && (
            <Typography color="error">
              Error occurred while rescheduling the booking time. Please try
              again later.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <LoadingButton
              onClick={handleConfirmYes}
              variant="contained" // Use 'contained' to have a solid background color
              className="h-[35px] w-[135px] sm:w-[100px] rounded-md px-[15px]"
              loading={isUpdatingBooking}
              loadingIndicator={
                <CircularProgress style={{ color: "white" }} size={24} />
              }
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
              Confirm
            </LoadingButton>
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
            onClick={handleConfirmCancel}
          >
            Abort
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditBookingPage;
