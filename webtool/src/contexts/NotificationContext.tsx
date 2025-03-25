import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationData, NotificationType } from '../types/Notification';
import Notification from '../components/Notification';
import { v4 as uuidv4 } from 'uuid';
interface NotificationContextType {
    showNotification: (notification: NotificationData) => void;
    getErrorLogs: () => string[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    const [notificationQueue, setNotificationQueue] = useState<NotificationData[]>([]);
    const [errorLogs, setErrorLogs] = useState<string[]>([]);

    const showNotification = (notification: NotificationData) => {
        notification.identifier = uuidv4();
        setNotificationQueue([...notificationQueue, notification]);
        if (notification.type === NotificationType.ERROR) {
            addErrorLog(notification.text);
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

    const addErrorLog = (errorLog: string) => {
        setErrorLogs([...errorLogs, errorLog]);
    };

    const getErrorLogs = () => {
        return errorLogs;
    };

    return (
        <NotificationContext.Provider value={{ showNotification, getErrorLogs }}>
            {children}
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