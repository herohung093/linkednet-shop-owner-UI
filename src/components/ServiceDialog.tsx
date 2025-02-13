import React, { useState } from "react";
import { axiosWithToken } from "../utils/axios";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Sort as SortIcon,
} from "@mui/icons-material";

interface ServiceItem {
  id: number;
  serviceName: string;
  serviceDescription: string;
  servicePrice: number;
  estimatedTime: number;
  displayOrder: number;
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
      .required("Service name is required")
      .max(100, "Must be less than 100 characters"),
    serviceDescription: yup
      .string()
      .required("Service description is required")
      .max(255, "Must be less than 255 characters"),
    servicePrice: yup
      .number()
      .required("Service price is required")
      .positive("Service price must be a positive number")
      .typeError("Service price must be a number"),
    estimatedTime: yup
      .number()
      .required("Estimated time is required")
      .positive("Estimated time must be a positive number")
      .typeError("Estimated time must be a number"),
    displayOrder: yup
      .number()
      .typeError("Display Order must be a number")
      .required("Display order is required")
      .min(1, "Minimum display order is 1"),
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
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<ServiceItemFormData>({
    resolver: yupResolver(schemaValidation),
    mode: "onChange",
    defaultValues: {
      serviceName: serviceItem?.serviceName || "",
      serviceDescription: serviceItem?.serviceDescription || "",
      servicePrice: serviceItem?.servicePrice || 0,
      estimatedTime: serviceItem?.estimatedTime || 0,
      displayOrder: serviceItem?.displayOrder || 1,
      active: serviceItem?.active ?? true,
    },
  });

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = async (values: ServiceItemFormData) => {
    setSubmitting(true);
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
      handleClose();

      if (response.status !== 200 && response.status !== 201) {
        throw new Error("Failed to submit.");
      }
    } catch (error) {
      console.error("Error submitting", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {mode === "add" ? (
        <Tooltip title="Add Service">
          <IconButton
            onClick={() => setOpen(true)}
            size="small"
            sx={{
              backgroundColor: "primary.main",
              color: "white",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Edit Service">
          <IconButton
            onClick={() => setOpen(true)}
            size="small"
            sx={{
              color: "action.active",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
            {mode === "add" ? "Add New Service" : "Edit Service"}
            {typeName && (
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Category: {typeName}
              </Typography>
            )}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Controller
                name="serviceName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Service Name"
                    fullWidth
                    error={!!errors.serviceName}
                    helperText={errors.serviceName?.message}
                    required
                  />
                )}
              />

              <Controller
                name="serviceDescription"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.serviceDescription}
                    helperText={errors.serviceDescription?.message}
                    required
                  />
                )}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Controller
                  name="servicePrice"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Price"
                      type="number"
                      error={!!errors.servicePrice}
                      helperText={errors.servicePrice?.message}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                <Controller
                  name="estimatedTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Estimated Time (minutes)"
                      type="number"
                      error={!!errors.estimatedTime}
                      helperText={errors.estimatedTime?.message}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TimeIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <Controller
                name="displayOrder"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Display Order"
                    type="number"
                    error={!!errors.displayOrder}
                    helperText={errors.displayOrder?.message}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SortIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: { xs: "100%", sm: "50%" } }}
                  />
                )}
              />

              <Controller
                name="active"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography color={value ? "primary" : "text.secondary"}>
                        {value ? "Active" : "Inactive"}
                      </Typography>
                    }
                  />
                )}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!isValid || !isDirty || submitting}
              startIcon={
                submitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : mode === "add" ? (
                  <AddIcon />
                ) : (
                  <EditIcon />
                )
              }
            >
              {submitting
                ? "Saving..."
                : mode === "add"
                ? "Add Service"
                : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ServiceDialog;