"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { showToast } from "nextjs-toast-notify";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/react-query/types";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { propertySchema, PropertyFormState } from "@/schemas/property.schema";
import { toPropertyInput } from "@/components/Property/property-form.helpers";
import {
  WizardSubmission,
  WizardPhase,
  useCreatePropertyWizard,
} from "@/hooks/mutations/use-create-property-wizard";
import { PropertyLimitErrorDetails } from "@/types/property/property.types";
import { StepGeneralInfo } from "./StepGeneralInfo";
import { StepContracts } from "./StepContracts";
import { StepTenants } from "./StepTenants";
import { StepOwners } from "./StepOwners";
import { PropertyLimitUpgradeModal } from "./PropertyLimitUpgradeModal";
import {
  ImageDraft,
  ContractDraft,
  NewContactDraft,
  toImageDrafts,
  toContractInput,
  toContactInput,
  revokeImageDrafts,
} from "./wizard.helpers";

const STEP_IDS = ["general", "contracts", "tenants", "owners"] as const;

function isPropertyLimitErrorDetails(
  value: unknown
): value is PropertyLimitErrorDetails {
  if (!value || typeof value !== "object") return false;
  const details = value as Partial<PropertyLimitErrorDetails>;
  return (
    details.code === "PROPERTY_LIMIT_EXCEEDED" &&
    details.message === "plan_limit_reached"
  );
}

/**
 * Full-page, three-step property creation flow. All inputs (fields + files)
 * are collected locally; nothing touches the backend until the final submit,
 * which chains: create property → upload images → create contracts (+ files)
 * → create/attach tenants.
 */
interface PropertyCreateWizardProps {
  canManageBilling: boolean;
}

export function PropertyCreateWizard({
  canManageBilling,
}: PropertyCreateWizardProps) {
  const t = useTranslations("properties.new");
  const tp = useTranslations("properties");
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<WizardPhase | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [limitError, setLimitError] = useState<PropertyLimitErrorDetails | null>(
    null
  );
  const [pendingUpgradeSubmission, setPendingUpgradeSubmission] =
    useState<WizardSubmission | null>(null);

  // Step 1 — general info + gallery
  const form = useForm<PropertyFormState>({
    resolver: zodResolver(propertySchema(tp)),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      stateCode: "",
      country: "",
      postalCode: "",
      type: "apartment",
      units: 1,
    },
  });
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [coverId, setCoverId] = useState<string | null>(null);

  // Step 2 — contracts
  const [contracts, setContracts] = useState<ContractDraft[]>([]);

  // Step 3 — tenants
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [newTenants, setNewTenants] = useState<NewContactDraft[]>([]);

  // Step 4 — owners
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [newOwners, setNewOwners] = useState<NewContactDraft[]>([]);

  // Revoke preview object URLs when the wizard unmounts.
  const imagesRef = useRef<{ gallery: ImageDraft[]; contracts: ContractDraft[] }>(
    { gallery: [], contracts: [] }
  );
  imagesRef.current = { gallery: images, contracts };
  useEffect(
    () => () => {
      revokeImageDrafts(imagesRef.current.gallery);
      for (const draft of imagesRef.current.contracts) {
        revokeImageDrafts(draft.images);
      }
    },
    []
  );

  const createWizard = useCreatePropertyWizard({
    successMessage: t("messages.created"),
    errorMessage: tp("messages.errors.create_failed"),
    errorMessages: {
      insufficient_permissions: tp("messages.errors.insufficient_permissions"),
    },
    suppressErrorCodes: ["PROPERTY_LIMIT_EXCEEDED"],
    onPhase: setPhase,
    onSuccess: ({ property, warnings }) => {
      for (const warning of warnings) {
        showToast.warning(t(`messages.warnings.${warning}`), {
          duration: 6000,
          position: "top-right",
        });
      }
      router.push(`/properties/${property.slug ?? property._id}`);
    },
  });

  const closeUpgradeModal = () => {
    setUpgradeModalOpen(false);
    setLimitError(null);
    setPendingUpgradeSubmission(null);
  };

  const retryPendingSubmission = () => {
    const submission = pendingUpgradeSubmission;
    if (!submission) return;
    setUpgradeModalOpen(false);
    setLimitError(null);
    setPendingUpgradeSubmission(null);
    void createWizard.mutateAsync(submission).catch(() => {
      setPhase(null);
    });
  };

  const steps = STEP_IDS.map((id) => ({
    id,
    title: t(`steps.${id}.label`),
    description: t(`steps.${id}.hint`),
  }));

  const goNext = async () => {
    // Step 1 gates navigation on a valid property form; the rest are optional.
    if (step === 0 && !(await form.trigger())) return;
    setStep((current) => Math.min(current + 1, STEP_IDS.length - 1));
  };

  const handleSubmit = async () => {
    if (!(await form.trigger())) {
      setStep(0);
      return;
    }

    // Cover first: the backend promotes the first uploaded image to cover.
    const orderedImages = [...images].sort((a, b) => {
      const cover = coverId ?? images[0]?.id;
      return (a.id === cover ? -1 : 0) - (b.id === cover ? -1 : 0);
    });

    const submission: WizardSubmission = {
      property: toPropertyInput(form.getValues(), { includeUnits: false }),
      images: orderedImages.map((draft) => draft.file),
      contracts: contracts.map((draft) => ({
        input: toContractInput(draft.values),
        images: draft.images.map((image) => image.file),
        documents: draft.documents.map((document) => document.file),
      })),
      existingTenantIds: selectedTenantIds,
      newTenants: newTenants.map((draft) => toContactInput(draft.values)),
      existingOwnerIds: selectedOwnerIds,
      newOwners: newOwners.map((draft) => toContactInput(draft.values)),
    };

    await createWizard.mutateAsync(submission).catch((error) => {
      if (
        error instanceof ApiError &&
        isPropertyLimitErrorDetails(error.details)
      ) {
        setPhase(null);
        setLimitError(error.details);
        setPendingUpgradeSubmission(submission);
        setUpgradeModalOpen(true);
        return;
      }

      // Error toast already shown by the global mutation cache; staying on
      // the page keeps every draft intact for another attempt.
      setPhase(null);
    });
  };

  const isSubmitting = createWizard.isPending;
  const isLastStep = step === STEP_IDS.length - 1;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <header className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-2 text-muted-foreground"
          disabled={isSubmitting}
          onClick={() => router.push("/properties")}
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t("description")}
          </p>
        </div>
        <Stepper
          steps={steps}
          current={step}
          onStepClick={(index) => !isSubmitting && setStep(index)}
        />
      </header>

      {/* Steps stay mounted so field/file state survives navigation. */}
      <main>
        <div className={cn(step !== 0 && "hidden")}>
          <StepGeneralInfo
            form={form}
            images={images}
            coverId={coverId}
            disabled={isSubmitting}
            onAddImages={(files) =>
              setImages((current) => [...current, ...toImageDrafts(files)])
            }
            onRemoveImage={(id) => {
              const removed = images.find((draft) => draft.id === id);
              if (removed) revokeImageDrafts([removed]);
              if (coverId === id) setCoverId(null);
              setImages((current) =>
                current.filter((draft) => draft.id !== id)
              );
            }}
            onSetCover={setCoverId}
          />
        </div>
        <div className={cn(step !== 1 && "hidden")}>
          <StepContracts
            contracts={contracts}
            disabled={isSubmitting}
            onChange={setContracts}
          />
        </div>
        <div className={cn(step !== 2 && "hidden")}>
          <StepTenants
            selectedTenantIds={selectedTenantIds}
            newTenants={newTenants}
            disabled={isSubmitting}
            onToggleExisting={(tenantId) =>
              setSelectedTenantIds((current) =>
                current.includes(tenantId)
                  ? current.filter((id) => id !== tenantId)
                  : [...current, tenantId]
              )
            }
            onChangeNewTenants={setNewTenants}
          />
        </div>
        <div className={cn(step !== 3 && "hidden")}>
          <StepOwners
            selectedOwnerIds={selectedOwnerIds}
            newOwners={newOwners}
            disabled={isSubmitting}
            onToggleExisting={(ownerId) =>
              setSelectedOwnerIds((current) =>
                current.includes(ownerId)
                  ? current.filter((id) => id !== ownerId)
                  : [...current, ownerId]
              )
            }
            onChangeNewOwners={setNewOwners}
          />
        </div>
      </main>

      <footer className="flex items-center justify-between gap-3 border-t pt-6">
        <Button
          variant="outline"
          disabled={step === 0 || isSubmitting}
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          {t("previous")}
        </Button>

        {isSubmitting && phase && (
          <p
            aria-live="polite"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader className="size-4 animate-spin" />
            {t(`progress.${phase}`)}
          </p>
        )}

        {isLastStep ? (
          <Button
            size="lg"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {t("submit")}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={isSubmitting} className="gap-2">
            {t("next")}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </footer>

      <PropertyLimitUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={(open) => {
          if (!open) closeUpgradeModal();
        }}
        canManageBilling={canManageBilling}
        limitError={limitError}
        onUpgradeSuccess={retryPendingSubmission}
      />
    </div>
  );
}
