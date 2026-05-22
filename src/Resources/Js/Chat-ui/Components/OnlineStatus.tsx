/**
 * Online Status Indicator
 * Shows a small dot to indicate if a user is online or offline
 */
export default function OnlineStatus({ isOnline, size = 'md' }: any) {
    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    return (
        <div
            className={`rounded-full ${sizeClasses[size]} ${
                isOnline ? 'bg-green-500' : 'bg-gray-300'
            }`}
            title={isOnline ? 'Online' : 'Offline'}
        ></div>
    );
}
