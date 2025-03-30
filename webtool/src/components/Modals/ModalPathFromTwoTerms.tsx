import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useCollection } from '../../contexts/CollectionContext';
import { useModal } from '../../contexts/ModalContext';
import { NotificationType } from '../../types/Notification';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';
import { useSettings } from '../../contexts/SettingsContext';

const ModalPathFromTwoTerms: React.FC = () => {

    const { showNotification } = useNotification();
    const { editCollection, collections } = useCollection();
    const { closePathFromTwoTerms, data__PathFromTwoTerms } = useModal();
    const { settings } = useSettings();
    
    const [term1, setTerm1] = useState<string>('');
    const [term2, setTerm2] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!term1 || !term2) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Erreur",
                text: "Veuillez remplir tous les champs",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "Veuillez remplir tous les champs",
                    origin: "handleSubmit"
                }
            });
            return;
        }

        const collectionIdentifier = data__PathFromTwoTerms.collectionIdentifier;
        if (!collectionIdentifier) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Erreur",
                text: "La collection n'existe pas",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "La collection n'existe pas",
                    origin: "handleSubmit"
                }
            });
            return;
        }   
        
        const collection = collections.find((collection) => collection.identifier === collectionIdentifier);

        if (!collection) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Erreur",
                text: "La collection n'existe pas",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "La collection n'existe pas",
                    origin: "handleSubmit"          
                }
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:5000/api/collection/path_from_two_terms', {
                model_name: settings.model_name,
                recordIDs: collection.recordIDs,
                term1: term1,
                term2: term2
            });

            const updatedCollection = {
                ...collection,
                recordIDs: response.data.data
            };
            editCollection(collectionIdentifier, updatedCollection);    

            showNotification({
                type: NotificationType.SUCCESS,
                title: "Succès",
                text: "Le chemin entre les deux termes a été calculé avec succès",
                buttons: [],
                timeout: 5000
            });

            closePathFromTwoTerms();
        } catch (error) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Erreur",
                text: "Une erreur est survenue lors du calcul du chemin entre les deux termes",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "Une erreur est survenue lors du calcul du chemin entre les deux termes",
                    origin: "handleSubmit"
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal">
            <div className="modal-header">
                <h1>Chemin entre deux termes</h1>
                <button className="modal-close-button" onClick={closePathFromTwoTerms}>
                    <FaTimes />
                </button>
            </div>

            <div className="modal-content">
   
                <div className="modal-input">
                    <label>Premier terme</label>
                    <input 
                        placeholder='Premier terme'
                        type="text" 
                        value={term1}
                        onChange={(e) => setTerm1(e.target.value)}
                    />
                </div>

                <div className="modal-input">
                    <label>Deuxième terme</label>
                    <input 
                        placeholder='Deuxième terme'
                        type="text" 
                        value={term2}
                        onChange={(e) => setTerm2(e.target.value)}
                    />
                </div>

                <div className="modal-buttons">
                    <button onClick={closePathFromTwoTerms}>Annuler</button>
                    <button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Chargement...' : 'Appliquer'}
                    </button>
                </div>
                
            </div>
        </div>
    );

};

export default ModalPathFromTwoTerms; 