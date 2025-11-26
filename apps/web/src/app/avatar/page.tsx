'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLiveKitRoom } from '@/hooks/useLiveKitRoom';
import TalkingHead from '@/components/TalkingHead';
import VoiceControl from '@/components/VoiceControl';
import Loader from '@/components/loader';

export default function AvatarDemo() {
    const [roomName, setRoomName] = useState(
        process.env.NEXT_PUBLIC_DEFAULT_ROOM || 'avatar-demo'
    );
    const [participantName, setParticipantName] = useState('');
    const { isConnected, isConnecting, error, connect } = useLiveKitRoom();

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomName.trim() || !participantName.trim()) {
            return;
        }

        await connect(roomName, participantName);
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">PipeChat Voice Agent</h1>
                <p className="text-muted-foreground">
                    Real-time AI voice conversation with 3D Avatar
                </p>
            </div>

            {!isConnected ? (
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Connect to Voice Chat</CardTitle>
                        <CardDescription>
                            Enter your details to start a conversation with the AI avatar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleConnect} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="room">Room Name</Label>
                                <Input
                                    id="room"
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="avatar-demo"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Your Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={participantName}
                                    onChange={(e) => setParticipantName(e.target.value)}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                    {error.message}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isConnecting}
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader className="mr-2" />
                                        Connecting...
                                    </>
                                ) : (
                                    'Connect'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {/* Avatar Display */}
                    <TalkingHead />

                    {/* Voice Controls */}
                    <VoiceControl />

                    {/* Instructions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">How to Use</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Click the microphone button to unmute and start speaking</li>
                                <li>The avatar will listen and respond with synchronized lip movements</li>
                                <li>Watch the status indicators for real-time feedback</li>
                                <li>Click the phone button to end the call</li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
