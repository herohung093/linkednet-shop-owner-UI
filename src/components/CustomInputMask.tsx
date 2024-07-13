/* eslint-disable @typescript-eslint/no-explicit-any */
import  { forwardRef } from "react";
import { InputMask } from "@react-input/mask";

interface CustomInputMaskProps {
  mask: string;
  placeholder?: string;
  className?: string;
  value:any
}

const CustomInputMask = forwardRef<HTMLInputElement, CustomInputMaskProps>(
  ({ value,mask, placeholder, className, ...rest }, ref) => (
    <InputMask
      {...rest}
      value={value}
      mask={mask}
      placeholder={placeholder}
      className={className}
      ref={ref}
    />
  )
);

export default CustomInputMask;
