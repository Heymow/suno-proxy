import React, { createContext, useContext, useState } from "react";
import { ErrorProviderProps } from "@/types";

const ErrorContext = createContext<{ error: string | null; setError: (error: string | null) => void } | undefined>(
  undefined
);

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  return <ErrorContext.Provider value={{ error, setError }}>{children}</ErrorContext.Provider>;
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};