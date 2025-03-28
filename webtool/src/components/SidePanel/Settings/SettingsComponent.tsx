import React from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { Settings } from '../../../types/settings';
import { Slider } from '@mui/material';


const SettingsRocchioComponent: React.FC<{
    k: number;
    scale: number;
    setK: (k: number) => void;
    setScale: (scale: number) => void;
    minK: number;
    maxK: number;
    minScale: number;
    maxScale: number;
}> = ({ k, scale, setK, setScale, minK, maxK, minScale, maxScale }) => {
    return (
        <>
            <div className="settings-section">
                <label>Nombre d'images prises en compte</label>
                <div className="settings-section-spacer"></div>
                <Slider
                    value={k}
                    onChange={(_e, value) => {
                        value = Math.max(minK, Math.min(maxK, value as number));
                        setK(value);
                    }}
                    step={1}
                    min={minK}
                    max={maxK}
                    valueLabelDisplay="on"
                />
            </div>

            <div className="settings-section">
                <label>Coefficient de pondération</label>
                <div className="settings-section-spacer"></div>
                <Slider
                    value={scale}
                    onChange={(_e, value) => {
                        value = Math.max(minScale, Math.min(maxScale, value as number));
                        setScale(value);
                    }}
                    step={0.01}
                    min={minScale}
                    max={maxScale}
                    valueLabelDisplay="on"
                />
            </div>
        </>
    )
};

const SettingsComponent: React.FC<{}> = ({}) => {

    const { settings, setSettings, serverSettingsInfos } = useSettings();

    return (
    <div className="settings">
        <div className="settings-section">
            <label>Modèle</label>
            <select 
                value={settings.model_name}
                onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
            >
                {serverSettingsInfos.models.map((model) => (
                    <option key={model.model_name} value={model.model_name}>
                        {model.model_name}
                    </option>
                ))}
            </select>
        </div>

        <div className="settings-section">
            <label>Méthode</label>
            <select 
                value={settings.method}
                onChange={(e) => setSettings({ ...settings, method: e.target.value as Settings['method'] })}
            >
                {serverSettingsInfos.methods.map((method) => (
                    <option key={method} value={method}>
                        {method}
                    </option>
                ))}
            </select>
        </div>

        {
            settings.method === 'rocchio' && 
            <SettingsRocchioComponent 
                k={settings.rocchio_k}
                scale={settings.rocchio_scale}
                setK={(k: number) => setSettings({ ...settings, rocchio_k: k })}
                setScale={(scale: number) => setSettings({ ...settings, rocchio_scale: scale })}
                minK={serverSettingsInfos.min_rocchio_k}
                maxK={serverSettingsInfos.max_rocchio_k}
                minScale={serverSettingsInfos.min_rocchio_scale}
                maxScale={serverSettingsInfos.max_rocchio_scale}
            />
        }
        
        <div className="settings-section">
            <label>Langue</label>
            <select 
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value as Settings['language'] })}
            >
                {serverSettingsInfos.languages.map((language) => (
                    <option key={language} value={language}>
                        {language}
                    </option>
                ))}
            </select>
        </div>

    </div>
    );
};

export default SettingsComponent; 