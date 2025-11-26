'use client';

import { useState, useCallback, useEffect } from 'react';
import { LocalAudioTrack, Track } from 'livekit-client';
import { useLiveKitRoom } from '@/hooks/useLiveKitRoom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, PhoneOff } from 'lucide-react';

export default function VoiceControl() {
    const { room, isConnected, localParticipant } = useLiveKitRoom();
    const [isMuted, setIsMuted] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);

    // Monitor local audio track state
    useEffect(() => {
        if (!localParticipant) return;

        const updateAudioState = () => {
            const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone);
            setIsAudioEnabled(!!audioTrack?.isEnabled);
            setIsMuted(audioTrack?.isMuted ?? false);
        };

        updateAudioState();

        // Listen for track changes
        localParticipant.on('trackMuted', updateAudioState);
        localParticipant.on('trackUnmuted', updateAudioState);

        return () => {
            localParticipant.off('trackMuted', updateAudioState);
            localParticipant.off('trackUnmuted', updateAudioState);
        };
    }, [localParticipant]);

    /**
     * Toggle microphone mute state
     */
    const toggleMute = useCallback(async () => {
        if (!localParticipant) return;

        try {
            const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone);

            if (audioTrack) {
                if (isMuted) {
                    await localParticipant.setMicrophoneEnabled(true);
                } else {
                    await localParticipant.setMicrophoneEnabled(false);
                }
            } else {
                // Enable microphone for the first time
                await localParticipant.setMicrophoneEnabled(true);
            }
        } catch (error) {
            console.error('Failed to toggle microphone:', error);
        }
    }, [localParticipant, isMuted]);

    /**
     * End the call
     */
    const endCall = useCallback(() => {
        if (room) {
            room.disconnect();
        }
    }, [room]);

    if (!isConnected) {
        return null;
    }

    return (
        <Card className="p-4">
            <div className="flex items-center justify-center gap-4">
                {/* Mute/Unmute button */}
                <Button
                    variant={isMuted ? 'destructive' : 'default'}
                    size="lg"
                    onClick={toggleMute}
                    className="rounded-full w-14 h-14"
                    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                    {isMuted ? (
                        <MicOff className="h-6 w-6" />
                    ) : (
                        <Mic className="h-6 w-6" />
                    )}
                </Button>

                {/* End call button */}
                <Button
                    variant="destructive"
                    size="lg"
                    onClick={endCall}
                    className="rounded-full w-14 h-14"
                    aria-label="End call"
                >
                    <PhoneOff className="h-6 w-6" />
                </Button>

                {/* Status text */}
                <div className="text-sm text-muted-foreground">
                    {isMuted ? 'Microphone muted' : 'Microphone active'}
                </div>
            </div>
        </Card>
    );
}
