import axios from 'axios';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ServerSettingsInfos, Settings } from '../types/settings';
import { useTranslation } from 'react-i18next';

import '../styles/settings.css';

export interface SettingsContext {
    settings: Settings;
    setSettings: (settings: Settings) => void;
    serverSettingsInfos: ServerSettingsInfos;
    loading: boolean;
    loaded: boolean;
}

const SettingsContext = createContext<SettingsContext | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();
    const [settings, setSettings] = useState<Settings>({
        model_name: 'art-base',
        method: 'rocchio',
        rocchio_k: 5,
        rocchio_scale: 0.25,
        language: 'fr'
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [serverSettingsInfos, setServerSettingsInfos] = useState<ServerSettingsInfos>({
        models: [],
        methods: [],
        languages: [],
        min_rocchio_k: 0,
        max_rocchio_k: 100,
        min_rocchio_scale: 0,
        max_rocchio_scale: 10.0,
        keywords: [],
        colors: [],
        luminosities: []
    });

    useEffect(() => {
        if(loaded) return;
        fetchServerSettingsInfos();
    }, []);

    useEffect(() => {
        if(loaded) {
            // Set the model_name to the last model in the serverSettingsInfos.models array
            setSettings({
                ...settings,
                model_name: serverSettingsInfos.models[serverSettingsInfos.models.length - 1].model_name
            });            
        }
    }, [serverSettingsInfos]);

    useEffect(() => {
        i18n.changeLanguage(settings.language);
    }, [settings.language, i18n]);

    const fetchServerSettingsInfos = async () => {
        setLoaded(false);
        setLoading(true);

        try {
            const response = await axios.get('http://127.0.0.1:5000/api/get_settings_infos');
            if (response && response.data && response.data.data) {
                const infos = response.data.data;
                setServerSettingsInfos(infos);
                setLoaded(true);            
            } else {
                throw new Error("No data received from server");
            }
        } catch (error) {
            // We don't have access to the notification context here, so we just log the error
            // I believe that we could "register" the notification context in the SettingsContext, but it would be a bit of a mess
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SettingsContext.Provider value={{ settings, setSettings, serverSettingsInfos, loading, loaded }}>
            { loading
            ? 
            <div className="settings-fullpage">
                <div className="lds-ripple">
                    <div></div>
                    <div></div>
                </div>
            </div>
            :
            loaded
            ? children
            :
            <div className="settings-fullpage">
                <h1>{i18n.t('settings.error.title')}</h1>
                <p>{i18n.t('settings.error.message')}</p>
                <button 
                    className="settings-fullpage-error-button"
                    onClick={fetchServerSettingsInfos}
                    disabled={loading}
                >
                    {i18n.t('settings.error.retry')}
                </button>
            </div>
            }
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}; 