import { notFound } from "next/navigation";

import { RespondentFlow } from "@/components/respondent/respondent-flow";
import { ApiError, getPublicForm } from "@/lib/api";

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { slug } = await params;
  let form;

  try {
    form = await getPublicForm(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return <RespondentFlow form={form} slug={slug} />;
}
