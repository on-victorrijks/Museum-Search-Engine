import psycopg2
import numpy as np
import pandas as pd
import json
from pgvector.psycopg2 import register_vector

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
    "objectWorkType": True,
    "materials": True,
    "formalDescriptionTermStylesPeriods": True,
    
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
        self.preloaded_keywords = None
        self.preload_keywords()
    
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

    def _create_keywords_table(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""CREATE TABLE IF NOT EXISTS Keywords (
                    id SERIAL PRIMARY KEY, 
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
    def preload_keywords(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT keyword FROM Keywords")
                self.preloaded_keywords = [row[0] for row in cur.fetchall()]

    # Methods to fetch
    def get_keywords(self):
        if self.preloaded_keywords is None:
            raise Exception("Keywords are not preloaded")
        return self.preloaded_keywords

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
            
    def get_nearest_artworks_to_recordID(
        self,
        recordID: int,
        page: int = 1,
        page_size: int = 10,
        keep_original_record: bool = False
    ):
        # First get the embedding of the artwork with the given recordID
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT embedding_vector FROM Embedding WHERE recordID = %s;
                    """,
                    (recordID,)
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
                        ORDER BY distance
                        LIMIT %s OFFSET %s;
                        """,
                        (embedding, page_size, offset)
                    )
                else:   
                    cur.execute(
                        """
                        SELECT recordID, embedding_vector <#> %s as distance 
                        FROM Embedding 
                        WHERE recordID != %s
                        ORDER BY distance
                        LIMIT %s OFFSET %s;
                        """,
                        (embedding, recordID, page_size, offset)
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
            JOIN Embedding e ON a.recordID = e.recordID
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

            if constraint_type not in ["AND", "OR", "GROUP"]:
                if key not in column_mapping:
                    return "", []
                column = column_mapping[key]
                isColumnAList = column_is_list.get(key, False)

            not_prefix = "NOT " if is_not else ""
            not_prefix = f" OR {column} IS NULL" if keep_null else ""
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
                        return not_prefix + f"{column} = %s" + suffix, [inp_equalTo]
                    else:
                        return not_prefix + f"LOWER({column}) = LOWER(%s)" + suffix, [inp_equalTo]
                else:
                    if case_sensitive:
                        return not_prefix + f"{column} LIKE %s" + suffix, [f"%{inp_equalTo}%"]
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
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT embedding_vector
                    FROM Embedding e
                    JOIN Model m ON e.modelID = m.modelID
                    WHERE e.recordID = %s AND m.model_name = %s
                    """,
                    (recordID, model_name))
                result = cur.fetchone()
                if result:
                    return convert_embedding_to_numpy(result[0])
                return None

    def get_nearest_artworks_to_embedding_from_subset(
        self,
        base_query,
        params,
        query_embedding,
        page,
        page_size,
    ):
        offset = (page - 1) * page_size
        with self._connect() as conn:
            with conn.cursor() as cur:

                if query_embedding is None:
                    # Not soft constraints, we just get the artworks with the hard constraints
                    params_full = []
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
    ):
        # Get the base query and the params
        base_query, params = self.get_hard_query(hard_constraints)

        # Soft constraints are a list of text, colors, keywords, ... and recordIDs
        # that will form a query embedding using the model.
        query_embedding = self.get_query_embedding(soft_constraints, model_name)
        
        # Get the page_size nearest artworks to the query embedding with the offset page
        nearest_artworks = self.get_nearest_artworks_to_embedding_from_subset(
            base_query,
            params,
            query_embedding,
            page,
            page_size,
        )

        # Return the artworks
        artworks = [self.get_artwork_by_recordID(recordID) for recordID in nearest_artworks]
        return artworks

    def get_keyword_embedding(self, keyword: str, model_name: str):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT embedding
                    FROM Keywords k
                    JOIN Model m ON k.modelID = m.modelID
                    WHERE LOWER(k.keyword) = LOWER(%s) AND m.model_name = %s
                    """,
                    (keyword, model_name)
                )
                result = cur.fetchone()
                if result:
                    return convert_embedding_to_numpy(result[0])
                return None

    def get_query_embedding(
        self, 
        soft_constraints, 
        model_name: str,
        version: str = "power"
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

            elif constraint['type'] == 'PRECOMPUTED':
                # A precomputed is a recordID of an artwork that we should be able to retrieve from the database
                # We should use the embedding of the artwork to form the query embedding
                recordID = constraint.get("recordID", None)
                if recordID is not None and weight != 0:
                    artwork_embedding = self.get_embedding_from_recordID(recordID, model_name)
                    if artwork_embedding is not None:
                        embeddings.append(artwork_embedding)
                        weights.append(weight)

        if len(embeddings) == 0:
            return None

        embeddings = np.array(embeddings)   # Convert to numpy array
        weights = np.array(weights)         # Convert to numpy array

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

    def get_models(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT model_name FROM Model")
                return [row[0] for row in cur.fetchall()]

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
                "path_keywords": "path/to/keywords.npy",
                "path_term_to_index": "path/to/term_to_index.json",
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
                embedding["description"]
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
                embedding["path_keywords"],
                embedding["path_term_to_index"]
            )

    def populate_keywords_table(
        self,
        modelID,
        path_keywords,
        path_term_to_index
    ):
        keywords_embeddings = np.load(path_keywords)
        term_to_index = json.load(open(path_term_to_index))

        # Insert the keywords into the database 
        with self._connect() as conn:
            with conn.cursor() as cur:
                for keyword, index in term_to_index.items():
                    embedding = keywords_embeddings[index]
                    cur.execute("INSERT INTO Keywords (keyword, modelID, embedding) VALUES (%s, %s, %s)", (keyword, modelID, embedding))
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
        description
    ):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO Model (
                        model_name,
                        text_dim,
                        img_dim,
                        description
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    RETURNING modelID;
                    """,
                    (model_name, text_dim, img_dim, description)
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