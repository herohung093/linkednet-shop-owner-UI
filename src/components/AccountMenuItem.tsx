import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  CreditCard as PaymentIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import SelectStore from "./SelectStore";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { axiosWithToken } from "../utils/axios";
import { RootState } from "../redux toolkit/store";
import { setStoresList } from "../redux toolkit/storesListSlice";
import { setSelectedStoreRedux } from "../redux toolkit/selectedStoreSlice";
import moment from "moment";

const AccountMenuItem = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const localStorageStoreUuid = localStorage.getItem("storeUuid");
  const [selectedStore, setSelectedStore] = useState<string | undefined>(
    localStorageStoreUuid || undefined
  );

  const storeConfig = useSelector(
    (state: RootState) => state.storesList.storesList,
    shallowEqual
  );

  const userDetails = useSelector(
    (state: RootState) => state.userDetails.userDetails
  );

  const fetchAllStore = async () => {
    try {
      const response = await axiosWithToken.get("/storeConfig/");
      const newStoresList = response.data;
      if (JSON.stringify(storeConfig) !== JSON.stringify(newStoresList)) {
        dispatch(setStoresList(newStoresList));
      }
    } catch (error) {
      console.error("Error fetching store config:", error);
    }
  };

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
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    navigate("/login");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("storeUuid");
  };

  const handleStoreChange = (event: any) => {
    handleClose();
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

  const getInitials = () => {
    if (!userDetails) return "?";
    return `${userDetails.firstName.charAt(0)}${userDetails.lastName.charAt(0)}`;
  };

  const isTrialExpired = () => {
    if (!userDetails?.trialEndDate) return false;
    const trialEnd = moment(userDetails.trialEndDate, "DD/MM/YYYY HH:mm:ss");
    return !userDetails.stripeCustomerId && trialEnd.isSameOrBefore(moment());
  };

  return (
    <Box>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleMenu}
          size="small"
          sx={{
            ml: 1,
            p: 0.5,
            transition: 'all 0.2s',
            backgroundColor: anchorEl ? 'action.selected' : 'transparent',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
                fontWeight: 'medium',
              }}
            >
              {getInitials()}
            </Avatar>
            <ArrowDownIcon
              sx={{
                transition: 'transform 0.2s',
                transform: anchorEl ? 'rotate(180deg)' : 'none',
                color: 'action.active',
              }}
            />
          </Box>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 250,
            borderRadius: 2,
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" noWrap fontWeight="medium">
            {userDetails?.firstName} {userDetails?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {userDetails?.email}
          </Typography>
          {isTrialExpired() && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'error.main',
                display: 'block',
                mt: 0.5 
              }}
            >
              Trial period has expired
            </Typography>
          )}
        </Box>

        <Divider />

        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 0.5, mb: 1, display: 'block' }}
          >
            Current Store
          </Typography>
          <SelectStore
            handleStoreChange={handleStoreChange}
            selectedStore={selectedStore}
            storeConfigs={storeConfig}
          />
        </Box>

        <Divider />

        <MenuItem onClick={() => navigate("/update-payment-details")}>
          <ListItemIcon>
            <PaymentIcon fontSize="small" />
          </ListItemIcon>
          Payment Details
          {isTrialExpired() && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: '0.75rem',
                bgcolor: 'error.main',
                color: 'white',
              }}
            >
              Required
            </Box>
          )}
        </MenuItem>

        <MenuItem onClick={() => navigate("/password-reset")}>
          <ListItemIcon>
            <AccountIcon fontSize="small" />
          </ListItemIcon>
          Change Password
        </MenuItem>

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AccountMenuItem;