import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
    getConversationTitle,
    normalizeMember,
    type MemberProfile,
} from '../utils/conversation';
import OnlineStatus from './OnlineStatus';

export default function MembersDialog({
    open,
    onOpenChange,
    conversation,
    currentUserId,
    onlineUsers,
    blockedUserIds,
    onBlockUser,
    onUnblockUser,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversation: any | null;
    currentUserId: number;
    onlineUsers: Set<number>;
    blockedUserIds: Set<number>;
    onBlockUser: (userId: number) => void;
    onUnblockUser: (userId: number) => void;
}) {
    const [members, setMembers] = useState<MemberProfile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !conversation?.id) {
            return;
        }

        const loadMembers = async () => {
            setLoading(true);

            try {
                const res = await axios.get(
                    `/conversations/${conversation.id}/members`,
                );
                const list = (res.data.data ?? [])
                    .map((member: Record<string, unknown>) =>
                        normalizeMember(member),
                    )
                    .filter(Boolean) as MemberProfile[];

                setMembers(list);
            } catch (error) {
                console.error('Failed to load members', error);

                const fallback = (conversation.members ?? [])
                    .map((member: Record<string, unknown>) =>
                        normalizeMember(member),
                    )
                    .filter(Boolean) as MemberProfile[];

                setMembers(fallback);
            } finally {
                setLoading(false);
            }
        };

        loadMembers();
    }, [open, conversation?.id, conversation?.members]);

    const title = getConversationTitle(conversation, currentUserId);
    const memberCount = members.length;
    const onlineCount = members.filter((member) =>
        onlineUsers.has(member.id),
    ).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {memberCount} member{memberCount === 1 ? '' : 's'} ·{' '}
                        {onlineCount} online
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                    {loading && members.length === 0 ? (
                        <p className="text-sm text-gray-500">Loading members…</p>
                    ) : null}

                    {!loading && members.length === 0 ? (
                        <p className="text-sm text-gray-500">No members found.</p>
                    ) : null}

                    {members.map((member) => {
                        const isOnline = onlineUsers.has(member.id);
                        const isYou = member.id === currentUserId;
                        const isBlocked = blockedUserIds.has(member.id);

                        return (
                            <div
                                key={member.id}
                                className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3"
                            >
                                <div className="relative shrink-0">
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="h-11 w-11 rounded-full object-cover"
                                    />
                                    <div className="absolute -right-0.5 -bottom-0.5 rounded-full bg-white p-0.5">
                                        <OnlineStatus
                                            isOnline={isOnline}
                                            size="sm"
                                        />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate font-medium text-gray-900">
                                            {member.name}
                                            {isYou ? ' (You)' : ''}
                                        </p>
                                        {member.isAdmin ? (
                                            <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                                Admin
                                            </span>
                                        ) : null}
                                        {isBlocked ? (
                                            <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                                                Blocked
                                            </span>
                                        ) : null}
                                    </div>
                                    {member.email ? (
                                        <p className="truncate text-xs text-gray-500">
                                            {member.email}
                                        </p>
                                    ) : null}
                                    <p
                                        className={`text-xs font-medium ${
                                            isOnline
                                                ? 'text-green-600'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        {isOnline ? 'Active now' : 'Offline'}
                                    </p>
                                </div>

                                {!isYou ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            isBlocked
                                                ? onUnblockUser(member.id)
                                                : onBlockUser(member.id)
                                        }
                                        className={`shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-medium ${
                                            isBlocked
                                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                    >
                                        {isBlocked ? 'Unblock' : 'Block'}
                                    </button>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
