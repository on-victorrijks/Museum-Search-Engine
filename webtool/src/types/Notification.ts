
export enum NotificationType {
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING'
}

export enum NotificationButtonType {
    NEUTRAL = 'NEUTRAL',
    NEGATIVE = 'NEGATIVE',
    POSITIVE = 'POSITIVE'
}

export interface NotificationButton {
    type: NotificationButtonType;
    text: string;
    icon?: React.ReactNode;
    onClick: () => void;
}

export interface NotificationData {
    type: NotificationType;
    title: string;
    icon?: React.ReactNode;
    text: string;
    buttons: NotificationButton[];
    timeout?: number;
} 