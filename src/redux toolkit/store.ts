import { configureStore } from '@reduxjs/toolkit';
import storesListReducer from './storesListSlice';

const store = configureStore({
  reducer: {
    storesList: storesListReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;