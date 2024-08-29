
import * as Menubar from "@radix-ui/react-menubar";
import { useNavigate } from "react-router";

const Account = () => {
  const navigate = useNavigate()
  const logoutHandler = () => {
    navigate("/");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("storeUuid");
  };

  return (
    <Menubar.Root className="flex z-1000">
      <Menubar.Menu>
        <Menubar.Trigger className="cursor-pointer py-2 px-3 mb-6 md:mb-0  outline-none select-none font-medium leading-none rounded text-black text-base flex lg:mt-1  justify-between gap-[2px] hover:underline hover:underline-offset-4">
          Account
        </Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content
            className="min-w-[120px] bg-white rounded-md p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] [animation-duration:_400ms] [animation-timing-function:_cubic-bezier(0.16,_1,_0.3,_1)] will-change-[transform,opacity] z-[1000] "
            align="start"
            sideOffset={5}
            alignOffset={-14}
          >
            <Menubar.RadioGroup             
            >            
              <Menubar.Separator className="h-[1px] bg-violet6 m-[5px]" />
              <Menubar.Item className="text-[13px] hover:underline hover:font-bold cursor-pointer leading-none text-violet11 rounded flex items-center h-[25px] px-[10px] relative select-none pl-5 outline-none data-[state=open]:bg-violet4 data-[state=open]:text-violet11 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-violet9 data-[highlighted]:to-violet10 data-[highlighted]:text-violet1 data-[highlighted]:data-[state=open]:text-violet1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
               Profile
              </Menubar.Item>
              <Menubar.Separator className="h-[1px] bg-violet6 m-[5px]" />
              <Menubar.Item onClick={logoutHandler} className="text-[13px] hover:underline hover:font-bold cursor-pointer leading-none text-violet11 rounded flex items-center h-[25px] px-[10px] relative select-none pl-5 outline-none data-[state=open]:bg-violet4 data-[state=open]:text-violet11 data-[highlighted]:bg-gradient-to-br data-[highlighted]:from-violet9 data-[highlighted]:to-violet10 data-[highlighted]:text-violet1 data-[highlighted]:data-[state=open]:text-violet1 data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none">
               Logout
              </Menubar.Item>
            </Menubar.RadioGroup>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
};

export default Account;
