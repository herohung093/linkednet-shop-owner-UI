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
  CircularProgress,
  IconButton,
  Checkbox, // Added Checkbox
  FormControlLabel, // Added FormControlLabel
} from "@mui/material";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { axiosWithToken } from "../utils/axios";
import moment from "moment";
import LoadingButton from "@mui/lab/LoadingButton";
import ActionResultDialog from "./dialogs/ActionResultDialog";
import { RootState } from "../redux toolkit/store";
import { useSelector } from "react-redux";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

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
  selectedAvailability: string;
  guests: Guest[];
  walkInBooking: boolean; // Added walkInBooking field
}

/**
 * CreateReservationDialog Component
 * 
 * This component provides a dialog for creating new reservations/bookings.
 * It allows users to:
 * - Enter customer information or select from existing customers
 * - Add multiple guests for group bookings
 * - Select services for each guest
 * - Choose staff and available time slots
 * - Add notes for the reservation
 */
const CreateReservationDialog: React.FC<CreateReservationDialogProps> = ({
  isCreateDialogOpen,
  handleCreateDialogClose,
  selectedDate,
  onReservationCreated,
}) => {
  // Form handling with React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      note: "",
      selectedAvailability: "",
      guests: [
        {
          id: null,
          name: "Guest 1",
          guestServices: null,
          totalPrice: 0,
          totalEstimatedTime: 0,
        },
      ],
      walkInBooking: true, // Set default value
    },
  });

  // Setup for managing multiple guests
  const {
    fields: guestFields,
    append: appendGuest,
    remove,
  } = useFieldArray({
    control,
    name: "guests",
  });

  // State management
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [staffAvailability, setStaffAvailability] = useState<
    { time: string; staffs: number[] }[]
  >([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [actionResultOpen, setActionResultOpen] = useState<boolean>(false);
  const [actionResultMessage, setActionResultMessage] = useState<string>("");
  const [actionResultType, setActionResultType] = useState<
    "success" | "failure"
  >("success");

  // Customer search state
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerSearchInput, setCustomerSearchInput] = useState<string>(""); // New state for dedicated search input
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null); // State to hold selected customer for Autocomplete value
  const [customerSearchTimer, setCustomerSearchTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Highlights matching text in search results
   * @param text - The text to be searched within (e.g., phone number or service name)
   * @param query - The search query to match and highlight
   * @returns React element with highlighted matching text
   */
  const highlightMatch = (text: string, query: string) => {
    if (!query || !text || query.length < 2) {
      // Return plain text wrapped in a span if no query or text is too short
      return <span>{text}</span>;
    }

    // Escape special regex characters from the query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Create a case-insensitive global regex to find all occurrences
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Check if there's any match
    if (!regex.test(text)) {
      return <span>{text}</span>; // Return plain text if no match
    }

    // Replace matches with the same text wrapped in a bold span
    // Using a span with inline style for boldness
    const highlightedText = text.replace(regex, '<span style="font-weight: bold;">$1</span>');

    // Use dangerouslySetInnerHTML to render the HTML string
    // Wrap in a parent span to ensure it's treated as a single element by Autocomplete
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // Watch form values for conditional logic
  const selectedStaff = watch("selectedStaff");
  const selectedAvailability = watch("selectedAvailability");
  const walkInBooking = watch("walkInBooking"); // Watch the walkInBooking field
  const storeConfig = useSelector(
    (state: RootState) => state.storesList?.storesList?.[0]
  );

  // ========== EFFECTS ==========

  /**
   * Effect: Fetch initial staff and services data when component mounts
   */
  useEffect(() => {
    const fetchStaffAndServices = async () => {
      try {
        // Get active staff members
        const staffResponse = await axiosWithToken.get<Staff[]>("/staff/", {
          params: { isOnlyActive: true },
        });

        // Add "Any Professional" option for flexible bookings
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

        // Get active services
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

  /**
   * Effect: Prevent dialog from staying open on page refresh
   */
  useEffect(() => {
    // if the dialog is open on refresh, close it
    if (isCreateDialogOpen) {
      handleCreateDialogClose();
    }
  }, []); // empty dependency array so it only runs once on component mount

  /**
   * Effect: Fetch staff availability when date or selected staff changes
   */
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
  }, [selectedDate, selectedStaff, isCreateDialogOpen]);

  /**
   * Effect: Handle customer search with debouncing
   * Only searches after user stops typing for 300ms and has entered at least 3 characters
   */
  useEffect(() => {
    if (customerSearchTimer) {
      clearTimeout(customerSearchTimer);
    }

    // Use customerSearchInput instead of searchString
    if (!customerSearchInput || customerSearchInput.length < 3) {
      setCustomerResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await axiosWithToken.get("/customer/search", {
          params: {
            page: 0,
            size: 10,
            sort: "id,DESC",
            filterBlacklisted: false,
            searchString: customerSearchInput, // Use customerSearchInput here
          },
        });
        setCustomerResults(response.data?.content || []);
      } catch (error) {
        console.error("Error searching customers:", error);
      }
    }, 300); // Debounce for 300ms
    
    setCustomerSearchTimer(timer);
    return () => clearTimeout(timer);
  }, [customerSearchInput]); // Depend on customerSearchInput

  /**
   * Effect: Reset staff selection to "Any" when guest count changes
   * This is because staff assignments work differently for single vs. group bookings
   */
  useEffect(() => {
    setValue("selectedStaff", "0"); // 0 represents "Any"
  }, [guestFields.length, setValue]);

  // ========== HELPER FUNCTIONS ==========

  /**
   * Find availability object by time
   */
  const findAvailabilityByTime = (time: string) => {
    return staffAvailability.find((availability) => availability.time === time);
  };

  /**
   * Get a random staff ID from available staff
   * Used for "Any Professional" bookings
   */
  const getRandomStaffId = (staffIds: number[]) => {
    const randomIndex = Math.floor(Math.random() * staffIds.length);
    return staffIds[randomIndex];
  };

  /**
   * Validate that all guests have at least one service selected
   */
  const validateGuestServices = (guests: Guest[]): boolean => {
    return guests.every(
      (guest) => guest.guestServices && guest.guestServices.length > 0
    );
  };

  // ========== FORM SUBMISSION ==========

  /**
   * Handle form submission to create a new reservation
   */
  const onSubmit = async (data: FormData) => {
    // Validate required fields and services
    const isPhoneRequired = !data.walkInBooking;
    const isPhoneValid = isPhoneRequired ? data.phone.match(/^04\d{8}$/) : true;

    if (
      !selectedDate ||
      !data.selectedAvailability ||
      !data.firstName ||
      (isPhoneRequired && !data.phone) || // Check phone only if required
      !isPhoneValid || // Check phone format only if required
      !validateGuestServices(data.guests)
    ) {
      let errorMessage = "Please fill all required fields correctly and ensure each guest has at least one service.";
      if (isPhoneRequired && !data.phone) {
        errorMessage = "Phone number is required for non-walk-in bookings.";
      } else if (isPhoneRequired && !isPhoneValid) {
        errorMessage = "Phone number must be a valid 10-digit Australian mobile number starting with 04.";
      }
      alert(errorMessage);
      return;
    }
    setIsCreating(true);

    let staffId = data.selectedStaff;
    // group booking always has staffId = 0
    if (staffId === "0") {
      // For "Any Professional" bookings
      const matchedAvailability = findAvailabilityByTime(
        data.selectedAvailability
      );
      if (matchedAvailability) {
        if (data.guests.length == 1) {
          // Single guest: assign random available staff
          staffId = getRandomStaffId(matchedAvailability.staffs).toString();
          data.guests[0].guestServices?.forEach((guestService) => {
            guestService.staff = staffList.find(
              (staff) => staff.id === parseInt(staffId)
            ) || {
              id: parseInt(staffId),
              firstName: "",
              lastName: "",
              nickname: "",
              phone: "",
              skillLevel: 1,
              dateOfBirth: "",
              rate: 1,
              workingDays: "",
              storeUuid: "",
              tenantUuid: "",
              isActive: true,
            };
          });
        } else {
          // Multiple guests: assign different staff to each guest
          data.guests.forEach((guest, index) => {
            const staffId = matchedAvailability.staffs[index];
            if (guest.guestServices) {
              guest.guestServices.forEach((guestService) => {
                guestService.staff = {
                  id: staffId,
                  firstName: "",
                  lastName: "",
                  nickname: "",
                  phone: "",
                  skillLevel: 1,
                  dateOfBirth: "",
                  rate: 1,
                  workingDays: "",
                  storeUuid: "",
                  tenantUuid: "",
                  isActive: true,
                };
              });
            }
          });
        }
      }
    } else {
      // Specific staff booking: assign selected staff to all services. Single booking
      data.guests.forEach((guest) => {
        if (guest.guestServices) {
          guest.guestServices.forEach((guestService) => {
            guestService.staff = staffList.find(
              (staff) => staff.id === parseInt(staffId)
            ) || {
              id: parseInt(staffId),
              firstName: "",
              lastName: "",
              nickname: "",
              phone: "",
              skillLevel: 1,
              dateOfBirth: "",
              rate: 1,
              workingDays: "",
              storeUuid: "",
              tenantUuid: "",
              isActive: true,
            };
          });
        }
      });
    }

    // Prepare reservation data for API
    const newReservation = {
      date: selectedDate.format("DD/MM/YYYY"),
      bookingTime: `${selectedDate.format(
        "DD/MM/YYYY"
      )} ${selectedAvailability}`,
      note: data.note,
      customer: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      guests: data.guests.map((g) => ({
        id: null,
        name: g.name,
        guestServices: g.guestServices
          ? g.guestServices.map((gs) => ({
              serviceItem: gs.serviceItem,
              staff: gs.staff,
            }))
          : null,
        totalPrice: 0,
        totalEstimatedTime: 0,
      })),
      walkInBooking: data.walkInBooking, // Include walkInBooking in payload
    };

    // Submit reservation to API
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
      handleClose();
    }
  };

  /**
   * Close dialog and reset form
   */
  const handleClose = () => {
    handleCreateDialogClose();
    setCustomerResults([]);
    setCustomerSearchInput(""); // Reset dedicated search input
    setSelectedCustomer(null); // Reset selected customer state
    reset({
      firstName: "",
      lastName: "",
      phone: "",
      note: "",
      selectedStaff: "0",
      selectedAvailability: "",
      guests: [
        {
          id: null,
          name: "Guest 1",
          guestServices: null,
          totalPrice: 0,
          totalEstimatedTime: 0,
        },
      ],
      walkInBooking: true, // Reset walkInBooking on close
    });
  };

  // ========== RENDER COMPONENT ==========
  return (
    <>
      <Dialog 
        open={isCreateDialogOpen} 
        onClose={handleClose}
        maxWidth="sm" // Add this prop
        fullWidth // add this to use the full maxWidth space
      >
        <DialogTitle>Create Reservation</DialogTitle>
        <DialogContent>
          {/* Date field (non-editable) */}
          <TextField
            label="Date"
            value={selectedDate ? selectedDate.format("DD/MM/YYYY") : ""}
            fullWidth
            margin="normal"
            disabled
          />

          {/* Dedicated Customer Search Autocomplete */}
          <Autocomplete
            freeSolo // Keep freeSolo if you want to allow typing non-matching text, otherwise remove
            options={customerResults}
            getOptionLabel={(option) => 
              // Display name and phone in the dropdown
              typeof option === 'string' ? option : `${option.firstName} ${option.lastName} - ${option.phone}`
            }
            value={selectedCustomer} // Control the value with state
            inputValue={customerSearchInput} // Control the input value with state
            onInputChange={(event, newInputValue) => {
              setCustomerSearchInput(newInputValue);
              // If input is cleared manually, reset selected customer
              if (newInputValue === '') {
                setSelectedCustomer(null);
                // Optionally clear the form fields too
                // setValue("firstName", "");
                // setValue("lastName", "");
                // setValue("phone", "");
              }
            }}
            onChange={(event, newValue) => {
              if (typeof newValue === 'object' && newValue !== null) {
                // Populate form fields on selection
                setValue("firstName", newValue.firstName || "", { shouldValidate: true });
                setValue("lastName", newValue.lastName || "", { shouldValidate: true });
                setValue("phone", newValue.phone || "", { shouldValidate: true });
                setSelectedCustomer(newValue); // Update the selected customer state
                setCustomerSearchInput(`${newValue.firstName} ${newValue.lastName} - ${newValue.phone}`); // Keep selected text in input
                setCustomerResults([]); // Clear results after selection
              } else {
                 // Handle case where user clears selection or types non-matching text
                 setSelectedCustomer(null); 
                 // Optionally clear form fields if search is cleared
                 // setValue("firstName", "");
                 // setValue("lastName", "");
                 // setValue("phone", "");
              }
            }}
            renderOption={(props, option) => (
              <li {...props}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span>
                    {highlightMatch(option.firstName || '', customerSearchInput)} {highlightMatch(option.lastName || '', customerSearchInput)}
                  </span>
                  <span>
                    {highlightMatch(option.phone || '', customerSearchInput)}
                  </span>
                </div>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Existing Customer (Name/Phone)"
                fullWidth
                margin="normal"
              />
            )}
          />
          
          {/* Customer information fields - Reverted to TextField */}
          <Controller
            name="firstName"
            control={control}
            defaultValue=""
            rules={{ required: "First name is required" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="First Name"
                required
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error ? fieldState.error.message : ""}
              />
            )}
          />
          <Controller
            name="lastName"
            control={control}
            defaultValue=""
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Last Name"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error ? fieldState.error.message : ""}
              />
            )}
          />
          
          {/* Phone field - Reverted to TextField */}
          <Controller
            name="phone"
            control={control}
            rules={{
              // Keep conditional validation rules
              required: walkInBooking ? false : "Phone number is required",
              pattern: walkInBooking ? undefined : {
                value: /^04\d{8}$/,
                message: "Phone number must start with 04 and be 10 digits",
              },
              maxLength: walkInBooking ? undefined : {
                value: 10,
                message: "Phone number cannot exceed 10 digits",
              },
              minLength: walkInBooking ? undefined : {
                value: 10,
                message: "Phone number must be at least 10 digits",
              },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Phone"
                type="tel" 
                required={!walkInBooking} // Keep dynamic required prop
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error ? fieldState.error.message : ""}
                inputProps={{ 
                  maxLength: 10 
                }}
                onInput={(e) => {
                  // Keep digit filtering for direct input
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/\D/g, "");
                  field.onChange(target.value); // Ensure react-hook-form state updates
                }}
              />
            )}
          />

          {/* Walk-in Booking Checkbox */}
          <Controller
            name="walkInBooking"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label="Once-off Booking (Walk-in)" // Updated label for clarity
              />
            )}
          />
          
          {/* Guest management */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <Button
              disabled={
                guestFields.length >=
                (storeConfig?.maxGuestsForGroupBooking ?? 1)
              }
              onClick={() => {
                if (
                  guestFields.length <
                  (storeConfig?.maxGuestsForGroupBooking ?? 1)
                ) {
                  appendGuest({
                    id: null,
                    name: `Guest ${guestFields.length + 1}`,
                    guestServices: null,
                    totalPrice: 0,
                    totalEstimatedTime: 0,
                  });
                }
              }}
            >
              + Add More Guest
            </Button>
          </div>
          
          {/* Service selection for each guest */}
          {guestFields.map((field, index) => (
            <div
              key={field.id}
              style={{ display: "flex", alignItems: "center" }}
            >
              <div style={{ flex: 1 }}>
                <Controller
                  name={`guests.${index}.guestServices`}
                  control={control}
                  defaultValue={null}
                  rules={{
                    validate: (value) =>
                      (value && value.length > 0) ||
                      "At least one service must be selected",
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Autocomplete
                        {...field}
                        multiple
                        options={servicesList
                          // Filtering will be handled in filterOptions below
                          .filter((service) =>
                            field.value
                              ? !field.value.some(
                                  (selected: GuestService) =>
                                    selected.serviceItem.id === service.id
                                )
                              : true
                          )
                          .sort((a, b) =>
                            a.serviceName.localeCompare(b.serviceName)
                          )}
                        getOptionLabel={(option) => option.serviceName}
                        value={
                          field.value
                            ? field.value.map(
                                (gs: GuestService) => gs.serviceItem
                              )
                            : []
                        }
                        onChange={(_, newValue) => {
                          const formatted = newValue.map((svc: ServiceItem) => {
                            // match the service from servicesList by id
                            const matchedService = servicesList.find(
                              (s) => s.id === svc.id
                            );
                            return {
                              serviceItem: matchedService ?? svc,
                              staff: 0,
                            };
                          });
                          field.onChange(formatted);
                        }}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        // Add custom filterOptions for word-start matching
                        filterOptions={(options, { inputValue }) => {
                          if (!inputValue) return options;
                          const lowerInput = inputValue.trim().toLowerCase();
                          return options.filter((option) => {
                            // Use a regex to match word-starts but do not split the string
                            const regex = new RegExp(`\\b${lowerInput}`, "i");
                            return regex.test(option.serviceName);
                          });
                        }}
                        renderOption={(props, option, { inputValue }) => (
                          // Add whiteSpace style to the list item props
                          <li {...props} style={{ ...props.style, whiteSpace: 'pre-wrap' }}>
                            {highlightMatch(option.serviceName, inputValue)}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={`Select Services for ${guestFields[index].name}`}
                            margin="normal"
                            fullWidth
                            error={!!fieldState.error}
                            helperText={
                              fieldState.error ? fieldState.error.message : ""
                            }
                          />
                        )}
                      />
                    </>
                  )}
                />
              </div>
              {guestFields.length > 1 && index > 0 && (
                <IconButton
                  onClick={() => remove(index)}
                  edge="end"
                  style={{ marginLeft: 8 }}
                >
                  <RemoveCircleIcon style={{ color: "red" }} />
                </IconButton>
              )}
            </div>
          ))}
          
          {/* Staff selection */}
          <Controller
            name="selectedStaff"
            control={control}
            defaultValue="0"
            rules={{ required: "Staff selection is required" }}
            render={({ field }) => {
              const filteredStaff =
                guestFields.length > 1
                  ? staffList.filter((staff) => staff.nickname === "Any")
                  : staffList;
              return (
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
                      PaperProps: { style: { maxHeight: 48 * 10 } },
                    },
                  }}
                >
                  {filteredStaff
                    .slice()
                    .sort((a, b) => a.nickname.localeCompare(b.nickname))
                    .map((staff) => (
                      <MenuItem key={staff.id} value={staff.id ?? ""}>
                        {staff.nickname}
                      </MenuItem>
                    ))}
                </TextField>
              );
            }}
          />
          
          {/* Time slot selection */}
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
                      availabilityItem.staffs.length >= guestFields.length &&
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

          {/* Notes field */}
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
        
        {/* Dialog actions */}
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
      
      {/* Result notification dialog */}
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
function dispatch(arg0: any) {
  throw new Error("Function not implemented.");
}
