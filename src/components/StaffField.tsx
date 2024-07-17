import { UseFormRegister } from "react-hook-form";

type FormData = {
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  dateOfBirth: Date;
  isActive: boolean;
};

interface StaffFieldProps {
  value: string | number | readonly string[] | undefined;
  fieldName: string;
  name: keyof FormData;
  register: UseFormRegister<FormData>;
}

const StaffField: React.FC<StaffFieldProps> = ({
  value,
  fieldName,
  name,
  register,
}) => {
  return (
    <fieldset className="mb-[15px] flex items-center gap-5">
      <label className="w-[80px] text-right text-[15px]" htmlFor={name}>
        {fieldName}
      </label>
      <input
        className="input"
        id={name}
        {...register(name)}
        name={name}
        defaultValue={value}
        inputMode={name === "phone" ? "numeric" : undefined}
        pattern={name === "phone" ? "^04\\d{8}$" : undefined}
        onInput={
          name === "phone"
            ? (e) => {
                const input = e.target as HTMLInputElement;
                input.value = input.value.replace(/[^0-9]/g, "");
              }
            : undefined
        }
      />
    </fieldset>
  );
};

export default StaffField;
