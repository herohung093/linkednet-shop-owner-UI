import MenubarDemo from "../components/Menubar";
import { Outlet, useLocation } from "react-router-dom";
import useAuthHomePageRedirect from "../hooks/useAuthHomePageRedirect";

const Main = () => {
  const location = useLocation();
  const hideMenubarPaths = ["/login", "/session-expired", "/404", "/"];

  useAuthHomePageRedirect();
  return (
    <>
      {!hideMenubarPaths.includes(location.pathname) && <MenubarDemo />}
      <Outlet />
    </>
  );
};

export default Main;
