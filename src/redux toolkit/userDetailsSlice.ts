
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserDetailsState {
  userDetails: UserDetails | null;
}

const initialState: UserDetailsState = {
  userDetails: null,
};

const userDetailsSlice = createSlice({
  name: 'userDetails',
  initialState,
  reducers: {
    setUserDetails(state, action: PayloadAction<UserDetails>) {
      state.userDetails = action.payload;
    },
    clearUserDetails(state) {
      state.userDetails = null;
    },
  },
});

export const { setUserDetails, clearUserDetails } = userDetailsSlice.actions;
export default userDetailsSlice.reducer;
export type { UserDetailsState };