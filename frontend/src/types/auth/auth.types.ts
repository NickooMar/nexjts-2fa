import { z } from "zod";
import { signInSchema, signUpSchema } from "@/schemas/auth.schema";

export type SignUpFormState = z.infer<typeof signUpSchema>;
export type SignInFormState = z.infer<typeof signInSchema>;

export enum AuthProviders {
  Google = "google",
}
