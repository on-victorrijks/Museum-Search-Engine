import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationData, NotificationType, NotificationDataError } from '../types/Notification';
import Notification from '../components/Notification';
import { v4 as uuidv4 } from 'uuid';
import { ErrorLog } from '../types/Error';
interface NotificationContextType {
    showNotification: (notification: NotificationData) => void;
    getErrorLogs: () => ErrorLog[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    const [notificationQueue, setNotificationQueue] = useState<NotificationData[]>([]);
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);

    const showNotification = (notification: NotificationData) => {
        notification.identifier = uuidv4();
        // if the notification queue has more than 3 notifications, remove the oldest one
        setNotificationQueue([...notificationQueue, notification]);
        notification.timestamp = Date.now();
        if (notification.type === NotificationType.ERROR && notification.errorContext) {
            addErrorLog(notification as NotificationDataError);
        }
        if (notification.timeout) {
            setTimeout(() => {
                setNotificationQueue(notificationQueue.filter((n) => n.identifier !== notification.identifier));
            }, notification.timeout);
        }
    };

    const closeNotification = (identifier: string) => {
        setNotificationQueue(notificationQueue.filter((n) => n.identifier !== identifier));
    };

    const addErrorLog = (notification: NotificationDataError) => {
        setErrorLogs([...errorLogs, notification.errorContext]);
    };

    const getErrorLogs = () => {
        return errorLogs;
    };

    return (
        <NotificationContext.Provider value={{ showNotification, getErrorLogs }}>
            {children}
            <div className="notification-container">
            {notificationQueue.map((notification) => {
                if (notification.identifier != undefined) {
                    return (
                        <Notification 
                            key={notification.identifier}
                            notification={notification} 
                            onClose={() => closeNotification(notification.identifier || "")} 
                        />
                    );
                }
                return null; // Should not happen
            })}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}; 