import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CleanupTrigger() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCleanup = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/cleanup-portfolio-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        console.log('✅ Cleanup completed:', data);
      } else {
        setError(data.error || 'Cleanup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Cleanup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Portfolio Images Cleanup</h3>
      
      <Button
        onClick={handleCleanup}
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? (
          <>
            <LoadingSpinner /> Running Cleanup...
          </>
        ) : (
          'Run Cleanup'
        )}
      </Button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
          <p className="font-semibold mb-2">✅ {result.message}</p>
          <ul className="space-y-1 text-sm">
            <li>Total items: <span className="font-mono">{result.totalItems}</span></li>
            <li>Deleted: <span className="font-mono text-red-600 font-semibold">{result.deletedCount}</span></li>
            <li>Remaining: <span className="font-mono">{result.remainingItems}</span></li>
          </ul>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="font-semibold text-yellow-700 mb-2">Errors:</p>
              <ul className="text-xs space-y-1">
                {result.errors.map((err: string, idx: number) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
