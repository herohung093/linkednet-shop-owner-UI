import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SelectedStoreState {
  storeId: number | string | null;
}

const initialState: SelectedStoreState = {
  storeId: localStorage.getItem("storeUuid"),
};

const selectedStoreSlice = createSlice({
  name: "selectedStore",
  initialState,
  reducers: {
    setSelectedStoreRedux(state, action: PayloadAction<number | string>) {
      state.storeId = action.payload;
    },
  },
});

export const { setSelectedStoreRedux } = selectedStoreSlice.actions;
export default selectedStoreSlice.reducer;
