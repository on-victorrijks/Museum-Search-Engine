import React, {
    useEffect,
    useState,
} from 'react';

import "../../styles/Modals/ModalSlideshowSettings.css";
import { FaTimes } from 'react-icons/fa';
import CollectionData from '../../types/Collections';

import Switch from "react-switch";
import Slider from '@mui/material/Slider';
import SlideShowData from '../../types/Slideshow';

const ModalSlideshowSettings: React.FC<{
    askToClose: () => void;
    collectionData: CollectionData;
    launchSlideshow: (slideShowData: SlideShowData) => void;
}> = ({
    askToClose,
    collectionData,
    launchSlideshow
}) => {

    const [automaticSlideshow, setAutomaticSlideshow] = useState<boolean>(true);
    const [slideshowInterval, setSlideshowInterval] = useState<number>(5000);
    const [infiniteSlideshow, setInfiniteSlideshow] = useState<boolean>(false);
    
    const compileSlideShowData = () => {
        const slideShowData: SlideShowData = {
            collectionData: collectionData,
            automaticSlideshow: automaticSlideshow,
            slideshowInterval: slideshowInterval,
            infiniteSlideshow: infiniteSlideshow
        };
        launchSlideshow(slideShowData);
        askToClose();
    }

    return (
        <div className="modal">
            
            <div className="modal-header">
                <h1>Paramètre du slideshow</h1>
                <button className="modal-close-button" onClick={askToClose}>
                    <FaTimes />
                </button>
            </div>

            <div className="modal-content">

                <div className="modal-input long">
                    <label>Est-ce que le slideshow est automatique ?</label>
                    <Switch
                        onChange={setAutomaticSlideshow}
                        checked={automaticSlideshow}
                    />
                </div>

                <div className="modal-input">
                    <label>Intervalle entre chaque image (en millisecondes)</label>
                    <div className="modal-input-spacer"></div>
                    <Slider
                        value={slideshowInterval}
                        onChange={(e, value) => {
                            value = Math.max(100, Math.min(60000, value as number));
                            setSlideshowInterval(value);
                        }}
                        step={100}
                        min={100}
                        max={60000}
                        valueLabelDisplay="on"
                    />
                </div>

                <div className="modal-input long">
                    <label>Le slideshow est-il infini ?</label>
                    <Switch
                        onChange={setInfiniteSlideshow}
                        checked={infiniteSlideshow}
                    />
                </div>

                <div className="modal-buttons">
                    <button 
                        onClick={compileSlideShowData} 
                    >
                        Démarrer le slideshow
                    </button>
                </div>


            </div>

        </div>
    );
};

export default ModalSlideshowSettings;