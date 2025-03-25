import React from 'react';
import { NotificationData, NotificationType } from '../types/Notification';
import '../styles/Notification.css';
import { FaTimes } from 'react-icons/fa';

interface NotificationProps {
    notification: NotificationData;
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
    const getNotificationClass = () => {
        switch (notification.type) {
            case NotificationType.ERROR:
                return 'notification-error';
            case NotificationType.SUCCESS:
                return 'notification-success';
            case NotificationType.WARNING:
                return 'notification-warning';
            default:
                return 'notification-default';
        }
    };

    return (
        <div className={`notification ${getNotificationClass()}`}>
            <div className="notification-header">
                <div className="notification-header-title">
                    {notification.icon && (
                        <div className="notification-header-icon">
                            {notification.icon}
                        </div>
                    )}
                    <h3>{notification.title}</h3>
                </div>
                <button className="notification-close" onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            { (notification.text.length > 0 || notification.buttons.length > 0) &&
            <div className="notification-content">
                <p>{notification.text}</p>
                { notification.buttons.length > 0 &&
                    <div className="notification-buttons">
                        {notification.buttons.map((button) => (
                            <button key={button.text} className={`notification-button ${button.type}`} onClick={button.onClick}>
                                {button.text}
                            </button>
                        ))}
                    </div>
                }
            </div>
            }
        </div>
    );
};

export default Notification; 