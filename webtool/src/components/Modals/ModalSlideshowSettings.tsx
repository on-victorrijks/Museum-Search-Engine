import React, { useState } from 'react';

import "../../styles/Modals/ModalSlideshowSettings.css";
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

import Switch from "react-switch";
import Slider from '@mui/material/Slider';
import SlideShowData from '../../types/Slideshow';
import { useCollection } from '../../contexts/CollectionContext';
import { useModal } from '../../contexts/ModalContext';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types/Notification';
import Slideshow from '../Slideshow';

const ModalSlideshowSettings: React.FC<{}> = ({}) => {

    const { showNotification } = useNotification();
    const { getCollection } = useCollection();
    const { closeSlideshowSettings, data__SlideshowSettings } = useModal();

    const [automaticSlideshow, setAutomaticSlideshow] = useState<boolean>(true);
    const [slideshowInterval, setSlideshowInterval] = useState<number>(5000);
    const [infiniteSlideshow, setInfiniteSlideshow] = useState<boolean>(false);
    
    const [slideShowData, setSlideShowData] = useState<SlideShowData|undefined>(undefined);

    const compileSlideShowData = () => {
        try {

            const collectionData = getCollection(data__SlideshowSettings.collectionIdentifier);
            if (!collectionData) {
                throw new Error("Collection non trouvée");
            }

            const slideShowData: SlideShowData = {
                    collectionData: collectionData,
                    automaticSlideshow: automaticSlideshow,
                    slideshowInterval: slideshowInterval,
                    infiniteSlideshow: infiniteSlideshow
            };
            launchSlideshow(slideShowData);
            
        } catch (error: any) {
            showNotification({
                type: NotificationType.ERROR,
                text: "Une erreur est survenue lors de la compilation du slideshow",
                title: "Erreur lors de la compilation du slideshow",
                icon: <FaExclamationTriangle />,
                buttons: [],
                errorContext: {
                    timestamp: new Date().getTime(),
                    message: error.toString(),
                    origin: "ModalSlideshowSettings"
                }
            });
        }
    }

    const launchSlideshow = (slideShowData: SlideShowData) => {
        setSlideShowData(slideShowData);
    }

    return (
        <>
            { slideShowData &&
                <Slideshow
                    collectionData={slideShowData.collectionData}
                    automaticSlideshow={slideShowData.automaticSlideshow}
                    slideshowInterval={slideShowData.slideshowInterval}
                    infiniteSlideshow={slideShowData.infiniteSlideshow}
                    exitSlideshow={() => setSlideShowData(undefined)}
                />  
            }

            <div className="modal">
                
                <div className="modal-header">
                    <h1>Paramètre du slideshow</h1>
                    <button className="modal-close-button" onClick={closeSlideshowSettings}>
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
                            onChange={(_e, value) => {
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

        </>
    );
};

export default ModalSlideshowSettings;