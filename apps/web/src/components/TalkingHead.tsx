'use client';

import { useState, useEffect, useRef } from 'react';
import { RoomEvent } from 'livekit-client';
import { useLiveKitRoom } from '@/hooks/useLiveKitRoom';
import { Card } from '@/components/ui/card';

// Declare TalkingHead types
declare global {
    interface Window {
        TalkingHead: any;
    }
}

interface TimingData {
    type: string;
    sequence_id: number;
    words: string[];
    word_times: number[];
    word_durations: number[];
    text: string;
}

export default function TalkingHead() {
    const avatarRef = useRef<HTMLDivElement>(null);
    const headRef = useRef<any>(null);
    const { room, isConnected } = useLiveKitRoom();

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [currentText, setCurrentText] = useState('');

    const timingQueueRef = useRef<TimingData[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const currentTimingRef = useRef<TimingData | null>(null);
    const speakStartTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number>(0);

    // Initialize TalkingHead avatar
    useEffect(() => {
        if (!avatarRef.current || headRef.current) return;

        const initAvatar = async () => {
            try {
                // Wait for TalkingHead to be available
                if (!window.TalkingHead) {
                    console.warn('TalkingHead library not loaded yet, waiting...');
                    return;
                }

                const head = new window.TalkingHead(avatarRef.current, {
                    ttsLang: 'en-GB',
                    lipsyncLang: 'en',
                });

                // Show avatar with default model
                await head.showAvatar({
                    url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb',
                    body: 'F',
                    avatarMood: 'neutral',
                    lipsyncLang: 'en',
                });

                headRef.current = head;
                console.log('TalkingHead avatar initialized');

                // Initialize Web Audio API for lip-sync synchronization
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            } catch (error) {
                console.error('Failed to initialize TalkingHead:', error);
            }
        };

        // Try to initialize immediately, or wait for library to load
        initAvatar();

        // Retry initialization if library loads late
        const retryInterval = setInterval(() => {
            if (!headRef.current && window.TalkingHead) {
                initAvatar();
            }
            if (headRef.current) {
                clearInterval(retryInterval);
            }
        }, 1000);

        return () => {
            clearInterval(retryInterval);
            if (headRef.current) {
                headRef.current.stopSpeaking();
            }
        };
    }, []);

    // Handle incoming timing data via LiveKit data channel
    useEffect(() => {
        if (!room) return;

        const handleData = (payload: Uint8Array, participant?: any) => {
            try {
                const msg = JSON.parse(new TextDecoder().decode(payload));

                if (msg.type === 'bot-tts-timing') {
                    console.log('Received timing data:', msg);
                    timingQueueRef.current.push(msg as TimingData);
                } else if (msg.type === 'bot-thinking') {
                    setIsThinking(true);
                } else if (msg.type === 'bot-response-start') {
                    setIsThinking(false);
                }
            } catch (error) {
                console.error('Failed to parse data message:', error);
            }
        };

        room.on(RoomEvent.DataReceived, handleData);

        return () => {
            room.off(RoomEvent.DataReceived, handleData);
        };
    }, [room]);

    // Set up audio analyzer for real-time lip-sync
    useEffect(() => {
        if (!room || !isConnected) return;

        const setupAudioAnalyzer = () => {
            try {
                // Get remote audio tracks
                const remoteParticipants = Array.from(room.remoteParticipants.values());
                if (remoteParticipants.length === 0) return;

                const audioTrack = remoteParticipants[0].audioTrackPublications.values().next().value?.track;
                if (!audioTrack || !audioContextRef.current) return;

                // Create audio analyzer
                const mediaStream = new MediaStream([audioTrack.mediaStreamTrack]);
                const source = audioContextRef.current.createMediaStreamSource(mediaStream);
                const analyser = audioContextRef.current.createAnalyser();

                analyser.fftSize = 256;
                source.connect(analyser);

                analyserRef.current = analyser;
                console.log('Audio analyzer set up');
            } catch (error) {
                console.error('Failed to set up audio analyzer:', error);
            }
        };

        // Wait for remote participants to join
        room.on(RoomEvent.TrackSubscribed, setupAudioAnalyzer);
        setupAudioAnalyzer();

        return () => {
            room.off(RoomEvent.TrackSubscribed, setupAudioAnalyzer);
        };
    }, [room, isConnected]);

    // Animation loop for lip-sync
    useEffect(() => {
        if (!headRef.current) return;

        const animate = () => {
            if (analyserRef.current) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const energy = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

                // Trigger speaking when audio starts
                if (energy > 10 && !currentTimingRef.current && timingQueueRef.current.length > 0) {
                    currentTimingRef.current = timingQueueRef.current.shift()!;
                    speakStartTimeRef.current = Date.now();
                    setIsSpeaking(true);
                    setCurrentText(currentTimingRef.current.text);

                    // Start TalkingHead speaking animation
                    if (headRef.current) {
                        headRef.current.speakText(currentTimingRef.current.text);
                    }
                }

                // Update lip movements based on word timing
                if (currentTimingRef.current) {
                    const elapsed = (Date.now() - speakStartTimeRef.current) / 1000;
                    const { words, word_times, word_durations } = currentTimingRef.current;

                    // Find current word for subtitle display
                    let currentWord = '';
                    for (let i = 0; i < words.length; i++) {
                        if (elapsed >= word_times[i] && elapsed < (word_times[i] + word_durations[i])) {
                            currentWord = words[i];
                            break;
                        }
                    }

                    // Check if finished speaking
                    const totalDuration = word_times[word_times.length - 1] + word_durations[word_durations.length - 1];
                    if (elapsed > totalDuration + 0.5) {
                        currentTimingRef.current = null;
                        setIsSpeaking(false);
                        setCurrentText('');

                        if (headRef.current) {
                            headRef.current.stopSpeaking();
                        }
                    }
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <Card className="relative overflow-hidden">
            {/* Avatar container */}
            <div
                ref={avatarRef}
                className="h-[500px] w-full bg-gradient-to-br from-gray-900 to-gray-800"
            />

            {/* Status indicators */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                {isConnected && (
                    <div className="px-3 py-1 bg-green-500/90 text-white text-sm rounded-full backdrop-blur-sm">
                        Connected
                    </div>
                )}
                {isThinking && (
                    <div className="px-3 py-1 bg-blue-500/90 text-white text-sm rounded-full backdrop-blur-sm animate-pulse">
                        Thinking...
                    </div>
                )}
                {isSpeaking && (
                    <div className="px-3 py-1 bg-purple-500/90 text-white text-sm rounded-full backdrop-blur-sm">
                        Speaking...
                    </div>
                )}
            </div>

            {/* Subtitle display */}
            {currentText && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
                    <p className="text-center">{currentText}</p>
                </div>
            )}
        </Card>
    );
}
