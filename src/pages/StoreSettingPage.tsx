import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import StoreInfo from "../components/StoreInfo";
import { axiosWithToken } from "../utils/axios";
import { setStoresList } from "../redux toolkit/storesListSlice";
import { useNavigate } from "react-router";
import withAuth from "../components/HOC/withAuth";

const StoreSettingPage: React.FC = () => {
  const [updateTrigger, setUpdateTrigger] = useState<boolean>(false);
  const [selectedStore, setSelectedStore] = useState<number | string>("");
  const dispatch = useDispatch();

  const fetchAllStore = useCallback(async () => {
    try {
      const response = await axiosWithToken.get("/storeConfig/");    
      dispatch(setStoresList(response.data));
    } catch (error) {
      console.error("Error fetching store config:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAllStore();
  }, [fetchAllStore, updateTrigger]);

  const storeConfigRedux = useSelector(
    (state: RootState) => state.storesList.storesList
  );
  const selectedStoreId = useSelector(
    (state: RootState) => state.selectedStore.storeUuid
  );

  const storeConfig = useMemo(() => {
    if (storeConfigRedux) {
      return storeConfigRedux.slice().sort((a, b) => a.id - b.id);
    }
    return [];
  }, [storeConfigRedux]);
 
  const currentStore = storeConfig.find(
    (store) => store.storeUuid === selectedStoreId
  );

  useEffect(() => {
    if (storeConfig.length > 0 && currentStore) {
      setSelectedStore(currentStore.id);
    }
  }, [storeConfig, currentStore]);



  const selectedStoreInfo = storeConfig.find(
    (store) => store.id === selectedStore
  );

  const handleUpdate = () => {
    setUpdateTrigger((prev) => !prev);
  };
const navigate =useNavigate()
  return (
    <div className="min-h-screen xl:w-[90%] 2xl:w-[80%] mx-auto">
      <div className="flex justify-center md:justify-end items-center my-4">      
        <button onClick={()=>navigate('/create-store')}  className="btn-primary ml-4 px-4 py-2 ">Create Store</button>
      </div>
      {storeConfig.length > 0 ? (
        <>
          {selectedStoreInfo && (
            <StoreInfo
              storeUuid={selectedStoreInfo.storeUuid}
              handleUpdate={handleUpdate}
            />
          )}
        </>
      ) : (
        <p>No stores available. Please create a store!</p>
      )}
    </div>
  );
};

export default withAuth(StoreSettingPage);
