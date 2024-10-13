// SuccessDialog.tsx
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  message: string;
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({
  open,
  onClose,
  message,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="success-dialog-title"
      aria-describedby="success-dialog-description"
    >
      <DialogTitle id="success-dialog-title">
        <Box display="flex" alignItems="center">
          <InfoOutlinedIcon sx={{ marginRight: 1 }} />
          Action Success
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="success-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            width: "200px",
            backgroundColor: "black",
            color: "white",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "black",
            },
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SuccessDialog;
