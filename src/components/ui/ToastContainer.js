"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * ToastContainer component for react-toastify
 * Replaces the custom Toaster component
 */
export default function CustomToastContainer() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      toastClassName="!rounded-md !shadow-lg !text-sm !py-2 !px-3 !min-h-0"
      bodyClassName="!text-sm !leading-snug !p-0 !m-0"
      progressClassName={"!bg-gradient-to-r !from-[#3EB87F] !to-[#2ea869]"}
      style={{
        "--toastify-color-success": "#3EB87F",
        "--toastify-color-error": "#ef4444",
        "--toastify-color-warning": "#f59e0b",
        "--toastify-color-info": "#3b82f6",
      }}
    />
  );
}
