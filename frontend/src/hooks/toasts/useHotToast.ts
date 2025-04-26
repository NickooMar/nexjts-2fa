import toast, { ToastOptions } from "react-hot-toast";

const toastOptions: ToastOptions = {
  duration: 4000,
  position: "top-center",
  icon: "",
};

export const useNextToast = () => {
  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, { ...toastOptions, ...options });
  };

  return { error };
};
