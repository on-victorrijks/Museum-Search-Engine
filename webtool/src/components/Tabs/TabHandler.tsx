import { useTranslation } from 'react-i18next';
import { FaMagnifyingGlassPlus } from 'react-icons/fa6';
import { FaMagnifyingGlassMinus } from 'react-icons/fa6';
import { FaFolderPlus, FaTimes } from 'react-icons/fa';
import { FaPenToSquare } from 'react-icons/fa6';
import { TabData } from '../../types/tab';

const TabHandler: React.FC<{
    tab: TabData;
    switchOpenInNewTab: (tabIdentifier: string) => void;
    getOpenInNewTabStatut: (tabIdentifier: string) => boolean;

    increaseColumnsCount?: () => void;
    canIncreaseColumnsCount?: boolean;
    decreaseColumnsCount?: () => void;
    canDecreaseColumnsCount?: boolean;

    selectTab: (tabIdentifier: string) => void;
    removeTab: (tabIdentifier: string) => void;
}> = ({
    tab,
    switchOpenInNewTab,
    getOpenInNewTabStatut,
    increaseColumnsCount,
    canIncreaseColumnsCount,
    decreaseColumnsCount,
    canDecreaseColumnsCount,
    selectTab,
    removeTab
}) => {

    const { t } = useTranslation();

    const getTabName = (tab: TabData) => {
        switch(tab.type) {
            case 'results':
                return 'Résultats';
            case 'artpiece-profile':
                return 'Profil d\'oeuvre';
            case 'artist-profile':
                return 'Profil d\'artiste';
            case 'collection':
                return 'Collection';
            default:
                return 'Tab';
        }
    }

    return (
        <div 
            className='tab-handler'
        >
            <h1>{getTabName(tab)}</h1>
            { (tab.type==="artpiece-profile" || tab.type==="artist-profile") &&
                <button className="long" onClick={() => switchOpenInNewTab(tab.identifier)}>
                    <div className="switch" is-enabled={getOpenInNewTabStatut(tab.identifier) ? "true" : "false"}>
                        <div className="switch-handler"></div>
                    </div>
                    <FaFolderPlus />
                </button>
            }

            {tab.type === 'results' &&
                <>
                    <button 
                        onClick={increaseColumnsCount}
                        disabled={!canIncreaseColumnsCount}
                    >
                        <FaMagnifyingGlassMinus />
                    </button>
                    <button 
                        onClick={decreaseColumnsCount}
                        disabled={!canDecreaseColumnsCount}
                    >
                        <FaMagnifyingGlassPlus />
                    </button>
                    <div className='tab-handler-separator'></div>
                    <button onClick={() => selectTab(tab.identifier)}>
                        <FaPenToSquare />
                    </button>
                </>
            }
            <button
                onClick={() => removeTab(tab.identifier)}
            >
                <FaTimes />
            </button>
        </div>
    );
};

export default TabHandler;