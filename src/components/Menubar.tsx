import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Slide,
  Toolbar,
  useScrollTrigger,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import NotificationIcon from "./NotificationIcon";
import HomeIcon from "@mui/icons-material/Home";
import AccountMenuItem from "./AccountMenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

interface MenuItemProps {
  label: string;
  path?: string;
  onClick?: () => void;
  children?: MenuItemProps[];
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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleManageStoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu("Manage Stores");
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpenMenu(null);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const storeMenuItems: MenuItemProps[] = [
    { label: "Create Store", path: "/create-store" },
    { label: "Store Details", path: "/store-details" },
    { label: "Store Settings", path: "/store-settings" },
  ];

  const mainMenuItems: MenuItemProps[] = [
    { label: "Home", path: "/dashboard" },
    { label: "Manage Stores", children: storeMenuItems },
    { label: "Staffs", path: "/staffs" },
    { label: "Services", path: "/services" },
    { label: "Manage Bookings", path: "/manage-bookings" },
  ];

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
        justifyContent: "space-between",
        height: "95vh",
      }}
      role="presentation"
      onClick={toggleMenu}
      onKeyDown={toggleMenu}
    >
      <List>
        {mainMenuItems.map((item, index) => (
          <ListItem
            key={index}
            sx={{ paddingTop: "0px", paddingBottom: "0px" }}
          >
            <ListItemButton onClick={() => item.path && navigate(item.path)}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

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
                      onClick={toggleMenu}
                      edge="start"
                      color="inherit"
                      aria-label="menu"
                      sx={{ mr: 2 }}
                    >
                      <MenuIcon sx={{ color: "black" }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: "flex", gap: "0.5rem" }}>
                    <NotificationIcon />
                    <AccountMenuItem />
                  </Box>
                </Box>
              </Toolbar>
            </AppBar>
          </HideOnScroll>
          <Drawer anchor="left" open={isOpen} onClose={toggleMenu}>
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
                    onClick={() => navigate("/staffs")}
                    sx={mainMenuStyle}
                  >
                    Staffs
                  </Button>
                  <Button
                    onClick={() => navigate("/services")}
                    sx={{
                      color: "black",
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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
                </Box>
                <Box sx={{ display: "flex", gap: "0.5rem" }}>
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
