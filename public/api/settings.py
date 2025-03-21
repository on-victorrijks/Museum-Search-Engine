import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../private_data/.env"))

PARENT = "./../../"

DB_INPUT_ARTPIECES = PARENT + os.getenv("DB_INPUT_ARTPIECES")
DB_INPUT_ARTISTS = PARENT + os.getenv("DB_INPUT_ARTISTS")
DB_INPUT_SUBJECTMATTER = PARENT + os.getenv("DB_INPUT_SUBJECTMATTER")

def get_paths():
    return {
        "artpieces": DB_INPUT_ARTPIECES,
        "artists": DB_INPUT_ARTISTS,
        "subjectmatter": DB_INPUT_SUBJECTMATTER,
        "embeddings": [
            {
                "name": "february_finetuned",
                "path_embeddings": PARENT + os.getenv("february_finetuned_path_embeddings"),
                "path_index_to_recordID": PARENT + os.getenv("february_finetuned_path_index_to_recordID"),
                "text_dim": 768,
                "img_dim": 768,
                "description": "February finetuned embeddings",
                "metrics": [
                    {"name": "Acc@1", "value": 0.7},
                    {"name": "Acc@5", "value": 0.89},
                    {"name": "Acc@10", "value": 0.98}
                ]
            }
        ]
    }

def get_db_config():
    return {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT"),
        "name": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
    }

