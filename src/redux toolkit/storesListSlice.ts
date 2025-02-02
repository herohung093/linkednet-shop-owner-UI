import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Store {
  zoneId: string;
  id: number;
  storeUuid: string;
  storeName: string;
  shortStoreName: string;
  storeAddress: string;
  storePhoneNumber: string;
  storeEmail: string;
  frontEndUrl: string;
  enableReservationConfirmation: boolean;
  automaticApproved: boolean;
  maxGuestsForGroupBooking: number;
}
interface StoresState {
  storesList: Store[];
}

const initialState: StoresState = {
  storesList: []
};
const storesListSlice = createSlice({
  name: 'storesList',
  initialState,
  reducers: {
    setStoresList(state, action: PayloadAction<Store[]>) {
      state.storesList = action.payload;
    },
    addStoreList(state, action: PayloadAction<Store>) {
      state.storesList.push(action.payload);
    },
    updateStoreList(state, action: PayloadAction<Store>) {
      const index = state.storesList.findIndex(store => store.id === action.payload.id);
      if (index !== -1) {
        state.storesList[index] = action.payload;
      }
    },
    deleteStoreList(state, action: PayloadAction<number>) {
      state.storesList = state.storesList.filter(store => store.id !== action.payload);
    },
  },
});

export const { setStoresList, addStoreList, updateStoreList, deleteStoreList } = storesListSlice.actions;
export default storesListSlice.reducer;
export type { StoresState };