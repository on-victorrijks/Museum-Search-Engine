import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../private_data/.env"))

PARENT = "./../../"

DB_INPUT_ARTPIECES = PARENT + os.getenv("DB_INPUT_ARTPIECES")
DB_INPUT_ARTISTS = PARENT + os.getenv("DB_INPUT_ARTISTS")
DB_INPUT_SUBJECTMATTER = PARENT + os.getenv("DB_INPUT_SUBJECTMATTER")
FILE_SUBJECTMATTERS_PARSED = PARENT + os.getenv("FILE_SUBJECTMATTERS_PARSED")

def get_paths():
    return {
        "artpieces": DB_INPUT_ARTPIECES,
        "artists": DB_INPUT_ARTISTS,
        "subjectmatter": FILE_SUBJECTMATTERS_PARSED,
        "embeddings": [
            {
                "name": "february_finetuned",
                "path_embeddings": PARENT + os.getenv("february_finetuned_path_embeddings"),
                "path_index_to_recordID": PARENT + os.getenv("february_finetuned_path_index_to_recordID"),
                "path_keywords": PARENT + os.getenv("february_finetuned_path_keywords_embeddings"),
                "path_term_to_index": PARENT + os.getenv("february_finetuned_path_keywords_term_to_index"),
                "text_dim": 768,    
                "img_dim": 768,
                "base_name": os.getenv("february_finetuned_model_name"),
                "weights_path": PARENT + os.getenv("february_finetuned_weights_path"),
                "description": "February finetuned embeddings",
                "metrics": [
                    {"name": "Acc@1", "value": 0.7},
                    {"name": "Acc@5", "value": 0.89},
                    {"name": "Acc@10", "value": 0.98}
                ]
            }
        ],
        "images": PARENT + os.getenv("IMAGES_FOLDER")
    }

def get_db_config():
    return {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT"),
        "name": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
    }

# Testing
def get_db_config_test():
    return {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT"),
        "name": "test_db",
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
    }

def get_paths_test():
    # TODO: In the future, we should use subsets of the data to populate the database (or synthetic data)
    return get_paths()   

def is_development():
    return os.getenv("ENVIRONMENT") == "development"

