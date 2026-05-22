import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { QUICK_REACTIONS } from './MessageReactions';

export default function MessageActionsMenu({
    isOwnMessage,
    onUnsend,
    onReact,
}: {
    isOwnMessage: boolean;
    onUnsend: () => void;
    onReact: (emoji: string) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Message options"
                    className="cursor-pointer rounded-full p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                    React
                </div>
                <div className="flex flex-wrap gap-1 px-2 pb-2">
                    {QUICK_REACTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            className="cursor-pointer rounded-md px-2 py-1 text-base hover:bg-gray-100"
                            onClick={() => onReact(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                {isOwnMessage ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={onUnsend}
                        >
                            Unsend message
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
