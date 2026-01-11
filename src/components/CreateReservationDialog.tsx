import React, { useEffect, useState, useRef } from "react";
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
  Typography,
} from "@mui/material";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { axiosWithToken } from "../utils/axios";
import moment from "moment";
import LoadingButton from "@mui/lab/LoadingButton";
import ActionResultDialog from "./dialogs/ActionResultDialog";
import { RootState } from "../redux toolkit/store";
import { useSelector } from "react-redux";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

interface CreateReservationDialogProps {
  isCreateDialogOpen: boolean;
  handleCreateDialogClose: () => void;
  selectedDate: moment.Moment | null;
  onReservationCreated: () => void;
  isEditMode?: boolean;
  existingReservation?: Reservation;
  selectedSlotTime?: Date | null;
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  note: string;
  selectedStaff: string;
  selectedAvailability: string;
  guests: Guest[];
  walkInBooking: boolean;
}

// Update the Guest interface to include schedule fields
interface Guest {
  id: number | null;
  name: string;
  guestServices: GuestService[] | null;
  totalPrice: number;
  totalEstimatedTime: number;
  selectedStaff?: string;  // Add staff selection per guest
  selectedAvailability?: string; // Add time selection per guest
}

/**
 * CreateReservationDialog Component
 * 
 * This component provides a dialog for creating or editing reservations/bookings.
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
  isEditMode = false,
  existingReservation,
  selectedSlotTime,
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
          selectedStaff: "0", // Default staff for first guest
          selectedAvailability: "", // Default empty availability for first guest
        },
      ],
      walkInBooking: true,
      selectedStaff: "0", // This is now for the main/first guest
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
  const [availableStaffIds, setAvailableStaffIds] = useState<Set<number>>(new Set([0]));
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [availabilityDropdownOpen, setAvailabilityDropdownOpen] = useState<boolean>(false);
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

  // Reference to track if component is mounted
  const isMounted = useRef(true);
  
  // Set up cleanup on unmount
  useEffect(() => {
    isMounted.current = true; // <-- Ensure it's true on mount
    return () => {
      isMounted.current = false;
    };
  }, []);

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

  // Watch form values for all guests' selected staff and availability
  const guestsWatch = watch("guests");
  const selectedStaff = watch("selectedStaff");
  const selectedAvailability = watch("selectedAvailability");
  const walkInBooking = watch("walkInBooking"); // Watch the walkInBooking field
  const storeConfig = useSelector(
    (state: RootState) => state.storesList?.storesList?.[0]
  );

  // Watch Guest 1's time selection to sync with other guests
  const guest1Time = watch("guests.0.selectedAvailability");

  // Add local state for editable date in edit mode
  const [editableDate, setEditableDate] = useState<moment.Moment | null>(selectedDate);

  // Sync editableDate with selectedDate when dialog opens or selectedDate changes (for create mode)
  useEffect(() => {
    if (!isEditMode) {
      setEditableDate(selectedDate);
    } else if (isEditMode && isCreateDialogOpen && existingReservation) {
      setEditableDate(selectedDate);
    }
  }, [selectedDate, isEditMode, isCreateDialogOpen, existingReservation]);

  // Set selected time from timeline slot if available
  useEffect(() => {
    if (selectedSlotTime && isCreateDialogOpen && !isEditMode) {
      const slotTime = moment(selectedSlotTime).format("HH:mm");
      setValue("guests.0.selectedAvailability", slotTime);
    }
  }, [selectedSlotTime, isCreateDialogOpen, isEditMode, setValue]);

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
   * Effect: This useEffect was previously used to prevent dialog from staying open on page refresh
   * However, it's been removed because it was causing the dialog to close immediately when opening in edit mode
   * The Dialog component already handles this scenario properly
   */
  // Removed problematic useEffect that was closing dialog on mount

  // Move fetchStaffAvailability outside of useEffect so it can be called manually
  const fetchStaffAvailability = async (date: moment.Moment, staffId: string) => {
    setLoadingAvailability(true);
    try {
      const response = await axiosWithToken.get<{
        [key: string]: number[];
      }>(`/staff/allStaffAvailability`, {
        params: {
          staffId: 0, // Default to "Any" staff
          date: date.format("DD/MM/YYYY"),
        },
      });

      let availabilities = Object.entries(response.data).map(
        ([time, staffs]) => ({
          time,
          staffs,
        })
      );

      availabilities = availabilities.sort((a, b) => {
        const timeA = moment(a.time, "HH:mm");
        const timeB = moment(b.time, "HH:mm");
        return timeA.diff(timeB);
      });

      if (isMounted.current) {
        // Extract all available staff IDs
        const availableStaffSet = new Set<number>([0]); // Always include "Any" (ID 0)
        
        // Collect all staff IDs from all time slots
        availabilities.forEach(slot => {
          slot.staffs.forEach(id => availableStaffSet.add(id));
        });
        
        // Update state
        setAvailableStaffIds(availableStaffSet);
        setStaffAvailability(availabilities);
        
      }
    } catch (error) {
      console.error("Error fetching staff availability:", error);
      if (isMounted.current) {
        setStaffAvailability([]); // Clear on error
        setAvailableStaffIds(new Set([0])); // Reset to only "Any" staff on error
      }
    } finally {
      if (isMounted.current) {
        setLoadingAvailability(false);
      }
    }
  };

  /**
   * Effect: Fetch staff availability when date or selected staff changes.
   */
  useEffect(() => {
    // Only fetch availability if dialog is open AND we have valid date and staff
    if (
      isCreateDialogOpen &&
      editableDate &&
      selectedStaff !== undefined &&
      selectedStaff !== null &&
      isMounted.current
    ) {
      fetchStaffAvailability(editableDate, selectedStaff);
    } else if (!isCreateDialogOpen) {
      // Clear availability when dialog closes
      setStaffAvailability([]);
    }
    // Dependencies: Fetch when date, staff, or dialog state changes
    // Including selectedStaff ensures this runs again after form initialization in edit mode
  }, [editableDate, selectedStaff, isCreateDialogOpen]);

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
    // Reset main staff selection - mainly for backward compatibility
    setValue("selectedStaff", "0"); // 0 represents "Any"
    
    // For each guest, ensure they have a staff selection
    guestFields.forEach((field, index) => {
      if (!guestsWatch[index].selectedStaff) {
        setValue(`guests.${index}.selectedStaff`, "0");
      }
    });
  }, [guestFields.length, setValue, guestsWatch]);

  // Initialize form with existing reservation data when in edit mode
  useEffect(() => {
    if (isEditMode && existingReservation && isCreateDialogOpen) {
      const { customer, guests, bookingTime, note, walkInBooking } = existingReservation;
      const time = bookingTime.split(" ")[1]; // Extract time part
      
      // Find staff ID from first guest service
      let staffId = "0";
      if (guests.length > 0 && guests[0].guestServices && guests[0].guestServices.length > 0) {
        const firstService = guests[0].guestServices[0];
        if (firstService.staff && firstService.staff.id) {
          staffId = firstService.staff.id.toString();
        }
      }
      
      // Reset form with existing data
      // Map each guest and add selectedStaff and selectedAvailability properties
      const guestsWithSchedule = guests.map((guest, index) => {
        let guestStaffId = "0";
        
        // Get staff ID from the guest's first service if it exists
        if (guest.guestServices && guest.guestServices.length > 0 && 
            guest.guestServices[0].staff && guest.guestServices[0].staff.id) {
          guestStaffId = guest.guestServices[0].staff.id.toString();
        }
        
        return {
          id: guest.id,
          name: guest.name,
          guestServices: guest.guestServices,
          totalPrice: guest.totalPrice,
          totalEstimatedTime: guest.totalEstimatedTime,
          selectedStaff: guestStaffId,
          selectedAvailability: time, // Use the same time initially
        };
      });
      
      reset({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        phone: customer.phone || "",
        note: note || "",
        selectedStaff: staffId,
        selectedAvailability: time,
        guests: guestsWithSchedule,
        walkInBooking: walkInBooking || false,
      });
      
      // Set selected customer if we have customer info
      if (customer) {
        setSelectedCustomer({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email || "",
          phone: customer.phone || "",
          blacklisted: customer.blacklisted || false,
          createdAt: customer.createdAt || "",
        });
        setCustomerSearchInput(`${customer.firstName} ${customer.lastName} - ${customer.phone}`);
      }
    }
  }, [isEditMode, existingReservation, isCreateDialogOpen, reset]);

  // ========== HELPER FUNCTIONS ==========

  /**
   * Get list of staff IDs that are already selected by other guests
   * Used to prevent double-booking staff across multiple guests
   */
  const getSelectedStaffIds = (currentGuestIndex: number): number[] => {
    const selectedStaffIds: number[] = [];
    
    guestFields.forEach((field, idx) => {
      // Skip the current guest in the check
      if (idx !== currentGuestIndex) {
        const staffId = guestsWatch[idx]?.selectedStaff;
        if (staffId && staffId !== "0") { // Don't include "Any" in exclusion list
          selectedStaffIds.push(parseInt(staffId));
        }
      }
    });
    
    return selectedStaffIds;
  };

  /**
   * Find availability object by time
   */
  const findAvailabilityByTime = (time: string) => {
    return staffAvailability.find((availability) => availability.time === time);
  };

  /**
   * Get a random staff ID from available staff, excluding already assigned ones.
   * Used for "Any Professional" bookings.
   * @param staffIds - Array of staff IDs available at a specific time slot.
   * @param excludedStaffIds - Array of staff IDs already assigned to other guests in this booking.
   * @returns A random staff ID from the available list, or null if none are available after exclusion.
   */
  const getRandomStaffId = (staffIds: number[], excludedStaffIds: number[]): number | null => {
    // Filter out staff IDs that are already assigned to other guests
    const availableStaff = staffIds.filter(id => !excludedStaffIds.includes(id));

    // If no staff are available after filtering, return null
    if (availableStaff.length === 0) {
      // Optionally, could return the first from the original list as a fallback,
      // but returning null indicates a potential scheduling conflict.
      console.warn("Could not find an available staff member for 'Any Professional' after excluding assigned staff.");
      return null; 
    }

    // Select a random index from the filtered list
    const randomIndex = Math.floor(Math.random() * availableStaff.length);
    return availableStaff[randomIndex];
  };

  /**
   * Validate that all guests have at least one service selected
   * and all required time/staff selections are made
   */
  const validateGuestServices = (guests: Guest[]): { valid: boolean; errorMessage: string } => {
    // Check if any guest is missing services
    const guestWithoutServices = guests.findIndex(
      (guest) => !guest.guestServices || guest.guestServices.length === 0
    );
    
    if (guestWithoutServices !== -1) {
      return { 
        valid: false, 
        errorMessage: `Please select at least one service for Guest ${guestWithoutServices + 1}` 
      };
    }

    // Check if any guest is missing a staff selection
    const guestWithoutStaff = guests.findIndex(
      (guest) => guest.selectedStaff === null && guest.selectedStaff === undefined
    );
    
    if (guestWithoutStaff !== -1) {
      return { 
        valid: false, 
        errorMessage: `Please select a staff member for Guest ${guestWithoutStaff + 1}` 
      };
    }

    // Only check first guest for time selection since others inherit from it
    if (!guests[0].selectedAvailability) {
      return {
        valid: false,
        errorMessage: "Please select an appointment time"
      };
    }

    // All validations passed
    return { valid: true, errorMessage: "" };
  };

  // ========== FORM SUBMISSION ==========

  /**
   * Handle form submission to create a new reservation
   */
  const onSubmit = async (data: FormData) => {
    // Validate required fields and services
    const isPhoneRequired = !data.walkInBooking;
    const isPhoneValid = isPhoneRequired ? data.phone.match(/^04\d{8}$/) : true;

    // First check for phone and date, which are common requirements
    if (!editableDate) {
      alert("Please select a valid date");
      return;
    }
    
    if (isPhoneRequired && !data.phone) {
      alert("Phone number is required for non-walk-in bookings.");
      return;
    } 
    
    if (isPhoneRequired && !isPhoneValid) {
      alert("Phone number must be a valid 10-digit Australian mobile number starting with 04.");
      return;
    }
    
    if (!data.firstName) {
      alert("First name is required");
      return;
    }

    // Check guest services, staff and time selections
    const guestValidation = validateGuestServices(data.guests);
    if (!guestValidation.valid) {
      alert(guestValidation.errorMessage);
      return;
    }

    setIsCreating(true);

    // Ensure all guests have the same time as Guest 1
    const firstGuestTime = data.guests[0].selectedAvailability || data.selectedAvailability;
    
    // Track staff assigned within this specific booking to avoid double-booking
    // Initialize as empty, will be populated as we iterate through guests
    const assignedStaffIdsForThisBooking: number[] = []; 

    let bookingCreationFailed = false; // Flag to track if assignment fails

    data.guests.forEach((guest, guestIndex) => {
      if (bookingCreationFailed) return; // Stop processing if an assignment failed

      if (!guest.guestServices) return;
      
      // Set all guests to use the same time
      guest.selectedAvailability = firstGuestTime;
      
      const guestStaffId = guest.selectedStaff || data.selectedStaff || "0";
      
      // For "Any Professional" bookings
      if (parseInt(guestStaffId) === 0) {
        const matchedAvailability = findAvailabilityByTime(guest1Time || "");
        
        if (matchedAvailability && matchedAvailability.staffs.length > 0) {
          // Assign random staff from available staff at this time slot, excluding already assigned ones
          // Pass the current state of assignedStaffIdsForThisBooking
          const randomStaffId = getRandomStaffId(matchedAvailability.staffs, assignedStaffIdsForThisBooking);
          
          if (randomStaffId !== null) {
            // Assign the chosen staff ID to all services for this guest
            guest.guestServices.forEach((guestService) => {
              guestService.staff = staffList.find(
                (staff) => staff.id === randomStaffId
              ) || {
                id: randomStaffId,
                firstName: "", lastName: "", nickname: "", phone: "", skillLevel: 1,
                dateOfBirth: "", rate: 1, workingDays: "", storeUuid: "", tenantUuid: "", isActive: true,
              };
            });
            // Add the assigned staff ID to the tracking list for this booking
            assignedStaffIdsForThisBooking.push(randomStaffId);
          } else {
            // Handle case where no staff could be assigned
            console.error(`Could not assign 'Any Professional' for Guest ${guestIndex + 1}. No available staff left.`);
            alert(`Could not find an available staff member for Guest ${guestIndex + 1}. Please adjust staff selections or time.`);
            bookingCreationFailed = true; // Set flag to stop submission
            setIsCreating(false); // Reset loading state
            return; // Exit the forEach loop early
          }
        } else {
          // Handle case where availability data is missing
           console.error(`Availability data missing for time ${guest1Time} when assigning 'Any Professional' for Guest ${guestIndex + 1}.`);
           alert(`Could not find availability data for the selected time for Guest ${guestIndex + 1}. Please try again or select a different time.`);
           bookingCreationFailed = true;
           setIsCreating(false);
           return;
        }
      } else {
        // Specific staff was selected for this guest
        const specificStaffId = parseInt(guestStaffId);
        
        // ***MODIFIED CHECK***
        // Check if this specific staff is already assigned to a PREVIOUS guest in this booking
        if (assignedStaffIdsForThisBooking.includes(specificStaffId)) {
           console.error(`Staff ID ${specificStaffId} is already assigned to another guest in this booking.`);
           alert(`Staff ${staffList.find(s => s.id === specificStaffId)?.nickname || `ID ${specificStaffId}`} is already assigned to another guest in this booking. Please select different staff for Guest ${guestIndex + 1}.`);
           bookingCreationFailed = true;
           setIsCreating(false);
           return; // Exit the forEach loop early
        }

        // Assign the specific staff to the guest's services
        guest.guestServices.forEach((guestService) => {
          guestService.staff = staffList.find(
            (staff) => staff.id === specificStaffId
          ) || {
            id: specificStaffId,
            firstName: "", lastName: "", nickname: "", phone: "", skillLevel: 1,
            dateOfBirth: "", rate: 1, workingDays: "", storeUuid: "", tenantUuid: "", isActive: true,
          };
        });
        // Add the specifically assigned staff ID to the tracking list *after* successful assignment
        assignedStaffIdsForThisBooking.push(specificStaffId);
      }
    });

    // If any assignment failed, stop the submission process
    if (bookingCreationFailed) {
      setIsCreating(false); // Ensure loading state is reset if we exit early
      return; 
    }

    // Prepare reservation data for API with explicit staff object mapping
    const reservationData = {
      id: isEditMode && existingReservation ? existingReservation.id : undefined,
      date: editableDate.format("DD/MM/YYYY"),
      bookingTime: `${editableDate.format("DD/MM/YYYY")} ${data.guests[0].selectedAvailability || data.selectedAvailability}`,
      status: existingReservation?.status || "PENDING",
      note: data.note,
      customer: {
        id: isEditMode && existingReservation ? existingReservation.customer.id : undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: isEditMode && existingReservation ? existingReservation.customer.email : "",
      },
      guests: data.guests.map((g) => ({
        id: g.id,
        name: g.name,
        guestServices: g.guestServices
          ? g.guestServices.map((gs) => {
              // Staff is already assigned above
              return {
                serviceItem: gs.serviceItem,
                staff: gs.staff // Ensure the assigned staff object is included
              };
            })
          : null,
        totalPrice: g.totalPrice || 0,
        totalEstimatedTime: g.totalEstimatedTime || 0,
      })),
      walkInBooking: data.walkInBooking,
      reservationOrigin: "ADMIN"
    };

    // Submit reservation to API
    try {
      if (isEditMode) {
        await axiosWithToken.put("/reservation/", reservationData);
        setActionResultMessage("Booking updated successfully!");
      } else {
        await axiosWithToken.post("/reservation/", reservationData);
        setActionResultMessage("Booking created successfully!");
      }
      setActionResultType("success");
      handleCreateDialogClose();
      onReservationCreated();
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} reservation:`, error);
      // Extract error message from the API response
      const errorMessage = error.response?.data?.message || 
        `Failed to ${isEditMode ? "update" : "create"} reservation. Please try again or contact admin for support.`;
      setActionResultMessage(errorMessage);
      setActionResultType("failure");
    } finally {
      setActionResultOpen(true);
      setIsCreating(false);
      if (actionResultType === "success") {
        handleClose();
      }
    }
  };

  /**
   * Close dialog and reset form
   */
  const handleClose = () => {
    // Only proceed if still mounted
    if (isMounted.current) {
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
    }
  };

  /**
   * Trigger availability refresh when the dropdown is opened.
   * Simplified: Let the useEffect handle the fetch based on current state.
   */
  const handleAvailabilityMenuOpen = () => {
    if (!availabilityDropdownOpen) {
      setAvailabilityDropdownOpen(true);
      // Optional: Force a re-fetch if needed, but useEffect should handle it.
      // Consider adding back availabilityFetchTrigger if useEffect doesn't reliably refetch on open.
      // setAvailabilityFetchTrigger(prev => prev + 1); 
    }
  };

  const handleAvailabilityMenuClose = () => {
    setAvailabilityDropdownOpen(false);
  };

  // When date changes in edit mode, clear availability selections and set staff based on guest count
  const handleDateChange = (newDate: moment.Moment | null) => {
    setEditableDate(newDate);
    
    // If multiple guests, always set staff to "Any" (0)
    // For single guest, also use "Any" (0) initially to load available times
    const staffValue = "0"; // Always use "0" (Any) initially when date changes
    setValue("selectedStaff", staffValue);
    
    setValue("selectedAvailability", ""); // Clear availability selection
    setStaffAvailability([]); // Clear availability list
    
    // If newDate is valid, fetch availability with "Any" staff to show all options
    if (newDate) {
      fetchStaffAvailability(newDate, staffValue);
    }
  };

  // Add state for draggable dialog
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  // Reference to the dialog paper element
  const dialogRef = useRef<HTMLElement>(null);

  // Reset position state when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isCreateDialogOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only enable dragging when clicking on the dialog title
    if ((e.target as HTMLElement).closest('.dialog-title')) {
      setIsDragging(true);
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

  // ========== RENDER COMPONENT ==========
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Dialog 
          open={isCreateDialogOpen} 
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          disableEnforceFocus
          disableRestoreFocus
          PaperProps={{
            ref: dialogRef,
            style: {
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease',
              cursor: isDragging ? 'grabbing' : 'auto',
            },
            onMouseDown: handleMouseDown
          }}
        >
          <DialogTitle 
            className="dialog-title" 
            style={{ cursor: "grab", userSelect: "none" }}
          >
            {isEditMode ? "Edit Reservation" : "Create Reservation"}
          </DialogTitle>
          
          <DialogContent>
            {/* Date field */}
            {isEditMode ? (
              <DatePicker
                label="Date"
                value={editableDate}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                  },
                }}
                disablePast
              />
            ) : (
              <TextField
                label="Date"
                value={editableDate ? editableDate.format("DD/MM/YYYY") : ""}
                fullWidth
                margin="normal"
                disabled
              />
            )}

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
                  setValue("walkInBooking", false); // Uncheck the walk-in booking checkbox
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
                   // Optionally reset walkInBooking if needed when selection is cleared
                   // setValue("walkInBooking", true); 
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
                  label="Search For Existing Customer (Name/Phone)"
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
                      selectedStaff: "0", // Default to "Any Professional"
                      selectedAvailability: "", // Empty availability initially
                    });
                  }
                }}
              >
                + Add More Guest
              </Button>
            </div>
            
            {/* Service selection for each guest with their own staff/time selection */}
            {guestFields.map((field, index) => (
              <div
                key={field.id}
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  marginBottom: "16px", 
                  padding: "16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9"
                }}
              >
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  marginBottom: "8px"
                }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {guestFields[index].name}
                  </Typography>
                  {guestFields.length > 1 && index > 0 && (
                    <IconButton
                      onClick={() => remove(index)}
                      edge="end"
                    >
                      <RemoveCircleIcon style={{ color: "red" }} />
                    </IconButton>
                  )}
                </div>
                
                {/* Service selection */}
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
                    <Autocomplete
                      {...field}
                      multiple
                      options={servicesList
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
                      filterOptions={(options, { inputValue }) => {
                        if (!inputValue) return options;
                        const lowerInput = inputValue.trim().toLowerCase();
                        return options.filter((option) => {
                          const regex = new RegExp(`\\b${lowerInput}`, "i");
                          return regex.test(option.serviceName);
                        });
                      }}
                      renderOption={(props, option, { inputValue }) => (
                        <li {...props} style={{ ...props.style, whiteSpace: 'pre-wrap' }}>
                          {highlightMatch(option.serviceName, inputValue)}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Services"
                          margin="normal"
                          fullWidth
                          error={!!fieldState.error}
                          helperText={
                            fieldState.error ? fieldState.error.message : ""
                          }
                        />
                      )}
                    />
                  )}
                />

                {/* Staff and Availability selection for this guest */}
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  {/* Staff selection for each guest */}
                  <Controller
                    name={`guests.${index}.selectedStaff`}
                    control={control}
                    defaultValue="0"
                    rules={{ required: "Staff selection is required" }}
                    render={({ field }) => {
                      // Get staff IDs that are already selected by other guests
                      const selectedStaffIds = getSelectedStaffIds(index);
                      
                      // Filter staff based on availability and exclude already selected staff
                      let filteredStaff = staffList.filter(staff => 
                        // Always include "Any Professional" option
                        staff.id === 0 || 
                        // For specific staff, ensure they're available and not already selected
                        (staff.id !== null && 
                         availableStaffIds.has(staff.id) && 
                         !selectedStaffIds.includes(staff.id))
                      );
                      
                      return (
                        <TextField
                          {...field}
                          select
                          label="Select Staff"
                          fullWidth
                          margin="normal"
                          error={!!errors.guests?.[index]?.selectedStaff}
                          helperText={
                            errors.guests?.[index]?.selectedStaff 
                              ? errors.guests[index].selectedStaff.message 
                              : ""
                          }
                          style={{ flex: 1 }}
                          SelectProps={{
                            MenuProps: {
                              PaperProps: { style: { maxHeight: 48 * 10 } },
                            },
                          }}
                          onChange={(e) => {
                            const selectedValue = e.target.value;
                            field.onChange(e); // Update form state first

                            // Check if should fetch availability
                            if (editableDate && selectedValue !== undefined && selectedValue !== null) {
                              fetchStaffAvailability(editableDate, selectedValue);
                            }
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
                  
                  {/* Time slot selection - only show for the first guest */}
                  {index === 0 && (
                    <Controller
                      name={`guests.${index}.selectedAvailability`}
                      control={control}
                      defaultValue=""
                      rules={{ required: "Availability selection is required" }}
                      render={({ field }) => {
                        // Get the current selectedStaff value for this guest
                        const currentGuestStaff = watch(`guests.${index}.selectedStaff`);
                        
                        // Filter availability options for this guest
                        let availableOptions = staffAvailability
                          .filter((availabilityItem) => {
                            // Staff matches if "Any" selected or specific staff is available
                            const staffMatches = 
                              currentGuestStaff === "0" || 
                              parseInt(currentGuestStaff || "") === 0 ||
                              availabilityItem.staffs.includes(parseInt(currentGuestStaff || ""));
                            
                            return staffMatches;
                          });
                        
                        // Sort time slots
                        availableOptions = Array.from(
                          new Map(availableOptions.map(item => [item.time, item])).values()
                        ).sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm")));

                        return (
                          <TextField
                            {...field}
                            select
                            required
                            label="Select Time"
                            fullWidth
                            margin="normal"
                            style={{ flex: 1 }}
                            error={!!errors.guests?.[index]?.selectedAvailability}
                            helperText={
                              errors.guests?.[index]?.selectedAvailability
                                ? errors.guests[index].selectedAvailability.message
                                : ""
                            }
                            SelectProps={{
                              MenuProps: {
                                PaperProps: {
                                  style: {
                                    maxHeight: 48 * 10,
                                  },
                                },
                              },
                              onOpen: handleAvailabilityMenuOpen,
                              onClose: handleAvailabilityMenuClose,
                              renderValue: (value) => value as string,
                            }}
                            InputProps={{
                              endAdornment: loadingAvailability ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : null,
                            }}
                            key={`avail-${index}-${currentGuestStaff}`}
                          >
                            {/* Case 1: Loading */}
                            {loadingAvailability && (
                              <MenuItem disabled value="">
                                Loading available times...
                              </MenuItem>
                            )}
                            
                            {/* Case 2: Not Loading, but no options */}
                            {!loadingAvailability && availableOptions.length === 0 && (
                               <MenuItem disabled value="">
                                 No available times found.
                               </MenuItem>
                            )}

                            {/* Case 3: Render available options */}
                            {!loadingAvailability && availableOptions.length > 0 && (
                              availableOptions.map((availabilityItem) => (
                                <MenuItem
                                  key={availabilityItem.time}
                                  value={availabilityItem.time}
                                >
                                  {availabilityItem.time}
                                </MenuItem>
                              ))
                            )}
                          </TextField>
                        );
                      }}
                    />
                  )}
                  
                  {/* For guests after the first one, show the selected time as text */}
                  {index > 0 && (
                    <TextField
                      label="Appointment Time"
                      value={guest1Time || "Same as Guest 1"}
                      fullWidth
                      margin="normal"
                      style={{ flex: 1 }}
                      disabled
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

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
              {isEditMode ? "Update" : "Create"}
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
      
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
