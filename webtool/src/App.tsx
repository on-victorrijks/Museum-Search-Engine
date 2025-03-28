import React, {
  useState
} from 'react';
import TabContainer from './components/TabContainer';
import axios from 'axios';

import { ApiResponse, SuccessfulQueryResponse } from './types/ApiResponses';

// Import types
import { TabData } from './types/tab';
import { 
  BlockType,
  HardQueryPart,
  IncludesBlockProps,
  Query,
  QueryPart,
  SelectionOption,
  SoftQueryPart,
} from './types/queries';

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

const App: React.FC = () => {

    const { settings } = useSettings();
    const { showNotification } = useNotification();

    const [tabs, setTabs] = useState<TabData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedTabIdentifier, setSelectedTabIdentifier] = useState<string>("N/A");

    const [queryParts, setQueryParts] = useState<QueryPart[]>([]);

    const getNumberOfTabs = () => tabs.length;

    const selectTab = (tabIdentifier: string) => {
      // Get the QueryParts of the selected tab
      const tab = tabs.find(tab => tab.identifier === tabIdentifier);
      if (!tab) {
        showNotification({
          type: NotificationType.ERROR,
          title: "Erreur",
          text: "Tab non trouvé",
          buttons: [],
          timeout: 5000,
          errorContext: {
            timestamp: Date.now(),
            message: "Tab non trouvé",
            origin: "selectTab"
          }
        });
        return;
      }
      if(tab.type==="results") {
        // This is a results tab
        const queryParts = tab.content.query.parts;
        // Set the QueryParts
        setQueryParts(queryParts);
      }

      // Select the tab
      setSelectedTabIdentifier(tabIdentifier);
    }

    const askForMoreResults = () => {
      // Get the selected tab
      const tabIndex = tabs.findIndex(tab => tab.identifier === selectedTabIdentifier);
      if (tabIndex === -1) {
        showNotification({
          type: NotificationType.ERROR,
          title: "Erreur",
          text: "Une erreur est survenue lors de la récupération du tab sélectionné",
          buttons: [],
          timeout: 5000,
          errorContext: {
            timestamp: Date.now(),
            message: "Une erreur est survenue lors de la récupération du tab sélectionné",
            origin: "askForMoreResults"
          }
        });
        return;
      }

      const tab = tabs[tabIndex];
      if (!tab) {
        showNotification({
          type: NotificationType.ERROR,
          title: "Erreur",
          text: "Une erreur est survenue lors de la récupération du tab sélectionné",
          buttons: [],
          timeout: 5000,
          errorContext: {
            timestamp: Date.now(),
            message: "Une erreur est survenue lors de la récupération du tab sélectionné",
            origin: "askForMoreResults"
          }
        });
        return;
      }

      // Increment the page
      const updatedTabs = tabs.map((tab, index) => {
        if (index === tabIndex) {
          tab.page = (tab.page ?? 1) + 1; // Increment the page
          return tab;
        }
        return tab;
      });

      // Send the query
      setLoading(true);
      queryServer(tabIndex, updatedTabs, tab.content.query);
    }

    const queryServer = async (
      tabIndex: number, 
      updatedTabs: TabData[], 
      query: Query
    ) => {
        const isFollowingOfPreviousQuery = updatedTabs[tabIndex].page && updatedTabs[tabIndex].page > 1;

        // Send the query
        const body = {
          "hard_constraints": query.parts.filter((part: QueryPart) => !part.isSoft),
          "soft_constraints": query.parts.filter((part: QueryPart) => part.isSoft),
          "model_name": settings.model_name,  
          "page": updatedTabs[tabIndex].page,
          "page_size": 30,
          "version": settings.method,
          "rocchio_k": settings.rocchio_k,
          "rocchio_scale": settings.rocchio_scale
        };
        body["soft_constraints"] = body["soft_constraints"].map((part: QueryPart) => {
          return {
            ...part,
            imageInformations: undefined
          };
        });

        try {
          const response = await axios.post("http://127.0.0.1:5000/api/query", body, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
      
          // Parse response.data as JSON
          const data: ApiResponse = response.data;
          const success = data["success"];
          if (!success) {
            showNotification({
              type: NotificationType.ERROR,
              title: "Erreur",
              text: data["error_message"] ? data["error_message"].toString() : "Une erreur est survenue",
              buttons: [],
              timeout: 5000,
              errorContext: {
                timestamp: Date.now(),
                message: data["error_message"] ? data["error_message"].toString() : "Une erreur est survenue",
                origin: "queryServer:success=false"
              }
            });
            return;
          }

          if (isFollowingOfPreviousQuery) {
            // We are following the previous query ==> We add the new results to the existing results
            updatedTabs[tabIndex].content.results = [
              ...updatedTabs[tabIndex].content.results,
              ...(data as SuccessfulQueryResponse).data
            ];
          } else {
            // We are not following the previous query ==> We replace the existing results
            updatedTabs[tabIndex].content.results = (data as SuccessfulQueryResponse).data;
          }

          setTabs(updatedTabs);
        } catch (error) {
          showNotification({
            type: NotificationType.ERROR,
            title: "Erreur lors de la récupération des résultats",
            text: "Une erreur est survenue lors de la récupération des résultats",
            buttons: [],
            timeout: 5000,
            errorContext: {
              timestamp: Date.now(),
              message: "Une erreur est survenue lors de la récupération des résultats",
              origin: "queryServer:error=" + error
            }
          });
          return { success: false, message: "An error occurred" };
        } finally {
          setLoading(false);
        }
      }

      const receiveQuery = async(query: Query) => {
        setLoading(true);

        let identifier = query.identifier;

        if (selectedTabIdentifier==="N/A") {
          // This is the first query
          // We need to create a new tab (therefore a new identifier)
          const newTabIdentifier = uuidv4();
          setSelectedTabIdentifier(newTabIdentifier);
          identifier = newTabIdentifier;
          query.identifier = newTabIdentifier;
        } else {
          if (query.identifier !== selectedTabIdentifier) {
            // This is a new query ==> This will create a new tab !
            const newTabIdentifier = uuidv4();
            setSelectedTabIdentifier(newTabIdentifier);
            identifier = newTabIdentifier;
            query.identifier = newTabIdentifier;
          } else {
            // We are updating a selected tab
            identifier = selectedTabIdentifier;
          }
        }

        // Check if a tab has the same query identifier
        const tab = tabs.find(tab => tab.identifier === identifier);
        let updatedTabs : TabData[];
        let newTabIndex : number = 0;
        updatedTabs = tabs;
        if (!tab) {
          // This is a new query, add a new tab
          updatedTabs = [...tabs, {
            type: 'results',
            identifier: identifier,
            content: {
              query: query,
              results: []
            },
            page: 1
          }];
          newTabIndex = updatedTabs.length - 1;

          if (query.parts.length==0) {
            // The user created a new query ==> We create the tab but we do not send the query to the server
            setTabs(updatedTabs);
            setQueryParts([]);
            setLoading(false);
            return;
          } else {
            // The user created a new query and added some QueryParts ==> We send the query to the server
            queryServer(newTabIndex, updatedTabs, query); // Handles the states updates
          }
        } else {

          tab.page = 1;
          tab.content.query = query;
          
          // Update the tab with the new query
          for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].identifier === identifier) {
              updatedTabs = tabs;
              newTabIndex = i;
              break;
            }
          }

          if (query.parts.length==0) {
            // The user updated the query but removed all QueryParts ==> We remove the tab
            updatedTabs = [];
            setTabs(updatedTabs);
            setQueryParts([]);
            setLoading(false);
            return;
          } else {
            // The user updated the query and added some QueryParts ==> We send the query to the server
            queryServer(newTabIndex, updatedTabs, query); // Handles the states updates
          }
        }

      }

      const removeTab = (tabIdentifier: string) => {
        let toRemoveTabIndex : number = -1;
        let newSelectedTabIdentifier : string = "N/A";
        let newQueryParts : QueryPart[] = [];
        tabs.forEach((tab, index) => {
          // Find the index of the tab to remove
          if (tab.identifier === tabIdentifier) {
            toRemoveTabIndex = index;
          } else {
            // Verify if this tab is selectable (i.e. has QueryParts)
            if (
              tab.content.query && tab.content.query.parts
            ) {
              // This tab could be selected
              newSelectedTabIdentifier = tab.identifier;
              newQueryParts = tab.content.query.parts;
            }
          }
        });
        if (toRemoveTabIndex === -1) {
          showNotification({
            type: NotificationType.ERROR,
            title: "Erreur",
            text: "Tab non trouvé",
            buttons: [],
            timeout: 5000,
            errorContext: {
              timestamp: Date.now(),
              message: "Tab non trouvé",
              origin: "removeTab"
            }
          });
          return;
        }
        // Remove the tab
        let updatedTabs : TabData[] = [];
        tabs.forEach((tab, index) => {
          if (index !== toRemoveTabIndex) {
            updatedTabs.push(tab);
          }
        });
        setTabs(updatedTabs);
        if (newSelectedTabIdentifier==="N/A") {
          setQueryParts([]);
        } else {
          selectTab(newSelectedTabIdentifier);
          setQueryParts(newQueryParts);
        }
      }

      const updateQueryPartWeight = (queryPartIdentifier: string, newWeight: number) => {
        if(selectedTabIdentifier=="N/A") return;
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return;
        const queryParts = tab.content.query.parts;
        queryParts.forEach((queryPart: QueryPart) => {
          const queryPartAsSoft = queryPart as SoftQueryPart;
          if (queryPartAsSoft.identifier === queryPartIdentifier) {
            queryPartAsSoft.weight = newWeight;
          }
        });
        tab.content.query.parts = queryParts;
        setQueryParts(queryParts);
        // Sadly, we need to re-send the query manually since a QueryPart weight is a key of a QueryPart and 
        // therefore does not trigger a re-render of the component (TODO: find a way to avoid this)
        receiveQuery(tab.content.query); 
      }

      const resetQuery = () => {
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return;
        tab.content.query.parts = [];
        tab.content.results = [];
        setTabs(tabs);
        setQueryParts([]);
      }

      const addTab = (newTab: TabData) => {
        setTabs([...tabs, newTab]);
      }

      const openArtPieceProfileWrapper = (
        fromTabIdentifier: string,
        recordID: number, 
        isNewTab: boolean
      ) => {
        if(isNewTab) {
          // Create a new tab with the ArtPieceProfile
          const newTab : TabData = {
            type: 'artpiece-profile',
            identifier: uuidv4(),
            content: {
              recordID: recordID,
              data: undefined
            }
          };
          addTab(newTab);
        } else {
          // Modify the current tab so it displays the ArtPieceProfile
          setTabs(tabs.map((tab) => {
            if(tab.identifier === fromTabIdentifier) {
              // This is the tab we want to modify
              tab.type = 'artpiece-profile';
              tab.content.recordID = recordID;
              tab.content.data = undefined;
            }
            return tab;
          }));          
        }
      }

      const openArtistProfileWrapper = (
        fromTabIdentifier: string,
        creatorid: string, 
        isNewTab: boolean
      ) => {
        if(isNewTab) {
          // Create a new tab with the ArtistProfile
          const newTab : TabData = {
            type: 'artist-profile',
            identifier: uuidv4(),
            content: {
              creatorid: creatorid,
              data: undefined
            }
          };
          addTab(newTab);
        } else {
          // Modify the current tab so it displays the ArtistProfile
          setTabs(tabs.map((tab) => {
            if(tab.identifier === fromTabIdentifier) {
              // This is the tab we want to modify
              tab.type = 'artist-profile';
              tab.content.creatorid = creatorid;
              tab.content.data = undefined;
            }
            return tab;
          }));          
        }
      }

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
