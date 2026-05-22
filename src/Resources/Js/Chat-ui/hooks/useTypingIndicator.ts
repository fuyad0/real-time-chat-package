import axios from 'axios';
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to emit typing indicators to the server
 * Automatically throttles typing events to avoid spamming the server
 */
export function useTypingIndicator(conversationId: number | null) {
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const emitTyping = useCallback(async () => {
        if (!conversationId) return;

        try {
            await axios.post('/presence/typing', {
                conversation_id: conversationId,
            });
        } catch (error) {
            console.error('Failed to emit typing indicator', error);
        }
    }, [conversationId]);

    const notifyTyping = useCallback(() => {
        if (typingTimeoutRef.current) {
            return;
        }

        emitTyping();

        typingTimeoutRef.current = setTimeout(() => {
            typingTimeoutRef.current = null;
        }, 2000);
    }, [emitTyping]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return notifyTyping;
}
