/**
 * Message Status Component
 * Shows icons for sent, delivered, and seen status
 */
export default function MessageStatus({ message, currentUserId }: any) {
    if (message.user_id !== currentUserId) {
        return null;
    }

    const readByOthers = (message.read_receipts ?? []).filter(
        (receipt: any) => receipt.user_id !== currentUserId,
    );

    let status = 'sent';
    let icon = '✓';
    let color = 'text-gray-400';

    if (readByOthers.length > 0) {
        status = 'seen';
        icon = '✓✓';
        color = 'text-blue-600';
    } else if (message.is_delivered) {
        status = 'delivered';
        icon = '✓✓';
        color = 'text-gray-500';
    }

    return (
        <div className={`mt-1 text-xs ${color}`} title={status}>
            {icon}
        </div>
    );
}
