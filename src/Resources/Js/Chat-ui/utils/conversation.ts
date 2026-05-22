export function getMemberId(member: {
    id?: number;
    user_id?: number;
    user?: { id?: number };
}): number | undefined {
    return member.id ?? member.user_id ?? member.user?.id;
}

export function getOtherMember(
    conversation: { members?: Array<Record<string, unknown>> } | null,
    currentUserId: number,
) {
    if (!conversation?.members?.length) {
        return null;
    }

    return (
        conversation.members.find((member) => {
            const id = getMemberId(member as Parameters<typeof getMemberId>[0]);
            return id !== undefined && id !== currentUserId;
        }) ?? null
    );
}

export function getOtherMemberId(
    conversation: { members?: Array<Record<string, unknown>> } | null,
    currentUserId: number,
): number | undefined {
    const member = getOtherMember(conversation, currentUserId);
    return member
        ? getMemberId(member as Parameters<typeof getMemberId>[0])
        : undefined;
}

export type TypingParticipant = {
    id: number;
    name: string;
    avatar: string;
};

export function getParticipantProfile(
    conversation: { members?: Array<Record<string, unknown>> } | null,
    userId: number,
    messages: Array<{ user_id?: number; user?: { name?: string; avatar?: string } }> = [],
): TypingParticipant {
    const member = conversation?.members?.find((m) => {
        return getMemberId(m as Parameters<typeof getMemberId>[0]) === userId;
    }) as
        | {
              name?: string;
              avatar?: string;
              user?: { name?: string; avatar?: string };
          }
        | undefined;

    const fromMessage = messages.find((m) => m.user_id === userId)?.user;

    const name =
        member?.name ?? member?.user?.name ?? fromMessage?.name ?? 'Someone';

    const avatar =
        member?.avatar ??
        member?.user?.avatar ??
        fromMessage?.avatar ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;

    return { id: userId, name, avatar };
}

export type MemberProfile = {
    id: number;
    name: string;
    email: string;
    avatar: string;
    isAdmin: boolean;
};

export function normalizeMember(member: Record<string, unknown>): MemberProfile | null {
    const id = getMemberId(member as Parameters<typeof getMemberId>[0]);

    if (id === undefined) {
        return null;
    }

    const record = member as {
        name?: string;
        email?: string;
        avatar?: string;
        user?: { name?: string; email?: string; avatar?: string };
        pivot?: { is_admin?: boolean };
    };

    const name = record.name ?? record.user?.name ?? 'Unknown';
    const email = record.email ?? record.user?.email ?? '';

    return {
        id,
        name,
        email,
        avatar:
            record.avatar ??
            record.user?.avatar ??
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
        isAdmin: Boolean(record.pivot?.is_admin),
    };
}

export function getConversationTitle(
    conversation: {
        name?: string;
        type?: string;
        members?: Array<Record<string, unknown>>;
    } | null,
    currentUserId: number,
): string {
    if (!conversation) {
        return 'Chat';
    }

    if (conversation.name) {
        return conversation.name;
    }

    const isGroup =
        conversation.type === 'group' ||
        (conversation.members && conversation.members.length > 2);

    if (isGroup) {
        return 'Group chat';
    }

    const other = getOtherMember(conversation, currentUserId) as {
        name?: string;
        user?: { name?: string };
    } | null;

    return other?.name ?? other?.user?.name ?? 'Chat';
}

export function formatTypingLabel(names: string[]): string {
    if (names.length === 0) {
        return '';
    }

    if (names.length === 1) {
        return `${names[0]} is typing`;
    }

    if (names.length === 2) {
        return `${names[0]} and ${names[1]} are typing`;
    }

    const last = names[names.length - 1];
    const rest = names.slice(0, -1).join(', ');

    return `${rest}, and ${last} are typing`;
}
