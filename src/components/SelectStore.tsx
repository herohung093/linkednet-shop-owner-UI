import { FormControl, Select, MenuItem as MuiMenuItem, SelectChangeEvent } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface SelectStoreProps {
  selectedStore: string | undefined;
  handleStoreChange: (event: SelectChangeEvent<string | undefined>) => void;
  storeConfigs: Array<{ storeUuid: string; storeName: string }>;
}

const SelectStore: React.FC<SelectStoreProps> = ({
  selectedStore,
  handleStoreChange,
  storeConfigs,
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
        className="h-[38px]"
        labelId="store-select-label"
        value={selectedStore ?? ""}
        onChange={handleStoreChange}
        IconComponent={ExpandMoreIcon}
      >
        {storeConfigs.map((store) => (
          <MuiMenuItem key={store.storeUuid} value={store.storeUuid}>
            {store.storeName}
          </MuiMenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectStore;
