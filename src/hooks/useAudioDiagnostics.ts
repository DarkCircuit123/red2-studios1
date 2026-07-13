import { useEffect, useState, useCallback } from 'react';
import { AudioDiagnostic, AudioDiagnosticReport } from '@/lib/audio-diagnostic';
import { GlobalAudioManager } from '@/lib/audio-manager';

export function useAudioDiagnostics() {
  const [report, setReport] = useState<AudioDiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const diagnosticReport = await AudioDiagnostic.runDiagnostic();
      setReport(diagnosticReport);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
      console.error('Audio diagnostic failed:', e);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const applyFixes = useCallback(() => {
    try {
      AudioDiagnostic.applyAllFixes();
      // Re-run diagnostic to verify fixes
      runDiagnostic();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to apply fixes:', e);
    }
  }, [runDiagnostic]);

  const exportReport = useCallback(() => {
    if (!report) return;
    
    const json = AudioDiagnostic.exportReport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-diagnostic-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  return {
    report,
    isRunning,
    error,
    runDiagnostic,
    applyFixes,
    exportReport,
  };
}

export function useAudioManager() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [audioContextState, setAudioContextState] = useState('unavailable');
  const manager = GlobalAudioManager.getInstance();

  useEffect(() => {
    // Set initial state
    setIsAudioEnabled(manager.isAudioEnabledState());
    setAudioContextState(manager.getAudioContextState());

    // Subscribe to audio toggle changes
    const unsubscribe = manager.onAudioToggle((enabled) => {
      setIsAudioEnabled(enabled);
    });

    return unsubscribe;
  }, [manager]);

  const toggleAudio = useCallback(() => {
    const newState = manager.toggleAudio();
    setIsAudioEnabled(newState);
  }, [manager]);

  const resumeAudioContext = useCallback(async () => {
    await manager.resumeAudioContext();
    setAudioContextState(manager.getAudioContextState());
  }, [manager]);

  return {
    isAudioEnabled,
    audioContextState,
    toggleAudio,
    resumeAudioContext,
    manager,
  };
}
