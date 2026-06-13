"use client";

import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PropertyFormState } from "@/schemas/property.schema";
import { PropertyFormFields } from "@/components/Property/PropertyFormFields";
import { IMAGE_MAX_PER_PROPERTY } from "@/components/Property/media/media.helpers";
import { WizardImagePicker } from "./WizardImagePicker";
import { ImageDraft } from "./wizard.helpers";

interface StepGeneralInfoProps {
  form: UseFormReturn<PropertyFormState>;
  images: ImageDraft[];
  coverId: string | null;
  disabled?: boolean;
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onSetCover: (id: string) => void;
}

/**
 * Step 1: the property's general information plus its image gallery
 * (landscape/cover + any related photos). Nothing is uploaded yet — files
 * are held locally and submitted at the end of the wizard.
 */
export function StepGeneralInfo({
  form,
  images,
  coverId,
  disabled,
  onAddImages,
  onRemoveImage,
  onSetCover,
}: StepGeneralInfoProps) {
  const t = useTranslations("properties.new");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("steps.general.title")}</CardTitle>
          <CardDescription>{t("steps.general.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            {/* Submission is owned by the wizard footer; no <form> here so a
                stray Enter press can't trigger a premature submit. */}
            <PropertyFormFields form={form} showUnits={false} />
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("images.title")}</CardTitle>
          <CardDescription>{t("images.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <WizardImagePicker
            images={images}
            coverId={coverId}
            maxImages={IMAGE_MAX_PER_PROPERTY}
            disabled={disabled}
            onAdd={onAddImages}
            onRemove={onRemoveImage}
            onSetCover={onSetCover}
          />
        </CardContent>
      </Card>
    </div>
  );
}
