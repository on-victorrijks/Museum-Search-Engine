import { ErrorLog } from "./Error";

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
    identifier?: string;
    timestamp?: number;
    type: NotificationType;
    errorContext?: ErrorLog;
    title: string;
    icon?: React.ReactNode;
    text: string;
    buttons: NotificationButton[];
    timeout?: number;
} 


// This forrces an error notification to have an error context
export interface NotificationDataError extends NotificationData {
    type: NotificationType.ERROR;
    errorContext: ErrorLog;
}
