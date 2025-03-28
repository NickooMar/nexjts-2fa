import { z } from "zod";
import { routing } from "./i18n/routing";
export { auth as middleware } from "@/auth";
import createMiddleware from "next-intl/middleware";

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    try {
      const result = schema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return { error: result.error.errors[0].message } as T;
      }

      return await action(result.data, formData);
    } catch (error) {
      console.error("Validation error:", error);
      return { error: "Validation failed" } as T;
    }
  };
}

// Internationalized routing middleware
export default createMiddleware(routing);

// New route segment configuration
export const runtime = "experimental-edge"; // Updated runtime
export const matcher = ["/", "/(en|es)/:path*"]; // Match only internationalized pathnames