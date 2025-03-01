import React, {
  useState
} from 'react';
import { TabData } from './types/tab';
import { QueryPart, Query } from './types/queries';
import SearchComponent from './components/SearchComponent';
import TabContainer from './components/TabContainer';
import axios from 'axios';

// Define the expected response type
interface ApiResponse {
  success: boolean;
  message?: Record<string, any>;
}

// Import uuid
import { v4 as uuidv4 } from 'uuid';

// Import CSS
import './styles/App.css';

const App: React.FC = () => {

    const [tabs, setTabs] = useState<TabData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedTabIdentifier, setSelectedTabIdentifier] = useState<string>("N/A");

    const getNumberOfTabs = () => tabs.length;

    const queryServer = async (tabIndex: number, updatedTabs: TabData[], query: Query) => {
        // Send the query
        const body = {
          "hard": query.parts.filter((part: QueryPart) => !part.isSoft),
          "soft": query.parts.filter((part: QueryPart) => part.isSoft),
          "version": "power",
          "page": 0,
          "page_size": 25
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
          setSelectedTabIdentifier(query.identifier);
          identifier = query.identifier;
        } else {
          identifier = selectedTabIdentifier;
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
              results: {}
            }
          }];
          newTabIndex = updatedTabs.length - 1;

          queryServer(newTabIndex, updatedTabs, query);
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

          queryServer(newTabIndex, updatedTabs, query);
        }

      }

      const removeTab = (tabIdentifier: string) => {
        setTabs(tabs.filter(tab => tab.identifier !== tabIdentifier));
      }

      const getLikeStatus = (
        tabIdentifier: string,
        recordID: number
      ) => {
        const tab = tabs.find(tab => tab.identifier === tabIdentifier);
        if (!tab) return undefined;
        const queryParts = tab.content.query.parts;
        const isLiked = queryParts.some((part: QueryPart) => {
          return part.type === "precomputed" && part.recordID === recordID && part.weight > 0;
        });
        const isDisliked = queryParts.some((part: QueryPart) => {
          return part.type === "precomputed" && part.recordID === recordID && part.weight < 0;
        });
        return isLiked ? true : isDisliked ? false : undefined;
      }

      const dislikeRecord = (imageInformations: Record<string, any>) => {
        const recordID = imageInformations["recordID"];
        // Add a QueryPart to the current query
        if(selectedTabIdentifier=="N/A") return;
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return;

        const likeStatus = getLikeStatus(selectedTabIdentifier, recordID);
        const queryParts = tab.content.query.parts;

        if (likeStatus===false) {
            // Remove the dislike status
            let newQueryParts : QueryPart[] = [];
            queryParts.forEach((part: QueryPart) => {
              if (!(part.type==="precomputed" && part.recordID===recordID)) {
                newQueryParts.push(part);
              }
            });
            tab.content.query.parts = newQueryParts;
            receiveQuery(tab.content.query);
        } else {
            // Add the dislike status
            const newQueryPart : QueryPart = {
              identifier: uuidv4(),
              type: "precomputed",
              weight: -1.0,
              isSoft: true,
              recordID: recordID,
              imageInformations: imageInformations
            };
            tab.content.query.parts.push(newQueryPart);
            receiveQuery(tab.content.query);
        }
      }

      const likeRecord = (imageInformations: Record<string, any>) => {
        const recordID = imageInformations["recordID"];
        // Add a QueryPart to the current query
        if(selectedTabIdentifier=="N/A") return;
        const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
        if (!tab) return;

        const likeStatus = getLikeStatus(selectedTabIdentifier, recordID);
        const queryParts = tab.content.query.parts;

        if (likeStatus===true) {
            // Remove the like status
            let newQueryParts : QueryPart[] = [];
            queryParts.forEach((part: QueryPart) => {
              if (!(part.type==="precomputed" && part.recordID===recordID)) {
                newQueryParts.push(part);
              }
            });
            tab.content.query.parts = newQueryParts;
            receiveQuery(tab.content.query);
        } else {
            // Add the like status
            const newQueryPart : QueryPart = {
              identifier: uuidv4(),
              type: "precomputed",
              weight: 1.0,
              isSoft: true,
              recordID: recordID,
              imageInformations: imageInformations
            };
            tab.content.query.parts.push(newQueryPart);
            receiveQuery(tab.content.query);
        }
      }

      return (
        <div className='tabs-container'>          
          <SearchComponent 
            loading={loading}
            receiveQuery={receiveQuery} 
          />
          { getNumberOfTabs()>0 &&
            <>
              { loading
              ? <div className='loading'>
                  <h1>Chargement...</h1>
                </div>
              : <TabContainer 
                tabs={tabs} 
                removeTab={removeTab}
                dislikeRecord={dislikeRecord}
                likeRecord={likeRecord}
                getLikeStatus={getLikeStatus}
              />
              }
            </>
          }
        </div>
      );
};

export default App;
