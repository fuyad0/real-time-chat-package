const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export { QUICK_REACTIONS };

export default function MessageReactions({
    reactions = [],
    currentUserId,
    onToggle,
}: {
    reactions: Array<{ user_id: number; reaction: string }>;
    currentUserId: number;
    onToggle: (emoji: string) => void;
}) {
    if (!reactions.length) {
        return null;
    }

    const grouped = reactions.reduce<
        Record<string, { count: number; mine: boolean }>
    >((acc, item) => {
        const key = item.reaction;
        if (!acc[key]) {
            acc[key] = { count: 0, mine: false };
        }
        acc[key].count += 1;
        if (item.user_id === currentUserId) {
            acc[key].mine = true;
        }
        return acc;
    }, {});

    return (
        <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(grouped).map(([emoji, meta]) => (
                <button
                    key={emoji}
                    type="button"
                    onClick={() => onToggle(emoji)}
                    className={`cursor-pointer rounded-full border px-2 py-0.5 text-xs transition-colors ${
                        meta.mine
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    {emoji} {meta.count}
                </button>
            ))}
        </div>
    );
}
