import React from "react";
// Direct imports for better tree-shaking
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

interface EventTimeButtonProps {
  staffs: number[];
  hour: string;
  selected: boolean | undefined;
  onSelect: () => void;
}

const EventTimeButton: React.FC<EventTimeButtonProps> = ({
  staffs,
  hour,
  selected,
  onSelect,
}) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={1}>
      <Box display="flex" flexWrap="wrap" justifyContent="center">
        <Button
          disabled={staffs.length == 0}
          size="medium"
          variant={selected ? "contained" : "outlined"}
          color="error"
          onClick={() => onSelect()}
          sx={{
            borderRadius: "20px",
            backgroundColor: selected ? "black" : "transparent",
            color: selected ? "#fff" : "inherit",
            borderColor: selected ? "black" : "rgba(0, 0, 0, 0.12)",
            boxShadow: selected
              ? "0px 0px 15px rgba(0, 0, 0, 0.15)"
              : "0px 0px 5px rgba(0, 0, 0, 0.1)",
            "&:hover": {
              backgroundColor: selected ? "black" : "rgba(211, 47, 47, 0.04)",
              color: selected ? "#fff" : "inherit",
              borderColor: "black",
            },
          }}
        >
          {hour}
        </Button>
      </Box>
    </Box>
  );
};

export default EventTimeButton;
