
import psycopg2
import numpy as np
import pandas as pd
import json

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
        self._create_subject_matter_value_table()
        self._create_artist_table()
        self._create_artwork_table()
        self._create_subject_matter_link_table()
        self._create_model_table()
        self._create_embedding_table()
        self._create_metric_table()

    def reset(self):
        # Drop all tables
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DROP TABLE IF EXISTS SubjectMatterLink")
                cur.execute("DROP TABLE IF EXISTS SubjectMatterValue")
                cur.execute("DROP TABLE IF EXISTS Embedding")
                cur.execute("DROP TABLE IF EXISTS Metric")
                cur.execute("DROP TABLE IF EXISTS Model")
                cur.execute("DROP TABLE IF EXISTS Artwork")
                cur.execute("DROP TABLE IF EXISTS Artist")
                conn.commit()
        # Recreate all tables
        self.initialize_tables()

    def _create_subject_matter_value_table(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS SubjectMatterValue (
                        SMVID SERIAL PRIMARY KEY,
                        type TEXT,
                        value TEXT
                    )
                """)
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

    def _create_subject_matter_link_table(self):
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS SubjectMatterLink (
                        recordID INTEGER REFERENCES Artwork(recordID),
                        SMVID INTEGER REFERENCES SubjectMatterValue(SMVID),
                        PRIMARY KEY (recordID, SMVID)
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
                        STRING_AGG(SMV.value, ' || ') AS subjectMatter
                    FROM Artwork
                    JOIN Embedding ON Artwork.recordID = Embedding.recordID
                    JOIN Artist ON Artwork.creatorID = Artist.creatorID
                    LEFT JOIN SubjectMatterLink SML ON Artwork.recordID = SML.recordID
                    LEFT JOIN SubjectMatterValue SMV ON SML.SMVID = SMV.SMVID
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
                        a.recordID,
                        a.workID,
                        a.language,
                        a.title,
                        a.objectWorkType,
                        a.termClassification,
                        a.materials,
                        a.signatureFullDescription,
                        a.creationFullDescription,
                        a.creationEarliestDate,
                        a.creationLatestDate,
                        a.creatorFullDescription,
                        a.physicalAppearanceDescription,
                        a.imageType,
                        a.imageColor,
                        a.imageLowResFilename,
                        a.imageHighResFilename,
                        a.imageCopyright,
                        a.formalDescriptionTermStylesPeriods,
                        a.height,
                        a.width,
                        a.ratio,
                        ar.creatorFirstName,
                        ar.creatorLastName,
                        STRING_AGG(smv.value, ' || ') AS subjectMatter
                    FROM Artwork a
                    JOIN Artist ar ON a.creatorID = ar.creatorID
                    LEFT JOIN SubjectMatterLink sml ON a.recordID = sml.recordID
                    LEFT JOIN SubjectMatterValue smv ON sml.SMVID = smv.SMVID
                    WHERE a.recordID = %s
                    GROUP BY a.recordID, ar.creatorID;
                    """,
                    (recordID,)
                )
                result = cur.fetchone()
                if result:
                    columns = [desc[0] for desc in cur.description]
                    return dict(zip(columns, result))
                return None

    def get_artist_by_artistID(self, artistID: int):
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
                    (artistID,)
                )
                result = cur.fetchone()
                if result:
                    columns = [desc[0] for desc in cur.description]
                    return dict(zip(columns, result))
                return None
            
    # Populate the tables
    def populate(self,):
        self.populate_artist_table(self.paths["artists"])
        self.populate_artwork_table(self.paths["artpieces"])
        self.populate_subject_matter_table(self.paths["subjectmatter"])
        self.populate_embeddings_table(self.paths["embeddings"])

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
        dataframe = pd.read_csv(path)
        # For now, we will not populate the SubjectMatter table