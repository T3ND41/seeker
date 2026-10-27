import React from 'react';
import { TaskGuidance } from '../types';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  ChevronRight,
  ListOrdered
} from 'lucide-react';

interface TaskProgressBarProps {
  taskGuidance: TaskGuidance | null;
  activeGoal?: string;
  onStepClick?: (stepIndex: number, stepText: string) => void;
  className?: string;
}

export const TaskProgressBar: React.FC<TaskProgressBarProps> = ({
  taskGuidance,
  activeGoal,
  onStepClick,
  className = '',
}) => {
  const completedSteps = taskGuidance?.completedSteps || [];
  const remainingSteps = taskGuidance?.remainingSteps || [];
  const isComplete = Boolean(taskGuidance?.isTaskComplete || (completedSteps.length > 0 && remainingSteps.length === 0));

  const completedCount = completedSteps.length;
  const remainingCount = isComplete ? 0 : remainingSteps.length;
  const totalSteps = completedCount + remainingCount;

  // Calculate percentage
  let progressPercentage = 0;
  if (isComplete) {
    progressPercentage = 100;
  } else if (totalSteps > 0) {
    progressPercentage = Math.min(100, Math.round((completedCount / totalSteps) * 100));
  } else if (activeGoal) {
    // If a goal is active but steps haven't finished scanning
    progressPercentage = 15;
  }

  // All combined steps for breadcrumb indicator
  const allStepItems = [
    ...completedSteps.map((s, idx) => ({ id: `c-${idx}`, text: s, status: 'completed' as const, index: idx + 1 })),
    ...remainingSteps.map((s, idx) => ({
      id: `r-${idx}`,
      text: s,
      status: (idx === 0 && !isComplete ? 'current' : 'pending') as 'current' | 'pending',
      index: completedCount + idx + 1,
    })),
  ];

  return (
    <div
      role="region"
      aria-label="Active task progress"
      className={`bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md backdrop-blur-sm transition-all duration-300 ${className}`}
    >
      {/* Top Header: Step Counter & Progress Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg shrink-0 ${
            isComplete
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <ListOrdered className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block truncate">
              {isComplete ? 'Task Completed' : 'Task Progress'}
            </span>
            <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 truncate">
              {isComplete ? (
                <span className="text-emerald-400 font-bold">All steps finished!</span>
              ) : remainingCount > 0 ? (
                <>
                  <span className="text-amber-300 font-extrabold">{remainingCount}</span>
                  <span className="text-slate-400">{remainingCount === 1 ? 'step left' : 'steps left'}</span>
                  {totalSteps > 0 && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({completedCount}/{totalSteps} done)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-400">Ready to begin task</span>
              )}
            </span>
          </div>
        </div>

        {/* Progress Percentage Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border transition-colors ${
              isComplete
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
            }`}
          >
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Visual Progress Bar Track */}
      <div
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${remainingCount} steps remaining out of ${totalSteps}. ${progressPercentage}% complete.`}
        className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner relative"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isComplete
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              : progressPercentage > 60
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Indicators / Next Step Preview */}
      {totalSteps > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
          {/* Step Pill Bubbles */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {allStepItems.slice(0, 6).map((step) => (
              <button
                key={step.id}
                onClick={() => onStepClick?.(step.index, step.text)}
                title={`Step ${step.index}: ${step.text}`}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                  step.status === 'completed'
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/40'
                    : step.status === 'current'
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50 shadow-sm animate-pulse'
                    : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
                }`}
              >
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-2.5 h-2.5" />
                ) : (
                  <span>#{step.index}</span>
                )}
              </button>
            ))}
            {allStepItems.length > 6 && (
              <span className="text-[10px] text-slate-500 font-mono">+{allStepItems.length - 6} more</span>
            )}
          </div>

          {/* Current Step preview label */}
          {!isComplete && taskGuidance?.instruction && (
            <div className="text-[11px] text-slate-400 truncate max-w-[200px] flex items-center gap-1 text-right ml-auto">
              <span className="text-slate-500">Next:</span>
              <span className="text-amber-200 font-medium truncate" title={taskGuidance.instruction}>
                {taskGuidance.instruction}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
