import { MoreVertical } from 'lucide-react';

export default function ConversationMenuButton({
    onClick,
    label = 'Conversation options',
}: {
    onClick: (event: React.MouseEvent) => void;
    label?: string;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="cursor-pointer rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
        >
            <MoreVertical className="h-5 w-5" />
        </button>
    );
}
