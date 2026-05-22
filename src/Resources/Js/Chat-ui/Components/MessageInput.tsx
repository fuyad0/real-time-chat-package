import { useState } from 'react';
import { useTypingIndicator } from '../hooks/useTypingIndicator';

export default function MessageInput({ onSend, conversationId }: any) {
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
        <div className="flex items-center gap-2 border-t bg-white p-3">
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
    );
}
