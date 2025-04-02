import { z } from "zod";
import { routing } from "./i18n/routing";
export { auth as middleware } from "@/auth";
import createMiddleware from "next-intl/middleware";

export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  [key: string]: string | Record<string, string> | undefined;
};

type ValidatedActionFunction<S extends z.ZodType, T> = (
  data: z.infer<S>
) => Promise<T>;

export function validatedAction<S extends z.ZodType, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<T> => {
    try {
      const rawData = Object.fromEntries(formData);
      const result = schema.safeParse(rawData);

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          fieldErrors[path] = issue.message;
        });

        return {
          fieldErrors,
        } as T;
      }

      return await action(result.data);
    } catch (error) {
      console.error("Action error:", error);
      return { 
        fieldErrors: {}
      } as T;
    }
  };
}

// Internationalized routing middleware
export default createMiddleware(routing);

// New route segment configuration
export const runtime = "experimental-edge";
export const matcher = ["/", "/(en|es)/:path*"];