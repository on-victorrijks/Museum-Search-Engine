import React, {
  useState
} from 'react';
import TabContainer from './components/TabContainer';
import axios from 'axios';

import { ApiResponse, SuccessfulQueryResponse } from './types/ApiResponses';

// Import types
import { TabData } from './types/tab';
// Import uuid
import { v4 as uuidv4 } from 'uuid';

// Import CSS
import './styles/App.css';
import "./styles/Modals/Modals.css"

import CollectionData from './types/Collections';
import ArtPieceData from './types/ArtPiece';
import { useNotification } from './contexts/NotificationContext';
import { NotificationType } from './types/Notification';
import { dislikeRecord, getLikeStatus, likeRecord } from './logic/LikingSystem';
import SidePanel from './components/SidePanel/SidePanel';
import { useSettings } from './contexts/SettingsContext';
import { useTab } from './contexts/TabContext';

const App: React.FC = () => {

    const { settings } = useSettings();
    const { showNotification } = useNotification();
    const { } = useTab();



      const getTermStatusInQuery = (term: string) => {
        /* Is there a query part that:
          - is hard
          - type==blockType.INCLUDES
          - exactMatch==true
          - isNot==false
          - selectecColumn.key=="iconography"
          - contains term in values
        */
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return false;

        const queryParts = tab.content.query.parts;

        const matchingQueryPart = queryParts.find((queryPart: QueryPart) => {
          if(queryPart.isSoft) return false;
          const queryPartAsHard = queryPart as HardQueryPart;
          
          if(
            queryPartAsHard.type === BlockType.INCLUDES &&
            queryPartAsHard.exactMatch === true &&
            queryPartAsHard.isNot === false &&
            queryPartAsHard.selectedColumn &&
            queryPartAsHard.selectedColumn.key === "iconography"
          ) {
            const queryPartAsIncludes = queryPartAsHard as IncludesBlockProps;
            if (queryPartAsIncludes.values && queryPartAsIncludes.values.includes(term)) {
              return true;
            }
          }
          return false;
        });

        return matchingQueryPart!==undefined;
      }

      const addTermFromIconography = (term: string) => {
        /* Is there a query part that:
          - is hard
          - type==blockType.INCLUDES
          - exactMatch==true
          - isNot==false
          - selectecColumn.key=="stf_values"
        */
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return;

        const queryParts = tab.content.query.parts;
        let matchingQueryPartIdentifier = uuidv4();

        const matchingQueryPart = queryParts.find((queryPart: QueryPart) => {
          if(queryPart.isSoft) return false;
          const queryPartAsHard = queryPart as HardQueryPart;
          return (
            queryPartAsHard.type === BlockType.INCLUDES &&
            queryPartAsHard.exactMatch === true &&
            queryPartAsHard.isNot === false &&
            queryPartAsHard.selectedColumn &&
            queryPartAsHard.selectedColumn.key === "STF_values"
          );
        });

        let shouldPush = true;
        if (matchingQueryPart!==undefined) {
          matchingQueryPartIdentifier = matchingQueryPart.identifier;
          // Check if the term is already in the values
          const queryPartAsIncludes = matchingQueryPart as IncludesBlockProps;
          if (queryPartAsIncludes.values && queryPartAsIncludes.values.includes(term)) {
            // The term is already in the values ==> We remove !
            shouldPush = false;
          }
        }

        let newQueryParts : QueryPart[] = queryParts;

        if (matchingQueryPart===undefined) {
          // Create a new QueryPart
          const newQueryPart : HardQueryPart = {
            identifier: matchingQueryPartIdentifier,
            type: BlockType.INCLUDES,
            blockType: BlockType.INCLUDES,
            keepNull: false,
            caseSensitive: false,
            exactMatch: true,
            isNot: false,
            isSoft: false,
            selectedColumn: {
              key: "STF_values",
              userFriendlyName: "Sujets"
            } as SelectionOption
          };
          newQueryParts.push(newQueryPart);
        }

        // Modify the existing QueryPart by adding the term
        setQueryParts(newQueryParts.map((queryPart: QueryPart) => {
          if (queryPart.identifier === matchingQueryPartIdentifier) {
            const queryPartAsHard = queryPart as IncludesBlockProps;
            if (!queryPartAsHard.values) queryPartAsHard.values = [];
            if (shouldPush) {
              queryPartAsHard.values.push(term);
            } else {
              queryPartAsHard.values = queryPartAsHard.values.filter((value: string) => value!==term);
            }
          }
          return queryPart;
        }));
      
      }

      const openCollectionInTab = (collectionData: CollectionData) => {
        // Create a tab for this collection if it does not exist
        const tab = tabs.find(tab => {
          const tabType = tab.type;
          return tabType==="collection" && tab.content.collectionIdentifier===collectionData.identifier;
        });

        if(tab) {
          // The tab already exists, we select it
          selectTab(tab.identifier);
        } else {
          // The tab does not exist, we create it
          const newTab : TabData = {
            type: 'collection',
            identifier: uuidv4(),
            content: {
              collectionIdentifier: collectionData.identifier
            }
          };
          addTab(newTab);
        }
      }

      const canLike = () => {
        // If the selected tab is a results tab, we can like (we can modify the query)
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return false;
        return tab.type==="results";
      }

      return (
        <div className='tabs-container'>

            <SidePanel 
                loading={loading}
                receiveQuery={receiveQuery}
                selectedTabIdentifier={selectedTabIdentifier}
                queryParts={queryParts}
                setQueryParts={setQueryParts}
                updateQueryPartWeight={updateQueryPartWeight}
                resetQuery={resetQuery}
                openCollectionInTab={openCollectionInTab}
            />
          

            { getNumberOfTabs()==0
            ?
            <div className="empty-tabs">
                <h2>Effectuez une recherche pour voir des oeuvres !</h2>
            </div>
            :
                <TabContainer 
                  loading={loading}

                    tabs={tabs} 
                    selectedTabIdentifier={selectedTabIdentifier}
                    selectTab={selectTab}
                    addTab={addTab}
                    removeTab={removeTab}

                    dislikeRecord={(imageInformations: ArtPieceData) => dislikeRecord(tabs, selectedTabIdentifier, setQueryParts, receiveQuery, imageInformations)}
                    likeRecord={(imageInformations: ArtPieceData) => likeRecord(tabs, selectedTabIdentifier, setQueryParts, receiveQuery, imageInformations)}
                    getLikeStatus={(recordID: number) => getLikeStatus(tabs, selectedTabIdentifier, recordID)}

                    addTermFromIconography={addTermFromIconography}
                    getTermStatusInQuery={getTermStatusInQuery}

                    openArtPieceProfileWrapper={openArtPieceProfileWrapper}
                    openArtistProfileWrapper={openArtistProfileWrapper}
                    
                    canLike={canLike()}

                    askForMoreResults={askForMoreResults}
                />
            }

        </div>
      );
};

export default App;
