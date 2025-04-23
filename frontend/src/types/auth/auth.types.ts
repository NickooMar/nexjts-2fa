import { z } from "zod";
import {
  createSignInSchema,
  createSignUpSchema,
} from "@/schemas/auth.schema";

export type SignUpFormState = z.infer<ReturnType<typeof createSignUpSchema>>;
export type SignInFormState = z.infer<ReturnType<typeof createSignInSchema>>;

export enum AuthProviders {
  Google = "google",
}
