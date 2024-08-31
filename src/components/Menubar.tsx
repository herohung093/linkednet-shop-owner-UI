import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Slide, Toolbar, useScrollTrigger } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import NotificationIcon from "./NotificationIcon";
import AccountMenuItem from "./AccountMenuItem";
import * as Menubar from '@radix-ui/react-menubar';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface MenuItemProps {
  label: string;
  path: string;
  onClick?: () => void;
}

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  children?: React.ReactElement<any>;
}

const MenubarDemo = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuItems: MenuItemProps[] = [
    { label: "Home", path: "/dashboard" },
    { label: "Store Settings", path: "/store-settings" },
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
      sx={{ width: 200, display: "flex", flexDirection: "column", justifyContent: "space-between", height: '95vh' }}
      role="presentation"
      onClick={toggleMenu}
      onKeyDown={toggleMenu}
    >
        <List>
          {menuItems.map((item, index) => (
            <ListItem key={index} sx={{ paddingTop: '0px', paddingBottom: '0px' }}>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
    </Box>
  );

  return (
    <div >
      {isMobile && (
        <Box sx={{ flexGrow: 1 }}>
          <HideOnScroll>
            <AppBar position="fixed" sx={{ background: 'white' }}>
              <Toolbar variant="dense">
                <Box sx={{ flexDirection: 'row', flexGrow: 1, justifyContent: 'space-between', display: { xs: 'flex', md: 'none' } }}>
                  <Box>
                    <IconButton onClick={toggleMenu} edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                      <MenuIcon sx={{ color: 'black' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: '0.5rem' }}>
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
        {!isMobile && <AppBar position="fixed" sx={{ background: 'white' }}>
          <Toolbar>
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'flex', lg: 'flex' }, justifyContent: 'space-between' }}>
              <Menubar.Root style={{ display: 'flex', gap: '1rem' }}>
                {menuItems.map((menuItem) => (
                  <Menubar.Menu key={menuItem.label}>
                    <Menubar.Trigger
                      onClick={() => navigate(menuItem.path)}
                      className={`cursor-pointer py-2 px-3 outline-none select-none font-medium leading-none rounded text-slate-900 lg:text-base flex items-center justify-between gap-[2px] hover:underline hover:underline-offset-4 ${window.location.pathname === menuItem.path && "underline underline-offset-4"}`}
                    >
                      {menuItem.label}
                    </Menubar.Trigger>
                  </Menubar.Menu>
                ))}
              </Menubar.Root>
              <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                <NotificationIcon />
                <AccountMenuItem />
              </Box>
            </Box>
          </Toolbar>
        </AppBar>}
        <Box sx={{ height: '64px' }} />
      </>
    </div>
  );
};

export default MenubarDemo;
