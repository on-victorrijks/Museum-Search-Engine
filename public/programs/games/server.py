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
from database import MockDB
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

    candidates, robot_selected_image, robot_questions, user_questions = engine.get_questions(
        N_candidates,
        N_players_questions,
        N_robot_questions,
        robot_sigma, 
        user_sigma, 
    )

    return {
        "n_players_questions": N_players_questions,
        "n_robot_questions": N_robot_questions,

        "candidates": candidates,
        "robot_selected_image": robot_selected_image,
        "robot_questions": robot_questions,
        "user_questions": user_questions
    }

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
    EMBEDDINGS_FOLDER = PARENT + os.getenv("EMBEDDINGS_FOLDER")
    MODELS_FOLDER = PARENT + os.getenv("MODELS_FOLDER")

    ##

    safeFormat = lambda x : x.replace("/", "_").replace(":", "_").replace(" ", "_")
    model_name = "ViT-L/14"
    embedding_name = safeFormat(model_name) + "_embeddings.npy"
    path_imagesEmbeddings = os.path.join(EMBEDDINGS_FOLDER, "images_" + embedding_name)
    path_objectsEmbeddings = os.path.join(EMBEDDINGS_FOLDER, "objects_" + embedding_name)
    path_othersEmbeddings = os.path.join(EMBEDDINGS_FOLDER, "others_" + embedding_name)

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
    # To splice us .head(N)

    print("OK: Dataset loaded")

    print("Loading iconographies...")
    # Load the iconographies (json file)
    with open(FILE_FABRITIUS_ICONOGRAPHIES_JSON, "r", encoding="utf-8") as f:
        ICONOGRAPHIES = json.load(f)
    print("OK: Iconographies loaded")   

    print("Loading embeddings...")
    # Load the image embeddings
    imagesEmbeddings = np.load(path_imagesEmbeddings)
    objectsEmbeddings = np.load(path_objectsEmbeddings)
    othersEmbeddings = np.load(path_othersEmbeddings)
    print(np.mean(imagesEmbeddings), np.std(imagesEmbeddings))
    print(np.mean(objectsEmbeddings), np.std(objectsEmbeddings))
    print(np.mean(othersEmbeddings), np.std(othersEmbeddings))
    print("OK: Embeddings loaded")

    ##

    difficulty_to_player_n_questions = { 0:10, 1:7, 2:4 }
    difficulty_to_robot_n_questions = { 0:5, 1:7, 2:10 }
    difficulty_to_robot_sigma = { 0:0.20, 1:0.10, 2:0.00 }
    difficulty_to_user_sigma = { 0:0.0, 1:0.10, 2:0.20 }

    ##

    print("Starting engine...")
    ENGINE = GameEngine(
        FULL_DATASET,
        imagesEmbeddings,
        objectsEmbeddings,
        othersEmbeddings,
        ICONOGRAPHIES,
        get_image_path_from_recordID,
        device,
        MODELS_FOLDER
    )
    print("OK: Engine started")

    print("Starting database...")
    DB = MockDB()
    # Insert mock data
    DB.insert_mock_data(FULL_DATASET.to_dict(orient="records"), imagesEmbeddings, ICONOGRAPHIES)
    DB.set_engine(ENGINE)
    print("OK: Database started")


    app = Flask(__name__, static_folder='static')
    CORS(app)

    # DIXIT
    # Serve game interface
    @app.route('/dixit')
    def index():
        return app.send_static_file('dixit/game.html')

    @app.route('/search')
    def search():
        return app.send_static_file('search/index.html')

    @app.route('/explorator')
    def explorator():
        return app.send_static_file('explorator/explorator.html')

    @app.route('/api/search/query', methods=['POST'])
    def query():
        data = request.json
        queries = data["queries"]

        if not queries or len(queries) == 0:
            return jsonify({
                "success": False,
                "message": "No queries provided."
            })

        # Get the recordIDs
        result = ENGINE.get_k_closest_images_from_queries(queries, 50)

        return jsonify({
            "success": True,
            "result": result
        })

    # Get neighbors
    @app.route('/api/search/neighbors', methods=['POST'])
    def neighbors():
        data = request.json
        recordID = data["recordID"]

        if recordID is None:
            return jsonify({
                "success": False,
                "message": "No recordID provided."
            })

        try:
            recordID = int(recordID)
        except:
            return jsonify({
                "success": False,
                "message": "Invalid recordID."
            })

        neighbors = ENGINE.get_k_closest_neighbors(recordID, 3)
        if neighbors is None:
            return jsonify({
                "success": False,
                "message": "Invalid recordID."
            })

        return jsonify({
            "success": True,
            "neighbors": neighbors
        })

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

    @app.route('/api/dixit/guess', methods=['POST'])
    def guess():
        data = request.json
        candidates = data["candidates"]
        questions = data["questions"]
    
        if (not candidates) or len(candidates) == 0:
            return jsonify({
                "success": False,
                "message": "No candidates provided."
            })

        if (not questions) or len(questions) == 0:
            return jsonify({
                "success": False,
                "message": "No questions provided."
            })

        return jsonify({
            "success": True,
            "message": {
                "guess": ENGINE.guess(candidates, questions)
            }
        })
    
    @app.route('/api/explorator/getImages', methods=['POST'])
    def getImages():
        data = request.json
        fromRecordID = data["fromRecordID"]

        return jsonify({
            "success": True,
            "message": {
                "recordIDs": ENGINE.getImages(fromRecordID)
            }
        })
    
    @app.route('/api/explorator/interpolate', methods=['POST'])
    def interpolate():
        data = request.json
        recordID1 = data["recordID1"]
        recordID2 = data["recordID2"]

        return jsonify({
            "success": True,
            "message": {
                "entries": ENGINE.interpolate(recordID1, recordID2, k=8)
            }
        })

    # New Routes !
    @app.route(
        '/api/search/v2/query', 
        methods=['POST']
    )
    def query_v2():
        data = request.json

        hard = data["hard"]
        soft = data["soft"]
        version = data["version"]

        page = data["page"]
        page_size = data["page_size"]

        # Validate
        if not hard and not soft:
            return jsonify({
                "success": False,
                "message": "No constraints provided."
            })
        if version not in ["classic", "power"]:
            return jsonify({
                "success": False,
                "message": "Invalid version."
            })
        if page is None:
            page = 0
        if page_size is None:
            page_size = 10

        page_size = max(1, page_size)
 
        # Query the database
        results = DB.query(
            filters=hard,
            queries=soft,
            page=page,
            page_size=page_size
        )

        return jsonify({
            "success": True,
            "message": results
        })
    
    @app.route(
        '/api/search/v2/get_columns', 
        methods=['GET']
    )
    def get_columns():        
        return jsonify({
            "success": True,
            "message": {
                "columns": DB.get_selection_columns()
            }
        })

    @app.route(
        '/api/search/v2/autocomplete', 
        methods=['POST']
    )
    def autocomplete():
        data = request.json
        key = data["key"]
        query = data["query"]

        if not key:
            return jsonify({
                "success": False,
                "message": "No key provided."
            })

        if not query:
            return jsonify({
                "success": False,
                "message": "No query provided."
            })

        try:
            return jsonify({
                "success": True,
                "message": {
                    "results": DB.autocomplete(key, query)
                }
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "message": str(e)
            })

    # 

    # By default, Flask will serve at http://127.0.0.1:5000/
    #app.run(debug=True)
    app.run()
