import { FormControl, Select, MenuItem as MuiMenuItem, SelectChangeEvent } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface SelectStoreProps {
  selectedStore: string | undefined;
  handleStoreChange: (event: SelectChangeEvent<string | undefined>) => void;
  storeConfig: Array<{ storeUuid: string; storeName: string }>;
}

const SelectStore: React.FC<SelectStoreProps> = ({
  selectedStore,
  handleStoreChange,
  storeConfig,
}) => {
  return (
    <FormControl
      sx={{
        minWidth: 150,
        fontWeight: "bold",       
        color: "white",
        borderRadius: "5px", 
      }}
    >
      <Select
        sx={{
          border: "none",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": { border: 0 },
          "&:hover .MuiOutlinedInput-notchedOutline": { border: 0 },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: 0 },
          fontWeight: "bold",
          backgroundColor: "#1E293B", 
          color: "white",
          borderRadius: "5px", 
          "& .MuiSvgIcon-root": {
            color: "white", 
          },
        }}
        className="h-[38px]"
        labelId="store-select-label"
        value={selectedStore ?? ""}
        onChange={handleStoreChange}
        IconComponent={ExpandMoreIcon}
      >
        <MuiMenuItem value={undefined} disabled>
          Select store
        </MuiMenuItem>
        {storeConfig.map((store) => (
          <MuiMenuItem key={store.storeUuid} value={store.storeUuid}>
            {store.storeName}
          </MuiMenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectStore;
