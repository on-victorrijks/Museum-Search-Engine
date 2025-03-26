import { FaSync, FaTimes, FaUndo } from "react-icons/fa";

import { FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { QueryPart, SoftQueryPart, SoftQueryType } from "../../../types/queries";
import { Slider } from "@mui/material";

const SearchButton: React.FC<{
    canSearch: boolean,
    compileIntoTab: (isNewSearch: boolean) => void
}> = ({ 
    canSearch,
    compileIntoTab
}) => {
    return (
        <button
            onClick={() => compileIntoTab(false)}
            disabled={!canSearch}
        >
            Rechercher
        </button>
    );
}
const NewQueryButton: React.FC<{
    canSearch: boolean,
    compileIntoTab: (isNewSearch: boolean) => void
}> = ({ 
    canSearch,
    compileIntoTab
}) => {
    return (
        <button
            onClick={() => compileIntoTab(true)}
            disabled={!canSearch}
        >
            Nouvel onglet
        </button>
    );
}
const ClearButton: React.FC<{
    resetQuery: () => void,
    canReset: boolean
}> = ({
    resetQuery,
    canReset
}) => {
    return (
        <button 
            className="square" 
            onClick={resetQuery}
            disabled={!canReset}
        >
            <FaUndo />
        </button>
    );
}
const AutoSearchButton: React.FC<{
    isAutoSearchEnabled: boolean,
    setIsAutoSearchEnabled: (isAutoSearchEnabled: boolean) => void
}> = ({
    isAutoSearchEnabled,
    setIsAutoSearchEnabled
}) => {
    return (
        <button
            className="square"
            onClick={() => setIsAutoSearchEnabled(!isAutoSearchEnabled)}
            is-enabled={isAutoSearchEnabled.toString()}
        >
            <FaSync />
        </button>
    );  
}

const renderKeyword = (
    isEnabled: boolean,
    toggleKeyword: (keyword: string) => void,
    keyword: string
) => {
    return (
        <div 
            key={keyword} 
            className={`keyword ${isEnabled ? 'enabled' : ''}`}
            onClick={() => toggleKeyword(keyword)}
        >
            <h3>{keyword}</h3>
        </div>
    );
}
const renderColor = (
    isEnabled: boolean,
    toggleColor: (colorId: string) => void,
    color: { id: string, style: string }
) => {
    return (
        <div 
            key={color.id} 
            className={`color ${isEnabled ? 'enabled' : ''}`}
            style={{ background: color.style }}
            onClick={() => toggleColor(color.id)}
        >
        </div>
    );
}
const renderLuminosity = (
    isEnabled: boolean,
    toggleLuminosity: (luminosityId: string) => void,
    luminosity: { id: string, color: string, text: string, textColor: string }
) => {
    return (
        <div 
            key={luminosity.id} 
            className={`luminosity ${isEnabled ? 'enabled' : ''}`}
            style={{ background: luminosity.color, color: luminosity.textColor }}
            onClick={() => toggleLuminosity(luminosity.id)}
        >
            <h3 
                style={{ color: luminosity.textColor }}
            >{luminosity.text}</h3>
        </div>
    );
}
const RenderSlider = (
    updateQueryPartWeight: (identifier: string, weight: number) => void,
    loading: boolean,
    queryPart: SoftQueryPart
) => {
    return (
        <div className='queryPart-Slider'>
            <div className='side min'>
                <FaThumbsDown />
            </div>
            <Slider
                defaultValue={queryPart.weight}
                step={0.25}
                min={-2}
                max={2}
                valueLabelDisplay="off"
                onChangeCommitted={(e, value) => updateQueryPartWeight(
                    queryPart.identifier, 
                    value as number
                )}
                color='primary'
                disabled={loading}
            />
            <div className='side max'>
                <FaThumbsUp />
            </div>
        </div>
    );
}
const formatType = (type: string) => {
    switch(type) {
        case SoftQueryType.TERM:
            return 'Texte';
        case SoftQueryType.KEYWORD:
            return 'Mot-clé';
        case SoftQueryType.COLOR:
            return 'Couleur';
        case SoftQueryType.LUMINOSITY:
            return 'Luminosité';
        case SoftQueryType.PRECOMPUTED:
            return 'Image';
        default:
            return 'Inconnu';
    }
}
const renderSoftQueryPart = (
    removeQueryPart: (identifier: string) => void,
    updateQueryPartWeight: (identifier: string, weight: number) => void,
    loading: boolean,
    queryPart: SoftQueryPart
) => {
    let imageURL;
    if (queryPart.imageInformations) {
        imageURL = "http://127.0.0.1:5000/api/artwork/" + queryPart.imageInformations.recordid + "/image";
    }

    return (
        <div key={queryPart.identifier} className="queryPart">
            { queryPart.imageInformations &&
            <div className="queryPartImage" style={{ backgroundImage: `url(${imageURL})` }}>
            </div>
            }
            <div className='queryPart-Header'>
                <div className="queryPartText">
                    <h4>{formatType(queryPart.type)}</h4>
                    {queryPart.term && <h2>{queryPart.term}</h2>}
                    {queryPart.keyword && <h2>{queryPart.keyword}</h2>}
                    {queryPart.color && <h2>{queryPart.color}</h2>}
                    {queryPart.luminosity && <h2>{queryPart.luminosity}</h2>}
                    {queryPart.imageInformations && <>
                        <h2>
                            {queryPart.imageInformations.title} - {queryPart.imageInformations.creatorfirstname} {queryPart.imageInformations.creatorlastname}
                        </h2>
                    </>}
                </div>
                <button
                    onClick={() => removeQueryPart(queryPart.identifier)}
                >
                    <FaTimes />
                </button>
            </div>
            {RenderSlider(
                updateQueryPartWeight,
                loading,
                queryPart
            )}
        </div>
    );
}

const BottomButtons = ({
    blocksValid,
    queryParts,
    compileIntoTab,
    resetQuery,
    isAutoSearchEnabled,
    setIsAutoSearchEnabled
}: {
    blocksValid: boolean,
    queryParts: QueryPart[],
    compileIntoTab: (isNewSearch: boolean) => void,
    resetQuery: () => void,
    isAutoSearchEnabled: boolean,
    setIsAutoSearchEnabled: (isAutoSearchEnabled: boolean) => void
}) => {
    return (
        <div className="buttons">
        <SearchButton
            canSearch={blocksValid && queryParts.length > 0} 
            compileIntoTab={compileIntoTab}
        />
        <NewQueryButton 
            canSearch={blocksValid && queryParts.length > 0} 
            compileIntoTab={compileIntoTab} 
        />
        <ClearButton
            canReset={queryParts.length > 0}
            resetQuery={resetQuery}
        />
        <AutoSearchButton
            isAutoSearchEnabled={isAutoSearchEnabled}
            setIsAutoSearchEnabled={setIsAutoSearchEnabled}
        />
    </div>
    );
}

export {
    SearchButton,
    NewQueryButton,
    ClearButton,
    renderKeyword,
    renderColor,
    renderLuminosity,
    renderSoftQueryPart,
    BottomButtons
}
