import { axiosWithToken } from "../utils/axios";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";

type FormData = {
  typeName: string;
  levelType: number;
  displayOrder: number;
};

const schemaValidation = yup.object({
  typeName: yup
    .string()
    .required("Please enter type name")
    .max(50, "Type name must be less than 50 characters"),
  levelType: yup.number().required("Please enter level type"),
  displayOrder: yup
    .number()
    .typeError("Display Order must be a number")
    .required("Please enter display order")
    .min(1, "Minimum display order is 1"),
});

interface ServiceType {
  id: number;
  type: string;
  levelType: number;
  description: string | null;
  storeUuid: string;
  active: boolean;
  displayOrder: number;
  tenantUuid: string;
}

interface DialogServiceType {
  edit?: boolean;
  serviceType?: ServiceType;
  onUpdate: () => void;
}

const AddCategoryDialog: React.FC<DialogServiceType> = ({
  edit = false,
  serviceType,
  onUpdate,
}) => {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schemaValidation),
    mode: "onChange",
    defaultValues: {
      levelType: edit ? serviceType?.levelType : 1, // Default to level 1
      displayOrder: edit ? serviceType?.displayOrder : 1, // Default to display order 1

    },
  });

  function handleDialogClose(newState: boolean) {
    setOpen(newState);
    if (!newState) {
      reset();
    }
  }

  const onSubmit = async (data: FormData) => {
    const payload = {
      type: data.typeName,
      levelType: data.levelType,
      displayOrder: data.displayOrder,
      active: true,
    };

    try {
      const response = await axiosWithToken.post("/serviceType/", payload);
      onUpdate();
      setOpen(false);
      reset();

      if (response.status !== 200) {
        throw new Error("Failed to add Type.");
      }
    } catch (error) {
      console.error("Error adding Type:", error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleDialogClose}>
      <Dialog.Trigger asChild>
        <button className="btn-primary w-44">
          {edit ? "Edit Service  Type" : "Create Service Type"}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-overlayShow overlay-dialog" />
        <Dialog.Content className="data-[state=open]:animate-contentShow content-dialog">
          <Dialog.Title className="text-mauve12 m-0 text-[17px] font-medium mb-5">
            {edit ? "Edit Service  Type" : "Create Service Type"}
          </Dialog.Title>
          <Dialog.Description></Dialog.Description>
          <form onSubmit={handleSubmit(onSubmit)}>
            <fieldset className="mb-[15px] flex items-center gap-5">
              <label
                className="text-violet11 w-[90px] text-right text-[15px]"
                htmlFor="typeName"
              >
                Type Name
              </label>
              <input
                className="text-violet11 shadow-violet7 focus:shadow-violet8 inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="typeName"
                defaultValue={edit ? serviceType?.type : ""}
                {...register("typeName")}
              />
              {errors.typeName && (
                <span className="text-red-500 text-sm">
                  {errors.typeName.message}
                </span>
              )}
            </fieldset>

            <fieldset className="mb-[15px] flex items-center gap-5">
              <label
                className="text-violet11 w-[90px] text-right text-[15px]"
                htmlFor="levelType"
              >
                Type Level
              </label>
              <Controller
                name="levelType"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`rounded ${
                          field.value === level
                            ? "border-blue-700 bg-blue-700 text-white font-bold w-7"
                            : "bg-slate-300   border-slate-300 border-2 w-7"
                        }`}
                        onClick={() => field.onChange(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.levelType && (
                <span className="text-red-500 text-sm">
                  {errors.levelType.message}
                </span>
              )}
            </fieldset>

            <fieldset className="mb-[15px] flex items-center gap-5">
              <label
                className="text-violet11 w-[90px] text-right text-[15px]"
                htmlFor="levelType"
              >
                Display Order
              </label>
              <input
                type="number"
                min="1"
                defaultValue={1}
                id="displayOrder"
                {...register("displayOrder", { valueAsNumber: true })}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {errors.displayOrder && (
                <span className="text-red-500 text-sm">
                  {errors.displayOrder.message}
                </span>
              )}
            </fieldset>

            <div className="mt-[25px] flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {edit ? "Edit" : "Add Type"}
              </button>
            </div>
          </form>
          <Dialog.Close asChild>
            <button
              className="text-violet11 hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
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

export default AddCategoryDialog;
