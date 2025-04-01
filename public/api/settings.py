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
                "keywords": {
                    "fr": {
                        "path": PARENT + os.getenv("february_finetuned_path_keywords_embeddings_fr"),
                        "term_data": PARENT + os.getenv("february_finetuned_path_keywords_term_data_fr")
                    },
                    "en": {
                        "path": PARENT + os.getenv("february_finetuned_path_keywords_embeddings_en"),
                        "term_data": PARENT + os.getenv("february_finetuned_path_keywords_term_data_en")
                    },
                    "nl": {
                        "path": PARENT + os.getenv("february_finetuned_path_keywords_embeddings_nl"),
                        "term_data": PARENT + os.getenv("february_finetuned_path_keywords_term_data_nl")
                    },
                },
                "text_dim": 768,    
                "img_dim": 768,
                "base_name": os.getenv("february_finetuned_model_name"),
                "weights_path": PARENT + os.getenv("february_finetuned_weights_path"),
                "description": "February finetuned embeddings",
                "metrics": [
                    {"name": "loss", "value": 0.353437},
                    {"name": "average_position", "value": 2.634336},
                    {"name": "mrr", "value": 0.744311},
                    {"name": "recall@1", "value": 0.619004},
                ]
            },
            #{
            #    "name": "march_finetuned",
            #    "path_embeddings": PARENT + os.getenv("march_finetuned_path_embeddings"),
            #    "path_index_to_recordID": PARENT + os.getenv("march_finetuned_path_index_to_recordID"),
            #    "path_keywords": PARENT + os.getenv("march_finetuned_path_keywords_embeddings"),
            #    "path_term_to_index": PARENT + os.getenv("march_finetuned_path_keywords_term_to_index"),
            #    "text_dim": 768,    
            #    "img_dim": 768,
            #    "base_name": os.getenv("march_finetuned_model_name"),
            #    "weights_path": PARENT + os.getenv("march_finetuned_weights_path"),
            #    "description": "March finetuned embeddings",
            #    "metrics": [
            #        {"name": "loss", "value": 0.283353},
            #        {"name": "average_position", "value": 2.305237},
            #        {"name": "mrr", "value": 0.784912},
            #        {"name": "recall@1", "value": 0.666860},
            #    ]
            #},
            {
                "name": "art-mini",
                "path_embeddings": PARENT + os.getenv("art-mini_path_embeddings"),
                "path_index_to_recordID": PARENT + os.getenv("art-mini_path_index_to_recordID"),
                "keywords": {
                    "fr": {
                        "path": PARENT + os.getenv("art-mini_path_keywords_embeddings_fr"),
                        "term_data": PARENT + os.getenv("art-mini_path_keywords_term_data_fr")
                    },
                    "en": {
                        "path": PARENT + os.getenv("art-mini_path_keywords_embeddings_en"),
                        "term_data": PARENT + os.getenv("art-mini_path_keywords_term_data_en")
                    },
                    "nl": {
                        "path": PARENT + os.getenv("art-mini_path_keywords_embeddings_nl"),
                        "term_data": PARENT + os.getenv("art-mini_path_keywords_term_data_nl")
                    },
                },
                "text_dim": 512,    
                "img_dim": 512,
                "base_name": os.getenv("art-mini_model_name"),
                "weights_path": PARENT + os.getenv("art-mini_weights_path"),
                "description": "Art-mini embeddings",
                "metrics": [
                    {"name": "loss", "value": 1.097012},
                    {"name": "average_position", "value": 2.357923},
                    {"name": "mrr", "value": 0.748386},
                    {"name": "recall@1", "value": 0.623060},
                ]
            },
            {
                "name": "art-base",
                "path_embeddings": PARENT + os.getenv("art-base_path_embeddings"),
                "path_index_to_recordID": PARENT + os.getenv("art-base_path_index_to_recordID"),
                "keywords": {
                    "fr": {
                        "path": PARENT + os.getenv("art-base_path_keywords_embeddings_fr"),
                        "term_data": PARENT + os.getenv("art-base_path_keywords_term_data_fr")
                    },
                    "en": {
                        "path": PARENT + os.getenv("art-base_path_keywords_embeddings_en"),
                        "term_data": PARENT + os.getenv("art-base_path_keywords_term_data_en")
                    },
                    "nl": {
                        "path": PARENT + os.getenv("art-base_path_keywords_embeddings_nl"),
                        "term_data": PARENT + os.getenv("art-base_path_keywords_term_data_nl")
                    },
                },
                "text_dim": 768,
                "img_dim": 768,
                "base_name": os.getenv("art-base_model_name"),
                "weights_path": PARENT + os.getenv("art-base_weights_path"),
                "description": "Art-base embeddings",
                "metrics": [
                    {"name": "loss", "value": 0.270707},
                    {"name": "average_position", "value": 2.104928},
                    {"name": "mrr", "value": 0.793721},
                    {"name": "recall@1", "value": 0.678622},
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

