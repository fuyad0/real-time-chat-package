import { useEcho } from '@laravel/echo-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface RealtimeChatConfig {
    conversationId?: number;
    userId: number;
    enabled?: boolean;
    onMessageReceived?: (message: unknown) => void;
    onMessageDelivered?: (payload: {
        messageId: number;
        conversationId: number;
    }) => void;
    onMessageRead?: (payload: {
        messageIds: number[];
        userId: number;
        conversationId: number;
    }) => void;
    onMessageDeleted?: (payload: {
        messageId: number;
        conversationId: number;
    }) => void;
    onMessageReactionAdded?: (payload: {
        messageId: number;
        conversationId: number;
        userId: number;
        reaction: string;
    }) => void;
    onUserTyping?: (userId: number) => void;
    onUserStoppedTyping?: (userId: number) => void;
    onUserOnline?: (userId: number) => void;
    onUserOffline?: (userId: number) => void;
}

function normalizeUserId(value: unknown): number {
    return Number(value);
}

export function useRealtimeChat(config: RealtimeChatConfig) {
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
    const typingTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
        new Map(),
    );

    const isActive =
        config.enabled !== false &&
        !!config.conversationId &&
        config.conversationId > 0;

    const conversationChannel = isActive
        ? `conversation.${config.conversationId}`
        : '';

    useEffect(() => {
        setTypingUsers(new Set());
        typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        typingTimeoutsRef.current.clear();
    }, [config.conversationId]);

    const clearTypingForUser = useCallback((userId: number) => {
        const existing = typingTimeoutsRef.current.get(userId);
        if (existing) {
            clearTimeout(existing);
        }

        setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
        });
        config.onUserStoppedTyping?.(userId);
        typingTimeoutsRef.current.delete(userId);
    }, [config.onUserStoppedTyping]);

    const handleTyping = useCallback(
        (event: { userId: unknown }) => {
            const userId = normalizeUserId(event.userId);

            if (userId === config.userId || Number.isNaN(userId)) {
                return;
            }

            setTypingUsers((prev) => new Set(prev).add(userId));
            config.onUserTyping?.(userId);

            const existing = typingTimeoutsRef.current.get(userId);
            if (existing) {
                clearTimeout(existing);
            }

            const timeout = setTimeout(() => {
                clearTypingForUser(userId);
            }, 3000);

            typingTimeoutsRef.current.set(userId, timeout);
        },
        [clearTypingForUser, config.onUserTyping, config.userId],
    );

    useEcho(
        conversationChannel,
        '.message:received',
        (event: { message: unknown }) => {
            config.onMessageReceived?.(event.message);
        },
        [config.conversationId, isActive, config.onMessageReceived],
        'private',
    );

    useEcho(
        conversationChannel,
        '.message:delivered',
        (event: { messageId: unknown; conversationId: unknown }) => {
            config.onMessageDelivered?.({
                messageId: Number(event.messageId),
                conversationId: Number(event.conversationId),
            });
        },
        [config.conversationId, isActive, config.onMessageDelivered],
        'private',
    );

    useEcho(
        conversationChannel,
        '.message:read',
        (event: {
            messageIds: unknown;
            userId: unknown;
            conversationId: unknown;
        }) => {
            const messageIds = Array.isArray(event.messageIds)
                ? event.messageIds.map((id) => Number(id))
                : [];

            config.onMessageRead?.({
                messageIds,
                userId: Number(event.userId),
                conversationId: Number(event.conversationId),
            });
        },
        [config.conversationId, isActive, config.onMessageRead],
        'private',
    );

    useEcho(
        conversationChannel,
        '.user:typing',
        handleTyping,
        [config.conversationId, config.userId, isActive, handleTyping],
        'private',
    );

    useEcho(
        conversationChannel,
        '.message:updated',
        (event: { message: unknown }) => {
            config.onMessageReceived?.(event.message);
        },
        [config.conversationId, isActive, config.onMessageReceived],
        'private',
    );

    useEcho(
        conversationChannel,
        '.message:deleted',
        (event: { messageId: unknown; conversationId: unknown }) => {
            config.onMessageDeleted?.({
                messageId: Number(event.messageId),
                conversationId: Number(event.conversationId),
            });
        },
        [config.conversationId, isActive, config.onMessageDeleted],
        'private',
    );

    useEcho(
        conversationChannel,
        '.message:reaction:added',
        (event: {
            messageId: unknown;
            conversationId: unknown;
            userId: unknown;
            reaction: unknown;
        }) => {
            config.onMessageReactionAdded?.({
                messageId: Number(event.messageId),
                conversationId: Number(event.conversationId),
                userId: Number(event.userId),
                reaction: String(event.reaction),
            });
        },
        [config.conversationId, isActive, config.onMessageReactionAdded],
        'private',
    );

    useEcho(
        'chat.presence',
        '.user:online',
        (event: { userId: unknown }) => {
            const userId = normalizeUserId(event.userId);
            setOnlineUsers((prev) => new Set(prev).add(userId));
            config.onUserOnline?.(userId);
        },
        [config.onUserOnline],
        'private',
    );

    useEcho(
        'chat.presence',
        '.user:offline',
        (event: { userId: unknown }) => {
            const userId = normalizeUserId(event.userId);
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
            config.onUserOffline?.(userId);
        },
        [config.onUserOffline],
        'private',
    );

    return {
        typingUsers,
        onlineUsers,
    };
}
