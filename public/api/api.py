from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from database.db import DatabaseManager
from settings import get_db_config, get_paths, is_development
from engine.model import Model
import math
import torch

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes in development

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["8000 per day", "1000 per hour"]
)

def formatReturn(
    success: bool,
    data: dict = None,
    python_error: Exception = None,
    user_error: str = "",
    error_code: int = 200
):
    if python_error is not None:
        # TODO: Log the error into a Logger
        print(f"Error: {python_error}")
    
    response = jsonify({
        "success": success,
        "data": data,
        "error_message": user_error,
        "error_code": error_code
    })
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response

# Initialize models
device = "cuda" if torch.cuda.is_available() else "cpu"
#device = "cpu"

print(f"Using device: {device}")

MODELS = {}
print(f"Loading models...")
for embedding in get_paths()["embeddings"]:
    print(f"Loading model {embedding['name']}...")
    MODELS[embedding["name"]] = Model(
        embedding["name"],
        embedding["base_name"],
        embedding["weights_path"],
        device=device
    )
    print(f"✓ : Model {embedding['name']} loaded")
print(f"Models loaded")

# Initialize database manager
DB_MANAGER = DatabaseManager(get_db_config(), get_paths(), MODELS)

MIN_PAGE_SIZE = 1
MAX_PAGE_SIZE = 100
MIN_PAGE = 1
# We have about 5500 artworks currently but this may change in the future
# For now we set an upper bound to 7000
UPPER_BOUND_ARTWORKS = 7000 

# Query parameters
VALID_VERSIONS = ["classic", "power", "rocchio"]
MIN_ROCCHIO_K = 1
MAX_ROCCHIO_K = 100
MIN_ROCCHIO_SCALE = 0
MAX_ROCCHIO_SCALE = 10.0

# Augmentation parameters
VALID_METHODS = ["convex_fill", "shortest_path"]
# Convex fill parameters
CONVEX_FILL__MIN_NUMBER_OF_IMAGES = 1
CONVEX_FILL__MAX_NUMBER_OF_IMAGES = 50
CONVEX_FILL__MIN_SIMILARITY_THRESHOLD = 0
CONVEX_FILL__MAX_SIMILARITY_THRESHOLD = 1
CONVEX_FILL__MIN_DECAY_RATE = 0
CONVEX_FILL__MAX_DECAY_RATE = 1
CONVEX_FILL__MIN_PATIENCE = 1
CONVEX_FILL__MAX_PATIENCE = 50

# Autocomplete parameters
MIN_AUTOCOMPLETE_PREFIX_LENGTH = 1
MAX_AUTOCOMPLETE_PREFIX_LENGTH = 100
MAX_AUTOCOMPLETE_RESULTS = 5

# Routes
@app.route('/api/artwork/<int:record_id>/similar', methods=['GET'])
@limiter.limit("60 per minute")
def get_similar_artworks(record_id):
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 10))
        keep_original_record = request.args.get('keep_original_record', False)

        page_size = max(MIN_PAGE_SIZE, min(page_size, MAX_PAGE_SIZE))
        max_page = math.ceil(UPPER_BOUND_ARTWORKS / page_size)

        if page > max_page:
            return formatReturn(
                success=False,
                user_error="Page hors limites",
                error_code=400
            )

        page = max(MIN_PAGE, min(page, max_page))

        results = DB_MANAGER.get_nearest_artworks_to_recordID(
            recordID=record_id,
            page=page,
            page_size=page_size,
            keep_original_record=keep_original_record
        )
        
        if results is None:
            return formatReturn(
                success=False,
                user_error="Oeuvre non trouvée",
                error_code=404
            )
            
        return formatReturn(
            success=True,
            data={
                "results": results,
                "page": page,
                "page_size": page_size
            }
        )
        
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la récupération des oeuvres similaires",
            error_code=500
        )

@app.route('/api/artwork/<int:record_id>', methods=['GET'])
@limiter.limit("60 per minute")  # Rate limit for artwork details
def get_artwork(record_id):
    # Example: /api/artwork/478
    try:
        artwork = DB_MANAGER.get_artwork_by_recordID(record_id)
        if artwork is None:
            return formatReturn(
                success=False,
                error_message="Artwork not found",
                error_code=404
            )
        return formatReturn(
            success=True,
            data=artwork
        )
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la récupération des informations de l'oeuvre",
            error_code=500
        )

@app.route('/api/artwork/<int:record_id>/image', methods=['GET'])
@limiter.limit("1000 per minute")  # Rate limit for image serving
def get_artwork_image(record_id):
    try:
        image_path = DB_MANAGER.get_image_path_by_recordID(record_id)
        if image_path is None:
            return formatReturn(
                success=False,
                error_message="Artwork not found",
                error_code=404
            )
            
        image_path = get_paths()["images"] + image_path
        if not os.path.exists(image_path):
            return formatReturn(
                success=False,
                error_message="Image not found",
                error_code=404
            )
            
        return send_file(
            image_path,
            mimetype='image/jpeg',
            as_attachment=False
        )
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la récupération de l'image de l'oeuvre",
            error_code=500
        )

@app.route('/api/artist/<string:creator_id>', methods=['GET'])
@limiter.limit("60 per minute")
def get_artist(creator_id):
    try:
        artist = DB_MANAGER.get_artist_by_creatorID(creator_id)
        return formatReturn(success=True, data=artist)
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la récupération des informations de l'artiste",
            error_code=500
        )

@app.route('/api/query', methods=['POST'])
@limiter.limit("60 per minute")
def query_artworks():
    """
        Example of a query:
        {
            "hard_constraints": [
                {
                    "type": "BETWEEN",
                    "selectedColumn": {
                        "key": "recordID"
                    },
                    "from": 64,
                    "to": 82,
                    "exactMatch": false,
                    "isNot": false,
                    "keepNull": false
                }
            ],
            "soft_constraints": [],
            "page": 1,
            "page_size": 10,
            "model_name": "march_finetuned",
            "version": "rocchio",
            "rocchio_k": 5,
            "rocchio_scale": 1.0
        }
        Another example:
        {
            "hard_constraints": [
                {
                    "type": "EQUAL",
                    "selectedColumn": {
                        "key": "title"
                    },
                    "equalTo": "une femme",
                    "isNot": false,
                    "keepNull": false,
                    "caseSensitive": false,
                    "exactMatch": false
                }
            ],
            "soft_constraints": [],
            "page": 1,
            "page_size": 10,
            "model_name": "march_finetuned",
            "version": "rocchio",
            "rocchio_k": 5,
            "rocchio_scale": 1.0
        }
    """
    try:
        data = request.json
        hard_constraints = data.get('hard_constraints', [])
        soft_constraints = data.get('soft_constraints', [])
        model_name = data.get('model_name', "march_finetuned")
        page = data.get('page', 1)
        page_size = data.get('page_size', 10)
        version = data.get('version', "power")
        rocchio_k = data.get('rocchio_k', 5)
        rocchio_scale = data.get('rocchio_scale', 1.0)

        page_size = max(MIN_PAGE_SIZE, min(page_size, MAX_PAGE_SIZE))
        max_page = math.ceil(UPPER_BOUND_ARTWORKS / page_size)
        page = max(MIN_PAGE, min(page, max_page))

        if model_name not in MODELS:
            return formatReturn(
                success=False,
                user_error="Modèle invalide",
                error_code=400
            )
        
        if version not in VALID_VERSIONS:
            return formatReturn(
                success=False,
                user_error="Version invalide",
                error_code=400
            )
        
        rocchio_k = max(MIN_ROCCHIO_K, min(rocchio_k, MAX_ROCCHIO_K))
        rocchio_scale = max(MIN_ROCCHIO_SCALE, min(rocchio_scale, MAX_ROCCHIO_SCALE))    

        results = DB_MANAGER.query(
            hard_constraints,
            soft_constraints,
            page,
            page_size,
            model_name,
            version,
            rocchio_k,
            rocchio_scale
        )
        return formatReturn(success=True, data=results)
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la requête",
            error_code=500
        )
    
@app.route('/api/collection/augment', methods=['POST'])
def augment_collection():
    try:
        data = request.json

        record_ids = data.get('recordIDs', [])
        if len(record_ids) == 0:
            return formatReturn(
                success=False,
                user_error="Aucune oeuvre spécifiée",
                error_code=400
            )

        method = data.get('method', "convex_fill")
        if method not in VALID_METHODS:
            return formatReturn(
                success=False,
                user_error="Méthode invalide",
                error_code=400
            )
        
        # Convex fill parameters
        parameters = {}
        if method == "convex_fill":
            number_of_images = data.get('numberOfImages', 10)
            number_of_images = max(CONVEX_FILL__MIN_NUMBER_OF_IMAGES, min(number_of_images, CONVEX_FILL__MAX_NUMBER_OF_IMAGES))
            similarity_threshold = data.get('similarityThreshold', 0.5)
            similarity_threshold = max(CONVEX_FILL__MIN_SIMILARITY_THRESHOLD, min(similarity_threshold, CONVEX_FILL__MAX_SIMILARITY_THRESHOLD))
            decay_rate = data.get('decayRate', 0.5)
            decay_rate = max(CONVEX_FILL__MIN_DECAY_RATE, min(decay_rate, CONVEX_FILL__MAX_DECAY_RATE))
            patience = data.get('patience', 10)
            patience = max(CONVEX_FILL__MIN_PATIENCE, min(patience, CONVEX_FILL__MAX_PATIENCE))
            parameters = {
                "numberOfImages": number_of_images,
                "similarityThreshold": similarity_threshold,
                "decayRate": decay_rate,
                "patience": patience
            }

        model_name = data.get('model_name', "march_finetuned")
        if model_name not in MODELS:
            return formatReturn(
                success=False,
                user_error="Modèle invalide",
                error_code=400
            )

        new_record_ids = DB_MANAGER.augment_collection(model_name, record_ids, method, parameters)

        return formatReturn(success=True, data=new_record_ids)
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de l'augmentation de la collection",
            error_code=500
        )
    
@app.route('/api/collection/sort_by_similarity', methods=['POST'])
def sort_by_similarity():
    try:
        data = request.json
        record_ids = data.get('recordIDs', [])
        model_name = data.get('model_name', "march_finetuned")

        if len(record_ids) <= 1:
            return formatReturn(
                success=False,
                user_error="Aucune oeuvre spécifiée",
                error_code=400
            )

        if model_name not in MODELS:
            return formatReturn(
                success=False,
                user_error="Modèle invalide",
                error_code=400
            ) 
        
        sorted_record_ids = DB_MANAGER.sort_by_similarity(model_name, record_ids)

        return formatReturn(success=True, data=sorted_record_ids)
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la trie des oeuvres par similarité",
            error_code=500
        )

@app.route('/api/collection/path_from_two_terms', methods=['POST'])
def path_from_two_terms():
    try:
        data = request.json
        record_ids = data.get('recordIDs', [])
        model_name = data.get('model_name', "march_finetuned")
        term1 = data.get('term1', "")
        term2 = data.get('term2', "")

        if len(record_ids) <= 1:
            return formatReturn(
                success=False,
                user_error="Aucune oeuvre spécifiée",
                error_code=400
            )

        if model_name not in MODELS:
            return formatReturn(
                success=False,
                user_error="Modèle invalide",
                error_code=400
            ) 
        
        if len(term1) == 0 or len(term2) == 0:
            return formatReturn(
                success=False,
                user_error="Aucun terme spécifié",
                error_code=400
            )
        
        path = DB_MANAGER.path_from_two_terms(model_name, record_ids, term1, term2)

        return formatReturn(success=True, data=path)
    
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la recherche du chemin entre les deux termes",
            error_code=500
        )
    
@app.route('/api/autocomplete', methods=['POST'])
def autocomplete():
    try:
        data = request.json
        prefix = data.get('prefix', "")
        column = data.get('column', None)
        prefix_length = len(prefix)
        if prefix_length < MIN_AUTOCOMPLETE_PREFIX_LENGTH or prefix_length > MAX_AUTOCOMPLETE_PREFIX_LENGTH:
            return formatReturn(
                success=False,
                user_error="Préfixe invalide",
                error_code=400
            )
        
        if column is None:  
            return formatReturn(
                success=False,
                user_error="Colonne invalide",
                error_code=400
            )
        
        results = DB_MANAGER.autocomplete(prefix, column, MAX_AUTOCOMPLETE_RESULTS) 

        return formatReturn(success=True, data=results)
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de l'autocomplétion",
            error_code=500
        )
    
@app.route('/api/get_settings_infos', methods=['GET'])
def get_settings_infos():
    return formatReturn(success=True, data={
        # Models
        "models": [{"model_name": model[0], "modelID": model[1]} for model in DB_MANAGER.get_models()],

        # Methods
        "methods": VALID_VERSIONS,

        # Languages
        "languages": ["fr", "en", "nl"],
        
        # Rocchio
        "min_rocchio_k": MIN_ROCCHIO_K,
        "max_rocchio_k": MAX_ROCCHIO_K,
        "min_rocchio_scale": MIN_ROCCHIO_SCALE,
        "max_rocchio_scale": MAX_ROCCHIO_SCALE,

        # Page
        "min_page_size": MIN_PAGE_SIZE,
        "max_page_size": MAX_PAGE_SIZE,

        # Autocomplete
        "min_autocomplete_prefix_length": MIN_AUTOCOMPLETE_PREFIX_LENGTH,
        "max_autocomplete_prefix_length": MAX_AUTOCOMPLETE_PREFIX_LENGTH,
        "max_autocomplete_results": MAX_AUTOCOMPLETE_RESULTS,

        # Augment
        "augment_methods": VALID_METHODS,

        # Convex fill
        "min_convex_fill_number_of_images": CONVEX_FILL__MIN_NUMBER_OF_IMAGES,
        "max_convex_fill_number_of_images": CONVEX_FILL__MAX_NUMBER_OF_IMAGES,
        "min_convex_fill_similarity_threshold": CONVEX_FILL__MIN_SIMILARITY_THRESHOLD,
        "max_convex_fill_similarity_threshold": CONVEX_FILL__MAX_SIMILARITY_THRESHOLD,
        "min_convex_fill_decay_rate": CONVEX_FILL__MIN_DECAY_RATE,
        "max_convex_fill_decay_rate": CONVEX_FILL__MAX_DECAY_RATE,
        "min_convex_fill_patience": CONVEX_FILL__MIN_PATIENCE,
        "max_convex_fill_patience": CONVEX_FILL__MAX_PATIENCE,
    })

# /api/get_settings_infos should replace the routes below
@app.route('/api/get_columns', methods=['GET'])
def get_columns():
    # TODO: Deprecate this route
    try:
        columns = DB_MANAGER.get_columns()
        return formatReturn(success=True, data=columns)
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la récupération des colonnes",
            error_code=500
        )

@app.route('/api/get_models', methods=['GET'])
def get_models():
    # TODO: Deprecate this route
    try:
        models = [model[0] for model in DB_MANAGER.get_models()]
        return formatReturn(success=True, data=models)
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la récupération des modèles",
            error_code=500
        )

@app.route('/api/get_keywords', methods=['GET'])
def get_keywords():
    # TODO: Deprecate this route
    try:
        keywords = DB_MANAGER.get_keywords()
        return formatReturn(success=True, data=keywords)
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la récupération des mots-clés",
            error_code=500
        )

if __name__ == '__main__':
    # Development server
    app.run(debug=False, host='0.0.0.0', port=5000)
