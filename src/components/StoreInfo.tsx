import React, { useCallback, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { axiosInstance } from "../utils/axios";

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
  isAutomaticApproved: boolean;
  emailAppPassword: string;
  frontEndUrl: string;
  enableReservationConfirmation: boolean;
  businessHoursList: BusinessHour[];
};

const schema = yup.object().shape({
  storeName: yup.string().required(),
  shortStoreName: yup.string().required(),
  zoneId: yup.string().required(),
  storeAddress: yup.string().required(),
  storePhoneNumber: yup.string().required(),
  storeEmail: yup.string().email().required(),
  isAutomaticApproved: yup.boolean().required(),
  emailAppPassword: yup.string().required(),
  frontEndUrl: yup.string().url().required(),
  enableReservationConfirmation: yup.boolean().required(),
  businessHoursList: yup
    .array()
    .of(
      yup.object().shape({
        dayOfWeek: yup.string().required(),
        openingTime: yup.string().required(),
        closingTime: yup.string().required(),
      })
    )
    .required(),
});

interface StoreInfoProps {
  storeId: string;
}

const StoreInfo: React.FC<StoreInfoProps> = ({ storeId }) => {
//   const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, setValue } = useForm<StoreInfo>({
    resolver: yupResolver(schema),
  });

  const fetchStoreInfo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<StoreInfo>(
        `/storeConfig/${storeId}`
      );
    //   setStoreInfo(response.data);
      reset(response.data); 
      setError(null);
    } catch (error) {
      setError("Error fetching store info");
    } finally {
      setLoading(false);
    }
  }, [storeId, reset]);

  useEffect(() => {
    fetchStoreInfo();
  }, [fetchStoreInfo]);

  const onSubmit = (data: StoreInfo) => {
    console.log("Updated store info:", data);
  };

  const handleChange = (
    day: string,
    field: "openingTime" | "closingTime",
    value: string
  ) => {
    const updatedBusinessHoursList = (
      control._getWatch("businessHoursList") as BusinessHour[]
    ).map((hour) =>
      hour.dayOfWeek === day ? { ...hour, [field]: value } : hour
    );
    setValue("businessHoursList", updatedBusinessHoursList);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

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
              className="border border-gray-300 p-2 w-full rounded-md"
              readOnly
            />
          )}
        />
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
              className="border border-gray-300 p-2 w-full rounded-md"
              readOnly
            />
          )}
        />
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
              className="border border-gray-300 p-2 w-full rounded-md"
              readOnly
            />
          )}
        />
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
              className="border border-gray-300 p-2 w-full rounded-md"
              readOnly
            />
          )}
        />
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
              className="border border-gray-300 p-2 w-full rounded-md"
              readOnly
            />
          )}
        />
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
              className="border border-gray-300 p-2 w-full rounded-md"
              readOnly
            />
          )}
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">
          Email App Password
        </label>
        <Controller
          name="emailAppPassword"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              {...field}
              className="border border-gray-300 p-2 w-full rounded-md"
              readOnly
            />
          )}
        />
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
              className="border border-gray-300 p-2 w-full rounded-md"
              readOnly
            />
          )}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Business Hours</h2>
        {control._getWatch("businessHoursList")?.map((hours: BusinessHour) => (
          <div key={hours.dayOfWeek} className="mb-4">
            <h3 className="text-lg font-medium mb-2">{hours.dayOfWeek}</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 font-bold mb-1">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={hours.openingTime}
                  onChange={(e) =>
                    handleChange(hours.dayOfWeek, "openingTime", e.target.value)
                  }
                  className="border border-gray-300 p-2 w-full rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 font-bold mb-1">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={hours.closingTime}
                  onChange={(e) =>
                    handleChange(hours.dayOfWeek, "closingTime", e.target.value)
                  }
                  className="border border-gray-300 p-2 w-full rounded-md"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Edit
        </button>
      </div>
    </form>
  );
};

export default StoreInfo;
