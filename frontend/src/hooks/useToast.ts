import { showToast as toast} from "nextjs-toast-notify";

interface ToastOptions {
  duration?: number;
  progress?: boolean;
  position?:
    | "top-center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  transition?:
    | "fadeIn"
    | "swingInverted"
    | "bounceIn"
    | "popUp"
    | "bottomToTopBounce"
    | "bounceInDown";
  icon?: string;
  sound?: boolean;
}

const toastOptions: ToastOptions = {
  duration: 4000,
  progress: true,
  position: "top-center",
  transition: "fadeIn",
  icon: "",
  sound: false,
};

export const useToast = () => {
  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, { ...toastOptions, ...options });
  };

  return { error };
};
