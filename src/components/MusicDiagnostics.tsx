import { useEffect, useState } from 'react';
import { BaseCrudService } from '@/integrations';
import { MusicSettings } from '@/entities/index';
import { getPlayableAudioUrl } from '@/lib/wix-audio-resolver';

/**
 * Music Diagnostics Component
 * Displays detailed information about music settings and URL resolution
 * Only visible in development or when explicitly enabled
 */
export default function MusicDiagnostics() {
  const [musicData, setMusicData] = useState<MusicSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const loadDiagnostics = async () => {
      try {
        console.log('[MUSIC_DIAGNOSTICS] Loading music settings...');
        const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });
        
        console.log('[MUSIC_DIAGNOSTICS] Raw data:', result.items);
        
        // Log detailed info for each track
        result.items?.forEach((track, index) => {
          const playableUrl = getPlayableAudioUrl(track.musicUrl, track.audio);
          console.log(`[MUSIC_DIAGNOSTICS] Track ${index}:`, {
            _id: track._id,
            musicTitle: track.musicTitle,
            isEnabled: track.isEnabled,
            musicUrl: track.musicUrl,
            audio: track.audio,
            playableUrl,
            volume: track.volume,
            loopMusic: track.loopMusic
          });
        });
        
        setMusicData(result.items || []);
      } catch (error) {
        console.error('[MUSIC_DIAGNOSTICS] Error loading:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDiagnostics();
  }, []);

  // Only show in development or if explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-8 z-40 bg-black text-white p-4 rounded-lg max-w-sm max-h-96 overflow-auto text-xs font-mono">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">🎵 Music Diagnostics</h3>
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          <p>Total tracks: {musicData.length}</p>
          
          {musicData.map((track, index) => {
            const playableUrl = getPlayableAudioUrl(track.musicUrl, track.audio);
            const isEnabled = track.isEnabled === true;
            const hasUrl = !!playableUrl;
            
            return (
              <div key={track._id} className="border-t border-gray-600 pt-2">
                <p className="font-bold">Track {index}: {track.musicTitle}</p>
                <p className={isEnabled ? 'text-green-400' : 'text-red-400'}>
                  Enabled: {isEnabled ? '✓' : '✗'}
                </p>
                <p className={hasUrl ? 'text-green-400' : 'text-red-400'}>
                  Has URL: {hasUrl ? '✓' : '✗'}
                </p>
                {track.musicUrl && (
                  <p className="text-gray-300 break-words">
                    musicUrl: {track.musicUrl.substring(0, 50)}...
                  </p>
                )}
                {track.audio && (
                  <p className="text-gray-300 break-words">
                    audio: {track.audio.substring(0, 50)}...
                  </p>
                )}
                {playableUrl && (
                  <p className="text-green-300 break-words">
                    ✓ Playable: {playableUrl.substring(0, 50)}...
                  </p>
                )}
                <p>Volume: {track.volume}%</p>
                <p>Loop: {track.loopMusic ? '✓' : '✗'}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
