import psycopg2
import numpy as np
import pandas as pd
import json
from pgvector.psycopg2 import register_vector
import random
import networkx as nx
from sklearn.metrics.pairwise import cosine_similarity

def betterInt(x):
    # If x is nan, return None
    if pd.isna(x):
        return None
    # If x is a string, try to convert it to an int
    try:
        return int(x)
    except ValueError:
        return None

def betterList(x):
    x = str(x)
    if len(x) == 0:
        return []
    return x.split('|')

def convert_embedding_to_numpy(embedding: str):
    # pgvector stores the embedding as a string
    embedding_string = embedding.strip('[]')
    embedding_list = [float(x.strip()) for x in embedding_string.split(',')]
    embedding_array = np.array(embedding_list)
    return embedding_array

subject_matter_to_table_name = {
    "subjectMatterSubjectTerms": "SubjectTerms",
    "subjectMatterIconographicTerms": "IconographicTerms",
    "subjectMatterConceptualTerms": "ConceptualTerms",
    "subjectMatterIconographicInterpretation": "IconographicInterpretation",
    "subjectMatterGeneralSubjectDescription": "GeneralSubjectDescription",
    "subjectMatterSpecificSubjectIdentification": "SpecificSubjectIdentification"
}

column_mapping = {
    # Artwork
    "recordID": "a.recordID",
    "workID": "a.workID",
    "language": "a.language",
    "title": "a.title",
    "objectType": "a.objectWorkType",
    "classification": "a.termClassification",
    "materials": "a.materials",
    "inscription": "a.signatureFullDescription",
    "creationEarliestDate": "a.creationEarliestDate",
    "creationLatestDate": "a.creationLatestDate",
    "creator": "a.creatorFullDescription",
    "physicalAppearance": "a.physicalAppearanceDescription",
    "imageType": "a.imageType",
    "imageColor": "a.imageColor",
    "imageLowResFilename": "a.imageLowResFilename",
    "imageHighResFilename": "a.imageHighResFilename",
    "imageCopyright": "a.imageCopyright",
    "imageStyle": "a.formalDescriptionTermStylesPeriods",
    "height": "a.height",
    "width": "a.width",
    "ratio": "a.ratio",
    
    # Artist
    "creatorID": "ar.creatorID",
    "creatorFirstName": "ar.creatorFirstName",
    "creatorLastName": "ar.creatorLastName",
    "creatorBirthDate": "ar.creatorBirthDate",
    "creatorDeathDate": "ar.creatorDeathDate",
    "creatorBirthDeathPlace": "ar.creatorBirthAndDeathDescription",
    "creatorNationality": "ar.creatorNationality",

    # ConceptualTerms_Flat
    "CFT_values": "CFT.values",

    # IconographicTerms_Flat
    "IFT_values": "IFT.values",

    # SubjectTerms_Flat
    "STF_values": "STF.values",

    # SubjectTerms_Tree
    "STT_tree": "STT.tree",

    # IconographicTerms_Tree
    "IFT_tree": "IFT.tree",

    # IconographicInterpretation
    "II_value": "II.value",

    # GeneralSubjectDescription
    "GSD_value": "GSD.value",

    # SpecificSubjectIdentification
    "SSI_value": "SSI.value",
}
column_is_list = {
    # Artwork
    "objectType": True,
    "materials": True,
    "imageStyle": True,
    
    # ConceptualTerms_Flat
    "CFT_values": True,
    # IconographicTerms_Flat
    "IFT_values": True,
    # SubjectTerms_Flat
    "STF_values": True,
}
blockType_per_column = {
    # Artwork
    "recordID": ["EQUAL", "BETWEEN", "INCLUDES"],
    "workID": ["EQUAL", "INCLUDES"],
    "language": ["EQUAL", "INCLUDES"],
    "title": ["EQUAL", "INCLUDES"],
    "objectType": ["EQUAL", "INCLUDES"],
    "classification": ["EQUAL", "INCLUDES"],
    "materials": ["EQUAL", "INCLUDES"],
    "inscription": ["EQUAL", "INCLUDES"],
    "creationEarliestDate": ["EQUAL", "BETWEEN"],
    "creationLatestDate": ["EQUAL", "BETWEEN"],
    "creator": ["EQUAL", "INCLUDES"],
    "physicalAppearance": ["EQUAL", "INCLUDES"],
    "imageType": ["EQUAL", "INCLUDES"],
    "imageColor": ["EQUAL", "INCLUDES"],
    "imageCopyright": ["EQUAL", "INCLUDES"],
    "imageStyle": ["EQUAL", "INCLUDES"],
    "height": ["EQUAL", "BETWEEN"],
    "width": ["EQUAL", "BETWEEN"],
    "ratio": ["EQUAL", "BETWEEN"],
    
    # Artist
    "creatorID": ["EQUAL", "INCLUDES"],
    "creatorFirstName": ["EQUAL", "INCLUDES"],
    "creatorLastName": ["EQUAL", "INCLUDES"],
    "creatorBirthDate": ["EQUAL", "BETWEEN"],
    "creatorDeathDate": ["EQUAL", "BETWEEN"],
    "creatorBirthDeathPlace": ["EQUAL", "INCLUDES"],
    "creatorNationality": ["EQUAL", "INCLUDES"],

    # ConceptualTerms_Flat
    "CFT_values": ["EQUAL", "INCLUDES"],

    # IconographicTerms_Flat
    "IFT_values": ["EQUAL", "INCLUDES"],

    # SubjectTerms_Flat
    "STF_values": ["EQUAL", "INCLUDES"],

    # IconographicInterpretation
    "II_value": ["EQUAL", "INCLUDES"],

    # GeneralSubjectDescription
    "GSD_value": ["EQUAL", "INCLUDES"],

    # SpecificSubjectIdentification
    "SSI_value": ["EQUAL", "INCLUDES"],
}
userFriendlyName_per_column = {
    # Artwork
    "recordID": "recordID",
    "workID": "workID",
    "language": "Langue",
    "title": "Titre",
    "objectType": "Type d'objet",
    "classification": "Classification",
    "materials": "Matériaux",
    "inscription": "Inscription",
    "creationEarliestDate": "Date de création (plus ancienne)",
    "creationLatestDate": "Date de création (plus récente)",
    "creator": "Créateur",
    "physicalAppearance": "Apparence physique",
    "imageType": "Type d'image",
    "imageColor": "Couleur de l'image",
    "imageCopyright": "Copyright de l'image",
    "imageStyle": "Style de l'image",
    "height": "Hauteur",
    "width": "Largeur",
    "ratio": "Ratio (hauteur/largeur)",
    
    # Artist
    "creatorID": "ID du créateur",
    "creatorFirstName": "Prénom du créateur",
    "creatorLastName": "Nom du créateur",
    "creatorBirthDate": "Date de naissance du créateur",
    "creatorDeathDate": "Date de décès du créateur",
    "creatorBirthDeathPlace": "Lieu de naissance et de décès du créateur",
    "creatorNationality": "Nationalité du créateur",

    # ConceptualTerms_Flat
    "CFT_values": "Concepts",

    # IconographicTerms_Flat
    "IFT_values": "Termes iconographiques",

    # SubjectTerms_Flat
    "STF_values": "Sujets",

    # IconographicInterpretation
    "II_value": "Interprétation iconographique",

    # GeneralSubjectDescription
    "GSD_value": "Description générale du sujet",

    # SpecificSubjectIdentification
    "SSI_value": "Identification spécifique du sujet",
}
columnsData = []
for column, block_types in blockType_per_column.items():
    columnsData.append({
        "key": column,
        "compatibleBlockTypes": block_types,
        "userFriendlyName": userFriendlyName_per_column[column]
    })
columnsWithAutocomplete = {
    # Artwork
    "language": "Artwork AS a",
    "title": "Artwork AS a",
    "objectType": "Artwork AS a",
    "classification": "Artwork AS a",
    "materials": "Artwork AS a",
    "inscription": "Artwork AS a",
    "creator": "Artwork AS a",
    "physicalAppearance": "Artwork AS a",
    "imageType": "Artwork AS a",
    "imageColor": "Artwork AS a",
    "imageCopyright": "Artwork AS a",
    "imageStyle": "Artwork AS a",
    
    # Artist
    "creatorFirstName": "Artist AS ar",
    "creatorLastName": "Artist AS ar",
    "creatorBirthDeathPlace": "Artist AS ar",
    "creatorNationality": "Artist AS ar",

    # ConceptualTerms_Flat
    "CFT_values": "ConceptualTerms_Flat AS CFT",

    # IconographicTerms_Flat
    "IFT_values": "IconographicTerms_Flat AS IFT",

    # SubjectTerms_Flat
    "STF_values": "SubjectTerms_Flat AS STF",

    # IconographicInterpretation
    "II_value": "IconographicInterpretation AS II",

    # GeneralSubjectDescription
    "GSD_value": "GeneralSubjectDescription AS GSD",

    # SpecificSubjectIdentification
    "SSI_value": "SpecificSubjectIdentification AS SSI",
}
column_types = {
    # Artwork
    "recordID": "INTEGER",
    "workID": "TEXT",
    "language": "TEXT",
    "title": "TEXT",
    "objectType": "TEXT[]",
    "classification": "TEXT",
    "materials": "TEXT[]",
    "inscription": "TEXT",
    "creationEarliestDate": "INTEGER",
    "creationLatestDate": "INTEGER",
    "creator": "TEXT",
    "physicalAppearance": "TEXT",
    "imageType": "TEXT",
    "imageColor": "TEXT",
    "imageCopyright": "TEXT",
    "imageStyle": "TEXT",
    "height": "NUMERIC",
    "width": "NUMERIC",
    "ratio": "NUMERIC",
    
    # Artist
    "creatorID": "TEXT",
    "creatorFirstName": "TEXT",
    "creatorLastName": "TEXT",
    "creatorBirthDate": "INTEGER",
    "creatorDeathDate": "INTEGER",
    "creatorBirthDeathPlace": "TEXT",
    "creatorNationality": "TEXT",

    # ConceptualTerms_Flat
    "CFT_values": "TEXT[]",

    # IconographicTerms_Flat
    "IFT_values": "TEXT[]",

    # SubjectTerms_Flat
    "STF_values": "TEXT[]",

    # IconographicInterpretation
    "II_value": "TEXT",

    # GeneralSubjectDescription
    "GSD_value": "TEXT",

    # SpecificSubjectIdentification
    "SSI_value": "TEXT",
}

class DatabaseManager:
    def __init__(
        self, 
        config,
        paths,
        models,
    ):
        self.db_host = config["host"]
        self.db_port = config["port"]
        self.db_name = config["name"]
        self.db_user = config["user"]
        self.db_password = config["password"]
        self.enable_pgvector()
        self.initialize_tables()
        self.paths = paths
        self.models = models
        self.newModelAddedHandler()
        self.preloaded_models_formatted = None
        self.preloaded_models = None

        self.preloaded_keywords = None
        self.preloaded_colors = None
        self.preloaded_luminosities = None

        self.preloaded_recordIDs = None
        self.preload_models()

        self.preload_keywords()
        self.preload_colors()
        self.preload_luminosities()
        
        self.preload_recordIDs()
        self.refresh_autocomplete_views()
        
    def preload_recordIDs(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT recordID FROM Artwork")
                self.preloaded_recordIDs = [row[0] for row in cur.fetchall()]
    
    def _connect(self):
        return psycopg2.connect(
            host=self.db_host,
            port=self.db_port,
            dbname=self.db_name,
            user=self.db_user,
            password=self.db_password
        )
        
    # Methods to initialize the various tables
    def initialize_tables(self):
        self._create_artist_table()
        self._create_artwork_table()

        self._create_model_table()
        self._create_embedding_table()
        self._create_metric_table()

        self._create_unstructured_subject_matter_tables("IconographicInterpretation")
        self._create_unstructured_subject_matter_tables("GeneralSubjectDescription")
        self._create_unstructured_subject_matter_tables("SpecificSubjectIdentification")

        self._create_structured_subject_matter_tables("SubjectTerms")
        self._create_structured_subject_matter_tables("IconographicTerms")
        self._create_structured_subject_matter_tables("ConceptualTerms")

        self._create_keywords_table()
        self._create_autocomplete_materialized_views()

    def newModelAddedHandler(self):
        # Verify that each model is present in the Model table
        for model_name in self.models:
            # Query the Model table to check if the model is present
            with self._connect() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT * FROM Model WHERE model_name = %s", (model_name,))
                    if cur.fetchone() is None:
                        # The model is not present, so we add it
                        correspondingEmbeddingData = None
                        for embedding in self.paths["embeddings"]:
                            if embedding["name"] == model_name:
                                correspondingEmbeddingData = embedding
                                break

                        if correspondingEmbeddingData is None:
                            raise Exception(f"Model {model_name} not found in paths !")
                        
                        print(f"Adding model {model_name} to the database...")
                        modelID = self.populate_model_table(
                            correspondingEmbeddingData["name"],
                            correspondingEmbeddingData["text_dim"],
                            correspondingEmbeddingData["img_dim"],
                            correspondingEmbeddingData["description"],
                            correspondingEmbeddingData["base_name"]
                        )
                        self.populate_embedding_vectors(
                            modelID,
                            correspondingEmbeddingData["path_embeddings"],
                            correspondingEmbeddingData["path_index_to_recordID"]
                        )
                        self.populate_metrics(
                            modelID,
                            correspondingEmbeddingData["metrics"]
                        )
                        self.populate_keywords_table(
                            modelID,
                            correspondingEmbeddingData["keywords"],
                        )
                        print(f"✓ : Model {model_name} added to the database")

    def _create_keywords_table(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""CREATE TABLE IF NOT EXISTS Keywords (
                    id SERIAL PRIMARY KEY, 
                    lang TEXT,
                    type TEXT,
                    keyword TEXT, 
                    modelID INTEGER REFERENCES Model(modelID),
                    embedding VECTOR
                )""")
                conn.commit()

    def rebuild_subject_matter_tables(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                # Structured subject matters:
                cur.execute("DROP TABLE IF EXISTS SubjectTerms_Flat")
                cur.execute("DROP TABLE IF EXISTS SubjectTerms_Tree")
                cur.execute("DROP TABLE IF EXISTS IconographicTerms_Flat")
                cur.execute("DROP TABLE IF EXISTS IconographicTerms_Tree")
                cur.execute("DROP TABLE IF EXISTS ConceptualTerms_Flat")
                cur.execute("DROP TABLE IF EXISTS ConceptualTerms_Tree")
                # Unstructured subject matters:
                cur.execute("DROP TABLE IF EXISTS IconographicInterpretation")
                cur.execute("DROP TABLE IF EXISTS GeneralSubjectDescription")
                cur.execute("DROP TABLE IF EXISTS SpecificSubjectIdentification") 
                conn.commit()

        # Recreate all tables
        self.initialize_tables()

        # Populate the tables
        self.populate_subject_matter_table(self.paths["subjectmatter"])


    def reset(self, full_reset: bool = False):
        # Drop all tables
        with self._connect() as conn:
            with conn.cursor() as cur:
                # Structured subject matters:
                cur.execute("DROP TABLE IF EXISTS SubjectTerms_Flat")
                cur.execute("DROP TABLE IF EXISTS SubjectTerms_Tree")
                cur.execute("DROP TABLE IF EXISTS IconographicTerms_Flat")
                cur.execute("DROP TABLE IF EXISTS IconographicTerms_Tree")
                cur.execute("DROP TABLE IF EXISTS ConceptualTerms_Flat")
                cur.execute("DROP TABLE IF EXISTS ConceptualTerms_Tree")
                # Unstructured subject matters:
                cur.execute("DROP TABLE IF EXISTS IconographicInterpretation")
                cur.execute("DROP TABLE IF EXISTS GeneralSubjectDescription")
                cur.execute("DROP TABLE IF EXISTS SpecificSubjectIdentification")

                # Very time consuming to populate
                if full_reset:
                    cur.execute("DROP TABLE IF EXISTS Embedding") 
                    cur.execute("DROP TABLE IF EXISTS Metric")
                    cur.execute("DROP TABLE IF EXISTS Model")

                cur.execute("DROP TABLE IF EXISTS Artwork")
                cur.execute("DROP TABLE IF EXISTS Artist")
                conn.commit()
        # Recreate all tables
        self.initialize_tables()

    def enable_pgvector(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                conn.commit()
                register_vector(conn)

    def _create_unstructured_subject_matter_tables(self, table_name):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(f"CREATE TABLE IF NOT EXISTS {table_name} (id SERIAL PRIMARY KEY, recordID INTEGER REFERENCES Artwork(recordID), value TEXT)")
                conn.commit()
    
    def _create_structured_subject_matter_tables(self, table_name):
        # Create a flat table
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(f"CREATE TABLE IF NOT EXISTS {table_name}_Flat (id SERIAL PRIMARY KEY, recordID INTEGER REFERENCES Artwork(recordID), values TEXT[])")
                conn.commit()
        # Create a tree table
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(f"CREATE TABLE IF NOT EXISTS {table_name}_Tree (id SERIAL PRIMARY KEY, recordID INTEGER REFERENCES Artwork(recordID), tree JSONB)")
                conn.commit()

    def _create_artist_table(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS Artist (
                        creatorID TEXT PRIMARY KEY,
                        creatorFirstName TEXT,
                        creatorLastName TEXT,
                        creatorBirthAndDeathDescription TEXT,
                        creatorNationality TEXT,
                        creatorDeathDate INTEGER,
                        creatorBirthDate INTEGER
                    )
                """)
                conn.commit()

    def _create_artwork_table(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS Artwork (
                        recordID INTEGER PRIMARY KEY,
                        creatorID TEXT REFERENCES Artist(creatorID),
                        workID TEXT,
                        language TEXT,
                        title TEXT,
                        objectWorkType TEXT[],
                        termClassification TEXT,
                        materials TEXT[],
                        signatureFullDescription TEXT,
                        creationFullDescription TEXT,
                        creationEarliestDate INTEGER,
                        creationLatestDate INTEGER,
                        creatorFullDescription TEXT,
                        physicalAppearanceDescription TEXT,
                        imageType TEXT,
                        imageColor TEXT,
                        imageLowResFilename TEXT,
                        imageHighResFilename TEXT,
                        imageCopyright TEXT,
                        formalDescriptionTermStylesPeriods TEXT[],
                        height NUMERIC,
                        width NUMERIC,
                        ratio NUMERIC
                    )
                """)
                conn.commit()

    def _create_model_table(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS Model (
                        modelID SERIAL PRIMARY KEY,
                        model_name TEXT UNIQUE,
                        text_dim INTEGER,
                        img_dim INTEGER,
                        description TEXT,
                        base_name TEXT
                    )
                """)
                conn.commit()

    def _create_embedding_table(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS Embedding (
                        embeddingID SERIAL PRIMARY KEY,
                        recordID INTEGER REFERENCES Artwork(recordID),
                        modelID INTEGER REFERENCES Model(modelID),
                        embedding_vector VECTOR
                    )
                """)
                conn.commit()

    def _create_metric_table(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS Metric (
                        modelID INTEGER REFERENCES Model(modelID),
                        name TEXT,
                        value NUMERIC,
                        PRIMARY KEY (modelID, name)
                    )
                """)
                conn.commit()

    # Preload data (for small datasets)
    def preload_models(self):
        db_models = {}
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT model_name, modelID FROM Model")
                for model_name, model_id in cur.fetchall():
                    db_models[model_name] = model_id

        enabled_models_names = list(self.models.keys())
        db_models_names = list(db_models.keys())

        # Intersection of the two sets
        common_models = []
        for model_name in enabled_models_names:
            if model_name in db_models_names:
                common_models.append(model_name)
        
        preloaded_models = {}
        preloaded_models_formatted = []
        for model_name in common_models:
            model_id = db_models[model_name]
            preloaded_models[model_name] = model_id

            preloaded_models_formatted.append({
                "model_name": model_name,
                "model_id": model_id,
            })

        self.preloaded_models = preloaded_models
        self.preloaded_models_formatted = preloaded_models_formatted

    def preload_keywords(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT DISTINCT keyword FROM Keywords WHERE type = 'keyword' AND lang = 'en'")
                keywords = [row[0] for row in cur.fetchall()]
        self.preloaded_keywords = keywords

    def preload_colors(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT DISTINCT keyword FROM Keywords WHERE type = 'color' AND lang = 'en'")
                colors = [row[0] for row in cur.fetchall()]
        self.preloaded_colors = colors

    def preload_luminosities(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT DISTINCT keyword FROM Keywords WHERE type = 'luminosity' AND lang = 'en'")
                luminosities = [row[0] for row in cur.fetchall()]
        self.preloaded_luminosities = luminosities

    # Methods to fetch
    def get_formatted_models(self):
        if self.preloaded_models is None:
            raise Exception("Models are not preloaded")
        return self.preloaded_models_formatted

    def get_models(self):
        if self.preloaded_models is None:
            raise Exception("Models are not preloaded")
        return self.preloaded_models

    def get_keywords(self):
        if self.preloaded_keywords is None:
            raise Exception("Keywords are not preloaded")
        return self.preloaded_keywords
    
    def get_colors(self):
        if self.preloaded_colors is None:
            raise Exception("Colors are not preloaded")
        return self.preloaded_colors
    
    def get_luminosities(self):
        if self.preloaded_luminosities is None:
            raise Exception("Luminosities are not preloaded")
        return self.preloaded_luminosities

    def get_tables(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
                return [row[0] for row in cur.fetchall()]

    def get_artworks_using_query_embedding(
        self,
        query_embedding: np.ndarray,
        page: int = 1,
        page_size: int = 10
    ):
        offset = (page - 1) * page_size
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        Artwork.recordID,
                        Artwork.workID,
                        Artwork.language,
                        Artwork.title,
                        Artwork.objectWorkType,
                        Artwork.termClassification,
                        Artwork.materials,
                        Artwork.signatureFullDescription,
                        Artwork.creationFullDescription,
                        Artwork.creationEarliestDate,
                        Artwork.creationLatestDate,
                        Artwork.creatorFullDescription,
                        Artwork.physicalAppearanceDescription,
                        Artwork.imageType,
                        Artwork.imageColor,
                        Artwork.imageLowResFilename,
                        Artwork.imageHighResFilename,
                        Artwork.imageCopyright,
                        Artwork.formalDescriptionTermStylesPeriods,
                        Artwork.height,
                        Artwork.width,
                        Artwork.ratio,
                        Artist.creatorFirstName,
                        Artist.creatorLastName,
                        Artist.creatorBirthAndDeathDescription,
                        Artist.creatorNationality,
                        Artist.creatorDeathDate,
                        Artist.creatorBirthDate,
                        Artist.creatorID,
                        CFT.values as CFT_values,
                        IFT.values as IFT_values,
                        STF.values as STF_values,
                        IFTT.tree as IFTT_tree,
                        CFTT.tree as CFTT_tree,
                        STT.tree as STT_tree,
                        II.value as II_value,
                        GSD.value as GSD_value,
                        SSI.value as SSI_value
                    FROM Artwork
                    JOIN Embedding ON Artwork.recordID = Embedding.recordID
                    JOIN Artist ON Artwork.creatorID = Artist.creatorID

                    JOIN ConceptualTerms_Flat CFT ON Artwork.recordID = CFT.recordID
                    JOIN IconographicTerms_Flat IFT ON Artwork.recordID = IFT.recordID
                    JOIN SubjectTerms_Flat STF ON Artwork.recordID = STF.recordID

                    JOIN IconographicTerms_Tree IFTT ON Artwork.recordID = IFTT.recordID
                    JOIN ConceptualTerms_Tree CFTT ON Artwork.recordID = CFTT.recordID
                    JOIN SubjectTerms_Tree STT ON Artwork.recordID = STT.recordID

                    JOIN IconographicInterpretation II ON Artwork.recordID = II.recordID
                    JOIN GeneralSubjectDescription GSD ON Artwork.recordID = GSD.recordID
                    JOIN SpecificSubjectIdentification SSI ON Artwork.recordID = SSI.recordID

                    ORDER BY Embedding.embedding_vector <=> %s
                    LIMIT %s OFFSET %s;
                    """,
                    (query_embedding.tobytes(), page_size, offset)
                )
                results = cur.fetchall()
                columns = [desc[0] for desc in cur.description]
                artworks = [dict(zip(columns, row)) for row in results]
                return artworks

    def get_artwork_by_recordID(self, recordID: int):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        Artwork.recordID,
                        Artwork.workID,
                        Artwork.language,
                        Artwork.title,
                        Artwork.objectWorkType,
                        Artwork.termClassification,
                        Artwork.materials,
                        Artwork.signatureFullDescription,
                        Artwork.creationFullDescription,
                        Artwork.creationEarliestDate,
                        Artwork.creationLatestDate,
                        Artwork.creatorFullDescription,
                        Artwork.physicalAppearanceDescription,
                        Artwork.imageType,
                        Artwork.imageColor,
                        Artwork.imageCopyright,
                        Artwork.formalDescriptionTermStylesPeriods,
                        Artwork.height,
                        Artwork.width,
                        Artwork.ratio,
                        Artist.creatorFirstName,
                        Artist.creatorLastName,
                        Artist.creatorBirthAndDeathDescription,
                        Artist.creatorNationality,
                        Artist.creatorDeathDate,
                        Artist.creatorBirthDate,
                        Artist.creatorID,
                        CFT.values as CFT_values,
                        IFT.values as IFT_values,
                        STF.values as STF_values,
                        IFTT.tree as IFTT_tree,
                        CFTT.tree as CFTT_tree,
                        STT.tree as STT_tree,
                        II.value as II_value,
                        GSD.value as GSD_value,
                        SSI.value as SSI_value
                    FROM Artwork
                    JOIN Artist ON Artwork.creatorID = Artist.creatorID

                    LEFT JOIN ConceptualTerms_Flat CFT ON Artwork.recordID = CFT.recordID
                    LEFT JOIN IconographicTerms_Flat IFT ON Artwork.recordID = IFT.recordID
                    LEFT JOIN SubjectTerms_Flat STF ON Artwork.recordID = STF.recordID

                    LEFT JOIN IconographicTerms_Tree IFTT ON Artwork.recordID = IFTT.recordID
                    LEFT JOIN ConceptualTerms_Tree CFTT ON Artwork.recordID = CFTT.recordID
                    LEFT JOIN SubjectTerms_Tree STT ON Artwork.recordID = STT.recordID
                    
                    LEFT JOIN IconographicInterpretation II ON Artwork.recordID = II.recordID
                    LEFT JOIN GeneralSubjectDescription GSD ON Artwork.recordID = GSD.recordID
                    LEFT JOIN SpecificSubjectIdentification SSI ON Artwork.recordID = SSI.recordID

                    WHERE Artwork.recordID = %s
                    """,
                    (recordID,)
                )
                result = cur.fetchone()
                if result:
                    columns = [desc[0] for desc in cur.description]
                    results = dict(zip(columns, result))
                    results["image_url"] = f"http://127.0.0.1:5000/api/artwork/{recordID}/image"
                    return results
                return None

    def get_image_path_by_recordID(self, recordID: int):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT imageLowResFilename FROM Artwork WHERE recordID = %s", (recordID,))
                result = cur.fetchone()
                return result[0] if result else None

    def get_artist_by_creatorID(self, creatorID: int):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        ar.creatorID,
                        ar.creatorFirstName,
                        ar.creatorLastName,
                        ar.creatorBirthAndDeathDescription,
                        ar.creatorNationality,
                        ar.creatorDeathDate,
                        ar.creatorBirthDate,
                        ARRAY_AGG(a.recordID) AS artworkrecordids
                        FROM Artist ar
                    LEFT JOIN Artwork a ON ar.creatorID = a.creatorID
                    WHERE ar.creatorID = %s
                    GROUP BY ar.creatorID;
                    """,
                    (creatorID,)
                )
                result = cur.fetchone()
                if result:
                    columns = [desc[0] for desc in cur.description]
                    return dict(zip(columns, result))
                return None
            
    def get_model_id_from_model_name(self, model_name: str):
        try:
            return self.preloaded_models[model_name]
        except KeyError:
            raise Exception(f"Model {model_name} not found in the database")

    def get_nearest_artworks_to_recordID(
        self,
        recordID: int,
        page: int = 1,
        page_size: int = 10,
        keep_original_record: bool = False,
        model_name: str = None
    ):
        model_id = self.get_model_id_from_model_name(model_name)
        
        # First get the embedding of the artwork with the given recordID
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT embedding_vector FROM Embedding WHERE recordID = %s AND modelid = %s;
                    """,
                    (recordID, model_id,)
                )
                embedding = cur.fetchone()
                if embedding:
                    embedding = embedding[0]
                else:
                    return None
                # Get the page_size nearest artworks to the embedding with the offset 
                offset = (page - 1) * page_size
                if keep_original_record:
                    cur.execute(
                        """
                        SELECT recordID, embedding_vector <#> %s as distance 
                        FROM Embedding 
                        WHERE modelid = %s
                        ORDER BY distance
                        LIMIT %s OFFSET %s;
                        """,
                        (embedding, model_id, page_size, offset)
                    )
                else:   
                    cur.execute(
                        """
                        SELECT recordID, embedding_vector <#> %s as distance 
                        FROM Embedding 
                        WHERE modelid = %s
                        AND recordID != %s
                        ORDER BY distance
                        LIMIT %s OFFSET %s;
                        """,
                        (embedding, model_id, recordID, page_size, offset)
                    )
                results = cur.fetchall()
                return [{"recordID": row[0], "distance": float(row[1])} for row in results]

    def get_hard_query(self, constraints):
        base_query = """
            SELECT
            *
            FROM Artwork a
            JOIN Artist ar ON a.creatorID = ar.creatorID
            LEFT JOIN ConceptualTerms_Flat CFT ON a.recordID = CFT.recordID
            LEFT JOIN IconographicTerms_Flat IFT ON a.recordID = IFT.recordID
            LEFT JOIN SubjectTerms_Flat STF ON a.recordID = STF.recordID
            LEFT JOIN IconographicTerms_Tree IFTT ON a.recordID = IFTT.recordID
            LEFT JOIN ConceptualTerms_Tree CFTT ON a.recordID = CFTT.recordID
            LEFT JOIN SubjectTerms_Tree STT ON a.recordID = STT.recordID
            LEFT JOIN IconographicInterpretation II ON a.recordID = II.recordID
            LEFT JOIN GeneralSubjectDescription GSD ON a.recordID = GSD.recordID
            LEFT JOIN SpecificSubjectIdentification SSI ON a.recordID = SSI.recordID
            JOIN Embedding e ON (a.recordID = e.recordID AND e.modelid = %s)
            WHERE 1=1
        """

        if not constraints:
            return base_query, []

        def parse_constraint(constraint):
            constraint_type = constraint["type"]

            selected_column = constraint.get("selectedColumn", {})
            key = selected_column.get("key", None)

            is_not = constraint.get("isNot", False)
            exact_match = constraint.get("exactMatch", False)
            case_sensitive = constraint.get("caseSensitive", False)
            keep_null = constraint.get("keepNull", False)

            column = ""
            isColumnAList = False
            columnType = None

            if constraint_type not in ["AND", "OR", "GROUP"]:
                if key not in column_mapping:
                    return "", []
                column = column_mapping[key]
                isColumnAList = column_is_list.get(key, False)
                columnType = column_types.get(key, None)

            # If the columnType is either INTEGER or NUMERIC, we will override the case_sensitive to True to avoid LOWER()
            if columnType in ["INTEGER", "NUMERIC"]:
                case_sensitive = True

            if is_not:
                not_prefix = "NOT "
            else:
                not_prefix = " "
                
            if keep_null:
                suffix = f" OR {column} IS NULL "
            else:
                suffix = " "

            if constraint_type == "AND":
                return "AND" + suffix, []
            elif constraint_type == "OR":
                return "OR" + suffix, []
            elif constraint_type == "GROUP":
                subquery = ""
                subparams = []

                for child in constraint["children"]:
                    subquery_temp, subparams_temp = parse_constraint(child)
                    subquery += subquery_temp
                    subparams.extend(subparams_temp)

                return not_prefix + "(" + subquery + ")" + suffix, subparams
            elif constraint_type == "EQUAL":
                """
                ==> "column = %s", [value] if exact_match and case_sensitive
                ==> "LOWER(column) = LOWER(%s)", [value] if exact_match and not case_sensitive
                ==> "LIKE", ["%value%"] if not exact_match and case_sensitive
                ==> "LOWER(column) LIKE LOWER(%s)", ["%value%"] if not exact_match and not case_sensitive
                """
                inp_equalTo = constraint.get("equalTo", None)
                if inp_equalTo is None:
                    return "", []
                if exact_match:
                    if case_sensitive:
                        if isColumnAList:
                            return not_prefix + f"{column} @> ARRAY[%s]" + suffix, [inp_equalTo]
                        else:
                            return not_prefix + f"{column} = %s" + suffix, [inp_equalTo]
                    else:
                        if isColumnAList:
                            return not_prefix + f"LOWER({column}) @> ARRAY[LOWER(%s)]" + suffix, [inp_equalTo]
                        else:
                            return not_prefix + f"LOWER({column}) = LOWER(%s)" + suffix, [inp_equalTo]
                else:
                    if case_sensitive:
                        if isColumnAList:
                            # At least one term from the TEXT[] column must be LIKE the input
                            return not_prefix + f"""
                                EXISTS (
                                    SELECT 1
                                    FROM unnest({column}) AS term
                                    WHERE term LIKE %s
                                )
                            """ + suffix, [f"%{inp_equalTo}%"]
                        else:
                            return not_prefix + f"{column} LIKE %s" + suffix, [f"%{inp_equalTo}%"]
                    else:
                        if isColumnAList:
                            # At least one lowered term from the TEXT[] column must be LIKE the lowered input
                            return not_prefix + f"""
                                EXISTS (
                                    SELECT 1
                                    FROM unnest({column}) AS term
                                    WHERE LOWER(term) LIKE LOWER(%s)
                                ) 
                            """ + suffix, [f"%{inp_equalTo}%"]
                        else:
                            return not_prefix + f"LOWER({column}) LIKE LOWER(%s)" + suffix, [f"%{inp_equalTo}%"]
            elif constraint_type == "BETWEEN":
                """
                ==> "column BETWEEN %s AND %s", [value1, value2] if case_sensitive
                ==> "LOWER(column) BETWEEN LOWER(%s) AND LOWER(%s)", [value1, value2] if not case_sensitive (and column is text)
                """
                inp_from = constraint.get("from", None)
                inp_to = constraint.get("to", None)
                if inp_from is None or inp_to is None:
                    return "", []
                if isColumnAList:
                    return suffix
                else:
                    if case_sensitive:
                        q, params = f"{column} BETWEEN %s AND %s", [inp_from, inp_to]
                    else:
                        q, params = f"LOWER({column}) BETWEEN LOWER(%s) AND LOWER(%s)", [inp_from, inp_to]
                    if is_not:
                        q = f"NOT ({q}) "
                    return q + suffix, params
            elif constraint_type == "INCLUDES":
                """
                Includes uses the exact_match differently, if exact match is set to true, it means that every query term
                must be present in the selected column.
                If exact match is set to false, it means that at least one query term must be present in the selected column.

                If the selected column is a list, we want && operator (at least one term must be present) and the "@>" (all terms must be present) operator:
                    ==> "column @> ARRAY[%s]" AND "column @> ARRAY[%s]", ["value1", "value2", ...] if exact_match 
                    ==> "column && ARRAY[%s]" OR "column && ARRAY[%s]", ["value1", "value2", ...] if not exact_match
                    # TODO: Add case sensitive and not case sensitive versions (maybe one table for lower and one for upper ? Faster queries ?)
                If the selected column is not a list:
                    ==> "column LIKE %s" AND "column LIKE %s", ["%value1%", "%value2%"], ... if exact_match and case_sensitive
                    ==> "LOWER(column) LIKE LOWER(%s)" AND "LOWER(column) LIKE LOWER(%s)", ["%value1%", "%value2%"], ... if exact_match and not case_sensitive
                    ==> "column LIKE %s" OR "column LIKE %s", ["%value1%", "%value2%"], ... if not exact_match and case_sensitive
                    ==> "LOWER(column) LIKE LOWER(%s)" OR "LOWER(column) LIKE LOWER(%s)", ["%value1%", "%value2%"], ... if not exact_match and not case_sensitive
                """
                inp_values = constraint.get("values", None)
                if inp_values is None:
                    return "", []
                if isColumnAList:
                    if exact_match:
                        return not_prefix + f"{column} @> %s" + suffix, [inp_values]
                    else:
                        return not_prefix + f"{column} && %s" + suffix, [inp_values]
                else:
                    per_term_queries = []
                    for value in inp_values:
                        if case_sensitive:
                            per_term_queries.append(not_prefix + f"{column} LIKE %s")
                        else:
                            per_term_queries.append(not_prefix + f"LOWER({column}) LIKE LOWER(%s)")
                    return not_prefix + " AND ".join(per_term_queries) + suffix, [f"%{value}%" for value in inp_values]
                
            # If the constraint is not supported, return an empty string and an empty list
            # We should maybe raise an error instead and log it #TODO
            return "", []

        conditions = ""
        params = []
        for constraint in constraints:
            new_condition, new_params = parse_constraint(constraint)
            conditions += new_condition
            params.extend(new_params)
        
        if len(conditions) > 0:
            return base_query + " AND " + conditions, params
        else:
            return base_query, []

    def get_embedding_from_recordID(self, recordID: int, model_name: str):
        model_id = self.get_model_id_from_model_name(model_name)
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT embedding_vector
                    FROM Embedding e
                    WHERE e.recordID = %s AND e.modelid = %s
                    """,
                    (recordID, model_id))
                result = cur.fetchone()
                if result:
                    return convert_embedding_to_numpy(result[0])
                return None

    def get_nearest_artworks_to_embedding_from_subset(
        self,
        base_query,
        params,
        model_name,
        query_embedding,
        page,
        page_size,
    ):
        model_id = self.get_model_id_from_model_name(model_name)
        offset = (page - 1) * page_size
        with self._connect() as conn:
            with conn.cursor() as cur:

                if query_embedding is None:
                    # Not soft constraints, we just get the artworks with the hard constraints
                    params_full = []
                    params_full.append(model_id)
                    params_full.extend(params)
                    params_full.append(page_size)
                    params_full.append(offset)
                    cur.execute(
                        base_query + """
                        LIMIT %s OFFSET %s;
                        """,
                        tuple(params_full)
                    )
                    results = cur.fetchall()
                    recordIDs = [row[0] for row in results]
                    return recordIDs
                else:
                    # Soft constraints, we get the artworks ordered by the query embedding
                    params_full = []
                    params_full.append(model_id)
                    params_full.extend(params)
                    params_full.append(query_embedding)
                    params_full.append(page_size)
                    params_full.append(offset)
                    cur.execute(
                        base_query + """
                        ORDER BY e.embedding_vector <#> %s
                        LIMIT %s OFFSET %s;
                        """,
                        tuple(params_full)
                    )
                    results = cur.fetchall()
                    recordIDs = [row[0] for row in results]
                    return recordIDs

    def query(
        self,
        hard_constraints,
        soft_constraints,
        page: int,
        page_size: int,
        model_name: str,
        version: str,
        rocchio_k: int,
        rocchio_scale: float,
    ):
        # Get the base query and the params
        base_query, params = self.get_hard_query(hard_constraints)

        # Soft constraints are a list of text, colors, keywords, ... and recordIDs
        # that will form a query embedding using the model.
        query_embedding = self.get_query_embedding(soft_constraints, model_name, version, rocchio_k, rocchio_scale)
        
        # Get the page_size nearest artworks to the query embedding with the offset page
        nearest_artworks = self.get_nearest_artworks_to_embedding_from_subset(
            base_query,
            params,
            model_name,
            query_embedding,
            page,
            page_size,
        )

        # Return the artworks
        artworks = [self.get_artwork_by_recordID(recordID) for recordID in nearest_artworks]
        return artworks

    def get_keyword_embedding(self, keyword: str, model_name: str):
        model_id = self.get_model_id_from_model_name(model_name)
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT embedding
                    FROM Keywords k
                    WHERE LOWER(k.keyword) = LOWER(%s) AND k.modelid = %s
                    """,
                    (keyword, model_id)
                )
                result = cur.fetchone()
                if result:
                    return convert_embedding_to_numpy(result[0])
                return None

    def get_query_embedding(
        self, 
        soft_constraints, 
        model_name: str,
        version: str = "rocchio",
        rocchio_k: int = 5,
        rocchio_scale: float = 1.0
    ):
        if model_name not in self.models:
            raise Exception(f"Model {model_name} not found")
        
        model = self.models[model_name]
        
        embeddings = []
        weights = []
        for constraint in soft_constraints:
            weight = constraint.get("weight", 0)

            if constraint['type'] == 'TERM':
                # A term can be anything that the user inputs
                text = constraint.get("term", "")
                if len(text) > 0 and weight != 0:
                    text_embedding = model.encode_text(text)
                    embeddings.append(text_embedding)
                    weights.append(weight)

            elif constraint['type'] == 'KEYWORD':
                # A keyword is a precomputed embedding that we should be able to retrieve from the database
                keyword = constraint.get("keyword", "")
                if len(keyword) > 0 and weight != 0:
                    keyword_embedding = self.get_keyword_embedding(keyword, model_name)
                    if keyword_embedding is not None:
                        embeddings.append(keyword_embedding)
                        weights.append(weight)

            elif constraint['type'] == 'COLOR':
                # A color is a precomputed embedding that we should be able to retrieve from the database
                color = constraint.get("color", "")
                if len(color) > 0 and weight != 0:
                    keyword_embedding = self.get_keyword_embedding(color, model_name)
                    if keyword_embedding is not None:
                        embeddings.append(keyword_embedding)
                        weights.append(weight)

            elif constraint['type'] == 'LUMINOSITY':
                # A color is a precomputed embedding that we should be able to retrieve from the database
                luminosity = constraint.get("luminosity", "")
                if len(luminosity) > 0 and weight != 0:
                    keyword_embedding = self.get_keyword_embedding(luminosity, model_name)
                    if keyword_embedding is not None:
                        embeddings.append(keyword_embedding)
                        weights.append(weight)

            elif constraint['type'] == 'PRECOMPUTED':
                # A precomputed is a recordID of an artwork that we should be able to retrieve from the database
                # We should use the embedding of the artwork to form the query embedding
                recordID = constraint.get("recordID", None)
                if recordID is not None and weight != 0:
                    artwork_embedding = self.get_embedding_from_recordID(recordID, model_name)
                    if artwork_embedding is not None:
                        
                        # We add the artwork embedding to the embeddings list
                        embeddings.append(artwork_embedding)
                        weights.append(weight)

                        if version == "rocchio":
                            # Get k nearest artworks to the artwork embedding
                            nearest_artworks = self.get_nearest_artworks_to_recordID(
                                recordID,
                                page=1,
                                page_size=rocchio_k,
                                keep_original_record=False,
                                model_name=model_name
                            )

                            # We add the nearest artworks to the embeddings list
                            for nearest_artwork in nearest_artworks:
                                recordID = nearest_artwork["recordID"]
                                distance = -nearest_artwork["distance"] # The closest distance possible is -1 (pgvector quirk ?)
                                nearest_artwork_embedding = self.get_embedding_from_recordID(recordID, model_name)
                                if nearest_artwork_embedding is not None:
                                    embeddings.append(nearest_artwork_embedding)
                                    distance = max(distance, 0)
                                    weights.append(rocchio_scale * weight * np.power(distance, 2))

        if len(embeddings) == 0:
            return None

        embeddings = np.array(embeddings)   # Convert to numpy array
        weights = np.array(weights)         # Convert to numpy array

        if version == "classic" or version == "rocchio":
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

    def get_all_recordIDs(self):
        if self.preloaded_recordIDs is None:
            raise Exception("RecordIDs not preloaded")
        return self.preloaded_recordIDs

    def get_closest_recordID_to_embedding(
        self,
        embedding,
        recordIDs,
        model_name,
    ):
        model_id = self.get_model_id_from_model_name(model_name)
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT recordID
                    FROM Embedding e
                    WHERE e.recordID = ANY(%s) AND e.modelid = %s
                    ORDER BY e.embedding_vector <#> %s  
                    LIMIT 1;
                    """,
                    (recordIDs, model_id, embedding)
                )
                results = cur.fetchone()
                if results:
                    return results[0]
                return None


    def convex_fill(self, model_name, record_ids, parameters):
        """
            The goal is to find k images that are similar to the recordIDs and that are not in recordIDs.
            The naive approach would be to find the k closest images to the centroid of the recordIDs,
            but in my opinion this would not be very interesting since the centroid would be a mix of all the images.

            The approach I chose is to select two recordIDs at random (they can be equal !), then get the closest image to the intersection of the two images.
            I repeat this process k times to get k images. 
        """
        if len(record_ids) == 0:
            raise Exception("ConvexFill: No recordIDs provided")

        number_of_images = parameters["numberOfImages"]
        similarity_threshold = parameters["similarityThreshold"]
        decay_rate = parameters["decayRate"]
        patience = parameters["patience"]
        if None in [number_of_images, similarity_threshold, decay_rate, patience]:
            raise Exception(f"ConvexFill: Missing parameters")

        embeddings = {
            recordID: self.get_embedding_from_recordID(recordID, model_name)
            for recordID in record_ids
        }
        if any(embedding is None for embedding in embeddings.values()):
            raise Exception(f"ConvexFill: Missing embeddings")

        other_recordIDs = set(self.get_all_recordIDs())
        recordIDs = set(record_ids)
        other_recordIDs = other_recordIDs - recordIDs

        # To keep the order
        recordIDs = list(recordIDs) 
        other_recordIDs = list(other_recordIDs)

        augmented_collection = []

        i = 0
        patience_counter = 0
        min_cosine_similarity = similarity_threshold

        while i < number_of_images:
            if len(other_recordIDs) == 0:
                return augmented_collection

            recordID1 = random.choice(recordIDs)
            recordID2 = random.choice(recordIDs)
            
            vector1 = embeddings[recordID1]
            vector2 = embeddings[recordID2]

            # Get the cosine similarity between the two vectors
            similarity = cosine_similarity([vector1], [vector2])[0][0]
            if similarity < min_cosine_similarity:
                # The two images are too different for the intersection to be interesting
                patience += 1
                min_cosine_similarity *= decay_rate
                
                if patience_counter < patience:
                    continue
                else:
                    # We continue anyways because we reached the max_patience
                    pass

            # We reset the patience and min_cosine_similarity because we found a good intersection (or we reached the max_patience)
            patience = 0
            min_cosine_similarity = similarity_threshold

            centroid = (vector1 + vector2) / 2
            closestRecordID = self.get_closest_recordID_to_embedding(centroid, other_recordIDs, model_name)
            if closestRecordID is None:
                raise Exception("ConvexFill: No closest recordID found")
            
            # We remove the recordID from the available_recordIDs
            other_recordIDs.remove(closestRecordID)
            augmented_collection.append(closestRecordID)

            i += 1

        return augmented_collection

    def find_shortest_path(self, recordIDs, embeddings_as_list):
        """
            We find the shortest path between all the recordIDs
        """
        # Initialize the distance matrix
        cosine_similarity_matrix = cosine_similarity(embeddings_as_list)
        # Since two vectors are more similar the closest to 1 their cosine similarity, we transform the matrix
        cosine_similarity_matrix = 2 - cosine_similarity_matrix

        # Set the diagonal to 0
        for i in range(len(cosine_similarity_matrix)):
            cosine_similarity_matrix[i, i] = 0

        # Get the shortest path between the two points
        G = nx.from_numpy_array(cosine_similarity_matrix)
        shortest_path = nx.approximation.traveling_salesman_problem(G, cycle=False)

        # Transform from indexes to recordIDs
        shortest_path = [recordIDs[i] for i in shortest_path]

        return shortest_path

    def path_from_two_terms(self, model_name, record_ids, term1, term2):
        """
            We encode the two terms.
            We compute two lists of distances.
            The first list contains the distances between the first term and the embeddings of the recordIDs.
            The second list contains the distances between the second term and the embeddings of the recordIDs.
            We sort the recordIDs by the closeness to the first term and then by the closeness to the second term.
            The first recordID of the sorted list is the recordID that is closest to the first term.
            The last recordID of the sorted list is the recordID that is closest to the second term.
            etc.
        """
        if model_name not in self.models:
            raise Exception(f"PathFromTwoTerms: Model {model_name} not found")
        
        model = self.models[model_name]
        
        embeddings = {
            recordID: self.get_embedding_from_recordID(recordID, model_name)
            for recordID in record_ids
        }
        if any(embedding is None for embedding in embeddings.values()):
            raise Exception("PathFromTwoTerms: Missing embeddings")
        
        embeddings_as_list = []
        for recordID in record_ids:
            embeddings_as_list.append(embeddings[recordID])
        
        
        term1_embedding = model.encode_text(term1)
        term2_embedding = model.encode_text(term2)

        if term1_embedding is None or term2_embedding is None:
            raise Exception("PathFromTwoTerms: Missing embeddings")

        # We want to project the recordIDs onto the line defined between the two terms
        v = term2_embedding - term1_embedding

        # We project the recordIDs onto the line
        projected_values = []
        for recordID in record_ids:
            e = embeddings[recordID]
            e_shifted = e - term1_embedding
            alpha = np.dot(e_shifted, v) / np.dot(v, v)
            projected_values.append((recordID, alpha))

        # We sort the recordIDs by the projection
        projected_values.sort(key=lambda x: x[1])

        # We return the sorted recordIDs
        sorted_recordIDs = [x[0] for x in projected_values]
        return sorted_recordIDs

    def sort_by_similarity(self, model_name, record_ids):
        """
            We sort the recordIDs by making the shortest path between all the recordIDs.
        """
        if len(record_ids) == 0:
            raise Exception("SortBySimilarity: No recordIDs provided")

        if len(record_ids) == 1:
            raise Exception("SortBySimilarity: Only one recordID provided")

        # Sort the recordIDs (deterministic)
        record_ids = sorted(record_ids)

        embeddings = {
            recordID: self.get_embedding_from_recordID(recordID, model_name)
            for recordID in record_ids
        }
        if any(embedding is None for embedding in embeddings.values()):
            raise Exception("SortBySimilarity: Missing embeddings")

        embeddings_as_list = []
        for recordID in record_ids:
            embeddings_as_list.append(embeddings[recordID])

        shortest_path = self.find_shortest_path(record_ids, embeddings_as_list)

        return shortest_path

    def shortest_path(self, model_name, record_ids, parameters):
        """
            The goal is to find the shortest path between the recordIDs.
            Then for each link between two recordIDs, we find the centroid of the two vectors and
            we add the closest recordID to the augmented collection.
        """
        embeddings = {
            recordID: self.get_embedding_from_recordID(recordID, model_name)
            for recordID in record_ids
        }
        if any(embedding is None for embedding in embeddings.values()):
            raise Exception("ShortestPath: Missing embeddings")

        other_recordIDs = set(self.get_all_recordIDs())
        recordIDs = set(record_ids)
        other_recordIDs = other_recordIDs - recordIDs
        other_recordIDs = list(other_recordIDs)

        sorted_recordIDs = self.sort_by_similarity(model_name, record_ids)

        augmented_collection = []
        for i in range(len(sorted_recordIDs) - 1):
            recordID1 = sorted_recordIDs[i]
            recordID2 = sorted_recordIDs[i + 1]
            centroid = (embeddings[recordID1] + embeddings[recordID2]) / 2
            closestRecordID = self.get_closest_recordID_to_embedding(centroid, other_recordIDs, model_name)
            augmented_collection.append(closestRecordID)

            # We remove the recordID from the available_recordIDs
            other_recordIDs.remove(closestRecordID)
        
        return augmented_collection

    def autocomplete(self, prefix, column, max_results):
        """
            We return the top max_results unique values that start with the prefix.
            The values are fetched from the materialized view for the given column.
        """
        # Check if the column is valid
        isAutocompleteAvailable = column in columnsWithAutocomplete
        if not isAutocompleteAvailable:
            return []

        view_name = f"mv_autocomplete_{column}"
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT value
                    FROM {view_name}
                    WHERE LOWER(value) LIKE LOWER(%s)
                    ORDER BY value
                    LIMIT %s;
                """, (f"{prefix}%", max_results))
                results = [row[0] for row in cur.fetchall()]
                return results

    def augment_collection(self, model_name, record_ids, method, parameters):
        if method == "convex_fill":
            return self.convex_fill(model_name, record_ids, parameters)
        elif method == "shortest_path":
            return self.shortest_path(model_name, record_ids, parameters)
        else:
            raise Exception("Unknown method")

    def get_columns(self):
        # Return the columns that the hard constraints can be applied to
        return columnsData

    # Populate the tables
    def populate(self, artists=True, artworks=True, embeddings=True, subjectmatter=True):
        if artists:
            print("Populating artist table")
            self.populate_artist_table(self.paths["artists"])
            print("Done populating artist table")
        if artworks:
            print("Populating artwork table")
            self.populate_artwork_table(self.paths["artpieces"])
            print("Done populating artwork table")
        if subjectmatter:
            print("Populating subject matter table")
            self.populate_subject_matter_table(self.paths["subjectmatter"])
            print("Done populating subject matter table")
        if embeddings:
            print("Populating embeddings table")
            self.populate_embeddings_table(self.paths["embeddings"])
            print("Done populating embeddings table")

    def populate_embeddings_table(self, embeddingsData):
        """
        "embeddings": [
            {
                "name": "model_1",
                "path_embeddings": "path/to/embeddings.npy",
                "path_index_to_recordID": "path/to/index_to_recordID.json",
                "keywords": {
                    "fr": {
                        "path": "path/to/embeddings.npy",
                        "term_data": "path/to/file.json"
                    },
                    "en": {
                        "path": "path/to/embeddings.npy",
                        "term_data": "path/to/file.json"
                    },
                    "nl": {
                        "path": "path/to/embeddings.npy",
                        "term_data": "path/to/file.json"
                    },
                },
                "text_dim": 300,
                "img_dim": 2048,
                "description": "This is a description of the model.",
                "metrics": [
                    {"name": "metric_1", "value": 0.1},
                    {"name": "metric_2", "value": 0.2},
                    {"name": "metric_3", "value": 0.3}
                ]
            }
        ]
        """
        for embedding in embeddingsData:
            modelID = self.populate_model_table(
                embedding["name"],
                embedding["text_dim"],
                embedding["img_dim"],
                embedding["description"],
                embedding["base_name"]
            )
            self.populate_embedding_vectors(
                modelID,
                embedding["path_embeddings"],
                embedding["path_index_to_recordID"]
            )
            self.populate_metrics(
                modelID,
                embedding["metrics"]
            )
            self.populate_keywords_table(
                modelID,
                embedding["keywords"],
            )

    def populate_keywords(self):
        for embedding in self.paths["embeddings"]:
            modelID = self.get_model_id_from_model_name(embedding["name"])
            keywords = embedding["keywords"]
            self.populate_keywords_table(modelID, keywords)

    def populate_keywords_table(
        self,
        modelID,
        keywords,
    ):
        for lang in keywords:
            path_keywords_path = keywords[lang]["path"]
            term_data_path = keywords[lang]["term_data"]

            keywords_embeddings = np.load(path_keywords_path)
            term_data = json.load(open(term_data_path, "r", encoding="utf-8"))
            
            # Insert the keywords into the database 
            with self._connect() as conn:
                with conn.cursor() as cur:
                    for index, keyword in enumerate(list(term_data.keys())):
                        type = term_data[keyword]["type"]
                        embedding = keywords_embeddings[index]
                        cur.execute("INSERT INTO Keywords (keyword, embedding, modelID, lang, type) VALUES (%s, %s, %s, %s, %s)", (keyword, embedding, modelID, lang, type))
                        conn.commit()

    def populate_metrics(self, modelID, metrics):
        with self._connect() as conn:
            with conn.cursor() as cur:
                for metric in metrics:
                    cur.execute(
                        """
                        INSERT INTO Metric (
                            modelID,
                            name,
                            value
                        )
                        VALUES (
                            %s,
                            %s,
                            %s
                        )
                        """,
                        (modelID, metric["name"], metric["value"])
                    )
                conn.commit()

    def populate_embedding_vectors(self, modelID, path_embeddings, path_index_to_recordID):
        # Load the embeddings
        embeddings = np.load(path_embeddings)
        # Load the recordID to index mapping
        with open(path_index_to_recordID, "r") as f:
            index_to_recordID = json.load(f)
        # Insert the embeddings into the database
        with self._connect() as conn:
            with conn.cursor() as cur:
                print(f"Inserting {len(index_to_recordID)} embeddings into the database")
                for index, recordID in index_to_recordID.items():
                    index = int(index)
                    recordID = int(recordID)
                    cur.execute(
                        """
                        INSERT INTO Embedding (
                            recordID,
                            modelID,
                            embedding_vector
                        )
                        VALUES (
                            %s,
                            %s,
                            %s
                        )
                        """,
                        (recordID, modelID, embeddings[index])
                    )
                    if index%100==0:
                        print(f"{index + 1} / {len(index_to_recordID)} embeddings inserted")
                conn.commit()

    def populate_model_table(
        self,
        model_name,
        text_dim,
        img_dim,
        description,
        base_name
    ):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO Model (
                        model_name,
                        text_dim,
                        img_dim,
                        description,
                        base_name
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    RETURNING modelID;
                    """,
                    (model_name, text_dim, img_dim, description, base_name)
                )
                modelID = cur.fetchone()[0]
                conn.commit()
                return modelID

    def populate_artwork_table(self, path):
        dataframe = pd.read_csv(path)
        # Create the rows in the Artist table
        with self._connect() as conn:
            with conn.cursor() as cur:
                for _, row in dataframe.iterrows():
                    cur.execute(
                        f"""
                        INSERT INTO Artwork (
                            recordID,
                            creatorID,
                            workID,
                            language,
                            title,
                            objectWorkType,
                            termClassification,
                            materials,
                            signatureFullDescription,
                            creationFullDescription,
                            creationEarliestDate,
                            creationLatestDate,
                            creatorFullDescription,
                            physicalAppearanceDescription,
                            imageType,
                            imageColor,
                            imageLowResFilename,
                            imageHighResFilename,
                            imageCopyright,
                            formalDescriptionTermStylesPeriods,
                            height,
                            width,
                            ratio
                        )
                        VALUES (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        ) 
                        """,
                        [ 
                            row['recordID'],
                            row['creatorID'],
                            row['workID'],
                            row['language'],
                            row['title'],
                            betterList(row['objectWorkType']),
                            row['termClassification'],
                            betterList(row['materials']),
                            row['signatureFullDescription'],
                            row['creationFullDescription'],
                            betterInt(row['creationEarliestDate']),
                            betterInt(row['creationLatestDate']),
                            row['creatorFullDescription'],
                            row['physicalAppearanceDescription'],
                            row['imageType'],
                            row['imageColor'],
                            row['imageLowResFilename'],
                            row['imageHighResFilename'],
                            row['imageCopyright'],
                            betterList(row['formalDescriptionTermStylesPeriods']),
                            float(row['height']),
                            float(row['width']),
                            float(row['ratio']) 
                        ]
                    )
                conn.commit()


    def populate_artist_table(self, path):
        dataframe = pd.read_csv(path)
        # Create the rows in the Artist table
        with self._connect() as conn:
            with conn.cursor() as cur:
                for _, row in dataframe.iterrows():
                    cur.execute(
                        f"""
                        INSERT INTO Artist (
                            creatorID,
                            creatorFirstName,
                            creatorLastName,
                            creatorBirthAndDeathDescription,
                            creatorNationality,
                            creatorDeathDate,
                            creatorBirthDate
                        )
                        VALUES (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        ) 
                        """,
                        [
                            row['creatorID'],
                            row['creatorFirstName'],
                            row['creatorLastName'],
                            row['creatorBirthAndDeathDescription'],
                            row['creatorNationality'],
                            betterInt(row['creatorDeathDate']),
                            betterInt(row['creatorBirthDate'])
                        ]
                    )
                conn.commit()

    def populate_subject_matter_table(self, path):
        """
            path leads to a json file with a list of dictionnaries.
            Each dictionnary has this structure:
            {
                "recordID": "1234567890",
                "structured": {
                    "subjectMatterSubjectTerms": {
                        "tree": {...},
                        "flattened": [...]
                    },
                    "subjectMatterIconographicTerms": { 
                        "tree": {...},
                        "flattened": [...]
                    },
                    "subjectMatterConceptualTerms": {
                        "tree": {...},
                        "flattened": [...]
                    }
                },
                "unstructured": {
                    "subjectMatterIconographicInterpretation": "...",
                    "subjectMatterGeneralSubjectDescription": "...",
                    "subjectMatterSpecificSubjectIdentification": "..."
                }   
            }
        """
        parsed_data = json.load(open(path))
        number_of_entries = len(parsed_data)
        for entryIndex, entry in enumerate(parsed_data):
            recordID = entry["recordID"]
            structured = entry["structured"]
            unstructured = entry["unstructured"]

            # Insert the structured subject matter
            self.populate_structured_subject_matter_table(recordID, structured)
            # Insert the unstructured subject matter
            self.populate_unstructured_subject_matter_table(recordID, unstructured)

            if entryIndex%100==0:
                print(f"{entryIndex + 1} / {number_of_entries} entries populated (SubjectMatter)")

    def populate_structured_subject_matter_table(self, recordID, structured):
        for subject_matter in structured:
            tree = structured[subject_matter]["tree"]
            flattened = structured[subject_matter]["flattened"]

            # Insert the tree
            self.populate_tree(recordID, subject_matter, tree)
            # Insert the flattened
            self.populate_flattened(recordID, subject_matter, flattened)

    def populate_tree(self, recordID, subject_matter, tree):
        table_name = subject_matter_to_table_name[subject_matter]
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    INSERT INTO {table_name}_Tree (recordID, tree) VALUES (%s, %s)
                    """,
                    (recordID, json.dumps(tree))
                )
                conn.commit()

    def populate_flattened(self, recordID, subject_matter, flattened):
        table_name = subject_matter_to_table_name[subject_matter]
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    INSERT INTO {table_name}_Flat (recordID, values) VALUES (%s, %s)
                    """,
                    (recordID, flattened)
                )
                conn.commit()

    def populate_unstructured_subject_matter_table(self, recordID, unstructured):
        for subject_matter in unstructured:
            value = unstructured[subject_matter]
            self.populate_unstructured_subject_matter_value(recordID, subject_matter, value)

    def populate_unstructured_subject_matter_value(self, recordID, subject_matter, value):
        table_name = subject_matter_to_table_name[subject_matter]
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    INSERT INTO {table_name} (recordID, value) VALUES (%s, %s)
                    """,
                    (recordID, value)
                )
                conn.commit()

    def _create_autocomplete_materialized_views(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                # Colonnes de type TEXT
                text_columns = {}

                # Colonnes de type TEXT[]
                array_columns = {}

                for columnKey in columnsWithAutocomplete.keys():
                    columnInTable = column_mapping[columnKey]
                    tableName = columnsWithAutocomplete[columnKey]
                    isList = column_is_list.get(columnKey, False)
                    if isList:
                        array_columns[columnKey] = (tableName, columnInTable)
                    else:
                        text_columns[columnKey] = (tableName, columnInTable)

                # Création des vues matérialisées pour les colonnes TEXT
                for column, (tableName, columnInTable) in text_columns.items():
                    view_name = f"mv_autocomplete_{column}"
                    cur.execute(f"""
                        CREATE MATERIALIZED VIEW IF NOT EXISTS {view_name} AS
                        SELECT DISTINCT {columnInTable} as value
                        FROM {tableName}
                        WHERE {columnInTable} IS NOT NULL
                        AND {columnInTable} != '';
                    """)
                    # Index sur la colonne value
                    cur.execute(f"""
                        CREATE UNIQUE INDEX IF NOT EXISTS idx_{view_name}_value 
                        ON {view_name} (value);
                    """)

                # Création des vues matérialisées pour les colonnes TEXT[]
                for columnKey, (tableName, columnInTable) in array_columns.items():
                    view_name = f"mv_autocomplete_{columnKey}"
                    cur.execute(f"""
                        CREATE MATERIALIZED VIEW IF NOT EXISTS {view_name} AS
                        SELECT DISTINCT unnest({columnInTable}) as value
                        FROM {tableName}
                        WHERE {columnInTable} IS NOT NULL
                        AND array_length({columnInTable}, 1) > 0;
                    """)
                    # Index sur la colonne value
                    cur.execute(f"""
                        CREATE UNIQUE INDEX IF NOT EXISTS idx_{view_name}_value 
                        ON {view_name} (value);
                    """)

                conn.commit()

    def refresh_autocomplete_views(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                for column in columnsWithAutocomplete.keys():
                    view_name = f"mv_autocomplete_{column}"
                    cur.execute(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view_name};")
                conn.commit()