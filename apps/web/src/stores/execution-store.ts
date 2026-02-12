/**
 * Execution Store — separated from tool-store per planning spec.
 * Manages current execution state, history, undo/redo for the active tool.
 * tool-store retains favorites and recents.
 */

import { create } from 'zustand';

export interface ExecutionRecord {
  id: string;
  toolId: string;
  input: string;
  output: string;
  status: 'completed' | 'failed';
  error?: string;
  coinsCharged: number;
  duration?: number;
  timestamp: number;
}

export interface ExecutionState {
  // Current execution
  currentToolId: string | null;
  currentInput: string;
  currentOutput: string;
  currentStatus: 'idle' | 'running' | 'completed' | 'failed' | 'queued';
  currentError: string | null;
  currentJobId: string | null;
  currentCoinsCharged: number;

  // History (ring buffer — last 50 executions per tool)
  history: Record<string, ExecutionRecord[]>;

  // Undo/redo for input
  undoStack: string[];
  redoStack: string[];

  // Actions — execution lifecycle
  setCurrentTool: (toolId: string) => void;
  setInput: (input: string) => void;
  startExecution: () => void;
  completeExecution: (output: string, coinsCharged: number, duration?: number) => void;
  failExecution: (error: string) => void;
  queueExecution: (jobId: string) => void;

  // Actions — undo/redo
  undo: () => void;
  redo: () => void;
  pushUndo: (value: string) => void;

  // Getters
  getHistory: (toolId: string) => ExecutionRecord[];

  // Reset
  reset: () => void;
}

const MAX_HISTORY = 50;

const initialState = {
  currentToolId: null as string | null,
  currentInput: '',
  currentOutput: '',
  currentStatus: 'idle' as const,
  currentError: null as string | null,
  currentJobId: null as string | null,
  currentCoinsCharged: 0,
  history: {} as Record<string, ExecutionRecord[]>,
  undoStack: [] as string[],
  redoStack: [] as string[],
};

export const useExecutionStore = create<ExecutionState>()((set, get) => ({
  ...initialState,

  setCurrentTool: (toolId) =>
    set({
      currentToolId: toolId,
      currentInput: '',
      currentOutput: '',
      currentStatus: 'idle',
      currentError: null,
      currentJobId: null,
      currentCoinsCharged: 0,
      undoStack: [],
      redoStack: [],
    }),

  setInput: (input) => set({ currentInput: input }),

  startExecution: () =>
    set({
      currentStatus: 'running',
      currentError: null,
      currentOutput: '',
      currentJobId: null,
      currentCoinsCharged: 0,
    }),

  completeExecution: (output, coinsCharged, duration) => {
    const state = get();
    const toolId = state.currentToolId;

    if (toolId) {
      const record: ExecutionRecord = {
        id: crypto.randomUUID(),
        toolId,
        input: state.currentInput,
        output,
        status: 'completed',
        coinsCharged,
        duration,
        timestamp: Date.now(),
      };
      const toolHistory = state.history[toolId] ?? [];
      const updatedHistory = [record, ...toolHistory].slice(0, MAX_HISTORY);

      set({
        currentOutput: output,
        currentStatus: 'completed',
        currentCoinsCharged: coinsCharged,
        history: { ...state.history, [toolId]: updatedHistory },
      });
    } else {
      set({
        currentOutput: output,
        currentStatus: 'completed',
        currentCoinsCharged: coinsCharged,
      });
    }
  },

  failExecution: (error) => {
    const state = get();
    const toolId = state.currentToolId;

    if (toolId) {
      const record: ExecutionRecord = {
        id: crypto.randomUUID(),
        toolId,
        input: state.currentInput,
        output: '',
        status: 'failed',
        error,
        coinsCharged: 0,
        timestamp: Date.now(),
      };
      const toolHistory = state.history[toolId] ?? [];
      const updatedHistory = [record, ...toolHistory].slice(0, MAX_HISTORY);

      set({
        currentStatus: 'failed',
        currentError: error,
        history: { ...state.history, [toolId]: updatedHistory },
      });
    } else {
      set({ currentStatus: 'failed', currentError: error });
    }
  },

  queueExecution: (jobId) =>
    set({ currentStatus: 'queued', currentJobId: jobId }),

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const prev = state.undoStack[state.undoStack.length - 1]!;
    set({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, state.currentInput],
      currentInput: prev,
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const next = state.redoStack[state.redoStack.length - 1]!;
    set({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, state.currentInput],
      currentInput: next,
    });
  },

  pushUndo: (value) =>
    set((state) => ({
      undoStack: [...state.undoStack.slice(-49), value],
      redoStack: [],
    })),

  getHistory: (toolId) => get().history[toolId] ?? [],

  reset: () => set(initialState),
}));
