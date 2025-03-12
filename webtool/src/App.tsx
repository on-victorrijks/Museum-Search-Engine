import React, {
  useEffect,
  useState
} from 'react';
import SearchComponent from './components/SearchComponent';
import TabContainer from './components/TabContainer';
import axios from 'axios';

import ApiResponse from './types/ApiResponse';

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
  SoftQueryType,
} from './types/queries';

// Import uuid
import { v4 as uuidv4 } from 'uuid';

// Import CSS
import './styles/App.css';
import "./styles/Modals/Modals.css"

import ResizableDiv from './components/ResizableDiv';
import CollectionPanel from './components/CollectionPanel';
import ModalCreateCollection from './components/Modals/ModalCreateCollection';

const App: React.FC = () => {

    const [modalCreateCollectionIsOpen, setModalCreateCollectionIsOpen] = useState<boolean>(true);

    const [isCollectionOpened, setIsCollectionOpened] = useState<boolean>(false);

    const [tabs, setTabs] = useState<TabData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedTabIdentifier, setSelectedTabIdentifier] = useState<string>("N/A");

    const [queryParts, setQueryParts] = useState<QueryPart[]>([]);

    const getNumberOfTabs = () => tabs.length;

    const handleError = (sPath: string, message: string) => {
      console.log(message);
    }

    const selectTab = (tabIdentifier: string) => {
      // Get the QueryParts of the selected tab
      const tab = tabs.find(tab => tab.identifier === tabIdentifier);
      if (!tab) {
        handleError("App.selectTab()", "Tab not found");
        return;
      }
      const queryParts = tab.content.query.parts;
      // Set the QueryParts
      setQueryParts(queryParts);
      // Select the tab
      setSelectedTabIdentifier(tabIdentifier);
    }

    const queryServer = async (tabIndex: number, updatedTabs: TabData[], query: Query) => {
        // Send the query
        const body = {
          "hard": query.parts.filter((part: QueryPart) => !part.isSoft),
          "soft": query.parts.filter((part: QueryPart) => part.isSoft),
          "version": "power",
          "page": 0,
          "page_size": 50
        };
        body["soft"] = body["soft"].map((part: QueryPart) => {
          return {
            ...part,
            imageInformations: undefined
          };
        });

        try {
          const response = await axios.post("http://127.0.0.1:5000/api/search/v2/query", body, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
      
          // Parse response.data as JSON
          const data: ApiResponse = response.data;
          const success = data["success"];
          if (!success) throw new Error(data["message"] ? data["message"].toString() : "An error occurred");
          const results = data["message"];
          updatedTabs[tabIndex].content.results = results;
          setTabs(updatedTabs);
        } catch (error) {
          console.error("Error making POST request:", error);
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
            }
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
          handleError("App.removeTab()", "Tab not found");
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
        selectTab(newSelectedTabIdentifier);
        setQueryParts(newQueryParts);
      }

      const getLikeStatus = (
        recordID: number
      ) => {
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return undefined;
        const queryParts = tab.content.query.parts;

        const isLiked = queryParts.some((queryPart: QueryPart) => {
          if(!queryPart.isSoft) return false;
          const queryPartAsSoft = queryPart as SoftQueryPart;
          return queryPartAsSoft.type === SoftQueryType.PRECOMPUTED && queryPartAsSoft.recordID === recordID && queryPartAsSoft.weight > 0;
        });

        const isDisliked = queryParts.some((queryPart: QueryPart) => {
          if(!queryPart.isSoft) return false;
          const queryPartAsSoft = queryPart as SoftQueryPart;
          return queryPartAsSoft.type === SoftQueryType.PRECOMPUTED && queryPartAsSoft.recordID === recordID && queryPartAsSoft.weight < 0;
        });

        return isLiked ? true : isDisliked ? false : undefined;
      }

      const likeRecord = (imageInformations: Record<string, any>) => {
        const recordID = imageInformations["recordID"];
        // Add a QueryPart to the current query
        if(selectedTabIdentifier=="N/A") return;
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return;

        const likeStatus = getLikeStatus(recordID);
        const queryParts = tab.content.query.parts;

        if (likeStatus===true) {
            // Remove the like status
            let newQueryParts : QueryPart[] = [];
            queryParts.forEach((queryPart: QueryPart) => {

              // Keep the hard QueryParts
              if(!queryPart.isSoft) {
                newQueryParts.push(queryPart);
                return;
              }

              // Remove the like status from the matching QueryPart
              const queryPartAsSoft = queryPart as SoftQueryPart;
              if (!(queryPartAsSoft.type===SoftQueryType.PRECOMPUTED && queryPartAsSoft.recordID===recordID)) {
                newQueryParts.push(queryPartAsSoft);
              }

            });
            tab.content.query.parts = newQueryParts;
            setQueryParts(tab.content.query.parts);
            receiveQuery(tab.content.query);
        } else {
            if(likeStatus===false) {
              // Remove the dislike status
              let newQueryParts : QueryPart[] = [];
              queryParts.forEach((queryPart: QueryPart) => {

                // Keep the hard QueryParts
                if(!queryPart.isSoft) {
                  newQueryParts.push(queryPart);
                  return;
                }

                // Remove the dislike status from the matching QueryPart
                const queryPartAsSoft = queryPart as SoftQueryPart;
                if (!(queryPartAsSoft.type===SoftQueryType.PRECOMPUTED && queryPartAsSoft.recordID===recordID)) {
                  newQueryParts.push(queryPartAsSoft);
                }

              });
              tab.content.query.parts = newQueryParts;
            }

            // Add the like status
            const newQueryPart : SoftQueryPart = {
              identifier: uuidv4(),
              type: SoftQueryType.PRECOMPUTED,
              weight: 1.0,
              isSoft: true,
              recordID: recordID,
              imageInformations: imageInformations
            };
            tab.content.query.parts.push(newQueryPart);
            setQueryParts(tab.content.query.parts);
            receiveQuery(tab.content.query);
        }
      }

      const dislikeRecord = (imageInformations: Record<string, any>) => {
        const recordID = imageInformations["recordID"];
        // Add a QueryPart to the current query
        if(selectedTabIdentifier=="N/A") return;
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return;

        const likeStatus = getLikeStatus(recordID);
        const queryParts = tab.content.query.parts;

        if (likeStatus===false) {
            // Remove the dislike status
            let newQueryParts : QueryPart[] = [];
            queryParts.forEach((queryPart: QueryPart) => {

              // Keep the hard QueryParts
              if(!queryPart.isSoft) {
                newQueryParts.push(queryPart);
                return;
              }

              // Remove the like status from the matching QueryPart
              const queryPartAsSoft = queryPart as SoftQueryPart;
              if (!(queryPartAsSoft.type===SoftQueryType.PRECOMPUTED && queryPartAsSoft.recordID===recordID)) {
                newQueryParts.push(queryPartAsSoft);
              }

            });
            tab.content.query.parts = newQueryParts;
            setQueryParts(tab.content.query.parts);
            receiveQuery(tab.content.query);
        } else {
            if(likeStatus===true) {
              // Remove the like status
              let newQueryParts : QueryPart[] = [];
              queryParts.forEach((queryPart: QueryPart) => {

                // Keep the hard QueryParts
                if(!queryPart.isSoft) {
                  newQueryParts.push(queryPart);
                  return;
                }

                // Remove the like status from the matching QueryPart
                const queryPartAsSoft = queryPart as SoftQueryPart;
                if (!(queryPartAsSoft.type===SoftQueryType.PRECOMPUTED && queryPartAsSoft.recordID===recordID)) {
                  newQueryParts.push(queryPartAsSoft);
                }

              });
              tab.content.query.parts = newQueryParts;
            }

            // Add the dislike status
            const newQueryPart : SoftQueryPart = {
              identifier: uuidv4(),
              type: SoftQueryType.PRECOMPUTED,
              weight: -1.0,
              isSoft: true,
              recordID: recordID,
              imageInformations: imageInformations
            };
            tab.content.query.parts.push(newQueryPart);
            setQueryParts(tab.content.query.parts);
            receiveQuery(tab.content.query);
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
        recordID: number, 
        isNewTab: boolean
      ) => {
        if(isNewTab) {
          // Create a new tab with the ArtistProfile
          const newTab : TabData = {
            type: 'artist-profile',
            identifier: uuidv4(),
            content: {
              recordID: recordID,
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
              tab.content.recordID = recordID;
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
          - selectecColumn.key=="iconography"
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
            queryPartAsHard.selectedColumn.key === "iconography"
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
              key: "iconography",
              userFriendlyName: "Objects présents"
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


      return (
        <>

          { modalCreateCollectionIsOpen &&
          <div className="modals-container">
            <ModalCreateCollection askToClose={() => setModalCreateCollectionIsOpen(false)} />
          </div>
          }


        <div className='tabs-container'>     
          <ResizableDiv minWidth={300} maxWidth={800} initialWidth={500}>
            <SearchComponent 
              loading={loading}
              receiveQuery={receiveQuery}
              selectedTabIdentifier={selectedTabIdentifier}
              queryParts={queryParts}
              setQueryParts={setQueryParts}
              updateQueryPartWeight={updateQueryPartWeight}
              resetQuery={resetQuery}
            />
          </ResizableDiv>  

          { getNumberOfTabs()==0
          ?
          <div className="empty-tabs">
            <h2>Effectuez une recherche pour voir des oeuvres !</h2>
          </div>
          :
            <TabContainer 
              tabs={tabs} 
              selectedTabIdentifier={selectedTabIdentifier}
              selectTab={selectTab}
              addTab={addTab}
              removeTab={removeTab}

              dislikeRecord={dislikeRecord}
              likeRecord={likeRecord}
              getLikeStatus={getLikeStatus}

              addTermFromIconography={addTermFromIconography}
              getTermStatusInQuery={getTermStatusInQuery}

              openArtPieceProfileWrapper={openArtPieceProfileWrapper}
              openArtistProfileWrapper={openArtistProfileWrapper}
            />
          }

          <CollectionPanel 
            isOpened={isCollectionOpened}
            togglePanel={() => setIsCollectionOpened(!isCollectionOpened)}
            openCollectionCreationModal={() => setModalCreateCollectionIsOpen(true)}
          />

        </div>
        </>
      );
};

export default App;
