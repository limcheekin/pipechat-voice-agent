'use client';

import { useState, useCallback, useEffect } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client';
import { getAccessToken } from '@/lib/token-service';

export interface UseLiveKitRoomReturn {
    room: Room | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: Error | null;
    localParticipant: LocalParticipant | null;
    remoteParticipants: RemoteParticipant[];
    connect: (roomName: string, participantName: string) => Promise<void>;
    disconnect: () => void;
}

/**
 * Custom hook for managing LiveKit room connection and state
 * 
 * @returns Object containing room state and control methods
 */
export function useLiveKitRoom(): UseLiveKitRoomReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
    const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);

    /**
     * Connect to a LiveKit room
     */
    const connect = useCallback(async (roomName: string, participantName: string) => {
        try {
            setIsConnecting(true);
            setError(null);

            // Get access token from backend
            const { token, livekitUrl } = await getAccessToken(roomName, participantName);

            // Create LiveKit room with optimized settings
            const livekitRoom = new Room({
                adaptiveStream: true,
                dynacast: true,
                disconnectOnPageLeave: true,
            });

            // Set up event listeners
            livekitRoom.on(RoomEvent.Connected, () => {
                console.log('Connected to LiveKit room');
                setIsConnected(true);
                setIsConnecting(false);
                setLocalParticipant(livekitRoom.localParticipant);
            });

            livekitRoom.on(RoomEvent.Disconnected, () => {
                console.log('Disconnected from LiveKit room');
                setIsConnected(false);
                setIsConnecting(false);
                setLocalParticipant(null);
                setRemoteParticipants([]);
            });

            livekitRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
                console.log('Participant connected:', participant.identity);
                setRemoteParticipants((prev) => [...prev, participant]);
            });

            livekitRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
                console.log('Participant disconnected:', participant.identity);
                setRemoteParticipants((prev) => prev.filter((p) => p.sid !== participant.sid));
            });

            livekitRoom.on(RoomEvent.Reconnecting, () => {
                console.log('Reconnecting to LiveKit room...');
                setIsConnecting(true);
            });

            livekitRoom.on(RoomEvent.Reconnected, () => {
                console.log('Reconnected to LiveKit room');
                setIsConnecting(false);
            });

            // Connect to the room
            await livekitRoom.connect(livekitUrl, token);
            setRoom(livekitRoom);
        } catch (err) {
            console.error('Failed to connect to LiveKit room:', err);
            setError(err instanceof Error ? err : new Error('Connection failed'));
            setIsConnecting(false);
        }
    }, []);

    /**
     * Disconnect from the current room
     */
    const disconnect = useCallback(() => {
        if (room) {
            room.disconnect();
            setRoom(null);
            setIsConnected(false);
            setLocalParticipant(null);
            setRemoteParticipants([]);
        }
    }, [room]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, [room]);

    return {
        room,
        isConnected,
        isConnecting,
        error,
        localParticipant,
        remoteParticipants,
        connect,
        disconnect,
    };
}
