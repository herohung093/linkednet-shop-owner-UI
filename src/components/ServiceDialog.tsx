import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import SwitchActive from "./SwitchActive";
import { axiosWithToken } from "../utils/axios";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import CustomLoading from "./Loading";
import { useNavigate } from "react-router";
import isTokenExpired from "../helper/CheckTokenExpired";
import { refreshToken } from "../helper/RefreshToken";
import { getToken } from "../helper/getToken";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';


interface ServiceItem {
  id: number;
  serviceName: string;
  serviceDescription: string;
  servicePrice: number;
  estimatedTime: number;
  active: boolean;
}

interface ServiceDialogProps {
  serviceItem?: ServiceItem;
  typeId: number;
  onUpdate: () => void;
  mode: "add" | "edit";
}

type ServiceItemFormData = Omit<ServiceItem, "id">;

const schemaValidation = yup
  .object({
    serviceName: yup.string().required("Please enter service name"),
    serviceDescription: yup
      .string()
      .required("Please enter service description"),
    servicePrice: yup
      .number()
      .required("Please enter service price")
      .typeError("Service price must be a number"),
    estimatedTime: yup
      .number()
      .required("Please enter estimated time")
      .typeError("Estimated time must be a number"),
    active: yup.boolean().required(),
  })
  .required();

const ServiceDialog: React.FC<ServiceDialogProps> = ({
  serviceItem,
  onUpdate,
  typeId,
  mode,
}) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ServiceItemFormData>({
    resolver: yupResolver(schemaValidation),
    mode: "onChange",
    defaultValues: {
      serviceName: serviceItem?.serviceName || "",
      serviceDescription: serviceItem?.serviceDescription || "",
      servicePrice: serviceItem?.servicePrice || 0,
      estimatedTime: serviceItem?.estimatedTime || 0,
      active: serviceItem?.active || true,
    },
  });

  const [open, setOpen] = useState(false);

  const onSubmitHandler = async (values: ServiceItemFormData) => {
    const payload = {
      ...values,
      serviceType: {
        id: typeId,
      },
    };
    console.log(payload);

    if (sessionStorage.getItem("authToken")) {
      const token = getToken();

      if (isTokenExpired(token)) {
        await refreshToken();
      }
    } else {
      navigate("/session-expired");
    }

    try {
      let response;
      if (mode === "edit") {
        response = await axiosWithToken.put(`/service/${serviceItem?.id}`, payload);
      } else {
        response = await axiosWithToken.post("/service/", payload);
      }
      console.log(response.data);
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
      <Dialog.Trigger asChild>
        <button className="">{mode === "edit" ? <MoreVertIcon className="cursor-pointer"/> : <AddIcon/>} </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-dialog data-[state=open]:animate-overlayShow " />
        <Dialog.Content className="data-[state=open]:animate-contentShow content-dialog">
          <Dialog.Title className="text-slate-700 m-0 text-[17px] font-medium mb-5">
            {mode === "edit" ? "Edit Service" : "Add Service"}
          </Dialog.Title>
          <Dialog.Description className="text-mauve11 mt-[10px] mb-5 text-[15px] leading-normal">
            {mode === "edit" ? "Edit your service. Click save when you're done." : "Add a new service. Click save when you're done."}
          </Dialog.Description>
          <form onSubmit={handleSubmit(onSubmitHandler)}>
            <div className="input-box">
              <label className="label">Service Name</label>
              <input {...register("serviceName")} className="input" />
              {errors.serviceName && (
                <div className="text-red-500 text-sm">
                  {errors.serviceName.message}
                </div>
              )}
            </div>
            <div className="input-box">
              <label className="label">Service Description</label>
              <input {...register("serviceDescription")} className="input" />
              {errors.serviceDescription && (
                <div className="text-red-500 text-sm">
                  {errors.serviceDescription.message}
                </div>
              )}
            </div>
            <div className="input-box">
              <label className="label">Service Price</label>
              <input
                type="number"
                {...register("servicePrice")}
                className="input "
              />
              {errors.servicePrice && (
                <div className="text-red-500 text-sm">
                  {errors.servicePrice.message}
                </div>
              )}
            </div>
            <div className="input-box">
              <label className="label">Estimated Time</label>
              <input
                type="number"
                {...register("estimatedTime")}
                className="input"
              />
              {errors.estimatedTime && (
                <div className="text-red-500 text-sm">
                  {errors.estimatedTime.message}
                </div>
              )}
            </div>
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
            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                className={`hover:bg-blue-500 focus:shadow-blue-700 inline-flex h-[35px] w-[135px] items-center justify-center rounded-md px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none ${
                  !isValid
                    ? "bg-slate-500 text-white"
                    : "bg-blue-700 text-white"
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

export default ServiceDialog;
