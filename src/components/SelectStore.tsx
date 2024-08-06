import { FormControl, Select, MenuItem as MuiMenuItem, SelectChangeEvent } from "@mui/material";

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
    <FormControl sx={{ minWidth: 150, fontWeight: "bold" }}>
      <Select
        sx={{
          border: "none",
          boxShadow: "none",
          "& .MuiOutlinedInput-notchedOutline": { border: 0 },
          "&:hover .MuiOutlinedInput-notchedOutline": { border: 0 },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: 0 },
          fontWeight: "bold",
        }}
        className="h-[38px]"
        labelId="store-select-label"
        value={selectedStore ?? ""}
        onChange={handleStoreChange}
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
