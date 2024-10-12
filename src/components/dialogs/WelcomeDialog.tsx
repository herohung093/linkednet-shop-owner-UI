import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleCreateStore = () => {
    onClose();
    navigate("/create-store");
  };
  
//@ts-ignore
  const handleClose = (event: object, reason: string) => {
    if (reason !== "backdropClick") {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="welcome-dialog-title"
      aria-describedby="welcome-dialog-description"
      disableEscapeKeyDown
    >
      <DialogTitle id="welcome-dialog-title">Welcome!</DialogTitle>
      <DialogContent>
        <DialogContentText id="welcome-dialog-description">
          You have just created an account. There is no store associated with
          this account yet. Please create a store to get started.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreateStore} color="primary" variant="contained">
          Create Store
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WelcomeDialog;
