import { notFound } from "next/navigation";

import { RespondentFlow } from "@/components/respondent/respondent-flow";
import { ApiError, getPublicForm } from "@/lib/api";

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = await params;

  try {
    const form = await getPublicForm(slug);
    return <RespondentFlow form={form} slug={slug} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
