import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatHeader from './Components/ChatHeader';
import ConversationList from './Components/ConversationList';
import MembersDialog from './Components/MembersDialog';
import MessageBox from './Components/MessageBox';
import MessageInput from './Components/MessageInput';
import { useRealtimeChat } from './hooks/useRealtimeChat';
import { useUserPresence } from './hooks/useUserPresence';
import { getParticipantProfile } from './utils/conversation';
import { mapMessagesChronological } from './utils/messages';

export default function ChatPage() {
    const authUser = usePage().props.auth.user;

    const [conversations, setConversations] = useState<any[]>([]);
    const [active, setActive] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [membersDialogConversation, setMembersDialogConversation] =
        useState<any | null>(null);

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

    useUserPresence();

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const res = await axios.get('/conversations');
            setConversations(res.data.data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const loadMessages = useCallback(
        async (conversationId: number) => {
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

                await axios.post(
                    `/conversations/${conversationId}/mark-as-read`,
                );
            } catch (error) {
                console.error('Failed to load messages', error);
            }
        },
        [authUser.id],
    );

    const openChat = async (conversation: any) => {
        setActive(conversation);
        await loadMessages(conversation.id);
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
    });

    const sendMessage = async (payload: any) => {
        if (!active) {
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
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
            />

            <div className="flex flex-1 flex-col">
                {active ? (
                    <ChatHeader
                        conversation={active}
                        currentUserId={authUser.id}
                        onShowMembers={() =>
                            setMembersDialogConversation(active)
                        }
                    />
                ) : null}

                <MessageBox
                    ref={messageBoxRef}
                    messages={messages}
                    conversation={active}
                    typingParticipants={typingParticipants}
                />

                <MessageInput
                    onSend={sendMessage}
                    conversationId={active?.id || null}
                />
            </div>

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
            />
        </div>
    );
}
