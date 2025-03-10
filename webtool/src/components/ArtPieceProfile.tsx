import React, {
    use,
    useEffect,
    useState,
} from 'react';
import { TabData } from '../types/tab';
import "../styles/ArtPieceProfile.css";

/*
MAIN INFOS:
<option value="title">Titre de l'oeuvre</option>
<option value="earliestDate">Date de création (est. basse)</option>
<option value="latestDate">Date de création (est. haute)</option>
<option value="creator">Nom de l'artiste</option>


MORE INFOS:
    OBJECTS PRESENTS:
<option value="iconography">Objects présents</option>

    ART PIECE:
<option value="classification">Classification</option>
<option value="objectType">Type d'objet</option>
<option value="materials">Matériaux</option>
<option value="inscription">Inscription</option>
<option value="measurements_0">Hauteur</option>
<option value="measurements_1">Largeur</option>
<option value="imageColor">Couleur de l'image</option>

    CREATOR:
<option value="creatorFirstName">Prénom de l'artiste</option>
<option value="creatorLastName">Nom de famille de l'artiste</option>
<option value="creatorBirthDate">Date de naissance de l'artiste</option>
<option value="creatorDeathDate">Date de décès de l'artiste</option>
<option value="creatorBirthDeathPlace">Lieu de naissance et de décès de l'artiste</option>
<option value="creatorNationality">Nationalité de l'artiste</option></select>

    IDENTIFIERS:
<option value="recordID">ID</option>
<option value="workID">workID</option>
*/

const ArtPieceHeader: React.FC<{
    title: string,
    earliestDate: string,
    latestDate: string,
    creator: string,
}> = ({ 
    title,
    earliestDate,
    latestDate,
    creator,
}) => (
    <div className="ap-profile-header-main-infos">
        <h1>{title}</h1>
        <h2>{creator}</h2>
        <div className="ap-profile-header-mi-date">
            <h2>{earliestDate}</h2>
            <div className="bubble"></div>
            <h2>{latestDate}</h2>
        </div>
    </div>
);

const InfoListElement: React.FC<{
    title: string,
    list: string[],
}> = ({ title, list }) => (
    <div className="ap-profile-info-list-element">
        <div className="ap-profile-info-list-element-label">
            <h2>{title}</h2>
        </div>
        <div className="ap-profile-info-list-element-content">
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

const Subtab_ObjectsPresents: React.FC<{
    tab: TabData;
}> = (tab) => (
    <>
        <InfoListElement 
            title="Iconographie"
            list={["test1", "test2", "test3"]}
        />
    </>
);

const RenderSubTab: React.FC<{
    tab: TabData;
    subtab: Subtabs;
}> = ({ tab, subtab }) => {
    
    switch(subtab) {
        case Subtabs.OBJECTS_PRESENTS:
            return <Subtab_ObjectsPresents tab={tab}/>;
        case Subtabs.ART_PIECE:
            return <div>ART PIECE</div>;
        case Subtabs.CREATOR:
            return <div>CREATOR</div>;
        case Subtabs.IDENTIFIERS:
            return <div>IDENTIFIERS</div>;
        default:
            return <></>
    }
}

enum Subtabs {
    OBJECTS_PRESENTS = "Objects présents",
    ART_PIECE = "Oeuvre",
    CREATOR = "Artiste",
    IDENTIFIERS = "Identifiants",
}

const ArtPieceProfile: React.FC<{
    tab: TabData;
}> = ({
    tab
}) => {

    const [subtab, setSubtab] = useState<Subtabs>(Subtabs.OBJECTS_PRESENTS);
    
    useEffect(() => {
        console.log(tab);
    }, [tab])

    
    return (
        <div className="ap-profile-container">

            <div className="ap-profile-header">
                <div className="ap-profile-header-image">
                    <img src="" />
                </div>
                <ArtPieceHeader 
                    title="Titre de l'oeuvre"
                    earliestDate="Date de création (est. basse)"
                    latestDate="Date de création (est. haute)"
                    creator="Nom de l'artiste"
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
                        tab={tab}
                        subtab={subtab}
                    />
                </div>
            </div>

        </div>
    );
};

export default ArtPieceProfile;