import MenubarDemo from "../components/Menubar";
import { Outlet, useLocation } from "react-router-dom";

const Main = () => {
  const location = useLocation();
  const hideMenubarPaths = ["/login", "/session-expired"];
  return (
    <>
      {!hideMenubarPaths.includes(location.pathname) && <MenubarDemo />}
      <Outlet />
    </>
  );
};

export default Main;
