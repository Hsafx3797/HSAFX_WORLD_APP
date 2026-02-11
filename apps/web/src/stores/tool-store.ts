/**
 * Tool Execution Store — input/output state, history, loading
 * Reference: SOLUTION_ROADMAP Task 4.3
 */

import { create } from 'zustand';

export interface ToolExecution {
  id: string;
  input: string;
  output: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'queued';
  error?: string;
  coinsCharged: number;
  duration?: number;
  timestamp: number;
}

export interface ToolState {
  // Current execution
  currentToolId: string | null;
  currentInput: string;
  currentOutput: string;
  currentStatus: 'idle' | 'running' | 'completed' | 'failed' | 'queued';
  currentError: string | null;
  currentJobId: string | null;
  currentCoinsCharged: number;

  // History (ring buffer — last 50 executions per tool)
  history: Record<string, ToolExecution[]>;

  // Undo/redo
  undoStack: string[];
  redoStack: string[];

  // Favorites & recents
  favorites: string[]; // tool IDs
  recentTools: string[]; // tool IDs, most recent first

  // Actions
  setCurrentTool: (toolId: string) => void;
  setInput: (input: string) => void;
  setOutput: (output: string) => void;
  setStatus: (status: ToolState['currentStatus']) => void;
  setError: (error: string | null) => void;
  setJobId: (jobId: string | null) => void;
  setCoinsCharged: (coins: number) => void;

  startExecution: () => void;
  completeExecution: (output: string, coinsCharged: number, duration?: number) => void;
  failExecution: (error: string) => void;
  queueExecution: (jobId: string) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;
  pushUndo: (value: string) => void;

  // Favorites
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;

  // Recents
  addRecent: (toolId: string) => void;

  // Reset
  reset: () => void;
}

const MAX_HISTORY = 50;
const MAX_RECENTS = 20;

const initialState = {
  currentToolId: null as string | null,
  currentInput: '',
  currentOutput: '',
  currentStatus: 'idle' as const,
  currentError: null as string | null,
  currentJobId: null as string | null,
  currentCoinsCharged: 0,
  history: {} as Record<string, ToolExecution[]>,
  undoStack: [] as string[],
  redoStack: [] as string[],
  favorites: [] as string[],
  recentTools: [] as string[],
};

export const useToolStore = create<ToolState>()((set, get) => ({
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
  setOutput: (output) => set({ currentOutput: output }),
  setStatus: (status) => set({ currentStatus: status }),
  setError: (error) => set({ currentError: error }),
  setJobId: (jobId) => set({ currentJobId: jobId }),
  setCoinsCharged: (coins) => set({ currentCoinsCharged: coins }),

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
    const execution: ToolExecution = {
      id: crypto.randomUUID(),
      input: state.currentInput,
      output,
      status: 'completed',
      coinsCharged,
      duration,
      timestamp: Date.now(),
    };

    const toolId = state.currentToolId;
    if (toolId) {
      const toolHistory = state.history[toolId] ?? [];
      const updatedHistory = [execution, ...toolHistory].slice(0, MAX_HISTORY);

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

  failExecution: (error) =>
    set({ currentStatus: 'failed', currentError: error }),

  queueExecution: (jobId) =>
    set({ currentStatus: 'queued', currentJobId: jobId }),

  // Undo/redo for input field
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

  toggleFavorite: (toolId) =>
    set((state) => ({
      favorites: state.favorites.includes(toolId)
        ? state.favorites.filter((id) => id !== toolId)
        : [...state.favorites, toolId],
    })),

  isFavorite: (toolId) => get().favorites.includes(toolId),

  addRecent: (toolId) =>
    set((state) => ({
      recentTools: [
        toolId,
        ...state.recentTools.filter((id) => id !== toolId),
      ].slice(0, MAX_RECENTS),
    })),

  reset: () => set(initialState),
}));
