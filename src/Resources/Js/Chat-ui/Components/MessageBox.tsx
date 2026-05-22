import { usePage } from '@inertiajs/react';
import { forwardRef } from 'react';
import type { TypingParticipant } from '../utils/conversation';
import MessageStatus from './MessageStatus';
import TypingIndicator from './TypingIndicator';

const MessageBox = forwardRef(
    (
        {
            messages,
            conversation,
            typingParticipants = [],
        }: {
            messages: any[];
            conversation: any;
            typingParticipants?: TypingParticipant[];
        },
        ref: any,
    ) => {
        const authUser = usePage().props.auth.user;

        return (
            <div ref={ref} className="flex-1 overflow-y-auto bg-gray-50 p-4">
                {conversation ? (
                    <div className="space-y-4">
                        {messages.map((m: any) => {
                            const isMe = m.user_id === authUser.id;
                            const attachments = m.attachments || [];

                            return (
                                <div
                                    key={m.id}
                                    className={`flex items-end gap-2 ${
                                        isMe ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {!isMe && (
                                        <img
                                            src={
                                                m.user?.avatar ||
                                                `https://ui-avatars.com/api/?name=${m.user?.name}`
                                            }
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    )}

                                    <div className="max-w-[70%]">
                                        <div
                                            className={`mb-1 text-[11px] ${
                                                isMe
                                                    ? 'text-right text-blue-400'
                                                    : 'text-left text-gray-500'
                                            }`}
                                        >
                                            {m.user?.name}
                                        </div>

                                        <div
                                            className={`rounded-2xl px-4 py-2 text-sm wrap-break-word shadow-sm ${
                                                isMe
                                                    ? 'rounded-br-sm bg-blue-600 text-white'
                                                    : 'rounded-bl-sm border bg-white text-gray-800'
                                            }`}
                                        >
                                            {m.body}
                                        </div>

                                        <div className="mt-2 space-y-2">
                                            {attachments.length > 0
                                                ? attachments.map(
                                                      (
                                                          file: any,
                                                          i: number,
                                                      ) => {
                                                          const type =
                                                              file.type ||
                                                              file.file_type ||
                                                              '';
                                                          const url =
                                                              file.file_path;

                                                          if (
                                                              type.startsWith(
                                                                  'image',
                                                              )
                                                          ) {
                                                              return (
                                                                  <img
                                                                      key={i}
                                                                      src={
                                                                          url
                                                                      }
                                                                      className="max-h-64 w-full rounded-lg border object-cover"
                                                                  />
                                                              );
                                                          }

                                                          if (
                                                              type ===
                                                              'application/pdf'
                                                          ) {
                                                              return (
                                                                  <a
                                                                      key={i}
                                                                      href={
                                                                          url
                                                                      }
                                                                      target="_blank"
                                                                      className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600"
                                                                  >
                                                                      📄 PDF
                                                                      Document
                                                                  </a>
                                                              );
                                                          }

                                                          return (
                                                              <a
                                                                  key={i}
                                                                  href={url}
                                                                  target="_blank"
                                                                  className="flex items-center gap-2 rounded-lg border bg-gray-100 p-2 text-xs"
                                                              >
                                                                  📎 Download
                                                                  File
                                                              </a>
                                                          );
                                                      },
                                                  )
                                                : null}
                                        </div>
                                    </div>

                                    <div className="mt-1 flex items-end gap-1">
                                        <MessageStatus
                                            message={m}
                                            currentUserId={authUser.id}
                                        />
                                    </div>

                                    {isMe && (
                                        <img
                                            src={
                                                m.user?.avatar ||
                                                `https://ui-avatars.com/api/?name=${m.user?.name}`
                                            }
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    )}
                                </div>
                            );
                        })}

                        {typingParticipants.length > 0 && (
                            <div className="mt-2 space-y-3">
                                {typingParticipants.map((participant) => (
                                    <TypingIndicator
                                        key={participant.id}
                                        participant={participant}
                                    />
                                ))}
                            </div>
                        )}

                        <div aria-hidden className="h-px shrink-0" />
                    </div>
                ) : (
                    <div className="mt-20 text-center text-gray-400">
                        Select a conversation
                    </div>
                )}
            </div>
        );
    },
);

MessageBox.displayName = 'MessageBox';

export default MessageBox;
