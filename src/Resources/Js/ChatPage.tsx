import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import ChatHeader from './Components/ChatHeader';
import ConversationList from './Components/ConversationList';
import MembersDialog from './Components/MembersDialog';
import MessageBox from './Components/MessageBox';
import MessageInput from './Components/MessageInput';
import { useRealtimeChat } from './hooks/useRealtimeChat';
import { useUserPresence } from './hooks/useUserPresence';
import { getOtherMemberId, getParticipantProfile } from './utils/conversation';
import { mapMessagesChronological } from './utils/messages';

export default function ChatPage() {
    const authUser = usePage().props.auth.user;

    const [conversations, setConversations] = useState<any[]>([]);
    const [active, setActive] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [blockedUserIds, setBlockedUserIds] = useState<Set<number>>(
        new Set(),
    );
    const [membersDialogConversation, setMembersDialogConversation] =
        useState<any | null>(null);
    const [actionNotice, setActionNotice] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const [userToBlock, setUserToBlock] = useState<number | null>(null);
    const [messageToUnsend, setMessageToUnsend] = useState<number | null>(null);

    const messageBoxRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback((smooth = false) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const el = messageBoxRef.current;
                if (!el) {
                    return;
                }

                el.scrollTo({
                    top: el.scrollHeight,
                    behavior: smooth ? 'smooth' : 'instant',
                });
            });
        });
    }, []);

    const showNotice = (text: string) => {
        setActionNotice(text);
        setTimeout(() => setActionNotice(null), 2500);
    };

    useUserPresence();

    useEffect(() => {
        loadConversations();
        loadBlockedUsers();
    }, []);

    const loadBlockedUsers = async () => {
        try {
            const res = await axios.get('/users/blocked');
            const ids = (res.data.data ?? []).map(
                (row: { blocked_user_id?: number; blocked_user?: { id?: number } }) =>
                    row.blocked_user_id ?? row.blocked_user?.id,
            );
            setBlockedUserIds(new Set(ids.filter(Boolean)));
        } catch (error) {
            console.error('Failed to load blocked users', error);
        }
    };

    const loadConversations = async () => {
        try {
            const res = await axios.get('/conversations');
            setConversations(res.data.data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const loadMessages = useCallback(
        async (conversationId: number, markRead = false) => {
            try {
                const res = await axios.get(
                    `/conversations/${conversationId}/messages`,
                );

                setMessages((prev) =>
                    mapMessagesChronological(
                        res.data.data,
                        authUser.id,
                        prev,
                    ),
                );

                if (markRead) {
                    await axios.post(
                        `/conversations/${conversationId}/mark-as-read`,
                    );
                    await loadConversations();
                }
            } catch (error) {
                console.error('Failed to load messages', error);
            }
        },
        [authUser.id],
    );

    const openChat = async (conversation: any) => {
        setActive(conversation);
        await loadMessages(conversation.id, true);
    };

    const markConversationAsRead = async (id?: number) => {
        const targetId = id || active?.id;
        if (!targetId) {
            return;
        }

        try {
            await axios.post(
                `/conversations/${targetId}/mark-as-read`,
            );
            await loadConversations();
            showNotice('Conversation marked as read');
        } catch (error) {
            console.error('Failed to mark conversation as read', error);
        }
    };

    const unsendMessage = async (messageId: number) => {
        setMessageToUnsend(messageId);
    };

    const confirmUnsendMessage = async () => {
        if (!messageToUnsend) return;

        try {
            await axios.delete(`/messages/${messageToUnsend}`);
            setMessages((prev) => prev.filter((m) => m.id !== messageToUnsend));
            showNotice('Message unsent');
        } catch (error) {
            console.error('Failed to unsend message', error);
        } finally {
            setMessageToUnsend(null);
        }
    };

    const toggleReaction = async (messageId: number, emoji: string) => {
        const message = messages.find((m) => m.id === messageId);
        if (!message) {
            return;
        }

        const reactions: Array<{ user_id: number; reaction: string }> =
            message.reactions ?? [];
        const mine = reactions.find(
            (r) => String(r.user_id) === String(authUser.id) && r.reaction === emoji,
        );

        try {
            if (mine) {
                await axios.delete(
                    `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
                );
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === messageId
                            ? {
                                  ...m,
                                  reactions: (m.reactions ?? []).filter(
                                      (r: { user_id: number; reaction: string }) =>
                                          !(
                                              String(r.user_id) === String(authUser.id) &&
                                              r.reaction === emoji
                                          ),
                                  ),
                              }
                            : m,
                    ),
                );
            } else {
                await axios.post(`/messages/${messageId}/reactions`, {
                    reaction: emoji,
                });
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m.id !== messageId) return m;
                        
                        const hasReacted = (m.reactions ?? []).some(
                            (r: any) => String(r.user_id) === String(authUser.id) && r.reaction === emoji
                        );
                        
                        if (hasReacted) return m;

                        return {
                            ...m,
                            reactions: [
                                ...(m.reactions ?? []),
                                {
                                    user_id: authUser.id,
                                    reaction: emoji,
                                },
                            ],
                        };
                    })
                );
            }
        } catch (error) {
            console.error('Failed to toggle reaction', error);
        }
    };

    const blockUser = async (userId: number) => {
        setUserToBlock(userId);
    };

    const confirmBlockUser = async () => {
        if (!userToBlock) return;

        try {
            await axios.post(`/users/${userToBlock}/block`);
            setBlockedUserIds((prev) => new Set(prev).add(userToBlock));
            showNotice('User blocked');
        } catch (error) {
            console.error('Failed to block user', error);
        } finally {
            setUserToBlock(null);
        }
    };

    const unblockUser = async (userId: number) => {
        try {
            await axios.delete(`/users/${userId}/block`);
            setBlockedUserIds((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
            showNotice('User unblocked');
        } catch (error) {
            console.error('Failed to unblock user', error);
        }
    };

    const markMessageDelivered = useCallback((messageId: number) => {
        setMessages((prev) =>
            prev.map((message) =>
                message.id === messageId
                    ? { ...message, is_delivered: true }
                    : message,
            ),
        );
    }, []);

    const markMessagesRead = useCallback(
        (messageIds: number[], readerId: number) => {
            if (readerId === authUser.id) {
                return;
            }

            setMessages((prev) =>
                prev.map((message) => {
                    if (!messageIds.includes(message.id)) {
                        return message;
                    }

                    const receipts = message.read_receipts ?? [];
                    const alreadyRead = receipts.some(
                        (receipt: any) => receipt.user_id === readerId,
                    );

                    if (alreadyRead) {
                        return message;
                    }

                    return {
                        ...message,
                        read_receipts: [
                            ...receipts,
                            {
                                user_id: readerId,
                                read_at: new Date().toISOString(),
                            },
                        ],
                    };
                }),
            );
        },
        [authUser.id],
    );

    const appendReaction = useCallback(
        (messageId: number, userId: number, reaction: string) => {
            setMessages((prev) =>
                prev.map((message) => {
                    if (message.id !== messageId) {
                        return message;
                    }

                    const reactions = message.reactions ?? [];
                    const exists = reactions.some(
                        (r: { user_id: number; reaction: string }) =>
                            String(r.user_id) === String(userId) && r.reaction === reaction,
                    );

                    if (exists) {
                        return message;
                    }

                    return {
                        ...message,
                        reactions: [...reactions, { user_id: userId, reaction }],
                    };
                }),
            );
        },
        [],
    );

    const { typingUsers, onlineUsers } = useRealtimeChat({
        conversationId: active?.id,
        userId: authUser.id,
        enabled: !!active?.id,
        onMessageReceived: () => {
            if (active?.id) {
                loadMessages(active.id);
            }
        },
        onMessageDelivered: ({ messageId }) => {
            markMessageDelivered(messageId);
        },
        onMessageRead: ({ messageIds, userId }) => {
            markMessagesRead(messageIds, userId);
        },
        onMessageDeleted: ({ messageId }) => {
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
        },
        onMessageReactionAdded: ({ messageId, userId, reaction }) => {
            appendReaction(messageId, userId, reaction);
        },
    });

    const sendMessage = async (payload: any) => {
        if (!active) {
            return;
        }

        const otherId = getOtherMemberId(active, authUser.id);
        if (otherId && blockedUserIds.has(otherId)) {
            showNotice('Unblock this user to send messages');
            return;
        }

        try {
            const form = new FormData();
            form.append('message', payload.text || '');

            if (payload.attachments?.length) {
                payload.attachments.forEach((file: File) => {
                    form.append('attachments[]', file);
                });
            }

            if (replyingTo) {
                form.append('reply_to_id', replyingTo.id);
            }

            const res = await axios.post(
                `/conversations/${active.id}/messages`,
                form,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            const sent = res.data.data;
            setMessages((prev) => [...prev, { ...sent, is_delivered: false }]);
            setReplyingTo(null);
            scrollToBottom(true);
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const typingParticipants = Array.from(typingUsers)
        .filter((userId) => userId !== authUser.id)
        .map((userId) =>
            getParticipantProfile(active, userId, messages),
        );

    const activeOtherUserId = active
        ? getOtherMemberId(active, authUser.id)
        : undefined;
    const isActiveUserBlocked =
        activeOtherUserId !== undefined &&
        blockedUserIds.has(activeOtherUserId);

    useEffect(() => {
        if (!active?.id || messages.length === 0) {
            return;
        }

        scrollToBottom(typingParticipants.length > 0);
    }, [
        messages,
        active?.id,
        typingParticipants.length,
        scrollToBottom,
    ]);

    return (
        <div className="flex h-screen max-h-[90vh] bg-gray-100">
            <ConversationList
                conversations={conversations}
                active={active}
                currentUserId={authUser.id}
                onSelect={openChat}
                onShowMembers={(conversation) =>
                    setMembersDialogConversation(conversation)
                }
                onMarkAsRead={(c) => markConversationAsRead(c.id)}
                onBlockUser={blockUser}
                onUnblockUser={unblockUser}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
            />

            <div className="relative flex flex-1 flex-col">
                {actionNotice ? (
                    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-gray-900/95 px-5 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-5">
                        {actionNotice}
                    </div>
                ) : null}

                {active ? (
                    <ChatHeader
                        conversation={active}
                        currentUserId={authUser.id}
                        otherUserId={activeOtherUserId}
                        isOtherUserBlocked={isActiveUserBlocked}
                        onMarkAsRead={markConversationAsRead}
                        onShowMembers={() =>
                            setMembersDialogConversation(active)
                        }
                        onBlockUser={blockUser}
                        onUnblockUser={unblockUser}
                    />
                ) : null}

                <MessageBox
                    ref={messageBoxRef}
                    messages={messages}
                    conversation={active}
                    typingParticipants={typingParticipants}
                    onUnsendMessage={unsendMessage}
                    onToggleReaction={toggleReaction}
                    onReply={setReplyingTo}
                />

                {isActiveUserBlocked ? (
                    <div className="border-t bg-red-50 px-4 py-2 text-center text-sm text-red-600">
                        You blocked this user. Unblock them from the menu to
                        send messages.
                    </div>
                ) : (
                    <MessageInput
                        onSend={sendMessage}
                        conversationId={active?.id || null}
                        replyingTo={replyingTo}
                        onCancelReply={() => setReplyingTo(null)}
                    />
                )}
            </div>

            <Dialog open={userToBlock !== null} onOpenChange={(open) => !open && setUserToBlock(null)}>
                <DialogContent className="sm:max-w-sm rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Block this user?</DialogTitle>
                        <DialogDescription className="mt-2 text-sm">
                            They will no longer be able to send you messages or interact with you in chat. You can unblock them at any time.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <button
                            onClick={() => setUserToBlock(null)}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmBlockUser}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            Block User
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={messageToUnsend !== null} onOpenChange={(open) => !open && setMessageToUnsend(null)}>
                <DialogContent className="sm:max-w-sm rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Unsend Message?</DialogTitle>
                        <DialogDescription className="mt-2 text-sm">
                            This message will be permanently removed for everyone in the chat.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 sm:justify-end gap-2">
                        <button
                            onClick={() => setMessageToUnsend(null)}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmUnsendMessage}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            Unsend
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <MembersDialog
                open={!!membersDialogConversation}
                onOpenChange={(open) => {
                    if (!open) {
                        setMembersDialogConversation(null);
                    }
                }}
                conversation={membersDialogConversation}
                currentUserId={authUser.id}
                onlineUsers={onlineUsers}
                blockedUserIds={blockedUserIds}
                onBlockUser={blockUser}
                onUnblockUser={unblockUser}
            />
        </div>
    );
}
