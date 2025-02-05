import pandas as pd
import os
import random
import numpy as np
import torch
from PIL import Image
from multilingual_clip import pt_multilingual_clip # Note: add device parameter to forward manually
from tqdm import tqdm
import matplotlib.pyplot as plt
from transformers import CLIPProcessor, CLIPModel

import open_clip
import clip

import transformers
from torch.utils.data import DataLoader, Dataset
from sklearn.metrics.pairwise import cosine_similarity

OBJECTS = [
    "homme",
    "femme",
    "animal",
    "maison",
    "arbre",
    "bateau",
]

LUMINOSITIES = [
    "Lumineux",
    "Sombre",
]

COLORS = [
    "Rouge",
    "Vert",
    "Bleu",
    "Jaune",
    "Blanc",
    "Noir",
]

class ImageTextDataset(Dataset):
    def __init__(self, dataframe, preprocess, getImageFromRecordID):
        self.dataframe = dataframe
        self.preprocess = preprocess
        self.getImageFromRecordID = getImageFromRecordID

    def __len__(self):
        return len(self.dataframe)

    def __getitem__(self, idx):
        row = self.dataframe.iloc[idx]
        
        path = self.getImageFromRecordID(self.dataframe, row['recordID']) 
        image = Image.open(path)
        image = self.preprocess(image)  
        
        # Return image and caption (not used)
        return image, "empty"

class GameEngine:
    def __init__(
        self,
        dataframe,
        imagesEmbeddings,
        objectsEmbeddings,
        iconographies,
        getImageFromRecordID,
        device,
        MODELS_FOLDER
    ):
        self.dataframe = dataframe
        self.imagesEmbeddings = imagesEmbeddings
        self.objectsEmbeddings = objectsEmbeddings
        self.iconographies = iconographies
        self.getImageFromRecordID = getImageFromRecordID
        self.device = device
        self.MODELS_FOLDER = MODELS_FOLDER

        self.model = None
        self.processor = None
        self.tokenizer = None
        self.load_model()

        self.test()
    
    def test(self):
        queries = [
            {
                "weight": 1.0,
                "value": "Portrait d'un homme"
            },
        ]

        k = 5
        best_entries = self.get_k_closest_images_from_queries(queries, k)
        recordIDs = [int(entry["recordID"]) for entry in best_entries]
        assert recordIDs == [3919, 7975, 6630, 3887, 4825], recordIDs

    def load_model(self):
        model_name = "openai/clip-vit-large-patch14"
        processor = CLIPProcessor.from_pretrained(model_name)
        model = CLIPModel.from_pretrained(model_name).to(self.device)
        tokenizer = transformers.AutoTokenizer.from_pretrained(model_name)
        # Load the weights of the model
        weights_path = os.path.join(self.MODELS_FOLDER, "2025-02-05 17_09_07_allFocus_5.pt")
        # Load the weights of the model
        model.load_state_dict(torch.load(weights_path))
        
        self.model = model
        self.processor = processor
        self.tokenizer = tokenizer

    def get_query_embedding(self, query):
        self.model.eval()

        inputs = self.processor(text=query, return_tensors="pt", padding=True, truncation=True)
        input_ids = inputs['input_ids'].to(self.device)
        attention_mask = inputs['attention_mask'].to(self.device)

        # Compute text embeddings
        text_features = self.model.get_text_features(input_ids=input_ids, attention_mask=attention_mask)
        #text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        text_features = text_features.flatten(1)

        return text_features.cpu().detach().numpy()

    def get_queries_embedding(self, queries):
        weights = [query['weight'] for query in queries]
        values = [query['value'] for query in queries]

        embeddings = [self.get_query_embedding(query) for query in values] # List of numpy arrays
        embeddings = np.array(embeddings) # Convert to numpy array

        # Multiply each embedding by its weight
        for i in range(len(embeddings)):
            embeddings[i] *= weights[i]
            
        # Sum all the embeddings
        embeddings = np.sum(embeddings, axis=0)

        # Normalize
        embeddings /= np.linalg.norm(embeddings)

        return embeddings
    
    def getEntryFromIndex(self, index):
        entry = self.dataframe.iloc[index]
        columns = [
            "objectWork.creatorDescription",
            "objectWork.termClassification",
            "objectWork.workID",
            "objectWork.titleText",
            "objectWork.inscriptionDescription",
            "creator.creatorAuthID",
            "creator.lastNameCreator",
            "creator.firstNameCreator",
            "creator.birthDeathDatesPlacesCreatorDescription",
            "creator.nationalityCreator",
            "creator.copyrightHolderName",
            "creator.copyrightStatement",
            "formalDescription.physicalAppearanceDescription",
            "subjectMatter.subjectTerms",
            "subjectMatter.iconographicTerms",
            "subjectMatter.conceptualTerms",
            "objectWork.objectWorkRemarks",
            "formalDescription.stylesPeriodsDescription",
            "subjectMatter.iconographicInterpretation",
            "formalDescription.termStylesPeriods",
            "materials.materialsTechDescription",
        ]
        #data = {column: entry[column] for column in columns} 
        data = {}
        data["recordID"] = int(entry["recordID"])
        data["creator.firstNameCreator"] = str(entry["creator.firstNameCreator"])
        data["creator.lastNameCreator"] = str(entry["creator.lastNameCreator"])
        data["objectWork.titleText"] = str(entry["objectWork.titleText"])
        return data 
    
    def get_k_closest_images_from_queries(self, queries, k):
        queries_embedding = self.get_queries_embedding(queries)
        sims = cosine_similarity(queries_embedding, self.imagesEmbeddings).squeeze()
        indices = np.argsort(sims)[::-1]
        
        # Get the best k index of the images
        best_indices = indices[:k]

        # Get the recordID of the best images
        best_entries = [self.getEntryFromIndex(index) for index in best_indices]

        return best_entries
    
    def get_k_closest_neighbors(self, recordID, k):
        image_embedding = self.get_image_embedding(recordID)
        if image_embedding is None:
            return None

        sims = cosine_similarity([image_embedding], self.imagesEmbeddings).squeeze()
        indices = np.argsort(sims)[::-1]
        
        # Get the best k index of the images
        best_indices = indices[:k]

        # Get the recordID of the best images
        best_entries = [self.getEntryFromIndex(index) for index in best_indices]

        return best_entries

    
class DEPR__GameEngine:

    def __init__(
        self,
        dataframe,
        iconographies,
        getImageFromRecordID,
        device,
        directLoad=True,
        ):
        
        self.dataframe = dataframe
        self.iconographies = iconographies
        self.getImageFromRecordID = getImageFromRecordID
        self.device = device

        # Textual model
        self.text_model = None
        self.text_tokenizer = None
        if directLoad:
            self.load_textual_model()
            self.verify_textual_model()

        # Image model
        self.image_model = None
        self.image_tokenizer = None
        self.image_preprocess = None
        if directLoad:
            self.load_image_model()

        # Dataset
        self.dataset = ImageTextDataset(self.dataframe, self.image_preprocess, self.getImageFromRecordID)
        self.dataloader = DataLoader(self.dataset, batch_size=2, num_workers=0)

        # Compute image embeddings
        self.image_embeddings = None
        if directLoad:
            self.compute_image_embeddings()

        # Get the list of unique objects
        self.unique_objects = None
        self.compute_unique_objects()

    def compute_unique_objects(self):
        unique_objects = set()
        for _, row in self.dataframe.iterrows():
            iconography = self.iconographies.get(str(row['recordID']), None)
            if iconography is None:
                continue

            def visit(node):
                value = node["value"]
                children = node["children"]

                isGroup = value == "<group>"

                if not isGroup:
                    unique_objects.add(value)

                for child in children:
                    visit(child)

            visit(iconography)

        self.unique_objects = list(unique_objects)

    def load_textual_model(self):
        model_name = 'M-CLIP/XLM-Roberta-Large-Vit-B-16Plus'

        # Load Model & Tokenizer
        self.text_model = pt_multilingual_clip.MultilingualCLIP.from_pretrained(model_name)
        self.text_tokenizer = transformers.AutoTokenizer.from_pretrained(model_name)
        self.text_model = self.text_model.to(self.device)
        self.text_model.eval()

    def load_image_model(self):
        openclip_model_name = "ViT-B-16-plus-240"
        openclip_pretrained = "laion400m_e32"

        #openclip_model_name = "ViTamin-XL-384"
        #openclip_pretrained = "datacomp1b"
        # ==> Better results than ViT-B-16-plus-240 but not avaialble in pt_multilingual_clip

        self.image_model, _, self.image_preprocess = open_clip.create_model_and_transforms(openclip_model_name, pretrained=openclip_pretrained)
        #self.openclip_tokenizer = open_clip.get_tokenizer(openclip_model_name)
        self.image_model = self.image_model.to(self.device)

    def verify_textual_model(self):
        # Verify that the pt_multilingual_clip has been modified to allow for device in forward
        try:
            self.text_model.forward("test", self.text_tokenizer, device=self.device)
            print("GOOD: Model has been modified to allow for device in forward")
        except:
            raise Exception("Model has not been modified to allow for device in forward !")
        
    def compute_image_embeddings(self):
        image_embeddings = []
        print("Computing image embeddings...")
        for images, _ in tqdm(self.dataloader):
            images = images.to(self.device)
            with torch.no_grad():
                image_features = self.image_model.encode_image(images)
            image_embeddings.append(image_features)
        print("OK: Image embeddings computed")

        image_embeddings = torch.cat(image_embeddings)
        # Normalize embeddings
        self.image_embeddings = image_embeddings / image_embeddings.norm(dim=-1, keepdim=True)

    def get_image_embedding(self, recordID):
        index_of_recordID = self.dataframe[self.dataframe['recordID'] == recordID].index[0]
        return self.image_embeddings[index_of_recordID]
    
    def get_texts_embedding(self, texts):
        self.text_model.eval()
        with torch.no_grad():
            query_embedding = torch.zeros((1, 640)).to(self.device)
            for i, query in enumerate(texts):
                part = self.text_model.forward(query, self.text_tokenizer, device=self.device) # Note: add device parameter to forward manually
                query_embedding += part

        # Normalize
        query_embedding = query_embedding / query_embedding.norm(dim=-1, keepdim=True)

        return query_embedding
    
    def batch_get_texts_embedding(self, texts):
        # texts = list of strings
        self.text_model.eval()
        with torch.no_grad():
            embeddings = self.text_model.forward(texts, self.text_tokenizer, device=self.device) # Note: add device parameter to forward manually

        # Normalize
        embeddings = embeddings / embeddings.norm(dim=-1, keepdim=True)

        return embeddings

    def get_images_embedding(self, recordIDs):
        image_embeddings = []
        for recordID in recordIDs:
            image_embeddings.append(self.get_image_embedding(recordID))
        image_embeddings = torch.stack(image_embeddings)
        return image_embeddings
    
    # QUESTIONS
    def select_N_questions(
        self,
        sigma,
        objects,
        sims,
        answers,
        objectsTypes,
        N_questions
    ):
        indices = np.arange(len(objects)) # The sorted indices of the objects (first = best question)
        N = len(indices)
        
        scale = 1 + 4 * (1 - sigma)
        weights = np.exp(-np.arange(N) / scale)
        weights /= weights.sum()

        selected_indices = np.random.choice(N, size=N_questions, replace=False, p=weights)
        
        selected_objects = [objects[i] for i in selected_indices]
        selected_sims = sims[selected_indices]
        selected_ans = answers[selected_indices]

        questions = []
        for i in range(N_questions):
            question = {
                "type": objectsTypes[i],
                "content": selected_objects[i]
            }
            answers = selected_sims[i] * selected_ans[i]
            questions.append({
                "question": question,
                "answers": answers.tolist()
            })

        return questions

    def get_questions(self, robotSigma, userSigma, candidates, sk=[1,2,3], robotQuestions=5, userQuestions=5):
        # Get the iconographies of the candidates
        iconographies = {}
        for candidate in candidates:
            iconographies[candidate] = self.iconographies.get(str(candidate), "No iconography found.")
        
        iconographies_at_depth_k = {}
        for k in range(0, 4):
            iconographies_at_depth_k[k] = {}
            for candidate in candidates:
                iconographies_at_depth_k[k][candidate] = []

        def visit(node, recordID, parentIsGroup=False):
            value = node["value"]
            children = node["children"]
            depth = node["depth"]

            isGroup = value == "<group>"

            if not isGroup:
                realDepth = (depth - 1) if parentIsGroup else depth
                iconographies_at_depth_k[realDepth][recordID].append(value)

            for child in children:
                visit(child, recordID, parentIsGroup=isGroup)

        for candidate in candidates:
            iconography = iconographies[candidate]
            # Visit the iconography json tree
            visit(iconography, candidate)

        #chosen_objects = iconographies_at_depth_k[sk]
        chosen_objects = {}
        for sk_ in sk:
            for candidate in candidates:
                if candidate not in chosen_objects:
                    chosen_objects[candidate] = []

                chosen_objects[candidate] += iconographies_at_depth_k[sk_][candidate]

        # Get the embeddings of the candidates
        candidates_embeddings = self.get_images_embedding(candidates)
        # Convert .cpu().numpy()
        candidates_embeddings = candidates_embeddings #.cpu().numpy()

        def generate_questions(objects, objectsTypes, isInternal=True):
            def formatObj(obj):
                return f"Une image contenant {obj}"

            # Embeddings per object
            texts = [formatObj(obj) for obj in objects]
            object_embeddings = self.batch_get_texts_embedding(texts)
            
            # Get the cosine similarity between each unique object and each candidate image
            similarities_per_object = (candidates_embeddings @  object_embeddings.T).squeeze(0)
            # Convert to numpy array
            similarities_per_object = similarities_per_object.cpu().numpy().T

            # Get the answers if the questions are internal (we know the answer thanks to the iconography)
            if isInternal:
                answers_per_object = []
                for obj in objects:
                    answers_for_obj = []
                    for candidate in candidates:
                        #answers_for_obj.append(1.0 if obj in chosen_objects[candidate] else 0.5) # temporary value
                        answers_for_obj.append(1.0) # For now
                    answers_per_object.append(answers_for_obj)
                # Convert to numpy array
                answers_per_object = np.array(answers_per_object)
            else:
                answers_per_object = np.ones((len(objects), len(candidates)))
                """
                The value is always 1 since we use the value 0.0 to indicate that the object is not in the iconography of the candidate.
                This is a clue that we have thanks to the iconography, but for external questions, we do not have this information !
                """            

            return objects, similarities_per_object, answers_per_object, objectsTypes

        # We assume that an object can only appear once in the iconography of a candidate
        objects_in_candidates = set()
        for candidate in candidates:
            for obj in chosen_objects[candidate]:
                objects_in_candidates.add(obj)
        objects_in_candidates = list(objects_in_candidates)
        objectsTypes_in_candidates = ["object" for _ in objects_in_candidates]
        
        # The set of other questions that help to differentiate the candidates
        otherQuestions = []
        otherQuestions_objectsTypes = []

        for color in COLORS:
            otherQuestions.append(color)
            otherQuestions_objectsTypes.append("color")

        for luminosity in LUMINOSITIES:
            otherQuestions.append(luminosity)
            otherQuestions_objectsTypes.append("luminosity")

        internal_questions = generate_questions(objects_in_candidates, objectsTypes_in_candidates, isInternal=True)
        """
        Shapes:
        - internal_questions[0] = objects ==> (N_objects,)
        - internal_questions[1] = sims ==> (N_objects, N_candidates)
        - internal_questions[2] = ans ==> (N_objects, N_candidates)
        - internal_questions[3] = objTypes ==> (N_objects,)
        """
        external_questions = generate_questions(otherQuestions, otherQuestions_objectsTypes, isInternal=False)
        """
        Shapes:
        - external_questions[0] = objects ==> (N_objects,)
        - external_questions[1] = sims ==> (N_objects, N_candidates)
        - external_questions[2] = ans ==> (N_objects, N_candidates)
        - external_questions[3] = objTypes ==> (N_objects,)
        """


        def cSort(questions, cut=-1):
            objects, sims, ans, objTypes = questions
            # Sort by variance, highest variance first
            sims_var = np.var(sims, axis=1)
            order = np.argsort(sims_var)[::-1]

            sorted_objects = [objects[i] for i in order]
            sorted_sims = sims[order]
            sorted_ans = ans[order]
            sorted_objTypes = [objTypes[i] for i in order]

            if cut != -1:
                sorted_objects = sorted_objects[:cut]
                sorted_sims = sorted_sims[:cut]
                sorted_ans = sorted_ans[:cut]
                sorted_objTypes = sorted_objTypes[:cut]

            return [sorted_objects, sorted_sims, sorted_ans, sorted_objTypes]

        # Sort the external questions
        external_questions = cSort(external_questions)#, cut=5)

        # Sort the merged questions
        merged_objects = internal_questions[0] + external_questions[0]
        merged_similarities = np.concatenate((internal_questions[1], external_questions[1]), axis=0)
        merged_answers = np.concatenate((internal_questions[2], external_questions[2]), axis=0)
        merged_objectsTypes = internal_questions[3] + external_questions[3]

        merged_objects_in_order = cSort([merged_objects, merged_similarities, merged_answers, merged_objectsTypes])

        # Get the robot questions and the user questions according to the sigma
        robot_questions = self.select_N_questions(robotSigma, *merged_objects_in_order, robotQuestions)
        user_questions = self.select_N_questions(userSigma, *merged_objects_in_order, (userQuestions + 3)*2) # (X+3)*2 to let the user choose with some margin 
        
        return robot_questions, user_questions
