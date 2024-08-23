import React, { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { axiosInstance, axiosWithToken } from "../utils/axios";

import CustomPageLoading from "./CustomPageLoading";

type BusinessHour = {
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
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
  businessHoursList: BusinessHour[];
};

const schema = yup.object().shape({
  storeName: yup.string().required("Store Name is required"),
  shortStoreName: yup.string().required("Short Store Name is required"),
  zoneId: yup.string().required("Zone ID is required"),
  storeAddress: yup.string().required("Store Address is required"),
  storePhoneNumber: yup
    .string()
    .required("Store Phone Number is required")
    .matches(
      /^04\d{8}$/,
      "Store Phone Number must be in the format 04xxxxxxxx"
    ),
  storeEmail: yup
    .string()
    .email("Invalid email format")
    .required("Store Email is required"),
  frontEndUrl: yup.string().required("Front End URL is required"),
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
          ),
      })
    )
    .required()
    .min(1, "At least one business hour entry is required"),
});

interface StoreInfoProps {
  storeUuid: string;
  handleUpdate: () => void;
}

const StoreInfo: React.FC<StoreInfoProps> = ({ storeUuid, handleUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<StoreInfo>({
    resolver: yupResolver(schema),
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
        (a, b) => {
          return (
            daysOfWeekOrder.indexOf(a.dayOfWeek) -
            daysOfWeekOrder.indexOf(b.dayOfWeek)
          );
        }
      );
  
      // Reset the form with sorted business hours
      reset({ ...response.data, businessHoursList: sortedBusinessHoursList });
      console.log({ ...response.data, businessHoursList: sortedBusinessHoursList });
      
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [storeUuid, reset]);

  useEffect(() => {
    fetchStoreInfo();
  }, [fetchStoreInfo, storeUuid]);

  const onSubmit = async (data: StoreInfo) => {
    setSubmitting(true);
    try {
      const response = await axiosWithToken.put("/storeConfig/", data);
      console.log(response.data);
      handleUpdate();
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    day: string,
    field: "openingTime" | "closingTime",
    value: string
  ) => {
    const updatedBusinessHoursList = (
      watch("businessHoursList") as BusinessHour[]
    ).map((hour) =>
      hour.dayOfWeek === day ? { ...hour, [field]: value } : hour
    );
    setValue("businessHoursList", updatedBusinessHoursList);
  };

  if (loading) return <CustomPageLoading />;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-4 max-w-lg mx-auto bg-white shadow-md rounded-md"
    >
      <h1 className="text-2xl font-semibold mb-4">Store Information</h1>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Store Name</label>
        <Controller
          name="storeName"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              {...field}
              className={`border p-2 w-full rounded-md ${
                errors.storeName ? "border-red-500" : "border-gray-300"
              }`}
            />
          )}
        />
        {errors.storeName && (
          <p className="text-red-500">{errors.storeName.message}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">
          Short Store Name
        </label>
        <Controller
          name="shortStoreName"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              {...field}
              className={`border p-2 w-full rounded-md ${
                errors.shortStoreName ? "border-red-500" : "border-gray-300"
              }`}
            />
          )}
        />
        {errors.shortStoreName && (
          <p className="text-red-500">{errors.shortStoreName.message}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Zone ID</label>
        <Controller
          name="zoneId"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className={`border p-2 w-full rounded-md ${
                errors.zoneId ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Zone ID</option>
              {[
                "Australia/Sydney",
                "Australia/Melbourne",
                "Australia/Brisbane",
                "Australia/Perth",
                "Australia/Adelaide",
                "Australia/Hobart",
                "Australia/Darwin",
              ].map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          )}
        />
        {errors.zoneId && (
          <p className="text-red-500">{errors.zoneId.message}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">
          Store Address
        </label>
        <Controller
          name="storeAddress"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              {...field}
              className={`border p-2 w-full rounded-md ${
                errors.storeAddress ? "border-red-500" : "border-gray-300"
              }`}
            />
          )}
        />
        {errors.storeAddress && (
          <p className="text-red-500">{errors.storeAddress.message}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">
          Store Phone Number
        </label>
        <Controller
          name="storePhoneNumber"
          control={control}
          render={({ field }) => (
            <input
              type="tel"
              {...field}
              pattern="\d*"
              maxLength={10}
              className={`border p-2 w-full rounded-md ${
                errors.storePhoneNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
          )}
        />
        {errors.storePhoneNumber && (
          <p className="text-red-500">{errors.storePhoneNumber.message}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">
          Store Email
        </label>
        <Controller
          name="storeEmail"
          control={control}
          render={({ field }) => (
            <input
              type="email"
              {...field}
              className={`border p-2 w-full rounded-md ${
                errors.storeEmail ? "border-red-500" : "border-gray-300"
              }`}
            />
          )}
        />
        {errors.storeEmail && (
          <p className="text-red-500">{errors.storeEmail.message}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">
          Front End URL
        </label>
        <Controller
          name="frontEndUrl"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              {...field}
              className={`border p-2 w-full rounded-md cursor-pointer ${
                errors.frontEndUrl ? "border-red-500" : "border-gray-300"
              }`}
              readOnly
              onClick={() => window.open(field.value, "_blank")}
            />
          )}
        />
        {errors.frontEndUrl && (
          <p className="text-red-500">{errors.frontEndUrl.message}</p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">
          Enable Reservation Confirmation
        </label>
        <Controller
          name="enableReservationConfirmation"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              checked={field.value} 
              onChange={(e) => field.onChange(e.target.checked)} 
              className="border p-2 rounded-md border-gray-300"
            />
          )}
        />
      </div>
      <div className="mb-4">
        <h2 className="text-lg font-bold">Business Hours</h2>
        {watch("businessHoursList").map((hour, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-center">
              <label className="block text-gray-700 font-bold">
                {hour.dayOfWeek}
              </label>
              <div className="flex space-x-2">
                <input
                  type="time"
                  value={hour.openingTime}
                  onChange={(e) =>
                    handleChange(hour.dayOfWeek, "openingTime", e.target.value)
                  }
                  className={`border p-2 rounded-md ${
                    errors.businessHoursList?.[index]?.openingTime
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                <input
                  type="time"
                  value={hour.closingTime}
                  onChange={(e) =>
                    handleChange(hour.dayOfWeek, "closingTime", e.target.value)
                  }
                  className={`border p-2 rounded-md ${
                    errors.businessHoursList?.[index]?.closingTime
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
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
        <button
          type="submit"
          className={`bg-blue-500 text-white py-2 px-4 rounded-md ${
            submitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isValid || submitting}
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
};

export default StoreInfo;
