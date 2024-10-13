import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import StoreInfo from "../components/StoreInfo";
import withAuth from "../components/HOC/withAuth";
import { Box } from "@mui/material";

const StoreSettingPage: React.FC = () => {
  const [selectedStore, setSelectedStore] = useState<number | string>("");

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

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
      }}
    >
      {storeConfig.length > 0 ? (
        <>
          {selectedStoreInfo && (
            <StoreInfo
              storeUuid={selectedStoreInfo.storeUuid}
              submitType="update"
            />
          )}
        </>
      ) : (
        <p>No stores available. Please create a store!</p>
      )}
    </Box>
  );
};

export default withAuth(StoreSettingPage);
