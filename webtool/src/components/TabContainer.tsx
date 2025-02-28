import React, {
    useState    
} from 'react';
import { TabData } from '../types/tab';

interface TabContainer {
    tabs: TabData[];
    removeTab: (tabIdentifier: string) => void;
}

const TabContainer: React.FC<TabContainer> = ({
    tabs,
    removeTab
}) => {

    const getTabName = (tab: TabData) => {
        switch(tab.type) {
            case 'results':
                return 'Résultats';
            case 'imageProfile':
                return 'Image de profil';
            case 'ArtistProfile':
                return 'Profil d\'artiste';
            default:
                return 'Tab';
        }
    }
    
    return (
        <>

            {tabs.map(tab => (
                <div key={tab.identifier} className='tab'>

                    <div className='tab-handler'>
                        <h1>{getTabName(tab)} - {tab.type}</h1>
                        <button
                            onClick={() => removeTab(tab.identifier)}
                        >
                            <h3>X</h3>
                        </button>
                    </div>

                    <div className='tab-content'>
                        {JSON.stringify(tab.content)}
                    </div>
                </div>
            ))}

        </>
    );
};

export default TabContainer;