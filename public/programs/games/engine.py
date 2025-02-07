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

LUMINOSITIES = [
    "Lumineux",
    "Sombre",
]

COLORS = [
    "Noir et blanc",
    "Couleurs vives",
    "Couleurs sombres",
    "Teinte rouge",
    "Teinte bleue",
    "Teinte verte",
]

TYPES = [
    "Portrait",
    "Paysage",
    "Sculpture",
]

OTHERS = LUMINOSITIES + COLORS + TYPES

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
        othersEmbeddings,
        iconographies,
        getImageFromRecordID,
        device,
        MODELS_FOLDER, 
        largeIconographyThreshold=6
    ):
        self.dataframe = dataframe
        self.imagesEmbeddings = imagesEmbeddings
        self.objectsEmbeddings = objectsEmbeddings
        self.othersEmbeddings = othersEmbeddings
        self.iconographies = iconographies
        self.getImageFromRecordID = getImageFromRecordID
        self.device = device
        self.MODELS_FOLDER = MODELS_FOLDER

        self.model = None
        self.processor = None
        self.tokenizer = None
        self.load_model()
        #self.test()

        self.flattened_iconographies = None
        self.compute_flattened_iconographies()
    
        self.recordIDsWithLargeEnoughIconography = None
        self.compute_recordIDsWithLargeEnoughIconography(largeIconographyThreshold)

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

    def depr__get_queries_embedding(self, queries, version="classic"):
        weights = [query['weight'] for query in queries]
        values = [query['value'] for query in queries]


        embeddings = [self.get_query_embedding(query) for query in values] # List of numpy arrays
        embeddings = np.array(embeddings) # Convert to numpy array

        if version == "classic":
            # Multiply each embedding by its weight
            for i in range(len(embeddings)):
                embeddings[i] *= weights[i]
        elif version == "power":
           # Multiply each embedding by the power of its weight
            for i in range(len(embeddings)):
                sign = 1 if weights[i] >= 0 else -1
                embeddings[i] *= np.power(weights[i], 2) * sign
        else:
            raise Exception("Unknown version")

        # Sum all the embeddings
        embeddings = np.sum(embeddings, axis=0)

        # Normalize
        embeddings /= np.linalg.norm(embeddings)

        return embeddings

    def get_queries_embedding(self, queries, precomputed={}, version="classic"):
        weights = [query['weight'] for query in queries]
        values = [query['value'] for query in queries]

        embeddings = []
        for i in range(len(values)):
            if i in precomputed:
                embeddings.append([precomputed[i]])
                print(precomputed[i].shape)
            else:
                embeddings.append(self.get_query_embedding(values[i]))
                print(self.get_query_embedding(values[i]).shape)
        embeddings = np.array(embeddings) # Convert to numpy array

        if version == "classic":
            # Multiply each embedding by its weight
            for i in range(len(embeddings)):
                embeddings[i] *= weights[i]
        elif version == "power":
           # Multiply each embedding by the power of its weight
            for i in range(len(embeddings)):
                sign = 1 if weights[i] >= 0 else -1
                embeddings[i] *= np.power(weights[i], 2) * sign
        else:
            raise Exception("Unknown version")

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
    
    def guess(self, candidates, questions):
        # candidates = list of recordIDs !

        # Get the embeddings of the candidates
        indexesOfCandidates = []
        recordIDS = self.dataframe["recordID"].tolist()

        for candidate in candidates:
            index = recordIDS.index(candidate)
            indexesOfCandidates.append(index)
    
        candidates_embeddings = self.imagesEmbeddings[indexesOfCandidates]
        # Get the embeddings of the questions content
        questions_as_queries = []
        all0weights = True
        for question in questions:
            questions_as_queries.append({
                "weight": question["user_answer"],
                "value": question["content"]
            })
            all0weights = all0weights and question["user_answer"] == 0.0
    
        if all0weights:
            # If all the weights are 0, answer with a random candidate
            return random.choice(candidates)
        
        queries_embedding = self.get_queries_embedding(questions_as_queries)

        # Compute the cosine similarity between the candidates and the questions
        sims = cosine_similarity(queries_embedding, candidates_embeddings).squeeze()
        indices = np.argsort(sims)[::-1]

        # Get the best candidate
        best_index = indices[0]
        best_candidate = candidates[best_index]

        return best_candidate

    def get_image_embedding(self, recordID):
        recordIDs = self.dataframe["recordID"].tolist()
        index = recordIDs.index(recordID)
        return self.imagesEmbeddings[index]

    def get_k_closest_images_from_queries(self, queries, k):
        precomputed = {}

        for i, query in enumerate(queries):
            type = query["type"]
            if type=="interaction":
                recordID = query["value"]
                precomputed[i] = self.get_image_embedding(int(recordID))

        queries_embedding = self.get_queries_embedding(queries, precomputed=precomputed, version="power")
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

    def compute_flattened_iconographies(self):
        # Flatten each iconography
        flattened_iconographies = {}
        for recordID in self.iconographies:
            flattened_iconography = []

            def visit(node):
                value = node["value"]
                children = node["children"]
                isOther = value == "<group>" or value == "root"

                if not isOther:
                    flattened_iconography.append(value)

                for child in children:
                    visit(child)

            visit(self.iconographies[recordID])

            flattened_iconographies[recordID] = flattened_iconography

        self.flattened_iconographies = flattened_iconographies

    def compute_recordIDsWithLargeEnoughIconography(self, threshold):
        recordIDsWithLargeEnoughIconography = []
        for recordID in self.flattened_iconographies:
            iconography = self.flattened_iconographies[recordID]
            if len(iconography) >= threshold:
                recordIDsWithLargeEnoughIconography.append(int(recordID))
        
        self.recordIDsWithLargeEnoughIconography = recordIDsWithLargeEnoughIconography

        print(f"Number of entries with |ico| >= {threshold}: {len(recordIDsWithLargeEnoughIconography)}")

    def getFlattenedIconography(self, recordID):
        return self.flattened_iconographies.get(str(recordID), None)

    def select_N_questions(
        self,
        sigma,
        scores,
    ):
        indices = np.arange(len(scores))
        nb_swaps = int(sigma * len(scores))
        new_order = indices.copy()

        for _ in range(nb_swaps):
            i, j = np.random.choice(len(scores), 2, replace=False)
            new_order[i], new_order[j] = new_order[j], new_order[i]
        
        return new_order

    # Functions for the "Quelle est l'oeuvre" game
    def get_questions(
        self, 
        N_candidates,
        N_players_questions,
        N_robot_questions,
        robot_sigma, 
        user_sigma, 
        ):

        # Find the candidates
        candidates = random.sample(self.recordIDsWithLargeEnoughIconography, N_candidates)

        # Get the iconographies of the candidates
        iconographies = {}
        for candidate in candidates:
            iconographies[candidate] = self.getFlattenedIconography(candidate)

        if None in iconographies.values():
            raise Exception("Iconography not found for one of the candidates")
        
        # Get the candidates embeddings
        indexesOfCandidates = [self.dataframe[self.dataframe['recordID'] == candidate].index[0] for candidate in candidates]
        candidates_embeddings = self.imagesEmbeddings[indexesOfCandidates]

        # One-hot encoding of the objects
        unique_objects = set()
        for candidate in candidates:
            for object in iconographies[candidate]:
                unique_objects.add(object)

        unique_objects = list(unique_objects) # Freeze the order of the objects
        N_objects = len(unique_objects)

        def one_hot_encoding_from_iconography(iconography):
            one_hot = np.zeros(N_objects)
            for objectIndex, object in enumerate(unique_objects):
                if object in iconography:
                    one_hot[objectIndex] = 1
            return one_hot
        
        candidates_one_hot = np.zeros((len(candidates), N_objects))
        for i, candidate in enumerate(candidates):
            candidates_one_hot[i] = one_hot_encoding_from_iconography(iconographies[candidate])

        # Get the score of each object
        def score_object(matrix, element_index):
            # number_of_candidates_with_object
            number_of_candidates_with_object = np.sum(matrix[:, element_index] == 1)
            number_of_candidates_without_object = np.sum(matrix[:, element_index] == 0)
            total = number_of_candidates_with_object + number_of_candidates_without_object
            x = number_of_candidates_with_object/total
            # The best object is the one separating the most the candidates
            # ==> Simply f(x) = (x)(1-x) ==> max for x = 0.5 !
            # ==> We could also use (x)^(1/2) * (1 - x) or a variant
            return x * (1 - x)
    
        score_per_object = np.array([score_object(candidates_one_hot, i) for i in range(N_objects)])

        # Sort the objects by score
        order = np.argsort(score_per_object)[::-1]
        
        # Generate the question objects
        questions = []

        # Questions with KNOWN answers 
        for questionIndex in range(len(order)):
            objectIndex = order[questionIndex]
            object = unique_objects[objectIndex]

            # Compute the cosine_similarities between the object and the candidates
            object_embedding = self.objectsEmbeddings[objectIndex]
            sims = cosine_similarity([object_embedding], candidates_embeddings).squeeze()
            score = score_per_object[objectIndex]

            question = {
                "score": score,
                "user_can_ask": True,
                "robot_can_ask": True,
                "type": "object",
                "content": object,
                "answers_iconography": candidates_one_hot[:, objectIndex].tolist(),
                "cosine_similarities": sims.tolist()
            }

            questions.append(question)

        max_score = np.max(score_per_object) * 1.05
        min_score = np.min(score_per_object) * 0.95
        def getRandomScore():
            return random.uniform(min_score, max_score)

        # Questions with ESTIMATED answers
        # OTHERS = LUMINOSITIES + COLORS + TYPES
        for luminosity in LUMINOSITIES:
            # Compute the cosine_similarities between the object and the candidates
            luminosityIndex = OTHERS.index(luminosity)
            other_embedding = self.othersEmbeddings[luminosityIndex]
            sims = cosine_similarity([other_embedding], candidates_embeddings).squeeze()

            question = {
                "score": getRandomScore(),
                "user_can_ask": False,
                "robot_can_ask": True,
                "type": "luminosities",
                "content": luminosity,
                "answers_iconography": [1.0] * len(candidates),
                "cosine_similarities": sims.tolist()
            }

            questions.append(question)

        for color in COLORS:
            # Compute the cosine_similarities between the object and the candidates
            colorIndex = OTHERS.index(color)
            other_embedding = self.othersEmbeddings[colorIndex]
            sims = cosine_similarity([other_embedding], candidates_embeddings).squeeze()

            question = {
                "score": getRandomScore(),
                "user_can_ask": False,
                "robot_can_ask": True,
                "type": "colors",
                "content": color,
                "answers_iconography": [1.0] * len(candidates),
                "cosine_similarities": sims.tolist()
            }

            questions.append(question)

        for type in TYPES:
            # Compute the cosine_similarities between the object and the candidates
            typeIndex = OTHERS.index(type)
            other_embedding = self.othersEmbeddings[typeIndex]
            sims = cosine_similarity([other_embedding], candidates_embeddings).squeeze()

            question = {
                "score": getRandomScore(),
                "user_can_ask": False,
                "robot_can_ask": True,
                "type": "types",
                "content": type,
                "answers_iconography": [1.0] * len(candidates),
                "cosine_similarities": sims.tolist()
            }

            questions.append(question)

        # Find the robot_selected_image
        # ==> It must be an image with enough "YES" in the iconography
        robot_selected_image_candidates = []
        for candidate in candidates:
            number_of_yes = np.sum(candidates_one_hot[candidates.index(candidate)])
            if number_of_yes >= N_players_questions:
                robot_selected_image_candidates.append(candidate)
        robot_selected_image = random.choice(robot_selected_image_candidates)
        robot_selected_image_index = candidates.index(robot_selected_image)

        # Get the number of questions to pick from for the robot and the user
        def getNumberOfQuestions(minimum, maximum, sigma):
            return int(minimum + (1 - sigma) * (maximum - minimum))
    
        mdf_N_questions_player = getNumberOfQuestions(N_players_questions, len(questions), user_sigma)
        mdf_N_questions_robot = getNumberOfQuestions(N_robot_questions, len(questions), robot_sigma)

        # Compute the userScore
        def userScore(question):
            answerForRobotSelectedImage = question["answers_iconography"][robot_selected_image_index]
            if answerForRobotSelectedImage == 0:
                # This question does not give an information about the robot_selected_image
                return -1.0
            
            answersForOtherImages = [question["answers_iconography"][i] for i in range(len(candidates)) if i != robot_selected_image_index]
            meanAnswerWithoutRobotSelectedImage = np.mean(answersForOtherImages)
            # The best indices are the ones that only concern the robot_selected_image !
            return 1 - meanAnswerWithoutRobotSelectedImage
    
        for question in questions:
            question["userScore"] = userScore(question)

        # Order the questions by score (highest first)
        user_questions = questions.copy()
        user_questions = sorted(user_questions, key=lambda x: x["userScore"], reverse=True)
        # Remove questions with a negative userScore
        user_questions = [question for question in user_questions if question["userScore"] >= 0]
        user_questions = user_questions[:min(mdf_N_questions_player, len(user_questions))]

        robot_questions = questions.copy()
        robot_questions = sorted(robot_questions, key=lambda x: x["score"], reverse=True)
        robot_questions = robot_questions[:mdf_N_questions_robot]
    
        # Using the sigmas, modify the orders of the questions a bit (swap some questions)
        robot_order = self.select_N_questions(robot_sigma, robot_questions)
        robot_questions = [robot_questions[i] for i in robot_order][:N_robot_questions]

        user_order = self.select_N_questions(user_sigma, user_questions)
        user_questions = [user_questions[i] for i in user_order][:N_players_questions]

        return candidates, robot_selected_image, robot_questions, user_questions