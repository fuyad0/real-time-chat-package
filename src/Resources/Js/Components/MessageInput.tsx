import { useState } from 'react';
import { useTypingIndicator } from '../hooks/useTypingIndicator';

export default function MessageInput({ onSend, conversationId, replyingTo, onCancelReply }: any) {
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const notifyTyping = useTypingIndicator(conversationId);

    const send = () => {
        if (!text.trim() && !file) {
            return;
        }

        const payload: any = {
            text,
        };

        if (file) {
            payload.attachments = [file];
        }

        onSend(payload);

        setText('');
        setFile(null);
    };

    return (
        <div className="flex flex-col border-t bg-white">
            {replyingTo && (
                <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
                    <div className="flex-1 truncate">
                        <span className="text-xs font-semibold text-blue-600 block">Replying to {replyingTo.user?.name || 'Unknown'}</span>
                        <span className="text-sm text-gray-600 truncate">{replyingTo.body}</span>
                    </div>
                    <button 
                        onClick={onCancelReply}
                        className="ml-4 text-gray-500 hover:text-gray-700 p-1"
                        aria-label="Cancel reply"
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className="flex items-center gap-2 p-3">
                {/* FILE ATTACH */}
            <label className="cursor-pointer px-2 text-xl">
                📎
                <input
                    type="file"
                    hidden
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
            </label>

            {/* INPUT */}
            <input
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    if (e.target.value.trim()) {
                        notifyTyping();
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        send();
                    }
                }}
                className="flex-1 rounded-xl border px-4 py-2 text-sm outline-none"
                placeholder="Type a message..."
            />

            {/* SEND BUTTON */}
            <button
                onClick={send}
                disabled={!text.trim() && !file}
                className={`rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                    !text.trim() && !file
                        ? 'cursor-not-allowed bg-gray-300'
                        : 'bg-blue-600'
                }`}
            >
                Send
            </button>
        </div>
        </div>
    );
}
