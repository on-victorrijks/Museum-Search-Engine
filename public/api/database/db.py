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

subject_matter_to_table_name = {
    "subjectMatterSubjectTerms": "SubjectTerms",
    "subjectMatterIconographicTerms": "IconographicTerms",
    "subjectMatterConceptualTerms": "ConceptualTerms",
    "subjectMatterIconographicInterpretation": "IconographicInterpretation",
    "subjectMatterGeneralSubjectDescription": "GeneralSubjectDescription",
    "subjectMatterSpecificSubjectIdentification": "SpecificSubjectIdentification"
}

class DatabaseManager:
    def __init__(
        self, 
        config,
        paths,
    ):
        self.db_host = config["host"]
        self.db_port = config["port"]
        self.db_name = config["name"]
        self.db_user = config["user"]
        self.db_password = config["password"]
        self.enable_pgvector()
        self.initialize_tables()
        self.paths = paths

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
                        creationEarliestDate TEXT,
                        creationLatestDate TEXT,
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
                        model_name TEXT,
                        text_dim INTEGER,
                        img_dim INTEGER,
                        description TEXT
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

    # Methods to fetch
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
                    return dict(zip(columns, result))
                return None

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
                        STRING_AGG(a.recordID::TEXT, ', ') AS artworkRecordIDs
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

    def apply_hard_constraints(self, constraints):
        if not constraints:
            with self._connect() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT recordID FROM Artwork")
                    return [row[0] for row in cur.fetchall()]

        base_query = """
            SELECT DISTINCT a.recordID
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
            WHERE 1=1
        """

        where_conditions = []
        params = []

        for constraint in constraints:
            constraint_type = constraint["type"]
            key = constraint["selectedColumn"]["key"]
            is_not = constraint.get("isNot", False)
            exact_match = constraint.get("exactMatch", False)
            case_sensitive = constraint.get("caseSensitive", False)
            keep_null = constraint.get("keepNull", False)

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

                # IconographicInterpretation
                "II_value": "II.value",

                # GeneralSubjectDescription
                "GSD_value": "GSD.value",

                # SpecificSubjectIdentification
                "SSI_value": "SSI.value",
            }

            if key not in column_mapping:
                continue

            column = column_mapping[key]

            if constraint_type == "BETWEEN":
                inp_from = constraint.get("from", -1)
                inp_to = constraint.get("to", -1)
                condition = f"{column} BETWEEN %s AND %s"
                params.extend([inp_from, inp_to])

            elif constraint_type == "EQUAL":
                inp_equal_to = constraint.get("equalTo", None)
                if inp_equal_to is None:
                    continue

                if exact_match:
                    if case_sensitive:
                        condition = f"{column} = %s"
                    else:
                        condition = f"LOWER({column}) = LOWER(%s)"
                    params.append(inp_equal_to)
                else:
                    if case_sensitive:
                        condition = f"{column} LIKE %s"
                    else:
                        condition = f"LOWER({column}) LIKE LOWER(%s)"
                    params.append(f"%{inp_equal_to}%")

            elif constraint_type == "INCLUDES":
                inp_values = constraint.get("values", [])
                if not inp_values:
                    continue

                if exact_match:
                    # Tous les termes doivent être présents
                    conditions = []
                    for value in inp_values:
                        if case_sensitive:
                            conditions.append(f"{column} = %s")
                        else:
                            conditions.append(f"LOWER({column}) = LOWER(%s)")
                        params.append(value)
                    condition = " AND ".join(conditions)
                else:
                    # Au moins un terme doit être présent
                    conditions = []
                    for value in inp_values:
                        if case_sensitive:
                            conditions.append(f"{column} = %s")
                        else:
                            conditions.append(f"LOWER({column}) = LOWER(%s)")
                        params.append(value)
                    condition = " OR ".join(conditions)

            else:
                continue

            if is_not:
                condition = f"NOT ({condition})"

            if keep_null:
                condition = f"({condition} OR {column} IS NULL)"

            where_conditions.append(condition)

        if where_conditions:
            base_query += " AND " + " AND ".join(where_conditions)

        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(base_query, params)
                recordIDs = [row[0] for row in cur.fetchall()]
                return recordIDs

    def get_embedding_from_recordID(self, recordID: int):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT embedding_vector FROM Embedding WHERE recordID = %s", (recordID,))
                result = cur.fetchone()
                if result:
                    return result[0]
                return None

    def get_nearest_artworks_to_embedding_from_subset(
        self,
        recordIDs,
        query_embedding,
        page,
        page_size,
    ):
        offset = (page - 1) * page_size
        with self._connect() as conn:
            with conn.cursor() as cur:
                # To allow for IN clause
                recordIDs_tuple = tuple(recordIDs)
                if len(recordIDs_tuple) == 1:
                    recordIDs_tuple = (recordIDs_tuple[0],)
                
                cur.execute(
                    """
                    SELECT recordID, embedding_vector <#> %s as distance 
                    FROM Embedding 
                    WHERE recordID IN %s
                    ORDER BY distance
                    LIMIT %s OFFSET %s;
                    """,
                    (query_embedding, recordIDs_tuple, page_size, offset)
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
    ):
        # Apply hard constraints
        recordIDs = self.apply_hard_constraints(hard_constraints)

        if len(recordIDs)==0:
            return []

        # Soft constraints are a list of text, colors, keywords, ... and recordIDs
        # that will form a query embedding using the model.
        # This will be implemented later.
        # For now just us the embedding of a select recordID
        recordID = 478
        query_embedding = self.get_embedding_from_recordID(recordID)
        if query_embedding==None:
            return []
        
        # Get the page_size nearest artworks to the query embedding with the offset page that are in recordIDs
        nearest_artworks = self.get_nearest_artworks_to_embedding_from_subset(
            recordIDs,
            query_embedding,
            page,
            page_size,
        )

        # Return the artworks
        artworks = [self.get_artwork_by_recordID(recordID) for recordID in nearest_artworks]
        return artworks

    # Populate the tables
    def populate(self,):
        print("Populating artist table")
        self.populate_artist_table(self.paths["artists"])
        print("Done populating artist table")
        print("Populating artwork table")
        self.populate_artwork_table(self.paths["artpieces"])
        print("Done populating artwork table")
        print("Populating subject matter table")
        self.populate_subject_matter_table(self.paths["subjectmatter"])
        print("Done populating subject matter table")
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