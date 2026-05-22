import type { TypingParticipant } from '../utils/conversation';

function TypingDots() {
    return (
        <div className="flex gap-1 py-1">
            <span
                className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: '0ms' }}
            />
            <span
                className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: '150ms' }}
            />
            <span
                className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: '300ms' }}
            />
        </div>
    );
}

/**
 * Typing row in the message area — avatar, name, and animated dots
 */
export default function TypingIndicator({ participant }: { participant: TypingParticipant }) {
    return (
        <div className="flex items-end gap-2 justify-start">
            <img
                src={participant.avatar}
                alt={participant.name}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
            />

            <div className="max-w-[70%]">
                <div className="mb-1 text-left text-[11px] text-gray-500">
                    {participant.name}
                </div>

                <div className="rounded-2xl rounded-bl-sm border bg-white px-4 py-2 shadow-sm">
                    <TypingDots />
                </div>
            </div>
        </div>
    );
}
