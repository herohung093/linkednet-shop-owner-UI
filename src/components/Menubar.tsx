import { SelectChangeEvent } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import useAuthCheck from "../hooks/useAuthCheck";
import { useDispatch, useSelector } from "react-redux";
import { axiosWithToken } from "../utils/axios";
import { setStoresList } from "../redux toolkit/storesListSlice";
import { RootState } from "../redux toolkit/store";
import { setSelectedStoreRedux } from "../redux toolkit/selectedStoreSlice";
import SelectStore from "./SelectStore";
import NotificationIcon from "./NotificationIcon";

interface MenuItemProps {
  label: string;
  path: string;
  onClick?: () => void;
}

const MenubarDemo = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const logoutHandler = () => {
    navigate("/");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("storeUuid");
  };

  const menuItems: MenuItemProps[] = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Staffs", path: "/staffs" },
    { label: "Services", path: "/services" },
    { label: "Manage Reservations", path: "/manage-reservations" },
    { label: "Logout", path: "", onClick: logoutHandler },
  ];

  useAuthCheck();
  const localStorageStoreUuid = localStorage.getItem("storeUuid");
  const [selectedStore, setSelectedStore] = useState<string | undefined>(
    localStorageStoreUuid || undefined
  );

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
  }, [fetchAllStore]);

  const storeConfigRedux = useSelector(
    (state: RootState) => state.storesList.storesList
  );
  const storeConfig = useMemo(() => {
    if (storeConfigRedux) {
      return storeConfigRedux.slice().sort((a, b) => a.id - b.id);
    }
    return [];
  }, [storeConfigRedux]);

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

  const handleStoreChange = (event: SelectChangeEvent<string | undefined>) => {
    toggleMenu()
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
    <div className="mb-[100px] relative z-10">
      <div className="flex justify-between items-center font-bold text-lg">
        <div
          className={`absolute top-[60px] left-0 right-0 bg-white shadow-md rounded-md md:hidden ${isOpen ? "block" : "hidden"
            }`}
        >
          <SelectStore
            handleStoreChange={handleStoreChange}
            selectedStore={selectedStore}
            storeConfig={storeConfig}
          />

          {menuItems.map((menuItem, index) => (
            <div key={index}>
              <div
                onClick={() => {
                  if (menuItem.onClick) {
                    menuItem.onClick();
                  } else {
                    navigate(menuItem.path);
                  }
                  setIsOpen(false);
                }}
                className={`cursor-pointer py-2 mb-4 px-3 outline-none select-none font-bold leading-none rounded text-slate-900 text-[15px] lg:text-base flex items-center justify-between gap-[4px] hover:underline ${currentPath === menuItem.path &&
                  "underline underline-offset-4"
                  }`}
              >
                {menuItem.label}
              </div>
            </div>
          ))}
        </div>
        <div className="absolute right-0 top-1 flex justify-evenly md:hidden bg-white p-[3px] mt-5 w-[20%] mx-4 rounded-md border-2">
          <NotificationIcon />
          <div className={`cursor-pointer`} onClick={toggleMenu}>
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </div>
        </div>
      </div>
      {/* Laptop and larger screens */}
      <div className="h-[1px]"></div>
      <div className="hidden md:flex bg-white p-[3px] mt-5 w-[90%] sm:w-[70%] lg:w-[50%] mx-auto justify-center rounded-md shadow-[0_2px_10px] shadow-blackA4">
        <SelectStore
          handleStoreChange={handleStoreChange}
          selectedStore={selectedStore}
          storeConfig={storeConfig}
        />

        {menuItems.map((menuItem, index) => (
          <div key={index}>
            <div
              onClick={() => {
                if (menuItem.onClick) {
                  menuItem.onClick();
                } else {
                  navigate(menuItem.path);
                }
              }}
              className={` cursor-pointer py-2 px-3 outline-none select-none font-medium leading-none rounded text-slate-900 text-[13px] lg:text-base flex items-center justify-between gap-[2px] hover:underline hover:underline-offset-4 ${currentPath === menuItem.path && "underline underline-offset-4"
                }`}
            >
              {menuItem.label}
            </div>
          </div>
        ))}
        <div className="notification-icon">
          <NotificationIcon />
        </div>
      </div>
    </div>
  );
};

export default MenubarDemo;
