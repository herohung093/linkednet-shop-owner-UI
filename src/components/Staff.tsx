/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import SwitchActive from "./SwitchActive";
import { axiosWithToken } from "../utils/axios";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { getToken } from "../helper/getToken";
import StaffField from "./StaffField";
import WorkingDayRadio from "./WorkingDayRadio";
import SkillLevelRadio from "./SkillLevelRadio";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import createDateFromString from "../helper/DateFromString";
import { formatDate } from "../helper/FormatDate";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import CustomLoading from "./Loading";
import NumericInput from "./NumericInput";
import isTokenExpired from "../helper/CheckTokenExpired";
import { refreshToken } from "../helper/RefreshToken";
import { useNavigate } from "react-router";

type FormData = {
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  dateOfBirth: Date;
  isActive: boolean;
};

interface StaffProps {
  staff: Staff;
  type: "add" | "edit";
  onUpdate: () => void;
}

const schemaValidation = yup.object({
  firstName: yup
    .string()
    .required("Please enter first name")
    .max(10, "First name must be less than 10 characters"),
  lastName: yup
    .string()
    .required("Please enter last name")
    .max(10, "Last name must be less than 10 characters"),
  nickname: yup
    .string()
    .required("Please enter nick name")
    .max(10, "Nick name must be less than 10 characters"),
  phone: yup
    .string()
    .required("Please enter phone number")
    .matches(/^04\d{8}$/, "Phone number must be in the format 04xxxxxxxx"),
  dateOfBirth: yup
    .date()
    .required("Please enter date of birth")
    .typeError("Date of Birth must be in the format dd/mm/yyyy")
    .max(new Date(), "Please enter valid date of birth")
    .min(
      new Date(
        new Date().getFullYear() - 100,
        new Date().getMonth(),
        new Date().getDate()
      ),
      "Date of Birth must be at least 100 years ago"
    ),
  isActive: yup.boolean().required(),
});

const Staff: React.FC<StaffProps> = ({ staff, onUpdate, type }) => {
  const navigate = useNavigate();
  const [day, month, year] = staff.dateOfBirth.split("/");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schemaValidation),
    mode: "onChange",
    defaultValues: {
      isActive: staff.isActive,
      firstName: staff.firstName,
      lastName: staff.lastName,
      nickname: staff.nickname,
      phone: staff.phone,
      dateOfBirth: new Date(`${year}-${month}-${day}`),
    },
  });

  const [formData, setFormData] = useState<any>({
    ...staff,
    workingDays: staff.workingDays.split(",").map((day) => parseInt(day, 10)),
    dateOfBirth: createDateFromString(staff.dateOfBirth),
  });

  const [open, setOpen] = useState(false);

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseInt(value, 10) });
  };

  const handleWorkingDaysChange = (day: number) => {
    const newWorkingDays = formData.workingDays.includes(day)
      ? formData.workingDays.filter((d: number) => d !== day)
      : [...formData.workingDays, day];
    setFormData({ ...formData, workingDays: newWorkingDays });
  };

  // const router = useRouter();
  const onSubmitHandler = async (values: any) => {
    const payload = {
      ...formData,
      ...values,
      dateOfBirth: formatDate(values.dateOfBirth),
      workingDays: formData.workingDays.join(","),
    };
    if (sessionStorage.getItem("authToken")) {
      const token = getToken();

      if (isTokenExpired(token)) {
        refreshToken(navigate);
      }
    } else {
      navigate("/session-expired");
    }

    try {
      const response = await axiosWithToken.post("/staff/", payload);
      console.log(response.data);
      onUpdate();
      setOpen(false);

      if (response.status !== 201) {
        throw new Error("Failed to submit .");
      }
    } catch (error) {
      console.error("Error submitting", error);
    }
  };
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <div>
          {type === "add" && <div className="btn-primary">Add</div>}
          {type === "edit" && (
            <div
              key={staff.id}
              className={`sm:p-4 mb-10 border-2 rounded-lg shadow-md py-2 flex flex-col justify-between w-[160px] sm:w-[200px] mx-auto items-center cursor-pointer ${
                !staff.isActive && "bg-slate-300"
              }`}
            >
              <div className="text-base xs:text-sm font-semibold flex flex-col justify-center gap-2 mb-2 items-center">
                <AccountCircleIcon />
                {staff.firstName}
              </div>
              <div className="text-gray-600 mb-4 px-8 text-base flex flex-col items-center justify-center gap-x-2">
                <div>Nickname:</div>
                <div>{staff.nickname}</div>
              </div>
            </div>
          )}
        </div>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-dialog data-[state=open]:animate-overlayShow " />
        <Dialog.Content className="data-[state=open]:animate-contentShow content-dialog">
          <Dialog.Title className="text-slate-700 m-0 text-[17px] font-medium mb-5">
            Edit staff profile
          </Dialog.Title>
          <form onSubmit={handleSubmit(onSubmitHandler)}>
            <StaffField
              name="firstName"
              register={register}
              fieldName="First Name"
              value={formData.firstName}
            />
            {errors.firstName && (
              <div className="ml-[100px] text-red-500 -mt-3 mb-2">
                {errors.firstName.message}
              </div>
            )}
            <StaffField
              register={register}
              name="lastName"
              fieldName="Last Name"
              value={formData.lastName}
            />
            {errors.lastName && (
              <div className="ml-[100px] text-red-500 -mt-3 mb-2">
                {errors.lastName.message}
              </div>
            )}

            <StaffField
              register={register}
              name="nickname"
              fieldName="Nick Name"
              value={formData.nickname}
            />
            {errors.nickname && (
              <div className="ml-[100px] text-red-500 -mt-3 mb-2">
                {errors.nickname.message}
              </div>
            )}
            <StaffField
              register={register}
              name="phone"
              fieldName="Phone"
              value={formData.phone}
            />
            {errors.phone && (
              <div className="ml-[100px] text-red-500 -mt-3 mb-2">
                {errors.phone.message}
              </div>
            )}
            <div className="mb-[15px] flex items-center gap-5">
              <label className=" w-[80px] text-right text-[15px]">D.O.B</label>
              <div className="inline-flex flex-1 w-full">
                <Controller
                  control={control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => field.onChange(date)}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="dd/mm/yyyy"
                      customInput={
                        <NumericInput className="h-[35px] w-full sm:w-[360px] flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none" />
                      }
                    />
                  )}
                />
              </div>
            </div>
            {errors.dateOfBirth && (
              <div className="ml-[100px] text-red-500 -mt-3 mb-2">
                {errors.dateOfBirth.message}
              </div>
            )}
            <SkillLevelRadio
              formData={formData}
              handleRadioChange={handleRadioChange}
            />
            <WorkingDayRadio
              formData={formData}
              handleWorkingDaysChange={handleWorkingDaysChange}
            />
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <SwitchActive
                  active={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />
            <div className="mt-[25px] flex justify-end">
              <Dialog.Close asChild>
                <button
                  type="submit"
                  onClick={handleSubmit(onSubmitHandler)}
                  className={` hover:bg-blue-500 focus:shadow-blue-700 inline-flex h-[35px] w-[135px] items-center justify-center rounded-md px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none                                         
                     ${
                       !isValid
                         ? "bg-slate-500 text-white"
                         : "bg-blue-700 text-white"
                     }  
                  `}
                  disabled={!isValid}
                >
                  {isSubmitting ? (
                    <CustomLoading />
                  ) : (
                    <p>
                      {type == "add" && "Add"}{" "}
                      {type === "edit" && "Save changes"}
                    </p>
                  )}
                </button>
              </Dialog.Close>
            </div>
          </form>
          <Dialog.Close asChild>
            <button
              className="absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Staff;
