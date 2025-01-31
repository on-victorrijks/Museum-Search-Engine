import pandas as pd
import os
import random
import numpy as np
import torch
from PIL import Image
from multilingual_clip import pt_multilingual_clip # Note: add device parameter to forward manually
from tqdm import tqdm
import matplotlib.pyplot as plt

import open_clip

import transformers
from torch.utils.data import DataLoader, Dataset
from sklearn.metrics.pairwise import cosine_similarity

COLORS = [
    "Couleurs sombres",
    "Couleurs claires",
    "Teinte verte",
    "Teinte rouge",
    "Teinte bleue",
    "Couleurs vives",
    "Noir et blanc",
    "Bicolor",
]

LUMINOSITIES = [
    "Lumineux",
    "Sombre"
]

EMOTIONS = [
    "Joie",
    "Tristesse",
    "Colère",
    "Peur",
    "Surprise",
    "Dégoût",
    "émotion neutre"
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
    
    def get_images_embedding(self, recordIDs):
        image_embeddings = []
        for recordID in recordIDs:
            image_embeddings.append(self.get_image_embedding(recordID))
        image_embeddings = torch.stack(image_embeddings)
        return image_embeddings
    
    # QUESTIONS
    def get_questions(self, candidates, sk=[1,2,3], N_questions=5):
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
        candidates_embeddings = candidates_embeddings.cpu().numpy()

        def generate_questions(objects, isInternal=True):
            # Embeddings per object
            object_embeddings = {}
            for obj in objects:
                object_embeddings[obj] = self.get_texts_embedding([obj]).cpu().numpy()
            
            # Get the cosine similarity between each unique object and each candidate image
            similarities_per_object = []
            for obj in objects:
                similarities_per_object.append(cosine_similarity(object_embeddings[obj], candidates_embeddings).flatten())
            # Convert to numpy array
            similarities_per_object = np.array(similarities_per_object)

            # Get the answers if the questions are internal (we know the answer thanks to the iconography)
            if isInternal:
                answers_per_object = []
                for obj in objects:
                    answers_for_obj = []
                    for candidate in candidates:
                        answers_for_obj.append(1 if obj in chosen_objects[candidate] else 0.0)
                    answers_per_object.append(answers_for_obj)
                # Convert to numpy array
                answers_per_object = np.array(answers_per_object)
            else:
                answers_per_object = np.ones((len(objects), len(candidates)))
                """
                The value is always 1 since we use the value 0.0 to indicate that the object is not in the iconography of the candidate.
                This is a clue that we have thanks to the iconography, but for external questions, we do not have this information !
                """

            return objects, similarities_per_object, answers_per_object

        # We assume that an object can only appear once in the iconography of a candidate
        objects_in_candidates = set()
        for candidate in candidates:
            for obj in chosen_objects[candidate]:
                objects_in_candidates.add(obj)
        objects_in_candidates = list(objects_in_candidates)
        
        # The set of other questions that help to differentiate the candidates
        otherQuestions = set()
        for color in COLORS:
            otherQuestions.add(color)
        for luminosity in LUMINOSITIES:
            otherQuestions.add(luminosity)
        otherQuestions = list(otherQuestions)

        internal_questions = generate_questions(objects_in_candidates, isInternal=True)
        external_questions = generate_questions(otherQuestions, isInternal=False)

        def cSort(questions, cut=-1):
            objects, sims, ans = questions
            # Sort by variance, highest variance first
            sims_var = np.var(sims, axis=1)
            order = np.argsort(sims_var)[::-1]

            sorted_objects = [objects[i] for i in order]
            sorted_sims = sims[order]
            sorted_ans = ans[order]

            if cut != -1:
                sorted_objects = sorted_objects[:cut]
                sorted_sims = sorted_sims[:cut]
                sorted_ans = sorted_ans[:cut]

            return [sorted_objects, sorted_sims, sorted_ans]

        # Sort the external questions
        external_questions = cSort(external_questions)#, cut=5)

        # Sort the merged questions
        merged_objects = internal_questions[0] + external_questions[0]
        merged_similarities = np.concatenate((internal_questions[1], external_questions[1]), axis=0)
        merged_answers = np.concatenate((internal_questions[2], external_questions[2]), axis=0)

        merged_objects_in_order = cSort([merged_objects, merged_similarities, merged_answers], cut=N_questions)

        return merged_objects_in_order

    def TEMP(self):
        candidates = None
        answers_per_candidate = None
        similarities_per_candidate = None

        for correctIndex in range(len(candidates)):
            # Select the 0/1 vector of answers for the correct candidate
            correct_vector = answers_per_candidate[correctIndex]
            # Multiply the similarities by the answers
            similarities_per_candidate_copy = similarities_per_candidate.copy()
            # Normalize the similarities
            similarities_per_candidate_copy = similarities_per_candidate_copy / np.linalg.norm(similarities_per_candidate_copy, axis=1, keepdims=True)
            # Multiply the similarities by the answers
            similarities_per_candidate_copy = similarities_per_candidate_copy * (correct_vector)
            # Each candidate has a score that is the sum of the similarities 
            scores = np.sum(similarities_per_candidate_copy, axis=1)
            # Order the candidates by score
            order = np.argsort(scores)[::-1]
            
            fig, axs = plt.subplots(1, 1 + len(candidates), figsize=((1 + len(candidates))*3, 5))
            # First image is the correct one
            axs[0].imshow(Image.open(self.getImageFromRecordID(self.dataframe, candidates[correctIndex])), cmap='gray')
            axs[0].axis("off")
            axs[0].set_title(f"Correct candidate")

            for i, index in enumerate(order):
                axs[i+1].imshow(Image.open(self.getImageFromRecordID(self.dataframe, candidates[index])), cmap='gray')
                axs[i+1].axis("off")
                axs[i+1].set_title(f"{candidates[index]} - {scores[index]:.5f}")

            plt.show()
        

        
        