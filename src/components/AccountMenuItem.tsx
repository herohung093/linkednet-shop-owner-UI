
import { AccountCircle } from "@mui/icons-material";
import { Avatar, IconButton, MenuItem, Menu, SelectChangeEvent, Divider, Box } from "@mui/material";
import { useNavigate } from "react-router";
import LogoutIcon from '@mui/icons-material/Logout';
import { useCallback, useEffect, useMemo, useState } from "react";
import SelectStore from "./SelectStore";
import { useDispatch, useSelector } from "react-redux";
import { axiosWithToken } from "../utils/axios";
import { RootState } from "../redux toolkit/store";
import useAuthCheck from "../hooks/useAuthCheck";
import { setStoresList } from "../redux toolkit/storesListSlice";
import { setSelectedStoreRedux } from "../redux toolkit/selectedStoreSlice";

const AccountMenuItem = () => {
  const [profileIconRef, setProfileIconRef] = useState<null | HTMLElement>(null);
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const localStorageStoreUuid = localStorage.getItem("storeUuid");
  const [selectedStore, setSelectedStore] = useState<string | undefined>(
    localStorageStoreUuid || undefined
  );

  useAuthCheck();

  const storeConfigRedux = useSelector(
    (state: RootState) => state.storesList.storesList
  );
  const storeConfig = useMemo(() => {
    if (storeConfigRedux) {
      return storeConfigRedux.slice().sort((a, b) => a.id - b.id);
    }
    return [];
  }, [storeConfigRedux]);


  const fetchAllStore = useCallback(async () => {
    try {
      const response = await axiosWithToken.get("/storeConfig/");
      dispatch(setStoresList(response.data));
    } catch (error) {
      console.error("Error fetching store config:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (storeConfig.length > 0) {
      const firstStoreUuid = storeConfig[0].storeUuid;
      if (!selectedStore) {
        setSelectedStore(firstStoreUuid);
        localStorage.setItem("storeUuid", firstStoreUuid);
        dispatch(setSelectedStoreRedux(firstStoreUuid));
      }
    }
  }, [storeConfig, selectedStore, dispatch]);

  useEffect(() => {
    fetchAllStore();
  }, [fetchAllStore]);

  const logoutHandler = () => {
    setProfileIconRef(null);
    navigate("/login");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("storeUuid");
  };

  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileIconRef(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setProfileIconRef(null);
  };

  const handleStoreChange = (event: SelectChangeEvent<string | undefined>) => {
    setProfileIconRef(null);
    const storeUuid = event.target.value as string | undefined;
    setSelectedStore(storeUuid);
    if (storeUuid !== undefined) {
      const selectedStore = storeConfig.find(
        (store) => store.storeUuid === storeUuid
      );
      if (selectedStore) {
        localStorage.setItem("storeUuid", selectedStore.storeUuid);
        dispatch(setSelectedStoreRedux(selectedStore.storeUuid));
      }
    }
  };

  return (
    <div>
      <IconButton
        size="small"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleProfileMenu}
        color="inherit"
        sx={{
          boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
          borderRadius: '50%',
          backgroundColor: 'white',
          border: '1px solid #E5E7EB'
        }}
      >
        <Avatar sx={{ width: 24, height: 24 }}>M</Avatar>
        {/* <AccountCircle sx={{ color: 'black' }} /> */}
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={profileIconRef}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(profileIconRef)}
        onClose={handleCloseProfileMenu}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              }
            },
          },
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 1,
        }}>
          <SelectStore
            handleStoreChange={handleStoreChange}
            selectedStore={selectedStore}
            storeConfigs={storeConfig}
          />
        </Box>
        <Divider />
        <MenuItem onClick={() => {
          setProfileIconRef(null);
          navigate("/password-reset");
        }}><AccountCircle sx={{ marginRight: '1rem' }} /> Change password</MenuItem>
        <MenuItem onClick={logoutHandler}><LogoutIcon sx={{ marginRight: '1rem' }} /> Logout</MenuItem>
      </Menu>
    </div>
  );
};

export default AccountMenuItem;
