/**
 * LiveKit Token Service
 * 
 * Fetches access tokens from the backend token server for LiveKit room authentication.
 */

export interface TokenResponse {
    token: string;
    livekitUrl: string;
}

/**
 * Get a LiveKit access token for a room
 * @param roomName - Name of the LiveKit room to join
 * @param participantName - Display name for the participant
 * @returns Token and LiveKit server URL
 */
export async function getAccessToken(
    roomName: string,
    participantName: string
): Promise<TokenResponse> {
    const tokenServerUrl = process.env.NEXT_PUBLIC_TOKEN_SERVER_URL;
    const apiKey = process.env.NEXT_PUBLIC_TOKEN_SERVER_API_KEY;

    if (!tokenServerUrl) {
        throw new Error('NEXT_PUBLIC_TOKEN_SERVER_URL is not configured');
    }

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    // Add API key if configured
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(tokenServerUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            room: roomName,
            identity: participantName,
            name: participantName,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
    }

    const data = await response.json();

    return {
        token: data.token,
        livekitUrl: data.url,
    };
}
