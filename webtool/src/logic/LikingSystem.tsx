import ArtPieceData from "../types/ArtPiece";
import { Query, QueryPart, SoftQueryPart, SoftQueryType } from "../types/queries";
import { TabData } from "../types/tab";

import { v4 as uuidv4 } from 'uuid';

const getLikeStatus = (
    tabs: TabData[],
    selectedTabIdentifier: string,
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

const likeRecord = (
    tabs: TabData[],
    selectedTabIdentifier: string,
    setQueryParts: (queryParts: QueryPart[]) => void,
    receiveQuery: (query: Query) => void,
    imageInformations: ArtPieceData
) => {
    const recordID = imageInformations.recordid;
    // Add a QueryPart to the current query
    if(selectedTabIdentifier=="N/A") return;
    const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
    if (!tab) return;

    const likeStatus = getLikeStatus(tabs, selectedTabIdentifier, recordID);
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

const dislikeRecord = (
    tabs: TabData[],
    selectedTabIdentifier: string,
    setQueryParts: (queryParts: QueryPart[]) => void,
    receiveQuery: (query: Query) => void,
    imageInformations: ArtPieceData
) => {
    const recordID = imageInformations.recordid;
    // Add a QueryPart to the current query
    if(selectedTabIdentifier=="N/A") return;
    const tab = tabs.find(tab => tab.identifier === selectedTabIdentifier);
    if (!tab) return;

    const likeStatus = getLikeStatus(tabs, selectedTabIdentifier, recordID);
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


export { getLikeStatus, likeRecord, dislikeRecord };