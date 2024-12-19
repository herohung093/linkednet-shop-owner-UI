import { axiosWithToken } from "../utils/axios";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SwitchActive from "./SwitchActive";

type FormData = {
  typeName: string;
  levelType: number;
  typeId: string;
  displayOrder: number;
  active: boolean;
};

const schemaValidation = yup.object({
  typeName: yup
    .string()
    .required("Please enter type name")
    .max(20, "Type name must be less than 20 characters"),
  typeId: yup.string().required("").max(3, ""),
  active: yup.boolean().required(),
  levelType: yup
    .number()
    .required("Please enter level type")
    .positive("Level type must be a positive number")
    .integer("Level type must be an integer"),
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

interface EditCategoryDialogType {
  serviceType?: ServiceType;
  onUpdate: () => void;
}

const EditCategoryDialog: React.FC<EditCategoryDialogType> = ({
  serviceType,
  onUpdate,
}) => {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schemaValidation),
    mode: "onChange",
    defaultValues: {
      typeName: serviceType?.type || "",
      levelType: serviceType?.levelType || 5, // default to level 5
      typeId: serviceType?.id.toString() || "",
      displayOrder: serviceType?.displayOrder || 1, // default to display order 1
      active: serviceType?.active,
    },
  });

  const onSubmit = async (data: FormData) => {
    const payloadEdit = {
      type: data.typeName,
      levelType: data.levelType,
      description: null,
      displayOrder: data.displayOrder,
      active: data.active,
    };

    try {
      const response = await axiosWithToken.put(
        `/serviceType/${data.typeId}`,
        payloadEdit
      );
      onUpdate();
      setOpen(false);

      if (response.status !== 200) {
        throw new Error("Failed to edit Type.");
      }
    } catch (error) {
      console.error("Error editing type:", error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild className="sm:hidden">
        <button>
          <MoreVertIcon className="cursor-pointer" />
        </button>
      </Dialog.Trigger>
      <Dialog.Trigger asChild className="hidden sm:block">
        <button className="btn-primary w-44">Edit Service Type</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-overlayShow overlay-dialog" />
        <Dialog.Content className="data-[state=open]:animate-contentShow content-dialog">
          <Dialog.Title className="text-mauve12 m-0 text-[17px] font-medium mb-5">
            Edit Service Type
          </Dialog.Title>
          <Dialog.Description></Dialog.Description>
          <form onSubmit={handleSubmit(onSubmit)}>
            <fieldset className="mb-[15px] flex items-center gap-5">
              <label
                className="text-violet11 text-right text-[15px]"
                htmlFor="typeName"
              >
                Type
              </label>
              <input
                className="text-violet11 shadow-violet7 focus:shadow-violet8 inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="typeName"
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
                className="text-violet11 text-right text-[15px]"
                htmlFor="levelType"
              >
                Level Type
              </label>
              <Controller
                name="levelType"
                control={control}
                render={({ field }) => (
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={` rounded ${
                          field.value === level
                            ? "border-blue-700 bg-blue-700 text-white font-bold w-8"
                            : "bg-slate-300   border-slate-300 border-2 w-8"
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
                htmlFor="displayOrder"
              >
                Display Order
              </label>
              <input
                type="number"
                id="displayOrder"
                min="1"
                defaultValue={1}
                {...register("displayOrder", { valueAsNumber: true })}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {errors.displayOrder && (
                <span className="text-red-500 text-sm">
                  {errors.displayOrder.message}
                </span>
              )}
            </fieldset>

            <fieldset className="mb-[15px] flex items-center gap-5">
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <SwitchActive
                    active={field.value}
                    onChange={(value) => field.onChange(value)}
                  />
                )}
              />
              {errors.active && (
                <span className="text-red-500 text-sm">
                  {errors.active.message}
                </span>
              )}
            </fieldset>

            <div className="mt-[25px] flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                Submit
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

export default EditCategoryDialog;
