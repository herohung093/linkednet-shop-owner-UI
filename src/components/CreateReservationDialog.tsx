import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { axiosWithToken } from "../utils/axios";
import moment from "moment";
import LoadingButton from "@mui/lab/LoadingButton";
import ActionResultDialog from "./dialogs/ActionResultDialog";

interface CreateReservationDialogProps {
  isCreateDialogOpen: boolean;
  handleCreateDialogClose: () => void;
  selectedDate: moment.Moment | null;
  onReservationCreated: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  note: string;
  selectedStaff: string;
  selectedServices: ServiceItem[];
  selectedAvailability: string;
}

const CreateReservationDialog: React.FC<CreateReservationDialogProps> = ({
  isCreateDialogOpen,
  handleCreateDialogClose,
  selectedDate,
  onReservationCreated,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [staffAvailability, setStaffAvailability] = useState<
    { time: string; staffs: number[] }[]
  >([]);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [actionResultOpen, setActionResultOpen] = useState<boolean>(false);
  const [actionResultMessage, setActionResultMessage] = useState<string>("");
  const [actionResultType, setActionResultType] = useState<
    "success" | "failure"
  >("success");

  const selectedStaff = watch("selectedStaff");
  const selectedServices = watch("selectedServices");
  const selectedAvailability = watch("selectedAvailability");

  // Fetch staff and services data
  useEffect(() => {
    const fetchStaffAndServices = async () => {
      try {
        const staffResponse = await axiosWithToken.get<Staff[]>("/staff/", {
          params: { isOnlyActive: true },
        });

        // Add the new staff member
        const anyStaffMember = {
          id: 0,
          firstName: "Any",
          lastName: "Professional",
          nickname: "Any",
          phone: "",
          skillLevel: 1,
          dateOfBirth: "",
          rate: 1,
          workingDays: "1,2,3,4,5,6,7",
          active: true,
          storeUuid: "default-store-uuid",
          tenantUuid: "default-tenant-uuid",
          isActive: true,
        };
        staffResponse.data.unshift(anyStaffMember);

        setStaffList(staffResponse.data);

        const servicesResponse = await axiosWithToken.get<ServiceItem[]>(
          "/service/active"
        );
        setServicesList(servicesResponse.data);
      } catch (error) {
        console.error("Error fetching staff and services:", error);
      }
    };

    fetchStaffAndServices();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedStaff) {
      const fetchStaffAvailability = async () => {
        try {
          const response = await axiosWithToken.get<{
            [key: string]: number[];
          }>(`/staff/allStaffAvailability`, {
            params: {
              staffId: selectedStaff,
              date: selectedDate.format("DD/MM/YYYY"),
            },
          });

          // Convert response data to a list of availability objects
          const availabilities = Object.entries(response.data).map(
            ([time, staffs]) => ({
              time,
              staffs,
            })
          );
          setStaffAvailability(availabilities);
        } catch (error) {
          console.error("Error fetching staff availability:", error);
        }
      };

      fetchStaffAvailability();
    }
  }, [selectedDate, selectedStaff]);

  useEffect(() => {
    // Calculate the estimated time
    const totalEstimatedTime =
      selectedServices?.reduce(
        (total, service) => total + service.estimatedTime,
        0
      ) || 0;
    setEstimatedTime(totalEstimatedTime);
  }, [selectedServices]);

  const findAvailabilityByTime = (time: string) => {
    return staffAvailability.find((availability) => availability.time === time);
  };

  const getRandomStaffId = (staffIds: number[]) => {
    const randomIndex = Math.floor(Math.random() * staffIds.length);
    return staffIds[randomIndex];
  };

  const onSubmit = async (data: FormData) => {
    if (
      !selectedDate ||
      !data.selectedStaff ||
      !data.selectedAvailability ||
      data.selectedServices.length === 0 ||
      !data.firstName ||
      !data.phone.match(/^04\d{8}$/)
    ) {
      alert("Please fill all fields correctly");
      return;
    }
    setIsCreating(true);

    let staffId = data.selectedStaff;
    if (staffId === "0") {
      const matchedAvailability = findAvailabilityByTime(
        data.selectedAvailability
      );
      if (matchedAvailability) {
        staffId = getRandomStaffId(matchedAvailability.staffs).toString();
      }
    }

    const newReservation = {
      date: selectedDate.format("DD/MM/YYYY"),
      bookingTime: `${selectedDate.format(
        "DD/MM/YYYY"
      )} ${selectedAvailability}`,
      staff: {
        id: staffId,
      },
      serviceItems: data.selectedServices.map((service) => ({
        id: service.id,
      })),
      note: data.note,
      customer: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    };

    try {
      await axiosWithToken.post("/reservation/", newReservation);
      setActionResultMessage("Booking created successfully!");
      setActionResultType("success");
      handleCreateDialogClose();
      onReservationCreated();
    } catch (error) {
      console.error("Error creating reservation:", error);
      setActionResultMessage(
        "Failed to create reservation. Please try again or contact admin for support."
      );
      setActionResultType("failure");
    } finally {
      setActionResultOpen(true);
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    handleCreateDialogClose();
    reset({
      firstName: "",
      lastName: "",
      phone: "",
      note: "",
      selectedStaff: "0",
      selectedServices: [],
      selectedAvailability: "",
    });
  };

  return (
    <>
      <Dialog open={isCreateDialogOpen} onClose={handleClose}>
        <DialogTitle>Create Reservation</DialogTitle>
        <DialogContent>
          <TextField
            label="Date"
            value={selectedDate ? selectedDate.format("DD/MM/YYYY") : ""}
            fullWidth
            margin="normal"
            disabled
          />
          <Controller
            name="firstName"
            control={control}
            defaultValue=""
            rules={{ required: "First name is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="First Name"
                required
                fullWidth
                margin="normal"
                error={!!errors.firstName}
                helperText={errors.firstName ? errors.firstName.message : ""}
              />
            )}
          />
          <Controller
            name="lastName"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="Last Name"
                fullWidth
                margin="normal"
                error={!!errors.lastName}
                helperText={errors.lastName ? errors.lastName.message : ""}
              />
            )}
          />
          <Controller
            name="phone"
            control={control}
            rules={{
              required: "Phone number is required",
              maxLength: {
                value: 10,
                message: "Phone number cannot exceed 10 digits",
              },
              minLength: {
                value: 10,
                message: "Phone number must be at least 10 digits",
              },
              pattern: {
                value: /^04\d{8}$/,
                message: "Phone number must start with 04",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone"
                type="tel"
                required
                fullWidth
                margin="normal"
                error={!!errors.phone}
                helperText={errors.phone ? errors.phone.message : ""}
                inputProps={{ maxLength: 10 }}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/\D/g, "");
                  field.onChange(target.value);
                }}
              />
            )}
          />
          <Controller
            name="selectedStaff"
            control={control}
            defaultValue="0"
            rules={{ required: "Staff selection is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Select Staff"
                fullWidth
                margin="normal"
                error={!!errors.selectedStaff}
                helperText={
                  errors.selectedStaff ? errors.selectedStaff.message : ""
                }
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        maxHeight: 48 * 10, // 48px is the default item height
                      },
                    },
                  },
                }}
              >
                {staffList.map((staff) => (
                  <MenuItem key={staff.id} value={staff.id ?? ""}>
                    {staff.nickname}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="selectedServices"
            control={control}
            defaultValue={[]}
            rules={{ required: "At least one service must be selected" }}
            render={({ field }) => (
              <Autocomplete
                {...field}
                multiple
                options={servicesList.filter(
                  (service) =>
                    !selectedServices?.some(
                      (selected) => selected.id === service.id
                    )
                )}
                getOptionLabel={(option) => option.serviceName}
                onChange={(event, newValue) =>
                  setValue("selectedServices", newValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Services"
                    margin="normal"
                    fullWidth
                    error={!!errors.selectedServices}
                    helperText={
                      errors.selectedServices
                        ? errors.selectedServices.message
                        : ""
                    }
                  />
                )}
              />
            )}
          />
          <Typography variant="body2" sx={{ marginTop: "8px" }}>
            Estimated Time: {estimatedTime} minutes
          </Typography>
          <Controller
            name="selectedAvailability"
            control={control}
            defaultValue=""
            rules={{ required: "Availability selection is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                required
                label="Select Availability"
                fullWidth
                margin="normal"
                error={!!errors.selectedAvailability}
                helperText={
                  errors.selectedAvailability
                    ? errors.selectedAvailability.message
                    : ""
                }
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      style: {
                        maxHeight: 48 * 10, // 48px is the default item height
                      },
                    },
                  },
                }}
              >
                {staffAvailability
                  .filter(
                    (availabilityItem) =>
                      availabilityItem.staffs.length > 0 &&
                      (selectedStaff === "0" ||
                        availabilityItem.staffs.includes(
                          parseInt(selectedStaff)
                        ))
                  )
                  .map((availabilityItem) => (
                    <MenuItem
                      key={availabilityItem.time}
                      value={availabilityItem.time}
                    >
                      {availabilityItem.time}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          />

          <Controller
            name="note"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="Note"
                fullWidth
                margin="normal"
                multiline
                rows={4}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="inherit"
            className="h-[35px] w-[135px] sm:w-[100px] rounded-md px-[15px]"
            onClick={handleClose}
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
          <LoadingButton
            type="submit"
            variant="contained"
            className="h-[35px] w-[135px] sm:w-[100px] rounded-md px-[15px]"
            loading={isCreating}
            onClick={handleSubmit(onSubmit)}
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
            Create
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <ActionResultDialog
        open={actionResultOpen}
        onClose={() => setActionResultOpen(false)}
        message={actionResultMessage}
        type={actionResultType}
      />
    </>
  );
};

export default CreateReservationDialog;
