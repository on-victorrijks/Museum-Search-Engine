import React, { createContext, useContext, useState } from 'react';
import ModalPathFromTwoTerms from '../components/Modals/ModalPathFromTwoTerms';

export interface data__PathFromTwoTerms {
    collectionIdentifier: string|undefined;
}

interface ModalContextType {
    isOpen__PathFromTwoTerms: boolean;
    openPathFromTwoTerms: (data: data__PathFromTwoTerms) => void;
    closePathFromTwoTerms: () => void;
    data__PathFromTwoTerms: data__PathFromTwoTerms;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen__PathFromTwoTerms, setIsOpen__PathFromTwoTerms] = useState(false);
    const [data__PathFromTwoTerms, setData__PathFromTwoTerms] = useState<{
        collectionIdentifier: string|undefined;
    }>({
        collectionIdentifier: undefined
    });

    const any_open = isOpen__PathFromTwoTerms;

    return (
        <ModalContext.Provider value={{ 
            // PathFromTwoTerms
            isOpen__PathFromTwoTerms: isOpen__PathFromTwoTerms, 
            openPathFromTwoTerms: (data: data__PathFromTwoTerms) => {
                setIsOpen__PathFromTwoTerms(true);
                setData__PathFromTwoTerms(data);
            },
            closePathFromTwoTerms: () => setIsOpen__PathFromTwoTerms(false),
            data__PathFromTwoTerms: data__PathFromTwoTerms
        }}>
            <div className="modals-container" style={{
                display: any_open ? "flex" : "none"
            }}>
                {isOpen__PathFromTwoTerms && <ModalPathFromTwoTerms />}
            </div>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}; 