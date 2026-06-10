"use client";

import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/lib/react-query/types";
import { useNextToast } from "@/hooks/toasts/useNextToast";
import { useJoinOrganization } from "@/hooks/mutations/use-organization-mutations";
import {
  joinOrganizationSchema,
  JoinOrganizationFormState,
} from "@/schemas/organization.schema";

const JOIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_invitation: "This invitation code is not valid",
  invitation_expired: "This invitation has expired",
  invitation_already_used: "This invitation was already used",
  already_a_member: "You already belong to this organization",
};

interface JoinOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinOrganizationDialog({
  open,
  onOpenChange,
}: JoinOrganizationDialogProps) {
  const toast = useNextToast();

  const form = useForm<JoinOrganizationFormState>({
    resolver: zodResolver(joinOrganizationSchema),
    defaultValues: { code: "" },
  });

  // On success the hook refreshes the NextAuth session, clears the (now
  // wrong-tenant) query cache, and refreshes server components. The success
  // toast is dynamic (includes the org name), so it lives here instead of the
  // hook's static `successMessage`.
  const joinOrganization = useJoinOrganization({
    errorMessage: "Could not join the organization",
    errorMessages: JOIN_ERROR_MESSAGES,
    onSuccess: ({ tenantName }) => {
      toast.success(
        tenantName ? `Joined ${tenantName}` : "Joined organization"
      );
      form.reset();
      onOpenChange(false);
    },
  });

  const onSubmit = async (values: JoinOrganizationFormState) => {
    await joinOrganization.mutateAsync(values.code).catch((error) => {
      // Toast already shown by the global mutation cache; mirror the message
      // on the field so the form highlights what to fix.
      const known =
        error instanceof ApiError
          ? Object.keys(JOIN_ERROR_MESSAGES).find((key) =>
              error.code.includes(key)
            )
          : undefined;
      form.setError("code", {
        message: known
          ? JOIN_ERROR_MESSAGES[known]
          : "Could not join the organization",
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join organization</DialogTitle>
          <DialogDescription>
            Enter the invitation code you received from an organization owner
            or admin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invitation code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      autoFocus
                      placeholder="e.g. 4F2A9C1B"
                      className="font-mono uppercase"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  "Join organization"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
