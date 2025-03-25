import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationData } from '../types/Notification';
import Notification from '../components/Notification';

interface NotificationContextType {
    showNotification: (notification: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notification, setNotification] = useState<NotificationData | null>(null);

    const showNotification = (notification: NotificationData) => {
        setNotification(notification);
        if (notification.timeout) {
            setTimeout(() => {
                setNotification(null);
            }, notification.timeout);
        }
    };

    const closeNotification = () => {
        setNotification(null);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && (
                <Notification 
                    notification={notification} 
                    onClose={closeNotification} 
                />
            )}
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