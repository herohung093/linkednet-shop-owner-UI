import { useEffect, useState } from "react";
import { axiosWithToken } from "../utils/axios";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import CloseIcon from "@mui/icons-material/Close";

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
  typeName?: string;
  typeId: number;
  onUpdate: () => void;
  mode: "add" | "edit";
}

type ServiceItemFormData = Omit<ServiceItem, "id">;

const schemaValidation = yup
  .object({
    serviceName: yup
      .string()
      .required("Please enter service name")
      .max(100, "Must be less than 100 characters"),
    serviceDescription: yup
      .string()
      .required("Please enter service description")
      .max(255, "Must be less than 255 characters"),
    servicePrice: yup
      .number()
      .required("Please enter service price")
      .positive("Service price must be a positive number")
      .typeError("Service price must be a number"),
    estimatedTime: yup
      .number()
      .required("Please enter estimated time")
      .positive("Estimated time must be a positive number")
      .typeError("Estimated time must be a number"),
    active: yup.boolean().required(),
  })
  .required();

const ServiceDialog: React.FC<ServiceDialogProps> = ({
  serviceItem,
  onUpdate,
  typeId,
  mode,
  typeName,
}) => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitting, isDirty },
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

    try {
      let response;
      if (mode === "edit") {
        response = await axiosWithToken.put(
          `/service/${serviceItem?.id}`,
          payload
        );
      } else {
        response = await axiosWithToken.post("/service/", payload);
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
    <>
      <IconButton onClick={() => setOpen(true)} className="sm:hidden">
        {mode === "edit" ? (
          <EditIcon className="cursor-pointer text-blue-500" />
        ) : (
          <AddIcon />
        )}
      </IconButton>

      {/* <Button onClick={() => setOpen(true)} className="hidden sm:block">
        {mode === "edit" ? "Edit Service" : "Add Service"}
      </Button> */}

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {mode === "edit"
            ? `Edit Service for ${typeName}`
            : `Add Service to ${typeName}`}
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            style={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmitHandler)}>
          <DialogContent dividers>
            <FormControl
              className="!mb-4"
              fullWidth
              variant="outlined"
              error={!!errors.serviceName}
            >
              <InputLabel htmlFor="serviceName" required>
                Service Name
              </InputLabel>
              <Controller
                name="serviceName"
                control={control}
                render={({ field }) => (
                  <OutlinedInput
                    id="serviceName"
                    label="Service Name"
                    {...field}
                  />
                )}
              />
              {errors.serviceName && (
                <FormHelperText>{errors.serviceName.message}</FormHelperText>
              )}
            </FormControl>

            <FormControl
              className="!mb-4"
              fullWidth
              variant="outlined"
              error={!!errors.serviceDescription}
            >
              <InputLabel htmlFor="serviceDescription">
                Service Description
              </InputLabel>
              <Controller
                name="serviceDescription"
                control={control}
                render={({ field }) => (
                  <OutlinedInput
                    id="serviceDescription"
                    label="Service Description"
                    {...field}
                  />
                )}
              />
              {errors.serviceDescription && (
                <FormHelperText>
                  {errors.serviceDescription.message}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl
              className="!mb-4"
              fullWidth
              variant="outlined"
              error={!!errors.servicePrice}
            >
              <InputLabel htmlFor="servicePrice" required>
                Service Price
              </InputLabel>
              <Controller
                name="servicePrice"
                control={control}
                render={({ field }) => (
                  <OutlinedInput
                    id="servicePrice"
                    label="Service Price"
                    type="number"
                    inputMode="numeric"
                    {...field}
                  />
                )}
              />
              {errors.servicePrice && (
                <FormHelperText>{errors.servicePrice.message}</FormHelperText>
              )}
            </FormControl>

            <FormControl
              className="!mb-4"
              fullWidth
              variant="outlined"
              error={!!errors.estimatedTime}
            >
              <InputLabel htmlFor="estimatedTime" required>
                Estimated Time in Minutes
              </InputLabel>
              <Controller
                name="estimatedTime"
                control={control}
                render={({ field }) => (
                  <OutlinedInput
                    id="estimatedTime"
                    label="Estimated Time in Minutes"
                    type="number"
                    inputMode="numeric"
                    {...field}
                  />
                )}
              />
              {errors.estimatedTime && (
                <FormHelperText>{errors.estimatedTime.message}</FormHelperText>
              )}
            </FormControl>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
            }}
          >
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              disabled={!isValid || isSubmitting || !isDirty}
              loadingIndicator={
                <CircularProgress style={{ color: "white" }} size={24} />
              }
              sx={{
                backgroundColor: "black",
                color: "white",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "black",
                },
                width: "200px",
              }}
            >
              {mode === "add" ? "Create Service" : "Submit"}
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ServiceDialog;
