"use client";

import { loginUser } from "@/redux/slice/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/strore/hooks";

export function useLogin() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  return {
    login: (payload: { email: string; password: string }) =>
      dispatch(loginUser(payload)),
    ...auth,
  };
}
