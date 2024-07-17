import { useState } from "react";
import { useNavigate, useLocation } from "react-router";

interface MenuItem {
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
  };

  const menuItems: MenuItem[] = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Staffs", path: "/staffs" },
    { label: "Service Type", path: "/service-type" },
    { label: "Bookings", path: "/bookings" },
    { label: "Logout", path: "", onClick: logoutHandler },
  ];

  return (
    <div className="mb-[100px] relative z-10">
      <div className="flex justify-between items-center font-bold text-lg">
        <div
          className={`absolute top-[60px] left-0 right-0 bg-white shadow-md rounded-md md:hidden ${
            isOpen ? "block" : "hidden"
          }`}
        >
          {menuItems.map((menuItem, index) => (
            <div key={index}>
              <div
                onClick={() => {
                  menuItem.label === "Logout"
                    ? logoutHandler()
                    : navigate(menuItem.path);
                  setIsOpen(false);
                }}
                className={`cursor-pointer py-2 mb-4 px-3 outline-none select-none font-bold leading-none rounded text-slate-900 text-[15px] lg:text-base flex items-center justify-between gap-[4px] hover:underline ${
                  currentPath === menuItem.path && "underline underline-offset-4"
                }`}
              >
                {menuItem.label}
              </div>
            </div>
          ))}
        </div>
        <div className="absolute right-0 top-1 flex md:hidden bg-white p-[3px] mt-5 w-[10%] mx-4 justify-center rounded-md border-2">
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
        {menuItems.map((menuItem, index) => (
          <div key={index}>
            <div
              onClick={() =>
                menuItem.label === "Logout"
                  ? logoutHandler()
                  : navigate(menuItem.path)
              }
              className={` cursor-pointer py-2 px-3 outline-none select-none font-medium leading-none rounded text-slate-900 text-[13px] lg:text-base flex items-center justify-between gap-[2px] hover:underline hover:underline-offset-4 ${
                currentPath === menuItem.path && "underline underline-offset-4"
              }`}
            >
              {menuItem.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenubarDemo;
