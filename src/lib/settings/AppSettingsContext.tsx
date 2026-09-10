"use client";

import { createContext, useContext } from "react";
import { DEFAULT_APP_SETTINGS, type AppSettings } from "./types";

const AppSettingsContext = createContext<AppSettings>(DEFAULT_APP_SETTINGS);

export function AppSettingsProvider({
  settings,
  children
}: {
  settings: AppSettings;
  children: React.ReactNode;
}) {
  return <AppSettingsContext.Provider value={settings}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings(): AppSettings {
  return useContext(AppSettingsContext);
}
