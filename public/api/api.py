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
    print(python_error)
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
MODELS = {}
for embedding in get_paths()["embeddings"]:
    MODELS[embedding["name"]] = Model(
        embedding["name"],
        embedding["base_name"],
        embedding["weights_path"],
        device="cuda" if torch.cuda.is_available() else "cpu"
    )

# Initialize database manager
DB_MANAGER = DatabaseManager(get_db_config(), get_paths(), MODELS)

MIN_PAGE_SIZE = 1
MAX_PAGE_SIZE = 100
MIN_PAGE = 1
# We have about 5500 artworks currently but this may change in the future
# For now we set an upper bound to 7000
UPPER_BOUND_ARTWORKS = 7000 

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
            "page_size": 10
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
            "model_name": "february_finetuned"
        }
    """
    try:
        data = request.json
        hard_constraints = data.get('hard_constraints', [])
        soft_constraints = data.get('soft_constraints', [])
        model_name = data.get('model_name', "february_finetuned")
        page = data.get('page', 1)
        page_size = data.get('page_size', 10)

        results = DB_MANAGER.query(
            hard_constraints,
            soft_constraints,
            page,
            page_size,
            model_name
        )
        return formatReturn(success=True, data=results)
    except Exception as e:
        return formatReturn(
            success=False,
            python_error=e,
            user_error="Une erreur est survenue lors de la requête",
            error_code=500
        )

@app.route('/api/get_columns', methods=['GET'])
def get_columns():
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
    try:
        models = DB_MANAGER.get_models()
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
