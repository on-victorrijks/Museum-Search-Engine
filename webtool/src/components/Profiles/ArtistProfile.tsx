import React, {
    useEffect,
    useState,
} from 'react';
import { TabData } from '../../types/tab';
import "../../styles/ArtistProfile.css";

import axios from 'axios';
import { ApiResponse } from '../../types/ApiResponses';
import ArtPiecesGallery from '../Artwork/ArtPiecesGallery';

interface ArtistData {
    recordID: number;
    fullName: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    deathDate: string;
    birthDeathPlace: string;
    nationality: string;
    artpiecesRecordIDs: number[];
}


const InfoListElement: React.FC<{
    title: string,
    list: string[],
}> = ({ title, list }) => {

    const isListEmpty = list.length == 0;

    return (
        <div className="artist-profile-info-list-element">
            <div className="artist-profile-info-list-element-label">
                <h2>{title}</h2>
            </div>
            <div className="artist-profile-info-list-element-content">
            {isListEmpty && <h4>Aucune information disponible</h4>}
            {list.map((item, index) => (
                <div 
                    className="artist-profile-info-list-element-content-item"
                    key={index}
                >
                    <h3>{item}</h3>
                </div>
            ))}
            </div>
        </div>
    );
}

const InfoElement: React.FC<{
    title: string,
    element: any
}> = ({ title, element }) => {

    const isElementEmpty = element == "";

    return (
        <div className="artist-profile-info-element">
            <div className="artist-profile-info-element-label">
                <h2>{title}</h2>
            </div>
            <div className="artist-profile-info-element-content">
                { isElementEmpty 
                ? <h4>Aucune information disponible</h4>
                : <h3>{element}</h3>
                }
            </div>
        </div>
    );
}

const SubTabBio: React.FC<{
    data: ArtistData;
}> = ({ data }) => (
    <>
        <InfoElement
            title="Nom complet"
            element={data.fullName}
        />
        <InfoElement
            title="Prénom"
            element={data.firstName}
        />
        <InfoElement
            title="Nom de famille"
            element={data.lastName}
        />
        <InfoElement
            title="Date de naissance"
            element={data.birthDate}
        />
        <InfoElement
            title="Date de décès"
            element={data.deathDate}
        />
        <InfoElement
            title="Lieu de naissance et de décès"
            element={data.birthDeathPlace}
        />
        <InfoElement
            title="Nationalité"
            element={data.nationality}
        />
    </>
);

const SubTabOeuvres: React.FC<{
    data: ArtistData;
    openArtPieceProfile: (recordID: number) => void;
}> = ({ data, openArtPieceProfile }) => (
    <>
        <ArtPiecesGallery
            recordIDs={data.artpiecesRecordIDs}
            openArtPieceProfile={openArtPieceProfile}
        />
    </>
);

const RenderSubTab: React.FC<{
    data: ArtistData;
    subtab: Subtabs_Artist;
    openArtPieceProfile: (recordID: number) => void;
}> = ({ data, subtab, openArtPieceProfile }) => {
    
    switch(subtab) {
        case Subtabs_Artist.BIOGRAPHIE:
            return <SubTabBio data={data}/>
        case Subtabs_Artist.OEUVRES:
            return <SubTabOeuvres data={data} openArtPieceProfile={openArtPieceProfile}/>
        default:
            return <></>
    }
}

enum Subtabs_Artist {
    BIOGRAPHIE = "Biographie",
    OEUVRES = "Oeuvres",
}

const ArtistProfile: React.FC<{
    recordID: number;
    tab: TabData;
    openArtPieceProfile: (recordID: number) => void;
}> = ({
    recordID,
    tab,
    openArtPieceProfile
}) => {

    const [subtab, setSubtab] = useState<Subtabs_Artist>(Subtabs_Artist.BIOGRAPHIE);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [data, setData] = useState<ArtistData|undefined>(undefined);

    const fetchData = async () => {
        const body = {
            "recordID": recordID,
        };

        try {
            const response = await axios.post("http://127.0.0.1:5000/api/search/v2/getArtistData", body, {
                headers: {
                'Content-Type': 'application/json',
                },
            });
        
            // Parse response.data as JSON
            const data: ApiResponse = response.data;
            const success = data["success"];
            if (!success) throw new Error(data["message"] ? data["message"].toString() : "An error occurred");
            const results = data["message"];
            if (!results) throw new Error("No results found");
            if (!results["data"]) throw new Error("No data found");
            setData(results["data"]);
            setDataLoaded(true);
        } catch (error) {
            console.error("Error making POST request:", error);
            return { success: false, message: "An error occurred" };
        }
    }

    useEffect(() => {
        if (!dataLoaded) {
            // This is a new tab
            fetchData();
        } else {
            // We check if the recordID has changed
            if (data && data.recordID != recordID) {
                setDataLoaded(false);
                fetchData();
            }
        }
    }, [tab, recordID]);
    
    return (
        <div className="artist-profile-container">

            { !dataLoaded || data==undefined 
            ? 
            <div className="artist-profile-loading">
                <h1>Chargement des données...</h1>
            </div>
            : 
            <>
            <div className="artist-profile-header">
                <h3>Profil de l'artiste</h3>
                <h1>{data.fullName}</h1>
            </div>

            <div className="artist-profile-stabs">
                <div className="artist-profile-stabs-selector">
                    { Object.entries(Subtabs_Artist).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => setSubtab(value as Subtabs_Artist)}
                            is-selected={subtab == (value as Subtabs_Artist) ? "true" : "false"}
                        >
                            {value}
                        </button>
                    ))}
                </div>
                <div className="artist-profile-stabs-content">
                    <RenderSubTab 
                        data={data}
                        subtab={subtab}
                        openArtPieceProfile={openArtPieceProfile}
                    />
                </div>
            </div>
            </>
            }

        </div>
    );
};

export default ArtistProfile;