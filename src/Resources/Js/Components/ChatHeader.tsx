import { getConversationTitle } from '../utils/conversation';
import ChatOptionsMenu from './ChatOptionsMenu';

export default function ChatHeader({
    conversation,
    currentUserId,
    otherUserId,
    isOtherUserBlocked,
    onMarkAsRead,
    onShowMembers,
    onBlockUser,
    onUnblockUser,
}: {
    conversation: any;
    currentUserId: number;
    otherUserId?: number;
    isOtherUserBlocked: boolean;
    onMarkAsRead: () => void;
    onShowMembers: () => void;
    onBlockUser: (userId: number) => void;
    onUnblockUser: (userId: number) => void;
}) {
    const title = getConversationTitle(conversation, currentUserId);
    const memberCount = conversation.members?.length ?? 0;

    return (
        <div className="flex items-center justify-between border-b bg-white px-4 py-3">
            <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-gray-900">
                    {title}
                </h2>
                <p className="text-xs text-gray-500">
                    {memberCount} member{memberCount === 1 ? '' : 's'}
                    {isOtherUserBlocked ? ' · User blocked' : ''}
                </p>
            </div>

            <ChatOptionsMenu
                conversation={conversation}
                currentUserId={currentUserId}
                otherUserId={otherUserId}
                isOtherUserBlocked={isOtherUserBlocked}
                onMarkAsRead={onMarkAsRead}
                onShowMembers={onShowMembers}
                onBlockUser={onBlockUser}
                onUnblockUser={onUnblockUser}
            />
        </div>
    );
}
