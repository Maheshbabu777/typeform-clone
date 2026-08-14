import React, { useEffect, useState } from "react";
import { PublicForm, ResponseSummary } from "@/lib/types";

interface ResponsesTableProps {
  form: PublicForm;
  responses: ResponseSummary[];
}

export function ResponsesTable({ form, responses }: ResponsesTableProps) {
  // We need to fetch the full response details for each row since listFormResponses only returns summaries
  // For the sake of this phase, we'll implement a simple client-side fetch for the details
  const [detailedResponses, setDetailedResponses] = useState<Record<number, ResponseSummary>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDetails() {
      setIsLoading(true);
      try {
        const fetchPromises = responses.map(async (r) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/responses/${r.id}`);
          if (res.ok) {
            const data = await res.json();
            return { id: r.id, data };
          }
          return null;
        });
        
        const results = await Promise.all(fetchPromises);
        const dict: Record<number, ResponseSummary> = {};
        for (const res of results) {
          if (res) {
            dict[res.id] = res.data;
          }
        }
        setDetailedResponses(dict);
      } catch (err) {
        console.error("Failed to load response details", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (responses.length > 0) {
      loadDetails();
    } else {
      setIsLoading(false);
    }
  }, [responses]);

  if (responses.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-card-foreground shadow-sm">
        <h3 className="mb-2 text-lg font-medium text-card-foreground">No responses yet</h3>
        <p className="text-muted-foreground">When people submit your form, their answers will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-muted-foreground">
            <tr>
              <th className="whitespace-nowrap px-6 py-4 font-medium">#</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">Started At</th>
              <th className="whitespace-nowrap px-6 py-4 font-medium">Completed At</th>
              {form.questions.map((q, i) => (
                <th key={q.id} className="whitespace-nowrap px-6 py-4 font-medium max-w-[200px] truncate" title={q.title}>
                  {i + 1}. {q.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={form.questions.length + 3} className="px-6 py-8 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-muted-foreground" />
                    Loading response data...
                  </div>
                </td>
              </tr>
            ) : (
              responses.map((response, index) => {
                const details = detailedResponses[response.id];
                
                // Build a quick lookup for this response's answers by question ID
                const answersMap: Record<number, string> = {};
                if (details?.answers) {
                  details.answers.forEach(a => {
                    answersMap[a.question_id] = a.value;
                  });
                }

                return (
                  <tr key={response.id} className="transition-colors hover:bg-muted/50">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-card-foreground">
                      {responses.length - index}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {new Date(response.started_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {response.completed_at 
                        ? new Date(response.completed_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) 
                        : <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600 dark:bg-amber-950 dark:text-amber-300">Partial</span>}
                    </td>
                    
                    {form.questions.map(q => (
                      <td key={q.id} className="max-w-[250px] truncate px-6 py-4 text-card-foreground" title={answersMap[q.id] || ""}>
                        {answersMap[q.id] || <span className="text-muted-foreground">-</span>}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
