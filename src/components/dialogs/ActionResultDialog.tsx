// ActionResultDialog.tsx
import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Box,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { red } from "@mui/material/colors";

interface ActionResultDialogProps {
  open: boolean;
  onClose: () => void;
  message: string;
  type: "success" | "failure";
}

const ActionResultDialog: React.FC<ActionResultDialogProps> = ({
  open,
  onClose,
  message,
  type,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="action-result-dialog-title"
      aria-describedby="action-result-dialog-description"
    >
      <DialogTitle id="action-result-dialog-title">
        <Box display="flex" alignItems="center">
          {type === "success" ? (
            <>
              <InfoOutlinedIcon sx={{ marginRight: 1 }} />
              Action Success
            </>
          ) : (
            <>
              <ErrorOutlineIcon
                sx={{
                  marginRight: 1,
                  color: type === "failure" ? red[400] : "inherit",
                }}
              />
              <Box component="span" sx={{ color: "red" }}>
                Action Failure
              </Box>
            </>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="action-result-dialog-description"
          sx={{ color: type === "failure" ? red[400] : "inherit" }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            width: "200px",
            backgroundColor: type === "failure" ? red[400] : "black",
            color: "white",
            textTransform: "none",
            "&:hover": {
              backgroundColor: type === "failure" ? red[400] : "grey",
            },
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActionResultDialog;
