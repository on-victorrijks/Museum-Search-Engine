import React, {
    use,
    useEffect,
    useState,
} from 'react';
import { TabData } from '../types/tab';
import "../styles/ArtPieceProfile.css";
import { FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import SimilarImages from './SimilarImages';

import axios from 'axios';
import ApiResponse from '../types/ApiResponse';

interface ArtPieceData {
    recordID: number;
    workID: string;
    title: string;
    earliestDate: string;
    latestDate: string;
    iconography: string[];
    classification: string;
    objectType: string;
    materials: string[];
    inscription: string;
    height: string;
    width: string;
    imageColor: string;
    author: string;
    creatorFirstName: string;
    creatorLastName: string;
    creatorBirthDate: string;
    creatorDeathDate: string;
    creatorBirthDeathPlace: string;
    creatorNationality: string;
}

const ArtPieceHeader: React.FC<{
    data: ArtPieceData,
    openArtistProfile: (recordID: number) => void;
}> = ({ data, openArtistProfile }) => {
    return (
        <div className="ap-profile-header-main-infos">
            <h1>{data.title=="" ? "Titre inconnu" : data.title}</h1>
            <h2 onClick={() => openArtistProfile(data.recordID)}>
                {data.author=="" ? "Auteur inconnue" : data.author}
            </h2>
            <div className="ap-profile-header-mi-date">
                <h2>{data.earliestDate}</h2>
                <div className="bubble"></div>
                <h2>{data.latestDate}</h2>
            </div>
        </div>
    );
}

const ArtPieceImage: React.FC<{
    data: ArtPieceData;
}> = ({ data }) => {
    const imageURL = "http://127.0.0.1:5000/images/" + data.recordID;
    return (
        <div className="ap-profile-header-image">
            <img src={imageURL} />
        </div>
    );
}

const InfoListElement: React.FC<{
    title: string,
    list: string[],
}> = ({ title, list }) => {

    const isListEmpty = list.length == 0;

    return (
        <div className="ap-profile-info-list-element">
            <div className="ap-profile-info-list-element-label">
                <h2>{title}</h2>
            </div>
            <div className="ap-profile-info-list-element-content">
            {isListEmpty && <h4>Aucune information disponible</h4>}
            {list.map((item, index) => (
                <div 
                    className="ap-profile-info-list-element-content-item"
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
        <div className="ap-profile-info-element">
            <div className="ap-profile-info-element-label">
                <h2>{title}</h2>
            </div>
            <div className="ap-profile-info-element-content">
                { isElementEmpty 
                ? <h4>Aucune information disponible</h4>
                : <h3>{element}</h3>
                }
            </div>
        </div>
    );
}

const Subtab_ObjectsPresents: React.FC<{
    data: ArtPieceData;
}> = ({data}) => (
    <>
        <InfoListElement 
            title="Iconographie"
            list={data.iconography}
        />
    </>
);

const Subtab_ArtPiece: React.FC<{
    data: ArtPieceData;
}> = ({data}) => (
    <>
        <InfoElement 
            title="Classification"
            element={data.classification}
        />
        <InfoElement // SHOULD BE LISt ??
            title="Type d'objet"
            element={data.objectType}
        />
        <InfoListElement 
            title="Matériaux"
            list={data.materials}
        />
        <InfoElement 
            title="Inscription"
            element={data.inscription}
        />
        <InfoElement 
            title="Hauteur"
            element={data.height}
        />
        <InfoElement 
            title="Largeur"
            element={data.width}
        />
        <InfoElement 
            title="Couleur de l'image"
            element={data.imageColor}
        />
    </>
);

const Subtab_Creator: React.FC<{
    data: ArtPieceData;
}> = ({data}) => ( 
    <>
        <InfoElement
            title="Prénom de l'artiste"
            element={data.creatorFirstName}
        />
        <InfoElement
            title="Nom de famille de l'artiste"
            element={data.creatorLastName}
        />
        <InfoElement
            title="Date de naissance de l'artiste"
            element={data.creatorBirthDate}
        />
        <InfoElement
            title="Date de décès de l'artiste"
            element={data.creatorDeathDate}
        />
        <InfoElement
            title="Lieu de naissance et de décès de l'artiste"
            element={data.creatorBirthDeathPlace}
        />
        <InfoElement
            title="Nationalité de l'artiste"
            element={data.creatorNationality}
        />
    </>
);

const Subtab_Identifiers: React.FC<{
    data: ArtPieceData;
}> = ({data}) => (
    <>
        <InfoElement
            title="RecordID"
            element={data.recordID}
        />
        <InfoElement
            title="workID"
            element={data.workID}
        />
    </>
);

const Subtab_Neighbours: React.FC<{
    data: ArtPieceData;
    openArtPieceProfile: (recordID: number) => void;
}> = ({data, openArtPieceProfile}) => (
    <SimilarImages 
        recordID={data.recordID}
        openArtPieceProfile={openArtPieceProfile}
    />
);

const RenderSubTab: React.FC<{
    data: ArtPieceData;
    subtab: Subtabs;
    openArtPieceProfile: (recordID: number) => void;
}> = ({ data, subtab, openArtPieceProfile }) => {
    
    switch(subtab) {
        case Subtabs.OBJECTS_PRESENTS:
            return <Subtab_ObjectsPresents data={data}/>;
        case Subtabs.ART_PIECE:
            return <Subtab_ArtPiece data={data}/>;
        case Subtabs.CREATOR:
            return <Subtab_Creator data={data}/>;
        case Subtabs.IDENTIFIERS:
            return <Subtab_Identifiers data={data}/>;
        case Subtabs.NEIGHBOURS:
            return <Subtab_Neighbours data={data} openArtPieceProfile={openArtPieceProfile}/>;
        default:
            return <></>
    }
}

enum Subtabs {
    OBJECTS_PRESENTS = "Objects présents",
    ART_PIECE = "Oeuvre",
    CREATOR = "Artiste",
    IDENTIFIERS = "Identifiants",
    NEIGHBOURS = "Images imilaires",
}

const ArtPieceProfile: React.FC<{
    recordID: number;
    tab: TabData;
    openArtPieceProfile: (recordID: number) => void;
    openArtistProfile: (recordID: number) => void;
}> = ({
    recordID,
    tab,
    openArtPieceProfile,
    openArtistProfile
}) => {

    const [subtab, setSubtab] = useState<Subtabs>(Subtabs.OBJECTS_PRESENTS);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [data, setData] = useState<ArtPieceData|undefined>(undefined);

    const fetchData = async () => {
        const body = {
            "recordID": recordID,
        };

        try {
            const response = await axios.post("http://127.0.0.1:5000/api/search/v2/getData", body, {
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
        <div className="ap-profile-container">

            { !dataLoaded || data==undefined 
            ? 
            <div className="ap-profile-loading">
                <h1>Chargement des données...</h1>
            </div>
            : 
            <>
            <div className="ap-profile-header">
                <ArtPieceImage data={data}/>
                <ArtPieceHeader data={data} openArtistProfile={openArtistProfile}/>
            </div>

            <div className="ap-profile-stabs">
                <div className="ap-profile-stabs-selector">
                    { Object.entries(Subtabs).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => setSubtab(value as Subtabs)}
                            is-selected={subtab == (value as Subtabs) ? "true" : "false"}
                        >
                            {value}
                        </button>
                    ))}
                </div>
                <div className="ap-profile-stabs-content">
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

export default ArtPieceProfile;