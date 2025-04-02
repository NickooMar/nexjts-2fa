import { z } from "zod";
import { signUpSchema } from "./auth.schemas";

export type SignUpFormState = {
  error?: string;
  fieldErrors?: {
    [K in keyof z.infer<typeof signUpSchema>]?: string;
  };
};

export enum AuthProviders {
  Google = "google",
}
