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
      <div className="rounded-lg border border-[#dedcde] bg-white p-12 text-center shadow-sm">
        <h3 className="text-lg font-medium text-[#3c323e] mb-2">No responses yet</h3>
        <p className="text-gray-500">When people submit your form, their answers will appear here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#dedcde] bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b border-[#dedcde]">
            <tr>
              <th className="whitespace-nowrap px-6 py-4 font-semibold">#</th>
              <th className="whitespace-nowrap px-6 py-4 font-semibold">Submitted At</th>
              {form.questions.map((q, i) => (
                <th key={q.id} className="whitespace-nowrap px-6 py-4 font-semibold max-w-[200px] truncate" title={q.title}>
                  {i + 1}. {q.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={form.questions.length + 2} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
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
                  <tr key={response.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                      {responses.length - index}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {response.completed_at 
                        ? new Date(response.completed_at).toLocaleString() 
                        : <span className="text-amber-600 text-xs font-medium px-2 py-1 bg-amber-50 rounded-full">Partial</span>}
                    </td>
                    
                    {form.questions.map(q => (
                      <td key={q.id} className="px-6 py-4 text-gray-700 truncate max-w-[250px]" title={answersMap[q.id] || ""}>
                        {answersMap[q.id] || <span className="text-gray-300">-</span>}
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
