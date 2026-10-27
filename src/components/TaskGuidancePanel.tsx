import React, { useState } from 'react';
import { TaskGuidance } from '../types';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Compass,
  Volume2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { soundManager } from '../utils/audioCues';

interface TaskGuidancePanelProps {
  activeGoal: string;
  taskGuidance: TaskGuidance | null;
  isLoading: boolean;
  onSetGoal: (goal: string) => void;
  onVerifyStep: () => void;
  onReadInstruction: (text: string) => void;
  onHighlightTarget: () => void;
  onToggleStep?: (stepText: string, currentlyCompleted: boolean) => void;
}

export const TaskGuidancePanel: React.FC<TaskGuidancePanelProps> = ({
  activeGoal,
  taskGuidance,
  isLoading,
  onSetGoal,
  onVerifyStep,
  onReadInstruction,
  onHighlightTarget,
  onToggleStep,
}) => {
  const [goalInput, setGoalInput] = useState('');

  const quickGoals = [
    'Complete payment and submit order',
    'Find and enable Two-Factor Authentication',
    'Select the best direct flight',
    'Locate and fix form errors',
    'Find account settings and profile',
  ];

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalInput.trim()) {
      onSetGoal(goalInput.trim());
      soundManager.playScanStart();
      setGoalInput('');
    }
  };

  const handleQuickGoalSelect = (goal: string) => {
    onSetGoal(goal);
    soundManager.playScanStart();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Task Navigator &amp; Step Guide
            </h2>
            <p className="text-xs text-slate-400">Real-time step-by-step guidance for your goal</p>
          </div>
        </div>

        {taskGuidance?.isTaskComplete && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Task Accomplished!
          </span>
        )}
      </div>

      {/* Goal Input & Active Goal Display */}
      <div className="mt-4 space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Current Goal / Task
        </label>
        {activeGoal ? (
          <div className="p-3.5 bg-amber-400/10 border-2 border-amber-400/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm font-bold text-amber-200">{activeGoal}</span>
            </div>
            <button
              onClick={() => onSetGoal('')}
              className="text-xs text-slate-400 hover:text-slate-200 underline ml-2"
            >
              Change
            </button>
          </div>
        ) : (
          <form onSubmit={handleGoalSubmit} className="flex gap-2">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="What are you trying to accomplish on this screen?"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              type="submit"
              disabled={!goalInput.trim() || isLoading}
              className="px-4 py-2.5 bg-amber-400 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-300 disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>Guide Me</span>
            </button>
          </form>
        )}

        {/* Quick Goal Suggestions */}
        {!activeGoal && (
          <div className="pt-2">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Suggested tasks on screen:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickGoals.map((g, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickGoalSelect(g)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors text-left"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Blocker or Warning Alert */}
      {taskGuidance?.blockerOrAlert && (
        <div className="mt-4 p-3.5 bg-rose-500/15 border-2 border-rose-500/50 rounded-xl flex items-start gap-3 text-rose-200 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="block font-bold text-rose-300 mb-0.5">Attention Needed</strong>
            {taskGuidance.blockerOrAlert}
          </div>
        </div>
      )}

      {/* Immediate Next Step Card */}
      {taskGuidance && (
        <div className="mt-5 p-4 bg-slate-950 border-2 border-blue-500/40 rounded-xl space-y-3 relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
              Immediate Action
            </span>
            <button
              onClick={() => onReadInstruction(taskGuidance.instruction)}
              className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1.5 font-medium bg-blue-900/30 px-2 py-1 rounded border border-blue-800"
              title="Read this step aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Read Aloud</span>
            </button>
          </div>

          <p className="text-base font-bold text-slate-100 leading-snug">
            {taskGuidance.instruction || 'Inspect the screen elements to proceed.'}
          </p>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            {taskGuidance.targetCoordinates && (
              <button
                onClick={onHighlightTarget}
                className="flex-1 py-2 px-3 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-300 transition-colors shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Show On Screen</span>
              </button>
            )}

            <button
              onClick={onVerifyStep}
              disabled={isLoading}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Did I do it? Check</span>
            </button>
          </div>
        </div>
      )}

      {/* Task Checklist: Completed & Remaining */}
      {taskGuidance && (
        <div className="mt-5 space-y-4 flex-1">
          {/* Completed Steps */}
          {taskGuidance.completedSteps?.length > 0 && (
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Completed Steps ({taskGuidance.completedSteps.length})</span>
                <span className="text-[10px] text-slate-500 font-normal">Click checkmark to undo</span>
              </span>
              <ul className="space-y-1.5">
                {taskGuidance.completedSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 text-xs text-slate-300 bg-emerald-950/20 border border-emerald-800/30 p-2 rounded-lg group hover:bg-emerald-950/30 transition-colors"
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => onToggleStep?.(step, true)}
                        title="Mark as incomplete"
                        className="text-emerald-400 hover:text-emerald-300 shrink-0 mt-0.5 focus:outline-none"
                      >
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" />
                      </button>
                      <span className="line-through text-slate-400 truncate">{step}</span>
                    </div>
                    <button
                      onClick={() => onReadInstruction(step)}
                      className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 p-1 transition-opacity"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Remaining Steps */}
          {taskGuidance.remainingSteps?.length > 0 && (
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Remaining Steps ({taskGuidance.remainingSteps.length})</span>
                <span className="text-[10px] text-slate-500 font-normal">Click circle to complete</span>
              </span>
              <ul className="space-y-1.5">
                {taskGuidance.remainingSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center justify-between gap-2 text-xs p-2 rounded-lg border transition-all ${
                      idx === 0
                        ? 'bg-amber-400/10 border-amber-400/40 text-amber-100 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => onToggleStep?.(step, false)}
                        title="Mark as complete"
                        className="text-slate-500 hover:text-emerald-400 shrink-0 mt-0.5 focus:outline-none transition-colors"
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                      <span className={idx === 0 ? 'font-semibold text-amber-200' : 'text-slate-300'}>
                        {step}
                      </span>
                    </div>
                    <button
                      onClick={() => onReadInstruction(step)}
                      className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
