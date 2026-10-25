"use client";

import { registerUser } from "@/redux/slice/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/strore/hooks";

export function useRegister() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  return {
    register: (payload: {
      name: string;
      email: string;
      password: string;
      role: "creator" | "recruiter";
    }) => dispatch(registerUser(payload)),
    ...auth,
  };
}
