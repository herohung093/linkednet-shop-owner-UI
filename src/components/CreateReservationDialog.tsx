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

  // Watch form values for conditional logic
  const selectedStaff = watch("selectedStaff");
  const selectedAvailability = watch("selectedAvailability");
  const walkInBooking = watch("walkInBooking"); // Watch the walkInBooking field
  const storeConfig = useSelector(
    (state: RootState) => state.storesList?.storesList?.[0]
  );

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
    // Check if editableDate is valid and selectedStaff is not undefined/null
    if (editableDate && selectedStaff !== undefined && selectedStaff !== null && isMounted.current) {
      fetchStaffAvailability(editableDate, selectedStaff);
    } else {
      // Clear availability if date is missing or component unmounted
      setStaffAvailability([]);
    }
    // Dependencies: Fetch only when date or staff selection actually changes.
    // availabilityFetchTrigger is removed as it might cause issues if selectedStaff is temporarily empty.
  }, [editableDate, selectedStaff, isCreateDialogOpen, isEditMode, existingReservation]); // Removed availabilityFetchTrigger

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
      reset({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        phone: customer.phone || "",
        note: note || "",
        selectedStaff: staffId,
        selectedAvailability: time,
        guests: guests.map(guest => ({
          id: guest.id,
          name: guest.name,
          guestServices: guest.guestServices,
          totalPrice: guest.totalPrice,
          totalEstimatedTime: guest.totalEstimatedTime,
        })),
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
      !editableDate ||
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

    // Special handling for edit mode to preserve staff assignments
    if (isEditMode && existingReservation) {
      // In edit mode, preserve existing staff assignments if they're valid
      if (parseInt(staffId) === 0) {
        // For "Any Professional" in edit mode
        const matchedAvailability = findAvailabilityByTime(
          data.selectedAvailability
        );
        
        if (matchedAvailability) {
          // Process each guest's services
          data.guests.forEach((guest, guestIndex) => {
            if (guest.guestServices) {
              guest.guestServices.forEach((guestService, serviceIndex) => {
                // If there's an existing staff assignment, preserve it if that staff is available
                // Otherwise assign a new staff member
                const existingStaffId = guestService.staff?.id;
                
                if (existingStaffId && matchedAvailability.staffs.includes(existingStaffId)) {
                  // Keep existing staff if they're available
                } else {
                  // Assign new staff: for single guest use random staff, for multiple guests use staff by index
                  if (data.guests.length === 1) {
                    const randomStaffId = getRandomStaffId(matchedAvailability.staffs);
                    guestService.staff = staffList.find(
                      (staff) => staff.id === randomStaffId
                    ) || {
                      id: randomStaffId,
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
                  } else {
                    // For multiple guests, try to use the guest index in the staffs array
                    const staffIdx = guestIndex % matchedAvailability.staffs.length;
                    const assignedStaffId = matchedAvailability.staffs[staffIdx];
                    guestService.staff = {
                      id: assignedStaffId,
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
                  }
                }
              });
            }
          });
        }
      } else {
        // Specific staff was selected, assign to all services
        data.guests.forEach((guest) => {
          if (guest.guestServices) {
            guest.guestServices.forEach((guestService) => {
              const specificStaff = staffList.find(
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
              guestService.staff = specificStaff;
            });
          }
        });
      }
    } else {
      // Create mode - use existing logic
      if (parseInt(staffId) === 0) {
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
    }

    // Prepare reservation data for API with explicit staff object mapping
    const reservationData = {
      id: isEditMode && existingReservation ? existingReservation.id : undefined,
      date: editableDate.format("DD/MM/YYYY"),
      bookingTime: `${editableDate.format("DD/MM/YYYY")} ${data.selectedAvailability}`,
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
              // Ensure staff object is properly constructed
              const staffObj = gs.staff || { 
                id: parseInt(staffId),
                // Include minimum required fields for staff
                firstName: "",
                lastName: "",
                nickname: "",
                isActive: true
              };
              
              return {
                serviceItem: gs.serviceItem,
                staff: staffObj
              };
            })
          : null,
        totalPrice: g.totalPrice || 0,
        totalEstimatedTime: g.totalEstimatedTime || 0,
      })),
      walkInBooking: data.walkInBooking,
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
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} reservation:`, error);
      setActionResultMessage(
        `Failed to ${isEditMode ? "update" : "create"} reservation. Please try again or contact admin for support.`
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
                // First filter by group booking constraint
                let filteredStaff =
                  guestFields.length > 1
                    ? staffList.filter((staff) => staff.nickname === "Any")
                    : staffList;
                
                // Then filter out staff that aren't available on the selected date
                filteredStaff = filteredStaff.filter(staff => 
                  // Always include "Any" staff or check if staff ID is in the available set
                  staff.id === 0 || (staff.id !== null && availableStaffIds.has(staff.id))
                );
                
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
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      field.onChange(e); // Update form state first

                      // Check the condition for fetching availability
                      const shouldFetch = editableDate && selectedValue !== undefined && selectedValue !== null;

                      // Trigger fetchStaffAvailability when staff selection changes
                      if (shouldFetch) {
                        // Ensure selectedValue is passed correctly, even if it's "0"
                        fetchStaffAvailability(editableDate!, selectedValue); 
                      } else {
                        console.warn("Skipping fetch: Date missing or invalid value.");
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
            
            {/* Time slot selection */}
            <Controller
              name="selectedAvailability"
              control={control}
              defaultValue=""
              rules={{ required: "Availability selection is required" }}
              render={({ field }) => {
                // Get the current selectedStaff value directly from watch within render
                const currentSelectedStaff = watch("selectedStaff"); 
                const numGuests = guestFields.length; // Get number of guests

                // Get the existing time if in edit mode
                const existingTime = isEditMode && existingReservation 
                  ? existingReservation.bookingTime.split(" ")[1] 
                  : null;
                
                // Check if date has changed in edit mode
                const existingDate = isEditMode && existingReservation 
                  ? existingReservation.bookingTime.split(" ")[0]
                  : null;
                const currentDate = editableDate ? editableDate.format("DD/MM/YYYY") : null;
                const dateHasChanged = existingDate && currentDate && existingDate !== currentDate;
                
                // If date has changed, we don't consider the existing time at all
                const shouldConsiderExistingTime = isEditMode && existingTime && !dateHasChanged;

                // Determine the list of options to display
                let availableOptions = staffAvailability
                  .filter((availabilityItem) => {
                    // Condition 1: Check if enough staff are available for the number of guests
                    const hasEnoughStaff = availabilityItem.staffs.length >= numGuests;

                    // Condition 2: Check if the staff matches (either "Any" or specific staff ID)
                    const staffMatches = currentSelectedStaff === "0" || parseInt(currentSelectedStaff) === 0 ||
                                        availabilityItem.staffs.includes(parseInt(currentSelectedStaff));

                    // Include if it meets both staff count and staff match criteria
                    return hasEnoughStaff && staffMatches;
                  });
                
                // Ensure uniqueness in case the existing time also met the filter criteria
                availableOptions = Array.from(new Map(availableOptions.map(item => [item.time, item])).values())
                                        .sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm")));
                
                // Only log a warning if the date hasn't changed but the time is no longer available
                if (shouldConsiderExistingTime && !availableOptions.some(opt => opt.time === existingTime)) {
                  console.warn(`Previously selected time (${existingTime}) is no longer available with the current staff selection or guest count`);
                }

                return (
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
                    // Using key might still be beneficial
                    key={currentSelectedStaff} 
                  >
                    {/* Case 1: Loading */}
                    {loadingAvailability && (
                      <MenuItem disabled value="">
                        Loading available times...
                      </MenuItem>
                    )}
                    
                    {/* Case 2: Not Loading, but no options satisfy filter */}
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
