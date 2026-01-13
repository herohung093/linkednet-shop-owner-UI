import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SelectedStoreState {
  storeUuid: number | string |null;
}

const initialState: SelectedStoreState = {
  storeUuid: localStorage.getItem("storeUuid"),
};

const selectedStoreSlice = createSlice({
  name: "selectedStore",
  initialState,
  reducers: {
    setSelectedStoreRedux(state, action: PayloadAction<number | string >) {
      state.storeUuid = action.payload;
    },
    clearSelectedStore(state) {
      state.storeUuid = null;
    },
  },
});

export const { setSelectedStoreRedux, clearSelectedStore } = selectedStoreSlice.actions;
export default selectedStoreSlice.reducer;
