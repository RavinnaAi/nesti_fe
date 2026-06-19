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
      autoClose={4500}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable={false}
      pauseOnHover
      theme="light"
      limit={3}
      toastClassName="nesti-toast"
      bodyClassName="nesti-toast-body"
      progressClassName={"!bg-gradient-to-r !from-[#3EB87F] !to-[#2ea869]"}
      closeButton={false}
      style={{
        "--toastify-color-success": "#3EB87F",
        "--toastify-color-error": "#ef4444",
        "--toastify-color-warning": "#f59e0b",
        "--toastify-color-info": "#3b82f6",
      }}
    />
  );
}
