import React, { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { axiosInstance, axiosWithToken } from "../utils/axios";
import CustomLoading from "./Loading";
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
        openingTime: yup.string().required("Opening Time is required"),
        closingTime: yup.string().required("Closing Time is required"),
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

  const fetchStoreInfo = useCallback(async () => {
    try {
      const response = await axiosInstance.get<StoreInfo>(
        `/storeConfig/${storeUuid}`
      );
      reset(response.data);
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
            <input
              type="text"
              {...field}
              className={`border p-2 w-full rounded-md ${
                errors.zoneId ? "border-red-500" : "border-gray-300"
              }`}
            />
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
              type="text"
              {...field}
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
              className={`border p-2 w-full rounded-md ${
                errors.frontEndUrl ? "border-red-500" : "border-gray-300"
              }`}
            />
          )}
        />
        {errors.frontEndUrl && (
          <p className="text-red-500">{errors.frontEndUrl.message}</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Business Hours</h2>
        {watch("businessHoursList")?.map((hours, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-lg font-medium mb-2">{hours.dayOfWeek}</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 font-bold mb-1">
                  Opening Time
                </label>
                <Controller
                  name={`businessHoursList.${index}.openingTime`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="time"
                      {...field}
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e);
                        handleChange(
                          hours.dayOfWeek,
                          "openingTime",
                          e.target.value
                        );
                      }}
                      className={`border p-2 w-full rounded-md ${
                        errors.businessHoursList?.[index]?.openingTime
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.businessHoursList?.[index]?.openingTime && (
                  <p className="text-red-500">
                    {errors.businessHoursList[index].openingTime.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 font-bold mb-1">
                  Closing Time
                </label>
                <Controller
                  name={`businessHoursList.${index}.closingTime`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="time"
                      {...field}
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e);
                        handleChange(
                          hours.dayOfWeek,
                          "closingTime",
                          e.target.value
                        );
                      }}
                      className={`border p-2 w-full rounded-md ${
                        errors.businessHoursList?.[index]?.closingTime
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.businessHoursList?.[index]?.closingTime && (
                  <p className="text-red-500">
                    {errors.businessHoursList[index].closingTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className={`${
            isValid ? "bg-blue-500 text-white" : "bg-slate-400 text-slate-950"
          } w-[150px] flex items-center justify-center rounded-md px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          {submitting ? <CustomLoading /> : "Update Store"}
        </button>
      </div>
    </form>
  );
};

export default StoreInfo;
