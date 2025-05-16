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

interface MenuItemProps {
  label: string;
  path?: string;
  onClick?: () => void;
  children?: MenuItemProps[];
}

interface Props {
  window?: () => Window;
  children?: React.ReactElement<any>;
}

const mainMenuStyle = {
  color: "black",
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontWeight: 550,
  height: "64px",
  lineHeight: "64px",
  padding: "0 16px",
  textTransform: "none",
  minWidth: "auto",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
};

const MenubarDemo = () => {
  const [isOpenDrawer, setIsOpenDrawer] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [estimatedCost, setEstimatedCost] = useState<string | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [openMobileChildMenu, setOpenMobileChildMenu] = useState<string | null>(
    null
  );
  const storeConfigUuid = localStorage.getItem("storeUuid");

  const handleMobileItemClick = (label: string) => {
    setOpenMobileChildMenu(openMobileChildMenu === label ? null : label);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, label: string) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(label);
  };

  const handleManageStoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu("Manage Stores");
  };

  const handleManagePromotionsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu("Manage Promotions");
  };

  const handleManageStaffClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu("Manage Staff");
  };

  const handlePayrollClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu("Payroll");
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

  const manageStaffMenuItems: MenuItemProps[] = [
    { label: "Staff List", path: "/staff" },
    { label: "Staff Salary", path: "/staff-salary" },
  ];

  const payrollMenuItems: MenuItemProps[] = [
    { label: "Create Payroll", path: "/create-payroll" },
    { label: "Payroll History", path: "/payroll-history" },
  ];

  const mainMenuItems: MenuItemProps[] = [
    { label: "Home", path: "/dashboard" },
    { label: "Manage Stores", children: storeMenuItems },
    { label: "Manage Staff", children: manageStaffMenuItems },
    { label: "Payroll", children: payrollMenuItems },
    { label: "Services", path: "/services" },
    { label: "Manage Bookings", path: "/manage-bookings" },
    { label: "Manage Customers", path: "/manage-customers" },
    { label: "Manage Promotions", children: managePromotionsMenuItems },
  ];

  function HideOnScroll(props: Props) {
    const { children, window } = props;
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

  useEffect(() => {
    const fetchEstimatedCost = async () => {
      try {
        const response = await axiosWithToken.get('/billing/estimate');
        const costValue = response.data.estimatedCost 
          ? Number(response.data.estimatedCost).toFixed(2) 
          : '0.00';
        setEstimatedCost(costValue);
      } catch (error) {
        console.error('Error fetching estimated cost:', error);
        setEstimatedCost('0.00');
      }
    };

    fetchEstimatedCost();
  }, []);

  return (
    <div>
      {isMobile ? (
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
                    {estimatedCost && (
                      <Tooltip title="Estimated Monthly Cost">
                        <Typography variant="body2" sx={{ 
                          color: 'rgb(91, 105, 135)',
                          fontSize: '14px'
                        }}>
                          Estimated costs: ${estimatedCost}
                        </Typography>
                      </Tooltip>
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
      ) : (
        <AppBar position="fixed" sx={{ background: "white", boxShadow: 1 }}>
          <Toolbar sx={{ minHeight: "64px !important", px: 2 }}>
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <IconButton
                  onClick={() => navigate("/dashboard")}
                  sx={{
                    color: "black",
                    height: "40px",
                    width: "40px",
                  }}
                >
                  <HomeIcon />
                </IconButton>

                {mainMenuItems.map((item, index) => (
                  item.children ? (
                    <Box key={index} sx={{ position: "relative" }}>
                      <Button
                        id={`${item.label.toLowerCase()}-menu`}
                        onClick={(e) => handleMenuClick(e, item.label)}
                        sx={mainMenuStyle}
                      >
                        {item.label}
                      </Button>
                      <Menu
                        id={`${item.label.toLowerCase()}-menu`}
                        anchorEl={anchorEl}
                        open={openMenu === item.label}
                        onClose={handleClose}
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "left",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "left",
                        }}
                        PaperProps={{
                          elevation: 2,
                          sx: { mt: 1 }
                        }}
                      >
                        {item.children.map((child, childIndex) => (
                          <MenuItem
                            key={childIndex}
                            onClick={() => {
                              handleClose();
                              child.path && navigate(child.path);
                            }}
                          >
                            {child.label}
                          </MenuItem>
                        ))}
                      </Menu>
                    </Box>
                  ) : (
                    <Button
                      key={index}
                      onClick={() => item.path && navigate(item.path)}
                      sx={mainMenuStyle}
                    >
                      {item.label}
                    </Button>
                  )
                ))}
              </Box>

              <Box 
                sx={{ 
                  display: "flex", 
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {estimatedCost && (
                  <Tooltip title="Estimated Monthly Cost">
                    <Typography 
                      variant="body2" 
                      sx={{
                        color: 'rgb(91, 105, 135)',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Estimated costs: ${estimatedCost}
                    </Typography>
                  </Tooltip>
                )}
                <NotificationIcon />
                <AccountMenuItem />
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ height: "64px" }} />
    </div>
  );
};

export default MenubarDemo;