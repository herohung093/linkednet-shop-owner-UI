import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from "@mui/material";
import { RootState } from "../redux toolkit/store";
import StoreConfigDialog from "../components/StoreConfigDialog";

const DashboardPage: React.FC = () => {
  const [updateTrigger, setUpdateTrigger] = useState<boolean>(false);
  const storeConfig = useSelector(
    (state: RootState) => state.storesList.storesList
  );
  console.log(storeConfig);

  const [selectedStore, setSelectedStore] = useState(
    storeConfig.length > 0 ? storeConfig[0].id : ""
  );
  const handleStoreChange = (event: SelectChangeEvent<string | number>) => {
    setSelectedStore(event.target.value as number);
  };

  const selectedStoreInfo = storeConfig.find(
    (store) => store.id === selectedStore
  );
  const handleUpdate = () => {
    setUpdateTrigger(!updateTrigger);
  };

  return (
    <div className="min-h-screen xl:w-[90%] 2xl:w-[80%] mx-auto">
             <div className="flex justify-end items-center mb-4">
            <FormControl variant="outlined" style={{ minWidth: 200 }}>
              <InputLabel id="store-select-label">Select Store</InputLabel>
              <Select
                className="h-[38px]"
                labelId="store-select-label"
                value={selectedStore}
                onChange={handleStoreChange}
                label="Select Store"
              >
                {storeConfig.map((store) => (
                  <MenuItem key={store.id} value={store.id}>
                    {store.storeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <button className="btn-primary ml-4 px-4 py-2">Create Store</button>
          </div>
      {storeConfig?.length > 0 ? (
        <>
   

          {selectedStoreInfo && (
            <div className="mt-10 w-full max-w-2xl mx-auto flex flex-col justify-center">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-center mb-6 text-2xl font-bold">
                  {selectedStoreInfo.storeName}
                </h2>
                <div className="space-y-4">
                  <p>
                    <strong>Short Store Name:</strong>{" "}
                    {selectedStoreInfo.shortStoreName}
                  </p>
                  <p>
                    <strong>Store Address:</strong>{" "}
                    {selectedStoreInfo.storeAddress}
                  </p>
                  <p>
                    <strong>Store Phone Number:</strong>{" "}
                    {selectedStoreInfo.storePhoneNumber}
                  </p>
                  <p>
                    <strong>Store Email:</strong> {selectedStoreInfo.storeEmail}
                  </p>
                  <p>
                    <strong>Front End URL:</strong>{" "}
                    <a
                      href={`https://nail-salon-booking.vercel.app/?storeUuid=${selectedStoreInfo.storeUuid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      {`https://nail-salon-booking.vercel.app`}
                    </a>
                  </p>
                  <p>
                    <strong>Store UUID:</strong> {selectedStoreInfo.storeUuid}
                  </p>
                  <p>
                    <strong>Enable Reservation Confirmation:</strong>{" "}
                    {selectedStoreInfo.enableReservationConfirmation
                      ? "Yes"
                      : "No"}
                  </p>
                  <p>
                    <strong>Automatic Approved:</strong>{" "}
                    {selectedStoreInfo.automaticApproved ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Zone ID:</strong> {selectedStoreInfo.zoneId}
                  </p>
                </div>
                <div className="flex justify-end mt-6">
                 <StoreConfigDialog mode="edit" onUpdate={handleUpdate}/>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p>No stores available. Please create a store!</p>
      )}
    </div>
  );
};

export default DashboardPage;
