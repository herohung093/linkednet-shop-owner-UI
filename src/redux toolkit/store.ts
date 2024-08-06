import { configureStore } from '@reduxjs/toolkit';
import storesListReducer from './storesListSlice';
import selectedStoreReducer from './selectedStoreSlice';

const store = configureStore({
  reducer: {
    storesList: storesListReducer,
    selectedStore: selectedStoreReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;