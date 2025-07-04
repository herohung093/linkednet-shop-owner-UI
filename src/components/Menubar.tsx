import {
  AppBar,
  Box,
  Button,
  Collapse,
  Drawer,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Slide,
  Toolbar,
  useScrollTrigger,
  Typography,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { axiosWithToken } from "../utils/axios";
import NotificationIcon from "./NotificationIcon";
import HomeIcon from "@mui/icons-material/Home";
import AccountMenuItem from "./AccountMenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import moment from "moment";

interface MenuItemProps {
  label: string;
  path?: string;
  onClick?: () => void;
  children?: MenuItemProps[];
}

interface BillingEstimate {
  reservationCount: number;
  estimatedCost: number;
  month: string;
  year: number;
  partialMonth: boolean;
  billingStartDate: string;
  billingEndDate: string;
}

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  children?: React.ReactElement<any>;
}

const mainMenuStyle = {
  color: "black",
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontWeight: 550,
};

const MenubarDemo = () => {
  const [isOpenDrawer, setIsOpenDrawer] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [billingEstimate, setBillingEstimate] =
    useState<BillingEstimate | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [openMobileChildMenu, setOpenMobileChildMenu] = useState<string | null>(
    null
  );
  const storeConfigUuid = localStorage.getItem("storeUuid");

  const handleMobileItemClick = (label: string) => {
    setOpenMobileChildMenu(openMobileChildMenu === label ? null : label);
  };

  const handleManageStoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu("Manage Stores");
  };

  const handleManagePromotionsClick = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu("Manage Promotions");
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpenMenu(null);
  };

  const toggleDrawer = () => {
    setIsOpenDrawer(!isOpenDrawer);
  };

  const storeMenuItems: MenuItemProps[] = [
    ...(!storeConfigUuid
      ? [{ label: "Create Store", path: "/create-store" }]
      : []),
      { label: "Store Settings", path: "/store-settings" },
      { label: "Store Closed Dates", path: "/manage-store-closed-dates" },
  ];

  const managePromotionsMenuItems: MenuItemProps[] = [
    { label: "Create Promotion", path: "/create-promotion" },
    { label: "Promotions", path: "/manage-promotions" },
  ];

  const mainMenuItems: MenuItemProps[] = [
    { label: "Home", path: "/dashboard" },
    { label: "Manage Stores", children: storeMenuItems },
    { label: "Staff", path: "/staff" },
    { label: "Services", path: "/services" },
    { label: "Manage Bookings", path: "/manage-bookings" },
    { label: "Manage Customers", path: "/manage-customers" },
    { label: "Manage Promotions", children: managePromotionsMenuItems },
  ];

  // Define paths where specific menu items should be hidden
  const hiddenPaths = {
    updatePayment: ["/update-payment-details"],
  };

  function HideOnScroll(props: Props) {
    const { children, window } = props;
    // Note that you normally won't need to set the window ref as useScrollTrigger
    // will default to window.
    // This is only being set here because the demo is in an iframe.
    const trigger = useScrollTrigger({
      target: window ? window() : undefined,
    });

    return (
      <Slide appear={false} direction="down" in={!trigger}>
        {children ?? <div />}
      </Slide>
    );
  }

  const drawerMenuList = () => (
    <Box
      sx={{
        width: 200,
        display: "flex",
        flexDirection: "column",
        height: "95vh",
        gap: "0rem",
      }}
      role="presentation"
      onKeyDown={toggleDrawer}
    >
      {mainMenuItems.map((item, index) => (
        <div key={index}>
          <ListItem sx={{ paddingTop: "0px", paddingBottom: "0px" }}>
            <ListItemButton
              onClick={() => {
                if (item.children) {
                  handleMobileItemClick(item.label);
                } else {
                  toggleDrawer();
                  item.path && navigate(item.path);
                }
              }}
            >
              <ListItemText primary={item.label} />
              {item.children ? (
                openMobileChildMenu === item.label ? (
                  <ExpandLess />
                ) : (
                  <ExpandMore />
                )
              ) : null}
            </ListItemButton>
          </ListItem>
          {item.children && (
            <Collapse
              in={openMobileChildMenu === item.label}
              timeout="auto"
              unmountOnExit
            >
              {item.children.map((child, childIndex) => (
                <ListItem key={childIndex} sx={{ paddingLeft: 4 }}>
                  <ListItemButton
                    onClick={() => {
                      toggleDrawer();
                      child.path && navigate(child.path);
                    }}
                  >
                    <ListItemText primary={child.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </Collapse>
          )}
        </div>
      ))}
    </Box>
  );

  // Fetch estimated cost from API using axiosWithToken
  useEffect(() => {
    const fetchEstimatedCost = async () => {
      try {
        // Using axiosWithToken instead of fetch
        const response = await axiosWithToken.get<BillingEstimate>(
          "/billing/estimate"
        );
        setBillingEstimate(response.data);
      } catch (error) {
        console.error("Error fetching estimated cost:", error);
      }
    };

    fetchEstimatedCost();
  }, []);

  return (
    <div>
      {isMobile && (
        <Box sx={{ flexGrow: 1 }}>
          <HideOnScroll>
            <AppBar position="fixed" sx={{ background: "white" }}>
              <Toolbar variant="dense">
                <Box
                  sx={{
                    flexDirection: "row",
                    flexGrow: 1,
                    justifyContent: "space-between",
                    display: { xs: "flex", md: "none" },
                  }}
                >
                    <Box>
                      <IconButton
                        onClick={toggleDrawer}
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                      >
                        <MenuIcon sx={{ color: "black" }} />
                      </IconButton>
                    </Box>
                  <Box sx={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {billingEstimate && (
                      <>
                        <Tooltip title="Estimated Monthly Cost">
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgb(91, 105, 135)",
                              fontSize: "14px",
                            }}
                          >
                            Estimated costs: $
                            {billingEstimate.estimatedCost.toFixed(2)}
                          </Typography>
                        </Tooltip>
                        <Tooltip
                          title={
                            <div>
                              <p>
                                Reservation Count:{" "}
                                {billingEstimate.reservationCount}
                              </p>
                              <p>
                                Billing Period:{" "}
                                {moment(
                                  billingEstimate.billingStartDate
                                ).format("DD/MM/YYYY")}{" "}
                                -{" "}
                                {moment(
                                  billingEstimate.billingEndDate
                                ).format("DD/MM/YYYY")}
                              </p>
                              <p style={{ fontSize: "12px", fontStyle: "italic" }}>
                                Note: Walk-in and cancelled bookings are not included
                              </p>
                            </div>
                          }
                        >
                          <InfoOutlined
                            sx={{ color: "rgb(91, 105, 135)", fontSize: "16px" }}
                          />
                        </Tooltip>
                      </>
                    )}
                    <NotificationIcon />
                    <AccountMenuItem />
                  </Box>
                </Box>
              </Toolbar>
            </AppBar>
          </HideOnScroll>
          <Drawer anchor="left" open={isOpenDrawer} onClose={toggleDrawer}>
            {drawerMenuList()}
          </Drawer>
        </Box>
      )}

      <>
        {!isMobile && (
          <AppBar position="fixed" sx={{ background: "white" }}>
            <Toolbar>
              <Box
                sx={{
                  flexGrow: 1,
                  display: { xs: "flex", md: "flex", lg: "flex" },
                  justifyContent: "space-between",
                }}
              >
                  <Box
                    sx={{
                      display: "flex",
                      gap: "2rem",
                    }}
                  >
                    <Button
                      onClick={() => navigate("/dashboard")}
                      sx={{
                        color: "black",
                      }}
                    >
                      <HomeIcon />
                    </Button>
                    <div>
                      <Button
                        id="manage-store-menu"
                        onClick={handleManageStoreClick}
                        sx={mainMenuStyle}
                      >
                        Manage Stores
                      </Button>
                      <Menu
                        id="manage-store-menu"
                        aria-labelledby="manage-store-button"
                        anchorEl={anchorEl}
                        keepMounted
                        open={openMenu === "Manage Stores"}
                        onClose={handleClose}
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "left",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "left",
                        }}
                        MenuListProps={{
                          "aria-labelledby": "basic-button",
                        }}
                      >
                        {storeMenuItems.map((item, index) => (
                          <MenuItem
                            key={index}
                            onClick={() => {
                              handleClose();
                              item.path && navigate(item.path);
                            }}
                          >
                            {item.label}
                          </MenuItem>
                        ))}
                      </Menu>
                    </div>
                    <Button
                      onClick={() => navigate("/staff")}
                      sx={mainMenuStyle}
                    >
                      Staff
                    </Button>
                    <Button
                      onClick={() => navigate("/services")}
                      sx={{
                        color: "black",
                        fontFamily:
                          '"Roboto", "Helvetica", "Arial", sans-serif',
                        fontWeight: 550,
                      }}
                    >
                      Services
                    </Button>
                    <Button
                      onClick={() => navigate("/manage-bookings")}
                      sx={mainMenuStyle}
                    >
                      Manage Bookings
                    </Button>
                    <Button
                      onClick={() => navigate("/manage-customers")}
                      sx={mainMenuStyle}
                    >
                      Manage Customer
                    </Button>
                    <div>
                      <Button
                        id="manage-store-menu"
                        onClick={handleManagePromotionsClick}
                        sx={mainMenuStyle}
                      >
                        Manage Promotions
                      </Button>
                      <Menu
                        id="manage-promotions-menu"
                        aria-labelledby="manage-promotions-button"
                        anchorEl={anchorEl}
                        keepMounted
                        open={openMenu === "Manage Promotions"}
                        onClose={handleClose}
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "left",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "left",
                        }}
                        MenuListProps={{
                          "aria-labelledby": "basic-button",
                        }}
                      >
                        {managePromotionsMenuItems.map((item, index) => (
                          <MenuItem
                            key={index}
                            onClick={() => {
                              handleClose();
                              item.path && navigate(item.path);
                            }}
                          >
                            {item.label}
                          </MenuItem>
                        ))}
                      </Menu>
                    </div>
                  </Box>
                <Box sx={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {billingEstimate && (
                    <>
                      <Tooltip title="Estimated Monthly Cost">
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgb(91, 105, 135)",
                            fontSize: "14px",
                          }}
                        >
                          Estimated costs: $
                          {billingEstimate.estimatedCost.toFixed(2)}
                        </Typography>
                      </Tooltip>
                      <Tooltip
                        title={
                          <div>
                            <p>
                              Reservation Count:{" "}
                              {billingEstimate.reservationCount}
                            </p>
                            <p>
                              Billing Period:{" "}
                              {moment(
                                billingEstimate.billingStartDate
                              ).format("DD/MM/YYYY")}{" "}
                              -{" "}
                              {moment(
                                billingEstimate.billingEndDate
                              ).format("DD/MM/YYYY")}
                            </p>
                            <p style={{ fontSize: "12px", fontStyle: "italic" }}>
                              Note: Walk-in and cancelled bookings are not included
                            </p>
                          </div>
                        }
                      >
                        <InfoOutlined
                          sx={{ color: "rgb(91, 105, 135)", fontSize: "16px" }}
                        />
                      </Tooltip>
                    </>
                  )}
                  <NotificationIcon />
                  <AccountMenuItem />
                </Box>
              </Box>
            </Toolbar>
          </AppBar>
        )}
        <Box sx={{ height: "64px" }} />
      </>
    </div>
  );
};

export default MenubarDemo;
