import pandas as pd
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import random
import torch
import json
import matplotlib.pyplot as plt
import numpy as np

# Import from folder engine
from engine import GameEngine
##

def QuelleEstLoeuvre(
    dataset, 
    engine, 
    difficulty, 
    difficulty_to_player_n_questions,
    difficulty_to_robot_n_questions,
    difficulty_to_robot_sigma,
    difficulty_to_user_sigma
):

    # Settings
    N_candidates        = 10
    N_players_questions = difficulty_to_player_n_questions[difficulty]
    N_robot_questions   = difficulty_to_robot_n_questions[difficulty]
    robot_sigma         = difficulty_to_robot_sigma[difficulty]
    user_sigma          = difficulty_to_user_sigma[difficulty]

    # Get number_of_candidates different random recordIDs from the filtered data    
    candidates = random.sample(dataset["recordID"].tolist(), N_candidates)

    robotQuestions, userQuestions = engine.get_questions(robot_sigma, user_sigma, candidates, robotQuestions=N_robot_questions, userQuestions=N_players_questions)

    return {
        "robot_selected_image": random.choice(candidates),
        "candidates": candidates,
        "n_players_questions": N_players_questions,
        "n_robot_questions": N_robot_questions,
        "userQuestions": userQuestions,
        "robotQuestions": robotQuestions,
    }

    # answers is of shape (N_objects, N_candidates)
    user_answers = np.zeros(len(objects))

    def get_scoring(N_answered):
        # Compute the score of each candidate
        scores = np.zeros(N_candidates)

        for objectIndex in range(N_answered):
            for candidateIndex in range(N_candidates):
                user_answer = user_answers[objectIndex]
                sim = sims[objectIndex, candidateIndex]
                ico_answer = answers[objectIndex, candidateIndex]
                score = user_answer * sim * ico_answer
                scores[candidateIndex] += score
        
        # Order the candidates by score
        order = np.argsort(scores)[::-1]

        return order, scores

    def generateQuestion(object):
        return f"Est-ce que cette image contient ou est associée à '{object}' ?"

    # Plot the candidates
    def plot_candidates(questionIndex):

        if questionIndex > 0:
            order, scores = get_scoring(questionIndex)
        else:
            order = np.arange(N_candidates)
            scores = np.zeros(N_candidates)

        fig, axs = plt.subplots(1, N_candidates, figsize=(N_candidates * 5, 10))
        plt.suptitle(generateQuestion(objects[questionIndex]))
        for i, recordID in enumerate(candidates):
            path = get_image_path_from_recordID(FULL_DATASET, recordID)
            img = plt.imread(path)
            axs[i].imshow(img, cmap="gray")
            axs[i].axis("off")

            candidate_position = order.tolist().index(i) + 1
            candidate_score = scores[i]

            axs[i].set_title(f"Position: {candidate_position}\nScore: {candidate_score:.2f}")

        plt.tight_layout()
        plt.show()

        answer = None
        while answer not in ["0", "1"]:
            answer = input("OUI (1) ou NON (0)? ")
        return answer
    
    # Ask the questions
    for i in range(len(objects)):
        user_answers[i] = int(plot_candidates(i))

    # Compute the final score
    order, scores = get_scoring(len(objects))

    # Plot the candidates in this order with their scores
    fig, axs = plt.subplots(1, N_candidates, figsize=(N_candidates * 5, 4))
    for i, index in enumerate(order):
        recordID = candidates[index]
        path = get_image_path_from_recordID(FULL_DATASET, recordID)
        img = plt.imread(path)
        axs[i].imshow(img, cmap="gray")
        axs[i].axis("off")
        axs[i].set_title(f"Score: {scores[index]:.2f}")
    plt.show()



if __name__ == "__main__":

    # loading variables from .env file
    load_dotenv("../../../private_data/.env") 

    # PARENT gets us to the root of the project
    PARENT = "./../../../"

    FOLDER_TABLE = PARENT + os.getenv("FOLDER_TABLE")
    FILE_FABRITIUS_DATA = PARENT + os.getenv("FILE_FABRITIUS_DATA")
    FILE_FABRITIUS_DATA_FILTERED = PARENT + os.getenv("FILE_FABRITIUS_DATA_FILTERED")
    FILE_FABRITIUS_DATA_FILTERED_DOWNLOADED = PARENT + os.getenv("FILE_FABRITIUS_DATA_FILTERED_DOWNLOADED")
    FOLDER_FIGURES = PARENT + os.getenv("FOLDER_FIGURES")
    IMAGES_FOLDER = PARENT + os.getenv("IMAGES_FOLDER")
    RECORD_IDS_TESTING_SET = PARENT + os.getenv("RECORD_IDS_TESTING_SET")
    RECORD_IDS_VALIDATION_SET = PARENT + os.getenv("RECORD_IDS_VALIDATION_SET")
    WRITTEN_CAPTIONS_TESTING_SET = PARENT + os.getenv("WRITTEN_CAPTIONS_TESTING_SET")
    WRITTEN_CAPTIONS_VALIDATION_SET = PARENT + os.getenv("WRITTEN_CAPTIONS_VALIDATION_SET")
    FILE_FABRITIUS_ICONOGRAPHIES_JSON = PARENT + os.getenv("FILE_FABRITIUS_ICONOGRAPHIES_JSON")

    ##

    def fixPath(path):
        return path.replace(".././", "../")

    def get_image_path_from_recordID(dataset, recordID):
        """
        Given a recordID, return the local path for its image.
        """
        # Locate row in the downloaded DataFrame
        paths = dataset[
            dataset["recordID"] == recordID
        ]["low_res_filename"].values
        
        if len(paths) == 0:
            return None
        
        path = paths[0]
        # Merge: IMAGES_FOLDER + path[1:]
        merged_path = fixPath(os.path.join(IMAGES_FOLDER, path[1:]))
        return merged_path

    ##

    print("Checking device...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("OK: Device is", device)

    print("Loading data...")
    FULL_DATASET = pd.read_csv(FILE_FABRITIUS_DATA_FILTERED_DOWNLOADED)
    # Remove rows with corrupted images
    FULL_DATASET = FULL_DATASET[FULL_DATASET["recordID"] != 11546]
    FULL_DATASET = FULL_DATASET[FULL_DATASET["recordID"] != 5262]
    FULL_DATASET = FULL_DATASET.sample(frac=0.10).reset_index(drop=True)
    print("OK: Dataset loaded")

    print("Loading iconographies...")
    # Load the iconographies (json file)
    with open(FILE_FABRITIUS_ICONOGRAPHIES_JSON, "r", encoding="utf-8") as f:
        ICONOGRAPHIES = json.load(f)
    print("OK: Iconographies loaded")   

    ##

    difficulty_to_player_n_questions = { 0:9, 1:6, 2:3 }
    difficulty_to_robot_n_questions = { 0:3, 1:6, 2:9 }
    difficulty_to_robot_sigma = { 0:0.30, 1:0.60, 2:0.90 }
    difficulty_to_user_sigma = { 0:1.00, 1:0.85, 2:0.70 }

    ##

    print("Starting engine...")
    ENGINE = GameEngine(
        FULL_DATASET,
        ICONOGRAPHIES,
        get_image_path_from_recordID,
        device,
        directLoad=True#False
    )
    print("OK: Engine started")


    app = Flask(__name__, static_folder='static')
    CORS(app)

    # DIXIT
    # Serve game interface
    @app.route('/dixit')
    def index():
        return app.send_static_file('dixit/game.html')

    # Get image
    @app.route('/images/<int:recordID>')
    def serve_image(recordID):
        path = get_image_path_from_recordID(FULL_DATASET, recordID)
        if path is None:
            # Return a random image
            return {
                "success": False,
                "message": "No image found."
            }
        return send_file(path, mimetype='image/jpg')

    # Create game
    @app.route('/api/dixit/create_game', methods=['POST'])
    def create_game():
        data = request.json
        difficulty = data["difficulty"]

        # Get the questions
        game = QuelleEstLoeuvre(
            FULL_DATASET, 
            ENGINE, 
            difficulty, 
            difficulty_to_player_n_questions,
            difficulty_to_robot_n_questions,
            difficulty_to_robot_sigma,
            difficulty_to_user_sigma
        )

        return jsonify({
            "success": True,
            "message": game
        })


    # 
    if __name__ == '__main__':
        # By default, Flask will serve at http://127.0.0.1:5000/
        #app.run(debug=True)

        app.run()
