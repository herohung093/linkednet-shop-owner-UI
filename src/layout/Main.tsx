import MenubarDemo from "../components/Menubar";
import { Outlet } from "react-router-dom";

const Main = () => {
  return (
    <>
      <MenubarDemo />
      <Outlet></Outlet>
    </>
  );
};

export default Main;
