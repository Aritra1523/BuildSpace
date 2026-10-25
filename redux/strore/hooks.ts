import { useDispatch, useSelector, useStore } from "react-redux";
import { AppDispatch } from "./Store";
import { RootState } from "@reduxjs/toolkit/query";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore =
  useStore.withTypes<typeof import("@/redux/store/store").store>();
