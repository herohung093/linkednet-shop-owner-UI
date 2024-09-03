import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { axiosWithToken } from "../utils/axios";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import CustomLoading from "./Loading";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";

interface StoreConfig {
  id: number;
  storeName: string;
  shortStoreName: string;
  storeAddress: string;
  storePhoneNumber: string;
  storeEmail: string;
  frontEndUrl: string;
  storeUuid: string;
  enableReservationConfirmation: boolean;
  automaticApproved: boolean;
  zoneId: string;
}

interface StoreConfigDialogProps {
  storeConfig?: StoreConfig;
  onUpdate: () => void;
  mode: "add" | "edit";
}

type StoreConfigFormData = Omit<StoreConfig, "id">;

const schemaValidation = yup
  .object({
    storeName: yup
      .string()
      .required("Please enter store name")
      .max(50, "Must be less than 50 characters"),
    shortStoreName: yup
      .string()
      .required("Please enter short store name")
      .max(20, "Must be less than 20 characters"),
    storeAddress: yup
      .string()
      .required("Please enter store address")
      .max(100, "Must be less than 100 characters"),
    storePhoneNumber: yup
      .string()
      .required("Please enter store phone number")
      .matches(/^04\d{8}$/, "Must be a valid phone number"),
    storeEmail: yup
      .string()
      .required("Please enter store email")
      .email("Must be a valid email"),
    frontEndUrl: yup
      .string()
      .required("Please enter front-end URL")
      .url("Must be a valid URL"),
    storeUuid: yup.string().required("Please enter store UUID"),
    enableReservationConfirmation: yup.boolean().required(),
    automaticApproved: yup.boolean().required(),
    zoneId: yup
      .string()
      .required("Please enter zone ID")
      .typeError("Zone ID must be a string"),
  })
  .required();

const StoreConfigDialog: React.FC<StoreConfigDialogProps> = ({
  storeConfig,
  onUpdate,
  mode,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<StoreConfigFormData>({
    resolver: yupResolver(schemaValidation),
    mode: "onChange",
    defaultValues: {
      storeName: storeConfig?.storeName || "",
      shortStoreName: storeConfig?.shortStoreName || "",
      storeAddress: storeConfig?.storeAddress || "",
      storePhoneNumber: storeConfig?.storePhoneNumber || "",
      storeEmail: storeConfig?.storeEmail || "",
      frontEndUrl: storeConfig?.frontEndUrl || "",
      storeUuid: storeConfig?.storeUuid || "",
      enableReservationConfirmation:
        storeConfig?.enableReservationConfirmation || false,
      automaticApproved: storeConfig?.automaticApproved || false,
      zoneId: storeConfig?.zoneId || undefined,
    },
  });

  const [open, setOpen] = useState(false);

  const onSubmitHandler = async (values: StoreConfigFormData) => {
    const payload = { ...values };


    try {
      let response;
      if (mode === "edit") {
        response = await axiosWithToken.put(
          `/store/${storeConfig?.id}`,
          payload
        );
      } else {
        response = await axiosWithToken.post("/store/", payload);
      }
      onUpdate();
      setOpen(false);

      if (response.status !== 200 && response.status !== 201) {
        throw new Error("Failed to submit.");
      }
    } catch (error) {
      console.error("Error submitting", error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild className="sm:hidden">
        <button className="">
          {mode === "edit" ? (
            <MoreVertIcon className="cursor-pointer text-blue-500" />
          ) : (
            <AddIcon />
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Trigger asChild className="hidden sm:block">
        <button
          className={`${mode === "edit" ? "btn-secondary" : "btn-primary"}`}
        >
          {mode === "edit" ? "Edit Store" : "Add Store"}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-dialog data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="data-[state=open]:animate-contentShow content-dialog">
          <Dialog.Title className="text-slate-700 m-0 text-[17px] font-medium mb-5">
            {mode === "edit" ? "Edit Store" : "Add Store"}
          </Dialog.Title>
          <Dialog.Description className="text-mauve11 mt-[10px] mb-5 text-[15px] leading-normal">
            {mode === "edit"
              ? "Edit your store configuration. Click save when you're done."
              : "Add a new store configuration. Click save when you're done."}
          </Dialog.Description>
          <form onSubmit={handleSubmit(onSubmitHandler)}>
            <div
              className={`input-box ${
                errors?.storeName?.message && "mb-10 md:mb-5"
              }`}
            >
              <label className="label">Store Name</label>
              <div className="h-[35px] w-[150px] sm:w-full flex-1 items-center justify-center">
                <input {...register("storeName")} className="input" />
                {errors.storeName && (
                  <div className="error-message">
                    {errors.storeName.message}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`input-box ${
                errors?.shortStoreName?.message && "mb-10 md:mb-5"
              }`}
            >
              <label className="label">Short Name</label>
              <div className="h-[35px] w-[150px] sm:w-full flex-1 items-center justify-center">
                <input {...register("shortStoreName")} className="input" />
                {errors.shortStoreName && (
                  <div className="error-message">
                    {errors.shortStoreName.message}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`input-box ${
                errors?.storeAddress?.message && "mb-10 md:mb-5"
              }`}
            >
              <label className="label">Address</label>
              <div className="h-[35px] w-[150px] sm:w-full flex-1 items-center justify-center">
                <input {...register("storeAddress")} className="input" />
                {errors.storeAddress && (
                  <div className="error-message">
                    {errors.storeAddress.message}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`input-box ${
                errors?.storePhoneNumber?.message && "mb-10 md:mb-5"
              }`}
            >
              <label className="label">Phone</label>
              <div className="h-[35px] w-[150px] sm:w-full flex-1 items-center justify-center">
                <input {...register("storePhoneNumber")} className="input" />
                {errors.storePhoneNumber && (
                  <div className="error-message">
                    {errors.storePhoneNumber.message}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`input-box ${
                errors?.storeEmail?.message && "mb-10 md:mb-5"
              }`}
            >
              <label className="label">Store Email</label>
              <div className="h-[35px] w-[150px] sm:w-full flex-1 items-center justify-center">
                <input {...register("storeEmail")} className="input" />
                {errors.storeEmail && (
                  <div className="error-message">
                    {errors.storeEmail.message}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`input-box ${
                errors?.frontEndUrl?.message && "mb-10 md:mb-5"
              }`}
            >
              <label className="label">URL</label>
              <div className="h-[35px] w-[150px] sm:w-full flex-1 items-center justify-center">
                <input {...register("frontEndUrl")} className="input" />
                {errors.frontEndUrl && (
                  <div className="error-message">
                    {errors.frontEndUrl.message}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`input-box ${
                errors?.storeUuid?.message && "mb-10 md:mb-5"
              }`}
            >
              <label className="label">Store UUID</label>
              <div className="h-[35px] w-[150px] sm:w-full flex-1 items-center justify-center">
                <input {...register("storeUuid")} className="input" />
                {errors.storeUuid && (
                  <div className="error-message">
                    {errors.storeUuid.message}
                  </div>
                )}
              </div>
            </div>
            {/* <Controller
              control={control}
              name="automaticApproved"
              render={({ field }) => (
                <SwitchActive
                  active={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            /> */}
            <div
              className={`input-box ${
                errors?.zoneId?.message && "mb-10 md:mb-5"
              }`}
            >
              <label className="label">Zone ID</label>
              <div className="h-[35px] w-[150px] sm:w-full flex-1 items-center justify-center">
                <input
                  type="number"
                  inputMode="numeric"
                  {...register("zoneId")}
                  className="input"
                />
                {errors.zoneId && (
                  <div className="error-message">{errors.zoneId.message}</div>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                className={`hover:bg-blue-500 focus:shadow-blue-700 inline-flex h-[35px] w-[135px] items-center justify-center rounded-md px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none ${
                  !isValid
                    ? "bg-slate-500 text-white"
                    : "bg-slate-950 text-white"
                }`}
                disabled={!isValid}
              >
                {isSubmitting ? <CustomLoading /> : "Save changes"}
              </button>
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

export default StoreConfigDialog;
