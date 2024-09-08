import MenubarDemo from "../components/Menubar";
import { Outlet, useLocation } from "react-router-dom";

const Main = () => {
  const location = useLocation();
  const hideMenubarPaths = ["/login", "/signup", "/session-expired", "/404", "/", "/reset-password-verification", "email-confirmation"];

  return (
    <>
      {!hideMenubarPaths.includes(location.pathname) && <MenubarDemo />}
      <Outlet />
    </>
  );
};

export default Main;
