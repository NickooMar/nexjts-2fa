"use client";

import { useState } from "react";
import { Building2, Plus, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DotBackground } from "@/components/Aceternity/DotBackground";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";
import { JoinOrganizationDialog } from "./JoinOrganizationDialog";

/**
 * Shown on the dashboard when the authenticated user has no organization yet:
 * they either create one (becoming its owner) or join an existing one with an
 * invitation code.
 */
export function NoOrganizationState() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const t = useTranslations("auth.no_organization_state");

  return (
    <DotBackground>
      <Card className="relative z-10 w-full max-w-lg text-center">
        <CardHeader className="items-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("create_action")}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setJoinOpen(true)}
          >
            <UserPlus className="size-4" />
            {t("join_action")}
          </Button>
        </CardContent>
      </Card>

      <CreateOrganizationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <JoinOrganizationDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </DotBackground>
  );
}
