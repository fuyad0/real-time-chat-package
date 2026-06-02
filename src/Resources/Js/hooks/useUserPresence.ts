import axios from 'axios';
import { useEffect } from 'react';

/**
 * Hook to manage user presence (online/offline status)
 * Automatically sets user online on mount and offline on unmount
 */
export function useUserPresence() {
    useEffect(() => {
        // Set user online when component mounts
        const setOnline = async () => {
            try {
                await axios.post('/presence/online');
            } catch (error) {
                console.error('Failed to set user online', error);
            }
        };

        setOnline();

        // Setup heartbeat to maintain online status
        const heartbeatInterval = setInterval(() => {
            setOnline();
        }, 30000); // Every 30 seconds

        // Cleanup: set user offline and clear interval
        return () => {
            clearInterval(heartbeatInterval);

            // Set user offline when component unmounts
            axios
                .post('/presence/offline')
                .catch((error) => {
                    console.error('Failed to set user offline', error);
                });
        };
    }, []);
}
