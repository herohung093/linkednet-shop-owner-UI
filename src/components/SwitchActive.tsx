import React from "react";
import * as Switch from "@radix-ui/react-switch";

const SwitchActive: React.FC<{
  active: boolean;
  onChange: (active: boolean) => void;
}> = ({ active, onChange }) => {
  return (
    <>
      <div className="flex items-center gap-x-5">
        <label
          className="text-violet11 w-[80px] text-right text-[15px]"
          htmlFor="airplane-mode"
        >
          Active
        </label>
        <Switch.Root
          defaultChecked={active}
          onCheckedChange={onChange}
          className={` cursor-pointer text-[15px] leading-none w-[42px] h-[25px] bg-black rounded-full relative   data-[state=checked]:bg-blue-700 outline-none`}
          id="airplane-mode"
        >
          <Switch.Thumb className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_2px_2px] shadow-black transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]" />
        </Switch.Root>
      </div>
    </>
  );
};

export default SwitchActive;
