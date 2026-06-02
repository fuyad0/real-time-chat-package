import OnlineStatus from './OnlineStatus';
import ConversationMenuButton from './ConversationMenuButton';
import { getMemberId, getOtherMemberId } from '../utils/conversation';
import ConversationActions from './ChatOptionsMenu';


function SidebarTypingDots() {
    return (
        <span className="inline-flex gap-0.5 align-middle">
            <span
                className="inline-block h-1 w-1 animate-bounce rounded-full bg-blue-500"
                style={{ animationDelay: '0ms' }}
            />
            <span
                className="inline-block h-1 w-1 animate-bounce rounded-full bg-blue-500"
                style={{ animationDelay: '150ms' }}
            />
            <span
                className="inline-block h-1 w-1 animate-bounce rounded-full bg-blue-500"
                style={{ animationDelay: '300ms' }}
            />
        </span>
    );
}

export default function ConversationList({
    conversations,
    active,
    currentUserId,
    onSelect,
    onShowMembers,
    onMarkAsRead,
    onBlockUser,
    onUnblockUser,
    onlineUsers = new Set<number>(),
    typingUsers = new Set<number>(),
}: {
    conversations: any[];
    active: any;
    currentUserId: number;
    onSelect: (conversation: any) => void;
    onShowMembers: (conversation: any) => void;
    onMarkAsRead: (conversation: any) => void;
    onBlockUser: (userId: number) => void;
    onUnblockUser: (userId: number) => void;
    onlineUsers?: Set<number>;
    typingUsers?: Set<number>;
}) {
    return (
        <div className="w-80 overflow-y-auto border-r bg-white">
            <div className="border-b p-4 font-bold">Conversations</div>

            {conversations.map((c: any) => {
                const otherMemberId = getOtherMemberId(c, currentUserId);
                const otherMember = c.members?.find(
                    (member: any) => getMemberId(member) === otherMemberId,
                );

                const avatar =
                    c.avatar_path ||
                    otherMember?.avatar ||
                    otherMember?.user?.avatar ||
                    null;

                const name =
                    c.name ||
                    otherMember?.name ||
                    otherMember?.user?.name ||
                    'Chat';

                const initials = name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                const isGroupChat =
                    c.type === 'group' ||
                    (c.members && c.members.length > 2);

                const memberIds = (c.members ?? [])
                    .map((m: any) => getMemberId(m))
                    .filter(Boolean) as number[];

                const isTyping =
                    active?.id === c.id &&
                    Array.from(typingUsers).some(
                        (userId) =>
                            userId !== currentUserId &&
                            memberIds.includes(userId),
                    );

                return (
                    <div
                        key={c.id}
                        onClick={() => onSelect(c)}
                        className={`flex cursor-pointer items-center gap-3 p-4 hover:bg-gray-100 ${active?.id === c.id ? 'bg-gray-200' : ''
                            }`}
                    >
                        <div className="relative">
                            {avatar ? (
                                <img
                                    src={avatar}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
                                    {initials}
                                </div>
                            )}
                            <div className="absolute right-0 bottom-0">
                                {!isGroupChat && otherMemberId ? (
                                    <OnlineStatus
                                        isOnline={onlineUsers.has(
                                            otherMemberId,
                                        )}
                                        size="sm"
                                    />
                                ) : (
                                    <OnlineStatus
                                        isOnline={memberIds.some((userId) =>
                                            onlineUsers.has(userId),
                                        )}
                                        size="sm"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 font-semibold">
                                <span className="truncate">{name}</span>
                                {!isGroupChat && otherMemberId ? (
                                    <span
                                        className={`text-xs font-normal ${onlineUsers.has(otherMemberId)
                                                ? 'text-green-600'
                                                : 'text-gray-400'
                                            }`}
                                    >
                                        ●
                                    </span>
                                ) : (
                                    <span className="text-xs font-normal text-green-600">
                                        (
                                        {
                                            memberIds.filter((userId) =>
                                                onlineUsers.has(userId),
                                            ).length
                                        }
                                        /{c.members?.length || 0})
                                    </span>
                                )}
                            </div>

                            <div className="truncate text-sm">
                                {isTyping ? (
                                    <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                                        typing...
                                        <SidebarTypingDots />
                                    </span>
                                ) : (
                                    <span className="text-gray-500">
                                        {c.last_message?.body ||
                                            'No messages yet'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <ConversationActions
                            isDirect={!isGroupChat}
                            directOtherId={otherMemberId}
                            isOtherUserBlocked={false} // pass real value later if available here
                            onMarkAsRead={() => onMarkAsRead(c)}
                            onShowMembers={() => onShowMembers(c)}
                            onBlockUser={(id) => onBlockUser(id)}
                            onUnblockUser={(id) => onUnblockUser(id)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
