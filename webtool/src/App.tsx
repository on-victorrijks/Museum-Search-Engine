import React, {
  useState
} from 'react';
import { TabData } from './types/tab';
import { QueryPart, Query } from './types/queries';
import SearchComponent from './components/SearchComponent';
import TabContainer from './components/TabContainer';

// Import CSS
import './styles/App.css';

// Import uuidv4
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
    const [tabs, setTabs] = useState<TabData[]>([]);

    const getNumberOfTabs = () => tabs.length;

    const receiveQuery = (query: Query) => {
      // Check if a tab has the same query identifier
      const tab = tabs.find(tab => tab.identifier === query.identifier);
      if (!tab) {
        // This is a new query, add a new tab
        addTab({
          type: 'results',
          identifier: query.identifier,
          content: query
        });
      } else {
        // If a tab has the same query identifier, update the tab
        const updatedTabs = tabs.map(tab => {
          if (tab.identifier === query.identifier) {
            tab.content = query;
          }
          return tab;
        });
        setTabs(updatedTabs);
      }
    }

    const addTab = (newTab: TabData) => {
      if (newTab.identifier === 'N/A') {
        newTab.identifier = uuidv4();
      }
      setTabs([...tabs, newTab]);
    }

    const removeTab = (tabIdentifier: string) => {
      setTabs(tabs.filter(tab => tab.identifier !== tabIdentifier));
    }

    return (
      <div className='tabs-container'>          
        <SearchComponent receiveQuery={receiveQuery} />
        { getNumberOfTabs()>0 &&
          <TabContainer tabs={tabs} removeTab={removeTab} />
        }
      </div>
    );
};

export default App;
