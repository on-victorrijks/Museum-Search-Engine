import React, {
    useEffect,
    useState,
} from 'react';
import { TabData } from '../../types/tab';
import "../../styles/ArtPieceProfile.css";
import SimilarImages from '../Artwork/SimilarImages';

import axios from 'axios';
import { ApiResponse, SuccessfulArtPieceDataResponse } from '../../types/ApiResponses';
import ArtPieceInteractions from '../Artwork/ArtPieceInteractions';
import ArtPieceData from '../../types/ArtPiece';
import { NotificationType } from '../../types/Notification';
import { useNotification } from '../../contexts/NotificationContext';

const ArtPieceHeader: React.FC<{
    data: ArtPieceData,
    openArtistProfile: (creatorid: string) => void;
    isLiked: boolean|undefined,
    likeRecord: (data: ArtPieceData) => void,
    dislikeRecord: (data: ArtPieceData) => void,
    canLike: boolean,
}> = ({ 
    data, 
    openArtistProfile,
    isLiked,
    likeRecord,
    dislikeRecord,
    canLike
}) => {
    return (
        <div className="ap-profile-header-main-infos">
            <h1>{data.title=="" ? "Titre inconnu" : data.title}</h1>
            <h2 onClick={() => openArtistProfile(data.creatorid)}>
                {data.creatorfirstname=="" ? "Auteur inconnue" : data.creatorfirstname + " " + data.creatorlastname}
            </h2>
            <div className="ap-profile-header-mi-date">
                <h2>{data.creationearliestdate}</h2>
                <div className="bubble"></div>
                <h2>{data.creationlatestdate}</h2>
            </div>
            <ArtPieceInteractions
                recordID={data.recordid}
                isLiked={isLiked}
                likeRecord={() => likeRecord(data)}
                dislikeRecord={() => dislikeRecord(data)}
                canLike={canLike}
            />
        </div>
    );
}

const ArtPieceImage: React.FC<{
    data: ArtPieceData;
}> = ({ data }) => {
    const imageURL = "http://127.0.0.1:5000/api/artwork/" + data.recordid + "/image";
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

const Subtab_Values: React.FC<{
    title: string;
    values: any[]
}> = ({title, values}) => (
    <InfoListElement 
        title={title}
        list={values}
    />
);

const Subtab_UniqueValue: React.FC<{
    title: string;
    value: string;
}> = ({title, value}) => (
    <InfoElement 
        title={title}
        element={value}
    />
);


const Subtab_ArtPiece: React.FC<{
    data: ArtPieceData;
}> = ({data}) => (
    <>
        <InfoElement 
            title="Classification"
            element={data.termclassification}
        />
        <InfoElement // SHOULD BE LISt ??
            title="Type d'objet"
            element={data.objectworktype}
        />
        <InfoListElement 
            title="Matériaux"
            list={data.materials}
        />
        <InfoElement 
            title="Inscription"
            element={data.signaturefulldescription}
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
            element={data.imagecolor}
        />
    </>
);

const Subtab_Creator: React.FC<{
    data: ArtPieceData;
}> = ({data}) => ( 
    <>
        <InfoElement
            title="Prénom de l'artiste"
            element={data.creatorfirstname}
        />
        <InfoElement
            title="Nom de famille de l'artiste"
            element={data.creatorlastname}
        />
        <InfoElement
            title="Date de naissance de l'artiste"
            element={data.creatorbirthdate}
        />
        <InfoElement
            title="Date de décès de l'artiste"
            element={data.creatordeathdate}
        />
        <InfoElement
            title="Lieu de naissance et de décès de l'artiste"
            element={data.creatorbirthanddeathdescription}
        />
        <InfoElement
            title="Nationalité de l'artiste"
            element={data.creatornationality}
        />
    </>
);

const Subtab_Identifiers: React.FC<{
    data: ArtPieceData;
}> = ({data}) => (
    <>
        <InfoElement
            title="RecordID"
            element={data.recordid}
        />
        <InfoElement
            title="workID"
            element={data.workid}
        />
    </>
);

const Subtab_Neighbours: React.FC<{
    data: ArtPieceData;
    openArtPieceProfile: (recordID: number) => void;
}> = ({data, openArtPieceProfile}) => (
    <SimilarImages 
        recordID={data.recordid}
        openArtPieceProfile={openArtPieceProfile}
    />
);

const RenderSubTab: React.FC<{
    data: ArtPieceData;
    subtab: Subtabs;
    openArtPieceProfile: (recordID: number) => void;
}> = ({ data, subtab, openArtPieceProfile }) => {
    
    switch(subtab) {
        case Subtabs.ART_PIECE:
            return <Subtab_ArtPiece data={data}/>;
        case Subtabs.CREATOR:
            return <Subtab_Creator data={data}/>;
        case Subtabs.IDENTIFIERS:
            return <Subtab_Identifiers data={data}/>;
        case Subtabs.NEIGHBOURS:
            return <Subtab_Neighbours data={data} openArtPieceProfile={openArtPieceProfile}/>;
        case Subtabs.CFT_VALUES:
            return <Subtab_Values title="Concepts" values={data.cft_values}/>;
        case Subtabs.IFT_VALUES:
            return <Subtab_Values title="Termes iconographiques" values={data.ift_values}/>;
        case Subtabs.STF_VALUES:
            return <Subtab_Values title="Sujets" values={data.stf_values}/>;
        case Subtabs.II_VALUE:
            return <Subtab_UniqueValue title="Interprétation iconographique" value={data.ii_value}/>;
        case Subtabs.GSD_VALUE:
            return <Subtab_UniqueValue title="Description générale du sujet" value={data.gsd_value}/>;
        case Subtabs.SSI_VALUE:
            return <Subtab_UniqueValue title="Identification spécifique du sujet" value={data.ssi_value}/>;
        default:
            return <></>
    }
}

enum Subtabs {
    ART_PIECE = "Oeuvre",
    CREATOR = "Artiste",
    IDENTIFIERS = "Identifiants",
    NEIGHBOURS = "Images imilaires",
    CFT_VALUES = "Concepts",
    IFT_VALUES = "Termes iconographiques",
    STF_VALUES = "Sujets",
    II_VALUE = "Interprétation iconographique",
    GSD_VALUE = "Description générale du sujet",
    SSI_VALUE = "Identification spécifique du sujet",
}

const ArtPieceProfile: React.FC<{
    recordID: number;
    tab: TabData;
    openArtPieceProfile: (recordID: number) => void;
    openArtistProfile: (creatorid: string) => void;
    dislikeRecord: (imageInformations: ArtPieceData) => void;
    likeRecord: (imageInformations: ArtPieceData) => void;
    getLikeStatus: (recordID: number) => boolean | undefined;
    canLike: boolean;
}> = ({
    recordID,
    tab,
    openArtPieceProfile,
    openArtistProfile,
    dislikeRecord,
    likeRecord,
    getLikeStatus,
    canLike
}) => {
    const { showNotification } = useNotification();

    const [subtab, setSubtab] = useState<Subtabs>(Subtabs.NEIGHBOURS);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [data, setData] = useState<ArtPieceData|undefined>(undefined);

    const fetchData = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:5000/api/artwork/" + recordID);
        
            // Parse response.data as JSON
            const data: ApiResponse = response.data;
            const success = data["success"];
            if (!success) throw new Error(data["error_message"] ? data["error_message"].toString() : "An error occurred");
            const results = data as SuccessfulArtPieceDataResponse;
            if (!results) throw new Error("No results found");
            if (!results.data) throw new Error("No data found");
            setData(results.data);
            setDataLoaded(true);
        } catch (error) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Erreur lors de la récupération des données",
                text: "Une erreur est survenue lors de la récupération des données",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "Une erreur est survenue lors de la récupération des données",
                    origin: "fetchData"
                }
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
            if (data && data.recordid != recordID) {
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
                <ArtPieceHeader 
                    data={data} 
                    openArtistProfile={openArtistProfile}
                    isLiked={getLikeStatus(data.recordid)}
                    likeRecord={likeRecord}
                    dislikeRecord={dislikeRecord}
                    canLike={canLike}
                />
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