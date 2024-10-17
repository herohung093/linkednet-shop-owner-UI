import React, { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { axiosInstance, axiosWithToken } from "../utils/axios";
import CustomPageLoading from "./CustomPageLoading";
import {
  Box,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "@mui/material/Link";
import { TimePicker } from "@mui/x-date-pickers";
import moment, { Moment } from "moment";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LoadingButton from "@mui/lab/LoadingButton";
import ActionResultDialog from "./dialogs/ActionResultDialog";
import { useDispatch } from "react-redux";
import { setStoresList } from "../redux toolkit/storesListSlice";

type BusinessHour = {
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
  dayOff: boolean;
};

type StoreInfo = {
  storeName: string;
  shortStoreName: string;
  zoneId: string;
  storeAddress: string;
  storePhoneNumber: string;
  storeEmail: string;
  frontEndUrl: string;
  enableReservationConfirmation: boolean;
  instagramLink: string;
  facebookLink: string;
  businessHoursList: BusinessHour[];
};

const timeStringToMinutes = (timeString: string) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

const schema = yup.object().shape({
  storeName: yup.string().required("Store Name is required"),
  shortStoreName: yup
    .string()
    .required("Short Store Name is required")
    .max(10, "Short Store Name must be less than 10 characters"),
  zoneId: yup.string().required("Zone ID is required"),
  storeAddress: yup.string().required("Store Address is required"),
  storePhoneNumber: yup
    .string()
    .required("Store Phone Number is required")
    .matches(/^(04|08)[0-9]*$/, "Phone number must start with 04 or 08"),
  storeEmail: yup
    .string()
    .email("Invalid email format")
    .required("Store Email is required"),
  frontEndUrl: yup.string(),
  enableReservationConfirmation: yup.boolean().required(),
  businessHoursList: yup
    .array()
    .of(
      yup.object().shape({
        dayOfWeek: yup.string().required("Day of the week is required"),
        openingTime: yup
          .string()
          .required("Opening Time is required")
          .test(
            "opening-closing-time",
            "Opening and Closing times are required",
            function (value) {
              const closingTime = this.parent.closingTime;
              return value && closingTime;
            }
          ),
        closingTime: yup
          .string()
          .required("Closing Time is required")
          .test(
            "opening-closing-time",
            "Opening and Closing times are required",
            function (value) {
              const openingTime = this.parent.openingTime;
              return value && openingTime;
            }
          )
          .test(
            "is-after-opening-time",
            "Closing Time must be after Opening Time",
            function (value) {
              const { openingTime } = this.parent;
              if (!openingTime || !value) return true; // Skip validation if either time is not set
              return (
                timeStringToMinutes(value) > timeStringToMinutes(openingTime)
              );
            }
          ),
        dayOff: yup.boolean(),
      })
    )
    .required()
    .min(1, "At least one business hour entry is required"),
});

interface StoreInfoProps {
  submitType?: string;
  storeUuid?: string;
}

const StoreInfo: React.FC<StoreInfoProps> = ({ storeUuid, submitType }) => {
  const defaultStoreConfig: StoreInfo = {
    storeName: "",
    shortStoreName: "",
    zoneId: "Australia/Sydney",
    storeAddress: "",
    storePhoneNumber: "",
    storeEmail: "",
    frontEndUrl: "",
    instagramLink: "",
    facebookLink: "",
    enableReservationConfirmation: false,
    businessHoursList: [
      {
        dayOfWeek: "MONDAY",
        openingTime: "09:00",
        closingTime: "17:00",
        dayOff: false,
      },
      {
        dayOfWeek: "TUESDAY",
        openingTime: "09:00",
        closingTime: "17:00",
        dayOff: false,
      },
      {
        dayOfWeek: "WEDNESDAY",
        openingTime: "09:00",
        closingTime: "17:00",
        dayOff: false,
      },
      {
        dayOfWeek: "THURSDAY",
        openingTime: "09:00",
        closingTime: "17:00",
        dayOff: false,
      },
      {
        dayOfWeek: "FRIDAY",
        openingTime: "09:00",
        closingTime: "17:00",
        dayOff: false,
      },
      {
        dayOfWeek: "SATURDAY",
        openingTime: "09:00",
        closingTime: "17:00",
        dayOff: false,
      },
      {
        dayOfWeek: "SUNDAY",
        openingTime: "09:00",
        closingTime: "17:00",
        dayOff: false,
      },
    ],
  };

  const [openResultDialog, setOpenResultDialog] = useState<boolean>(false);
  const [resultDialogType, setResultDialogType] = useState<
    "success" | "failure"
  >("success");
  const [resultDialogMessage, setResultDialogMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid, isDirty, dirtyFields },
  } = useForm<StoreInfo>({
    // @ts-ignore
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: defaultStoreConfig,
  });

  const daysOfWeekOrder = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  const fetchStoreInfo = useCallback(async () => {
    try {
      const response = await axiosInstance.get<StoreInfo>(
        `/storeConfig/${storeUuid}`
      );
      const sortedBusinessHoursList = response.data.businessHoursList.sort(
        (a, b) =>
          daysOfWeekOrder.indexOf(a.dayOfWeek) -
          daysOfWeekOrder.indexOf(b.dayOfWeek)
      );

      reset({
        ...response.data,
        businessHoursList: sortedBusinessHoursList,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [storeUuid, reset]);

  useEffect(() => {
    if (storeUuid) {
      fetchStoreInfo();
    } else {
      reset(defaultStoreConfig);
      setLoading(false);
    }
  }, [fetchStoreInfo, storeUuid, reset]);

  const onSubmit = async (data: StoreInfo) => {
    try {
      await schema.validate(data, { abortEarly: false });
      console.log("Form is valid");
    } catch (validationErrors) {
      console.log("Validation errors:", validationErrors);
    }
    setSubmitting(true);
    try {
      let response;
      if (submitType === "update") {
        response = await axiosWithToken.put("/storeConfig/", data);
        setResultDialogMessage("Store updated successfully!");
      } else {
        response = await axiosWithToken.post("/storeConfig/", data);
        setResultDialogMessage("Store created successfully!");
      }
      setResultDialogType("success");
      reset(response.data);
      dispatch(setStoresList([response.data]));
    } catch (error) {
      console.log(error);
      setResultDialogType("failure");
      setResultDialogMessage(
        "Failed to update store information. Please try again!"
      );
    } finally {
      setOpenResultDialog(true);
      setSubmitting(false);
    }
  };

  const handleBusinessHourChange = (
    day: string,
    field: "openingTime" | "closingTime",
    value: Moment | null
  ) => {
    const updatedBusinessHoursList = (
      watch("businessHoursList") as BusinessHour[]
    ).map((businessHourItem) =>
      businessHourItem.dayOfWeek === day
        ? { ...businessHourItem, [field]: value }
        : businessHourItem
    );
    setValue("businessHoursList", updatedBusinessHoursList);
  };

  const handleBusinessHourSwitchChange = (day: string, value: boolean) => {
    const updatedBusinessHoursList = (
      watch("businessHoursList") as BusinessHour[]
    ).map((businessHourItem) =>
      businessHourItem.dayOfWeek === day
        ? { ...businessHourItem, dayOff: value }
        : businessHourItem
    );
    setValue("businessHoursList", updatedBusinessHoursList);
  };

  const getOutlinedInputStyles = (dirtyFields: any, fieldName: string) => ({
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: dirtyFields[fieldName] ? "rgb(46, 125, 50)" : "inherit",
      },
      "&:hover fieldset": {
        borderColor: dirtyFields[fieldName] ? "rgb(46, 125, 50)" : "inherit",
      },
      "&.Mui-focused fieldset": {
        borderColor: "blue",
      },
    },
  });

  const handleCloseResultDialogDialog = () => {
    setOpenResultDialog(false);
  };

  if (loading) return <CustomPageLoading />;

  return (
    <Box sx={{ maxWidth: { md: "70%", lg: "40%" }, width: "33rem" }}>
      <Paper
        elevation={1}
        sx={{
          borderRadius: "10px",
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="mx-4 my-4 py-4">
          <h1 className="text-2xl font-semibold mb-4">Store Information</h1>
          <div className="mb-4">
            <Controller
              name="storeName"
              control={control}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.storeName}
                  sx={getOutlinedInputStyles(dirtyFields, "storeName")}
                >
                  <InputLabel htmlFor="storeName" required>
                    Store Name
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="storeName"
                    required
                    label="Store Name"
                    inputProps={{ maxLength: 100 }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      field.onChange(target.value);
                    }}
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title="Store Name is displayed in your booking website.">
                          <IconButton
                            aria-label="storeShortNameHint"
                            edge="end"
                          >
                            <InfoOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    }
                  />
                  {errors.storeName && (
                    <Typography color="error">
                      {errors.storeName.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>
          <div className="mb-4">
            <Controller
              name="shortStoreName"
              control={control}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.shortStoreName}
                  sx={getOutlinedInputStyles(dirtyFields, "shortStoreName")}
                >
                  <InputLabel htmlFor="shortStoreName" required>
                    Short Store Name
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="shortStoreName"
                    required
                    label="Short Store Name"
                    inputProps={{ maxLength: 20 }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      field.onChange(target.value);
                    }}
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title="Short Store Name is used in sms messages. This is to limit the length of the sms message.">
                          <IconButton
                            aria-label="storeShortNameHint"
                            edge="end"
                          >
                            <InfoOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    }
                  />
                  {errors.shortStoreName && (
                    <Typography color="error">
                      {errors.shortStoreName.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>
          <div className="mb-4">
            <Controller
              name="zoneId"
              control={control}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.zoneId}
                  sx={getOutlinedInputStyles(dirtyFields, "zoneId")}
                >
                  <InputLabel htmlFor="zoneId" required>
                    Store Timezone
                  </InputLabel>
                  <Select
                    {...field}
                    id="zoneId"
                    labelId="zoneId-label"
                    label="Store Timezone"
                    sx={{ width: "100%" }}
                  >
                    {[
                      "Australia/Sydney",
                      "Australia/Melbourne",
                      "Australia/Brisbane",
                      "Australia/Perth",
                      "Australia/Adelaide",
                      "Australia/Hobart",
                      "Australia/Darwin",
                    ].map((zone) => (
                      <MenuItem key={zone} value={zone}>
                        {zone}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            {errors.zoneId && (
              <Typography color="error">{errors.zoneId.message}</Typography>
            )}
          </div>
          <div className="mb-4">
            <Controller
              name="storeAddress"
              control={control}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.storeAddress}
                  sx={getOutlinedInputStyles(dirtyFields, "storeAddress")}
                >
                  <InputLabel htmlFor="storeAddress" required>
                    Address
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="storeAddress"
                    required
                    label="Address"
                    inputProps={{ maxLength: 100 }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      field.onChange(target.value);
                    }}
                  />
                  {errors.storeAddress && (
                    <Typography color="error">
                      {errors.storeAddress.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>
          <div className="mb-4">
            <Controller
              name="storePhoneNumber"
              control={control}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.storePhoneNumber}
                  sx={getOutlinedInputStyles(dirtyFields, "storePhoneNumber")}
                >
                  <InputLabel htmlFor="storePhoneNumber" required>
                    Store Phone Number
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="storePhoneNumber"
                    required
                    type="tel"
                    inputMode="numeric"
                    label="Store Phone Number"
                    placeholder="04xxxxxxxx or 08xxxxxxxx"
                    inputProps={{ maxLength: 10 }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/\D/g, "");
                      field.onChange(target.value);
                    }}
                  />
                  {errors.storePhoneNumber && (
                    <Typography color="error">
                      {errors.storePhoneNumber.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>
          <div className="mb-4">
            <Controller
              name="storeEmail"
              control={control}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.storeEmail}
                  sx={getOutlinedInputStyles(dirtyFields, "storeEmail")}
                >
                  <InputLabel htmlFor="storeEmail" required>
                    Store Email Address
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="storeEmail"
                    required
                    type="email"
                    inputMode="email"
                    label="Store Email Address"
                    inputProps={{ maxLength: 100 }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      field.onChange(target.value);
                    }}
                  />
                  {errors.storeEmail && (
                    <Typography color="error">
                      {errors.storeEmail.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>
          <div className="mb-4">
            <Controller
              name="facebookLink"
              control={control}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.facebookLink}
                  sx={getOutlinedInputStyles(dirtyFields, "facebookLink")}
                >
                  <InputLabel htmlFor="facebookLink">Facebook Link</InputLabel>
                  <OutlinedInput
                    {...field}
                    id="facebookLink"
                    type="link"
                    label="Facebook Link"
                    inputProps={{ maxLength: 150 }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      field.onChange(target.value);
                    }}
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title="This Facebook link will be add on your booking page. ">
                          <IconButton aria-label="facebookLinkHint" edge="end">
                            <InfoOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    }
                  />
                  {errors.facebookLink && (
                    <Typography color="error">
                      {errors.facebookLink.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>
          <div className="mb-4">
            <Controller
              name="instagramLink"
              control={control}
              render={({ field }) => (
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!errors.instagramLink}
                  sx={getOutlinedInputStyles(dirtyFields, "instagramLink")}
                >
                  <InputLabel htmlFor="instagramLink">
                    Instagram Link
                  </InputLabel>
                  <OutlinedInput
                    {...field}
                    id="instagramLink"
                    type="link"
                    label="Instagram Link"
                    inputProps={{ maxLength: 150 }}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      field.onChange(target.value);
                    }}
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title="This Instagram link will be add on your booking page.">
                          <IconButton aria-label="instagramLinkHint" edge="end">
                            <InfoOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    }
                  />
                  {errors.instagramLink && (
                    <Typography color="error">
                      {errors.instagramLink.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </div>
          <div className="mb-4">
            <div className="flex items-center">
              <label className="block text-gray-700 font-bold mb-2">
                Booking Link
              </label>
              <Tooltip title="This is the booking link of your store. You can add this link to your Google page.">
                <IconButton
                  aria-label="bookingLinkHint"
                  edge="end"
                  sx={{ mb: 1 }}
                >
                  <InfoOutlinedIcon />
                </IconButton>
              </Tooltip>
            </div>
            <Controller
              name="frontEndUrl"
              control={control}
              render={({ field }) =>
                field.value ? (
                  <Link
                    href={field.value}
                    className="text-blue-500"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {field.value}
                  </Link>
                ) : (
                  <></>
                )
              }
            />
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-bold mb-4">Business Hours</h2>
            {watch("businessHoursList").map((businessHourItem, index) => (
              <div key={index} className="mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                  <label className="block text-gray-700 font-bold w-24 sm:w-32">
                    {businessHourItem.dayOfWeek + ":"}
                  </label>
                  <div className="flex space-x-2 mt-3 sm:mt-0">
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <Controller
                        name={`businessHoursList.${index}.openingTime`}
                        control={control}
                        render={({ field }) => (
                          <TimePicker
                            label="Opening Time"
                            minutesStep={30}
                            ampmInClock={false}
                            ampm={false}
                            skipDisabled={true}
                            disabled={businessHourItem.dayOff}
                            minTime={moment("07:00", "HH:mm")}
                            maxTime={moment("22:00", "HH:mm")}
                            value={
                              field.value ? moment(field.value, "HH:mm") : null
                            }
                            onChange={(newValue) => {
                              field.onChange(
                                newValue ? newValue.format("HH:mm") : null
                              );
                              handleBusinessHourChange(
                                businessHourItem.dayOfWeek,
                                "openingTime",
                                newValue
                              );
                            }}
                            sx={{
                              width: { xs: "5rem", sm: "7rem" },
                              backgroundColor: dirtyFields.businessHoursList?.[
                                index
                              ]?.openingTime
                                ? "lightyellow"
                                : "inherit",
                            }}
                          />
                        )}
                      />

                      <Controller
                        name={`businessHoursList.${index}.closingTime`}
                        control={control}
                        render={({ field }) => (
                          <TimePicker
                            label="Closing Time"
                            minutesStep={30}
                            ampm={false}
                            ampmInClock={false}
                            skipDisabled={true}
                            disabled={businessHourItem.dayOff}
                            minTime={moment("07:00", "HH:mm")}
                            maxTime={moment("22:00", "HH:mm")}
                            value={
                              field.value ? moment(field.value, "HH:mm") : null
                            }
                            onChange={(newValue) => {
                              field.onChange(
                                newValue ? newValue.format("HH:mm") : null
                              );
                              handleBusinessHourChange(
                                businessHourItem.dayOfWeek,
                                "closingTime",
                                newValue
                              );
                            }}
                            sx={{
                              width: { xs: "5rem", sm: "7rem" },
                              backgroundColor: dirtyFields.businessHoursList?.[
                                index
                              ]?.openingTime
                                ? "lightyellow"
                                : "inherit",
                            }}
                          />
                        )}
                      />
                    </LocalizationProvider>
                    <Controller
                      name={`businessHoursList.${index}.dayOff`}
                      control={control}
                      render={({ field }) => (
                        <Stack direction="row" sx={{ alignItems: "center" }}>
                          <Typography>Open</Typography>
                          <Switch
                            checked={field.value ?? false}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              handleBusinessHourSwitchChange(
                                businessHourItem.dayOfWeek,
                                e.target.checked
                              );
                            }}
                            color="primary"
                          />
                          <Typography>Close</Typography>
                        </Stack>
                      )}
                    />
                  </div>
                </div>
                {errors.businessHoursList?.[index] && (
                  <p className="text-red-500">
                    {errors.businessHoursList[index]?.openingTime?.message ||
                      errors.businessHoursList[index]?.closingTime?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <LoadingButton
              type="submit"
              variant="contained" // Use 'contained' to have a solid background color
              className="w-full flex justify-center items-center h-[40px] focus:outline-none focus:shadow-outline"
              loading={submitting}
              disabled={!isValid || submitting || !isDirty}
              loadingIndicator={
                <CircularProgress style={{ color: "white" }} size={24} />
              }
              sx={{
                backgroundColor: "black",
                color: "white",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "black",
                },
              }}
            >
              {submitType?.toLocaleUpperCase()}
            </LoadingButton>
          </div>
        </form>
      </Paper>
      <ActionResultDialog
        open={openResultDialog}
        onClose={handleCloseResultDialogDialog}
        message={resultDialogMessage}
        type={resultDialogType}
      />
    </Box>
  );
};

export default StoreInfo;
