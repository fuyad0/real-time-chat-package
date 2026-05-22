/**
 * API returns messages newest-first; reverse for chronological chat display (oldest at top).
 */
export function mapMessagesChronological(
    apiMessages: any[],
    authUserId: number,
    previousMessages: any[] = [],
): any[] {
    const deliveredIds = new Set(
        previousMessages
            .filter(
                (message) =>
                    message.user_id === authUserId && message.is_delivered,
            )
            .map((message) => message.id),
    );

    return [...apiMessages].reverse().map((message) => {
        if (message.user_id !== authUserId) {
            return message;
        }

        const readByOthers = (message.read_receipts ?? []).some(
            (receipt: { user_id: number }) => receipt.user_id !== authUserId,
        );

        return {
            ...message,
            is_delivered: readByOthers || deliveredIds.has(message.id),
        };
    });
}
