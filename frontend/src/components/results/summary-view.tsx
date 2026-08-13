import React from "react";
import { PublicForm, ResponseSummary, QuestionStats } from "@/lib/types";
import { Users, CheckCircle } from "lucide-react";

interface SummaryViewProps {
  form: PublicForm;
  responses: ResponseSummary[];
  stats: QuestionStats[];
}

export function SummaryView({ form, responses, stats }: SummaryViewProps) {
  const totalViews = responses.length; // Simplified: in a real app we'd track actual views
  const completedResponses = responses.filter(r => r.completed_at).length;
  const completionRate = totalViews > 0 
    ? Math.round((completedResponses / totalViews) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* High-level metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#dedcde] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Users className="h-5 w-5" />
            <h3 className="text-sm font-medium">Total Responses</h3>
          </div>
          <p className="text-3xl font-bold text-[#3c323e]">{totalViews}</p>
        </div>

        <div className="rounded-lg border border-[#dedcde] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <CheckCircle className="h-5 w-5" />
            <h3 className="text-sm font-medium">Completion Rate</h3>
          </div>
          <p className="text-3xl font-bold text-[#3c323e]">{completionRate}%</p>
        </div>
      </div>

      {/* Question breakdown */}
      <div className="rounded-lg border border-[#dedcde] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#dedcde] bg-gray-50 px-6 py-4">
          <h3 className="text-sm font-semibold text-[#3c323e]">Question Analysis</h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {stats.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No data available to analyze yet.
            </div>
          ) : (
            stats.map((stat, idx) => (
              <div key={stat.question_id} className="p-6">
                <h4 className="mb-4 text-sm font-medium text-gray-900">
                  {idx + 1}. {stat.title}
                </h4>
                
                {stat.counts.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No answers provided yet.</p>
                ) : (
                  <div className="space-y-3">
                    {stat.counts.map((c, i) => {
                      // Find max count to scale the bar chart
                      const maxCount = Math.max(...stat.counts.map(x => x.count));
                      const percentage = Math.round((c.count / maxCount) * 100);
                      
                      return (
                        <div key={i} className="flex items-center text-sm">
                          <div className="w-1/3 truncate pr-4 text-gray-600" title={c.value}>
                            {c.value}
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                              <div 
                                className="h-full bg-[#a25fba] rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-12 text-right font-medium text-gray-900">
                              {c.count}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
