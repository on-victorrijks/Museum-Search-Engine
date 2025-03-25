import React, {
    useEffect,
    useState,
} from 'react';
import { TabData } from '../../types/tab';
import "../../styles/ArtistProfile.css";

import axios from 'axios';
import { ApiResponse, SuccessfulArtistDataResponse } from '../../types/ApiResponses';
import ArtPiecesGallery from '../Artwork/ArtPiecesGallery';
import { NotificationType } from '../../types/Notification';
import { useNotification } from '../../contexts/NotificationContext';
import ArtistData from '../../types/ArtistData';

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
            element={data.creatorfirstname + " " + data.creatorlastname}
        />
        <InfoElement
            title="Prénom"
            element={data.creatorfirstname}
        />
        <InfoElement
            title="Nom de famille"
            element={data.creatorlastname}
        />
        <InfoElement
            title="Date de naissance"
            element={data.creatorbirthdate}
        />
        <InfoElement
            title="Date de décès"
            element={data.creatordeathdate}
        />
        <InfoElement
            title="Lieu de naissance et de décès"
            element={data.creatorbirthanddeathdescription}
        />
        <InfoElement
            title="Nationalité"
            element={data.creatornationality}
        />
    </>
);

const SubTabOeuvres: React.FC<{
    data: ArtistData;
    openArtPieceProfile: (recordID: number) => void;
}> = ({ data, openArtPieceProfile }) => (
    <ArtPiecesGallery
        recordIDs={data.artworkrecordids}
        openArtPieceProfile={openArtPieceProfile}
    />
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
    creatorid: string;
    tab: TabData;
    openArtPieceProfile: (recordID: number) => void;
}> = ({
    creatorid,
    tab,
    openArtPieceProfile
}) => {

    const { showNotification } = useNotification();

    const [subtab, setSubtab] = useState<Subtabs_Artist>(Subtabs_Artist.BIOGRAPHIE);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [data, setData] = useState<ArtistData|undefined>(undefined);

    const fetchData = async () => {

        try {
            const response = await axios.get("http://127.0.0.1:5000/api/artist/" + creatorid);
        
            // Parse response.data as JSON
            const data: ApiResponse = response.data;
            const success = data["success"];
            if (!success) throw new Error(data["error_message"] ? data["error_message"].toString() : "An error occurred");    
            const results = data as SuccessfulArtistDataResponse;
            if (!results) throw new Error("No data found");
            if (!results.data) throw new Error("No data found");
            setData(results.data);
            setDataLoaded(true);
        } catch (error) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Erreur lors de la récupération des données",
                text: "Une erreur est survenue lors de la récupération des données",
                buttons: [],
                timeout: 5000
            });
            return { success: false, message: "An error occurred" };
        }
    }

    useEffect(() => {
        if (!dataLoaded) {
            // This is a new tab
            fetchData();
        } else {
            // We check if the recordID has changed
            if (data && data.creatorid != creatorid) {
                setDataLoaded(false);
                fetchData();
            }
        }
    }, [tab, creatorid]);
    
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
                <h1>{data.creatorfirstname + " " + data.creatorlastname}</h1>
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