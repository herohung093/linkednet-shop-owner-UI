import { configureStore } from '@reduxjs/toolkit';
import storesListReducer from './storesListSlice';
import selectedStoreReducer from './selectedStoreSlice';
import userDetailsReducer from './userDetailsSlice';

const store = configureStore({
  reducer: {
    storesList: storesListReducer,
    selectedStore: selectedStoreReducer,
    userDetails: userDetailsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;