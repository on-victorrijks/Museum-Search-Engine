import React, { createContext, useContext, useState } from 'react';
import ModalPathFromTwoTerms from '../components/Modals/ModalPathFromTwoTerms';
import ModalCreateCollection from '../components/Modals/ModalCreateCollection';
import ModalAugmentCollection from '../components/Modals/ModalAugmentCollection';
import ModalSlideshowSettings from '../components/Modals/ModalSlideshowSettings';
import SlideShowData from '../types/Slideshow';

export interface data__PathFromTwoTerms {
    collectionIdentifier: string|undefined;
}

export interface data__AugmentCollection {
    collectionIdentifier: string|undefined;
}

export interface data__SlideshowSettings {
    collectionIdentifier: string|undefined;
}

interface ModalContextType {
    // PathFromTwoTerms
    isOpen__PathFromTwoTerms: boolean;
    openPathFromTwoTerms: (data: data__PathFromTwoTerms) => void;
    closePathFromTwoTerms: () => void;
    data__PathFromTwoTerms: data__PathFromTwoTerms;

    // CreateCollection
    isOpen__CreateCollection: boolean;
    openCreateCollection: () => void;
    closeCreateCollection: () => void;

    // AugmentCollection
    isOpen__AugmentCollection: boolean;
    openAugmentCollection: (data: data__AugmentCollection) => void;
    closeAugmentCollection: () => void;
    data__AugmentCollection: data__AugmentCollection;

    // SlideshowSettings
    isOpen__SlideshowSettings: boolean;
    openSlideshowSettings: (data: data__SlideshowSettings) => void;
    closeSlideshowSettings: () => void;
    data__SlideshowSettings: data__SlideshowSettings;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    // PathFromTwoTerms
    const [isOpen__PathFromTwoTerms, setIsOpen__PathFromTwoTerms] = useState(false);
    const [data__PathFromTwoTerms, setData__PathFromTwoTerms] = useState<{
        collectionIdentifier: string|undefined;
    }>({
        collectionIdentifier: undefined
    });

    // CreateCollection
    const [isOpen__CreateCollection, setIsOpen__CreateCollection] = useState(false);

    // AugmentCollection
    const [isOpen__AugmentCollection, setIsOpen__AugmentCollection] = useState(false);
    const [data__AugmentCollection, setData__AugmentCollection] = useState<data__AugmentCollection>({
        collectionIdentifier: undefined
    });

    // SlideshowSettings
    const [isOpen__SlideshowSettings, setIsOpen__SlideshowSettings] = useState(false);
    const [data__SlideshowSettings, setData__SlideshowSettings] = useState<data__SlideshowSettings>({
        collectionIdentifier: undefined
    });

    const any_open = isOpen__PathFromTwoTerms || isOpen__CreateCollection || isOpen__AugmentCollection || isOpen__SlideshowSettings;

    return (
        <ModalContext.Provider value={{ 
            // PathFromTwoTerms
            isOpen__PathFromTwoTerms: isOpen__PathFromTwoTerms, 
            openPathFromTwoTerms: (data: data__PathFromTwoTerms) => {
                setIsOpen__PathFromTwoTerms(true);
                setData__PathFromTwoTerms(data);
            },
            closePathFromTwoTerms: () => setIsOpen__PathFromTwoTerms(false),
            data__PathFromTwoTerms: data__PathFromTwoTerms,

            // CreateCollection
            isOpen__CreateCollection: isOpen__CreateCollection,
            openCreateCollection: () => setIsOpen__CreateCollection(true),
            closeCreateCollection: () => setIsOpen__CreateCollection(false),

            // AugmentCollection
            isOpen__AugmentCollection: isOpen__AugmentCollection,
            openAugmentCollection: (data: data__AugmentCollection) => {
                setIsOpen__AugmentCollection(true);
                setData__AugmentCollection(data);
            },
            closeAugmentCollection: () => setIsOpen__AugmentCollection(false),
            data__AugmentCollection: data__AugmentCollection,

            // SlideshowSettings
            isOpen__SlideshowSettings: isOpen__SlideshowSettings,
            openSlideshowSettings: (data: data__SlideshowSettings) => {
                setIsOpen__SlideshowSettings(true);
                setData__SlideshowSettings(data);
            },
            closeSlideshowSettings: () => setIsOpen__SlideshowSettings(false),
            data__SlideshowSettings: data__SlideshowSettings
        }}>
            <div className="modals-container" style={{
                display: any_open ? "flex" : "none"
            }}>
                {isOpen__PathFromTwoTerms && <ModalPathFromTwoTerms />}
                {isOpen__CreateCollection && <ModalCreateCollection />}
                {isOpen__AugmentCollection && <ModalAugmentCollection />}
                {isOpen__SlideshowSettings && <ModalSlideshowSettings />}
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