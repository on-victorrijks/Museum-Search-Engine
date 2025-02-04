import pandas as pd
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import random

##

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
RECORD_IDS_TRAINING_SET = PARENT + os.getenv("RECORD_IDS_TRAINING_SET")

WRITTEN_CAPTIONS_TESTING_SET = PARENT + os.getenv("WRITTEN_CAPTIONS_TESTING_SET")
WRITTEN_CAPTIONS_VALIDATION_SET = PARENT + os.getenv("WRITTEN_CAPTIONS_VALIDATION_SET")
WRITTEN_CAPTIONS_TRAINING_SET = PARENT + os.getenv("WRITTEN_CAPTIONS_TRAINING_SET")


##

def fixPath(path):
    return path.replace(".././", "../")

filtered_data_downloaded = pd.read_csv(FILE_FABRITIUS_DATA_FILTERED_DOWNLOADED)

def get_image_path_from_recordID(recordID):
    """
    Given a recordID, return the local path for its image.
    """
    # Locate row in the downloaded DataFrame
    paths = filtered_data_downloaded[
        filtered_data_downloaded["recordID"] == recordID
    ]["low_res_filename"].values
    
    if len(paths) == 0:
        return None
    
    path = paths[0]
    # Merge: IMAGES_FOLDER + path[1:]
    merged_path = fixPath(os.path.join(IMAGES_FOLDER, path[1:]))
    return merged_path

def get_output_df(path):
    if os.path.exists(path):
        return pd.read_csv(path)
    else:
        return pd.DataFrame(columns=['recordID', 'category', 'focus', 'caption'])

def get_input_df(path):
    data = pd.read_csv(path)
    tasks = pd.DataFrame(columns=['recordID', 'category', 'focus', 'caption'])
    for index, row in data.iterrows():
        recordID = row["recordID"]
        category = row["category"]
        for focus in ["content", "emotion", "colors", "luminosity"]:
            tasks.loc[len(tasks)] = {
                "recordID": recordID,
                "category": category,
                "focus": focus,
                "caption": None
            }
    
    # Shuffle the tasks
    tasks = tasks.sample(frac=1).reset_index(drop=True)

    return tasks

def add_row_to_output_df(output, path, recordID, category, focus, caption):
    output.loc[len(output)] = {
        "recordID": recordID,
        "category": category,
        "focus": focus,
        "caption": caption
    }
    # Save the output
    output.to_csv(path, index=False)
    output = pd.read_csv(path) # Reload the output

app = Flask(__name__, static_folder='static')
CORS(app)

# 1) Load the input and output dataframe
VALIDATION_DATA = {
    "tasks": get_input_df(RECORD_IDS_VALIDATION_SET),
    "output": get_output_df(WRITTEN_CAPTIONS_VALIDATION_SET)
}
TESTING_DATA = {
    "tasks": get_input_df(RECORD_IDS_TESTING_SET),
    "output": get_output_df(WRITTEN_CAPTIONS_TESTING_SET)
}
TRAINING_DATA = {
    "tasks": get_input_df(RECORD_IDS_TRAINING_SET),
    "output": get_output_df(WRITTEN_CAPTIONS_TRAINING_SET)
}

# 2) Remove the tasks that have already been completed
def remove_completed_tasks(tasks, output):
    # Remove from tasks the rows that have the same recordID AND focus
    for index, row in output.iterrows():
        recordID = row["recordID"]
        focus = row["focus"]
        tasks = tasks[(tasks["recordID"] != recordID) | (tasks["focus"] != focus)]

    return tasks

for dataset in [VALIDATION_DATA, TESTING_DATA, TRAINING_DATA]:
    dataset["tasks"] = remove_completed_tasks(dataset["tasks"], dataset["output"])

# 2) Serve index.html
@app.route('/')
def index():
    return app.send_static_file('index.html')

# 3) Serve the images
@app.route('/images/<int:recordID>')
def serve_image(recordID):
    path = get_image_path_from_recordID(recordID)
    if path is None:
        return {
            "success": False,
            "message": "No image found."
        }
    return send_file(path, mimetype='image/jpg')

# 4) Get a task
def get_new_task(setName):
    global VALIDATION_DATA, TESTING_DATA, TRAINING_DATA
    if setName not in ["validation", "testing", "training"]:
        return {
            "success": False,
            "message": "Invalid set name."
        }
    
    dataset = None
    if setName == "training":
        dataset = TRAINING_DATA
    elif setName == "testing":
        dataset = TESTING_DATA
    else:
        dataset = VALIDATION_DATA


    total_per_focus = {}
    completed_per_focus = {}
    for focus in ["content", "emotion", "colors", "luminosity"]:
        completed_per_focus[focus] = len(dataset["output"][dataset["output"]["focus"] == focus])
        total_per_focus[focus] = len(dataset["tasks"][dataset["tasks"]["focus"] == focus]) + completed_per_focus[focus]

    if len(dataset["tasks"]) == 0:
        return {
            "success": True,
            "content": "N/A",
            "infos": {
                "total": len(dataset["tasks"]) + len(dataset["output"]),
                "completed": len(dataset["output"]),
                "total_per_focus": total_per_focus,
                "completed_per_focus": completed_per_focus
            }
        }
    
    task = dataset["tasks"].iloc[0].to_dict()
    del task["caption"]

    return jsonify({
        "success": True,
        "content": task,
        "infos": {
            "total": len(dataset["tasks"]) + len(dataset["output"]),
            "completed": len(dataset["output"]),
            "total_per_focus": total_per_focus,
            "completed_per_focus": completed_per_focus
        }
    })

@app.route('/api/get_task/<string:setName>', methods=['GET'])
def get_task(setName):
    return get_new_task(setName)

# 5) Send caption (receive completed JSON)
@app.route('/api/send_caption/<string:setName>', methods=['POST'])
def send_caption(setName):
    global VALIDATION_DATA, TESTING_DATA, TRAINING_DATA
    if setName not in ["validation", "testing", "training"]:
        return {
            "success": False,
            "message": "Invalid set name."
        }
    
    dataset = None
    if setName == "training":
        dataset = TRAINING_DATA
    elif setName == "testing":
        dataset = TESTING_DATA
    else:
        dataset = VALIDATION_DATA
    
    data = request.json
    recordID = data["recordID"]
    category = data["category"]
    focus = data["focus"]
    caption = data["caption"]

    # Verify caption
    if not isinstance(caption, str) or len(caption) == 0:
        return {
            "success": False,
            "message": "The caption must be a non-empty string."
        }
    
    add_row_to_output_df(
        dataset["output"],
        WRITTEN_CAPTIONS_VALIDATION_SET if setName == "validation" else WRITTEN_CAPTIONS_TESTING_SET if setName == "testing" else WRITTEN_CAPTIONS_TRAINING_SET,
        recordID,
        category,
        focus,
        caption
    )

    # Remove the task from the tasks
    dataset["tasks"] = dataset["tasks"][
        (dataset["tasks"]["recordID"] != recordID) | (dataset["tasks"]["focus"] != focus)
    ]
    
    return get_new_task(setName)

# 
if __name__ == '__main__':
    # By default, Flask will serve at http://127.0.0.1:5000/
    app.run(debug=True)