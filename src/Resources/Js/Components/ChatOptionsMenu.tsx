import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { getOtherMemberId } from '../utils/conversation';

export default function ChatOptionsMenu({
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
    const directOtherId =
        otherUserId ?? getOtherMemberId(conversation, currentUserId);
    const isDirect =
        conversation?.type !== 'group' &&
        (conversation?.members?.length ?? 0) <= 2;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Chat options"
                    className="cursor-pointer rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onMarkAsRead()}
                >
                    Mark conversation as read
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={onShowMembers}
                >
                    View members
                </DropdownMenuItem>
                {isDirect && directOtherId ? (
                    <>
                        <DropdownMenuSeparator />
                        {isOtherUserBlocked ? (
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => onUnblockUser(directOtherId)}
                            >
                                Unblock user
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                variant="destructive"
                                className="cursor-pointer"
                                onClick={() => onBlockUser(directOtherId)}
                            >
                                Block user
                            </DropdownMenuItem>
                        )}
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
