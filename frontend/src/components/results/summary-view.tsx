import React from "react";
import { PublicForm, ResponseSummary, QuestionStats } from "@/lib/types";
import { Users, CheckCircle } from "lucide-react";

interface SummaryViewProps {
  form: PublicForm;
  responses: ResponseSummary[];
  stats: QuestionStats[];
}

export function SummaryView({ responses, stats }: SummaryViewProps) {
  const totalViews = responses.length; // Simplified: in a real app we'd track actual views
  const completedResponses = responses.filter(r => r.completed_at).length;
  const completionRate = totalViews > 0 
    ? Math.round((completedResponses / totalViews) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* High-level metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <div className="mb-2 flex items-center gap-3 text-muted-foreground">
            <Users className="h-5 w-5" />
            <h3 className="text-sm font-medium">Total Responses</h3>
          </div>
          <p className="text-3xl font-medium tracking-tight text-card-foreground">{totalViews}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <div className="mb-2 flex items-center gap-3 text-muted-foreground">
            <CheckCircle className="h-5 w-5" />
            <h3 className="text-sm font-medium">Completion Rate</h3>
          </div>
          <p className="text-3xl font-medium tracking-tight text-card-foreground">{completionRate}%</p>
        </div>
      </div>

      {/* Question breakdown */}
      <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="border-b border-border bg-muted px-6 py-4">
          <h3 className="text-sm font-medium text-card-foreground">Question Analysis</h3>
        </div>
        
        <div className="divide-y divide-border">
          {stats.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No data available to analyze yet.
            </div>
          ) : (
            stats.map((stat, idx) => (
              <div key={stat.question_id} className="p-6">
                <h4 className="mb-4 text-sm font-medium text-card-foreground">
                  {idx + 1}. {stat.title}
                </h4>
                
                {stat.counts.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">No answers provided yet.</p>
                ) : (
                  <div className="space-y-3">
                    {stat.counts.map((c, i) => {
                      // Find max count to scale the bar chart
                      const maxCount = Math.max(...stat.counts.map(x => x.count));
                      const percentage = Math.round((c.count / maxCount) * 100);
                      
                      return (
                        <div key={i} className="flex items-center text-sm">
                          <div className="w-1/3 truncate pr-4 text-muted-foreground" title={c.value}>
                            {c.value}
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div 
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-12 text-right font-medium text-card-foreground">
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
