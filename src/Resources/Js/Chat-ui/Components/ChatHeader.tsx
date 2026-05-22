import { getConversationTitle } from '../utils/conversation';
import ConversationMenuButton from './ConversationMenuButton';

export default function ChatHeader({
    conversation,
    currentUserId,
    onShowMembers,
}: {
    conversation: any;
    currentUserId: number;
    onShowMembers: () => void;
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
                </p>
            </div>

            <ConversationMenuButton
                label="View conversation members"
                onClick={(event) => {
                    event.stopPropagation();
                    onShowMembers();
                }}
            />
        </div>
    );
}
