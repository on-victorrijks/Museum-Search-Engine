import numpy as np
from typing import List, Dict, Any, Tuple
from abc import ABC, abstractmethod
from sklearn.metrics.pairwise import cosine_similarity
import difflib

class AbstractDatabase(ABC):
    @abstractmethod
    def get_columns(self) -> List[str]:
        """Returns the names of the columns in the database."""
        pass

    @abstractmethod
    def get_size(self) -> int:
        """Returns the number of records in the database."""
        pass

    @abstractmethod
    def get_unique_for_column(self, column: str) -> List[Any]:
        """Returns the unique values for a column in the database."""
        pass

    @abstractmethod
    def insert_mock_data(
        self, 
        records: List[Dict[str, Any]], 
        embeddings: List[np.ndarray]
    ):
        """Inserts mock structured data and corresponding vector embeddings."""
        pass

    @abstractmethod
    def apply_hard_constraints(
        self, 
        filters: Dict[str, Tuple[Any, Any]]
    ) -> List[int]:
        """Filters data based on hard constraints and returns matching indices."""
        pass

    @abstractmethod
    def apply_soft_constraints(
        self, 
        queries: List[Dict[str, Any]],
        indices: List[int]
    ) -> List[Tuple[int, float]]:
        """Ranks valid indices based on vector similarity to the query embedding."""
        pass

    @abstractmethod
    def query(
        self, 
        filters: Dict[str, Tuple[Any, Any]], 
        queries: List[Dict[str, Any]],
        page: int, 
        page_size: int
    ) -> List[Dict[str, Any]]:
        """Returns paginated, ordered results based on constraints."""
        pass

# Casting func - START
def CAST__any__int(inp):
    try:
        return int(float(inp))
    except:
        raise Exception({
            "type": "CAST_ERROR",
            "message": f"{inp} n'est pas un entier."
        })

def CAST__any__fstring(inp):
    try:
        inp = str(inp).strip()

        while inp[0]=="'":
            inp = inp[1:]
        while inp[-1]=="'":
            inp = inp[:-1]
            
        return str(inp).strip()
    except:
        raise Exception({
            "type": "CAST_ERROR",
            "message": f"{inp} n'est pas une chaine de caractère."
        })

def CAST__list_any__list_fstring(inp):
    try:
        result = []
        for element in inp:
            element = CAST__any__fstring(element)
            if element:
                result.append(element)
        return result
    except:
        raise Exception({
            "type": "CAST_ERROR",
            "message": f"{inp} n'est pas une liste de chaines de caractères."
        })
    
def CAST__string_list_string__list_fstring(inp):
    # Ex: inp = "[toile, peinture à l'huile]"
    try:
        result = []
        inp = inp[1:-1]
        inp = inp.split(",")
        for element in inp:
            element = CAST__any__fstring(element)
            if element:
                result.append(element)
        return result
    except Exception as e:
        raise Exception({
            "type": "CAST_ERROR",
            "message": f"{inp} n'est pas une liste de chaines de caractères."
        })

def CAST__any__float(inp):
    try:
        return float(inp)
    except:
        raise Exception({
            "type": "CAST_ERROR",
            "message": f"{inp} n'est pas un nombre à virgule flottante."
        })
    
def CAST__list_any__list_float(inp):
    try:
        if inp[0]=="[":
            inp = inp[1:]
        if inp[-1]=="]":
            inp = inp[:-1]
        inp = inp.split(",")
        result = []
        for element in inp:
            element = CAST__any__float(element)
            if element:
                result.append(element)
        return result
    except:
        raise Exception({
            "type": "CAST_ERROR",
            "message": f"{inp} n'est pas une liste de nombres à virgule flottante."
        })

def CAST__list_any__float_0(inp):
    try:
        result = CAST__list_any__list_float(inp)
        return result[0]
    except:
        raise Exception({
            "type": "CAST_ERROR",
            "message": f"{inp} n'est pas une liste de nombres à virgule flottante à la position 0."
        })

def CAST__list_any__float_1(inp):
    try:
        result = CAST__list_any__list_float(inp)
        return result[1]
    except:
        raise Exception({
            "type": "CAST_ERROR",
            "message": f"{inp} n'est pas une liste de nombres à virgule flottante à la position 1."
        })
    
# Casting func - END
# Compare func - START
def COMPARE__int__int(a, b, caseSensitive=False, strict=False):
    return a==b

def COMPARE__fstring__fstring(a, b, caseSensitive=False, strict=False):
    if strict:
        # Strict comparison (==)
        if caseSensitive:
            return a==b
        return a.lower()==b.lower()
    else:
        # Non-strict comparison (in)
        if caseSensitive:
            return a in b
        return a.lower() in b.lower()

def COMPARE__float__float(a, b, caseSensitive=False, strict=False):
    return a==b
# Compare func - END

class MockDB(AbstractDatabase):
    def __init__(self):
        """
            The search engine allows the user to use HARD filters on columns.
            For that purpose, it is important to know which column is interesting and its type.
            For example, the column "objectWork.objectWorkType" is very interesting since it stores
            the type of the object ("tableau","dessin","aquarelle",...).
            But there are two issues !
                1) objectWork.objectWorkType is not very explanatory for the user
                2) objectWork.objectWorkType is not a string but a list of strings stored as a string

            Moreover, some columns are not interesting for the user since they are not very useful for filtering and
            some columns are not present in self.get_columns() but are present in the database (ex: iconography).

            self.smartColumns is a dictionary that contains all the information needed to use the search engine.
            It is a dictionary of dictionaries with the following structure:
                - key: string -> A key arbitrary chosen to identify the column
                    - isInRecord: bool -> True if the column is present in self.get_columns() else False
                    - columnName: str -> The name of the column in the database
                    - newColumnName: str -> The name of the column that will be used in data
                    - userFriendlyName: str -> The name of the column that will be displayed to the user
                    - castDB: func -> A function that cast the column to the correct type
                    - castUser: func -> A function that cast the user input to the correct type
                    - default: any -> The default value if the column is not present in the database
                    - isList: bool -> True if the column is a list else False
                    - comparator: func -> A function that compares two values
        """

        self.ENGINE = None

        self.data = []
        self.vectors = []
        self.iconographies = []
        self.unique_iconographies = []

        self.indexToRecordID = {}
        self.recordIDToIndex = {}

        self.smartColumns = {
            # Iconography
            "iconography": {
                "isInRecord": False,
                "columnName": "iconography",
                "newColumnName": None,
                "userFriendlyName": "Objects présents",
                "castDB": CAST__list_any__list_fstring,
                "castUser": CAST__any__fstring,
                "default": [],
                "isList": True,
                "comparator": COMPARE__fstring__fstring
            },

            # Identifiers
            "recordID": {
                "isInRecord": True,
                "columnName": "recordID",
                "newColumnName": "recordID",
                "userFriendlyName": "ID",
                "castDB": CAST__any__int,
                "castUser": CAST__any__int,
                "default": -1,
                "isList": False,
                "comparator": COMPARE__int__int
            },
            "workID": {
                "isInRecord": True,
                "columnName": "objectWork.workID",
                "newColumnName": "objectWork.workID",
                "userFriendlyName": "workID",
                "castDB": CAST__any__int,
                "castUser": CAST__any__int,
                "default": -1,
                "isList": False,
                "comparator": COMPARE__int__int
            },

            # Art piece informatons
            "title": {
                "isInRecord": True,
                "columnName": "objectWork.titleText",
                "newColumnName": "objectWork.titleText",
                "userFriendlyName": "Titre de l'oeuvre",
                "castDB": CAST__any__fstring,
                "castUser": CAST__any__fstring,
                "default": "",
                "isList": False,
                "comparator": COMPARE__fstring__fstring
            },
            "earliestDate": {
                "isInRecord": True,
                "columnName": "creation.earliestDate",
                "newColumnName": "creation.earliestDate",
                "userFriendlyName": "Date de création (est. basse)",
                "castDB": CAST__any__int,
                "castUser": CAST__any__int,
                "default": -1,
                "isList": False,
                "comparator": COMPARE__int__int
            },
            "latestDate": {
                "isInRecord": True,
                "columnName": "creation.latestDate",
                "newColumnName": "creation.latestDate",
                "userFriendlyName": "Date de création (est. haute)",
                "castDB": CAST__any__int,
                "castUser": CAST__any__int,
                "default": -1,
                "isList": False,
                "comparator": COMPARE__int__int
            },
            "classification": {
                "isInRecord": True,
                "columnName": "objectWork.termClassification",
                "newColumnName": "objectWork.termClassification",
                "userFriendlyName": "Classification",
                "castDB": CAST__any__fstring,
                "castUser": CAST__any__fstring,
                "default": "",
                "isList": False,
                "comparator": COMPARE__fstring__fstring
            },
            "objectType": {
                "isInRecord": True,
                "columnName": "objectWork.objectWorkType",
                "newColumnName": "objectWork.objectWorkType",
                "userFriendlyName": "Type d'objet",
                "castDB": CAST__string_list_string__list_fstring,
                "castUser": CAST__any__fstring,
                "default": [],
                "isList": True,
                "comparator": COMPARE__fstring__fstring
            },
            "materials": {
                "isInRecord": True,
                "columnName": "objectWork.termMaterialsTech",
                "newColumnName": "objectWork.termMaterialsTech",
                "userFriendlyName": "Matériaux",
                "castDB": CAST__string_list_string__list_fstring,
                "castUser": CAST__any__fstring,
                "default": [],
                "isList": True,
                "comparator": COMPARE__fstring__fstring
            },
            "inscription": {
                "isInRecord": True,
                "columnName": "objectWork.inscriptionDescription",
                "newColumnName": "objectWork.inscriptionDescription",
                "userFriendlyName": "Inscription",
                "castDB": CAST__any__fstring,
                "castUser": CAST__any__fstring,
                "default": "",
                "isList": False,
                "comparator": COMPARE__fstring__fstring
            },
            "measurements_0": {
                "isInRecord": True,
                "columnName": "objectWork.measurementsDescription",
                "newColumnName": "height",
                "userFriendlyName": "Hauteur",
                "castDB": CAST__list_any__float_0,
                "castUser": CAST__any__float,
                "default": -1,
                "isList": False,
                "comparator": COMPARE__float__float
            },
            "measurements_1": {
                "isInRecord": True,
                "columnName": "objectWork.measurementsDescription",
                "newColumnName": "width",
                "userFriendlyName": "Largeur",
                "castDB": CAST__list_any__float_1,
                "castUser": CAST__any__float,
                "default": -1,
                "isList": False,
                "comparator": COMPARE__float__float
            },
            "imageColor": {
                "isInRecord": True,
                "columnName": "imageColor",
                "newColumnName": "imageColor",
                "userFriendlyName": "Couleur de l'image",
                "castDB": CAST__any__fstring,
                "castUser": CAST__any__fstring,
                "default": "",
                "isList": False,
                "comparator": COMPARE__fstring__fstring
            },

            # Creator informations
            "creator": {
                "isInRecord": True,
                "columnName": "objectWork.creatorDescription",
                "newColumnName": "objectWork.creatorDescription",
                "userFriendlyName": "Nom de l'artiste",
                "castDB": CAST__any__fstring,
                "castUser": CAST__any__fstring,
                "default": "",
                "isList": False,
                "comparator": COMPARE__fstring__fstring
            },
            "creatorFirstName": {
                "isInRecord": True,
                "columnName": "creator.firstNameCreator",
                "newColumnName": "creator.firstNameCreator",
                "userFriendlyName": "Prénom de l'artiste",
                "castDB": CAST__any__fstring,
                "castUser": CAST__any__fstring,
                "default": "",
                "isList": False,
                "comparator": COMPARE__fstring__fstring
            },
            "creatorLastName": {
                "isInRecord": True,
                "columnName": "creator.lastNameCreator",
                "newColumnName": "creator.lastNameCreator",
                "userFriendlyName": "Nom de famille de l'artiste",
                "castDB": CAST__any__fstring,
                "castUser": CAST__any__fstring,
                "default": "",
                "isList": False,
                "comparator": COMPARE__fstring__fstring
            },
            "creatorBirthDate": {
                "isInRecord": True,
                "columnName": "creator.birthDateCreator",
                "newColumnName": "creator.birthDateCreator",
                "userFriendlyName": "Date de naissance de l'artiste",
                "castDB": CAST__any__int,
                "castUser": CAST__any__int,
                "default": -1,
                "isList": False,
                "comparator": COMPARE__int__int
            },
            "creatorDeathDate": {
                "isInRecord": True,
                "columnName": "creator.deathDateCreator",
                "newColumnName": "creator.deathDateCreator",
                "userFriendlyName": "Date de décès de l'artiste",
                "castDB": CAST__any__int,
                "castUser": CAST__any__int,
                "default": -1,
                "isList": False,
                "comparator": COMPARE__int__int
            },
            "creatorBirthDeathPlace": {
                "isInRecord": True,
                "columnName": "creator.birthDeathDatesPlacesCreatorDescription",
                "newColumnName": "creator.birthDeathDatesPlacesCreatorDescription",
                "userFriendlyName": "Lieu de naissance et de décès de l'artiste",
                "castDB": CAST__any__fstring,
                "castUser": CAST__any__fstring,
                "default": "",
                "isList": False,
                "comparator": COMPARE__fstring__fstring
            },
            "creatorNationality": {
                "isInRecord": True,
                "columnName": "creator.nationalityCreator",
                "newColumnName": "creator.nationalityCreator",
                "userFriendlyName": "Nationalité de l'artiste",
                "castDB": CAST__any__fstring,
                "castUser": CAST__any__fstring,
                "default": "",
                "isList": False,
                "comparator": COMPARE__fstring__fstring
            }
        }
        self.selectionColumns = []
        for key, value in self.smartColumns.items():
            self.selectionColumns.append({
                "key": key,
                "userFriendlyName": value["userFriendlyName"]
            })

    def get_selection_columns(self):
        return self.selectionColumns

    def get_smart_columns(self):
        return self.smartColumns

    def cast_columns(self):
        """
            Cast the columns as their type, for example:
            - columnType=="list" and itemType=="number" -> "[1,2,3]" -> [1, 2, 3]
            - columnType=="number" -> "1" -> 1
            - columnType=="string" -> "hello" -> "hello"
        """
        print("Casting columns...")
        f_data = []
        for i, record in enumerate(self.data):
            for smartColumn in self.get_smart_columns().values():
                if smartColumn["isInRecord"]:
                    columnName = smartColumn["columnName"]
                    newColumnName = smartColumn["newColumnName"]
                    castDB = smartColumn["castDB"]

                    castedValue = smartColumn["default"]
                    try:
                        castedValue = castDB(record[columnName])
                    except Exception as e:
                        castedValue = smartColumn["default"]
                    
                    record[newColumnName] = castedValue
            f_data.append(record)
        self.data = f_data
        print("Columns casted !")

    def get_columns(self) -> List[str]:
        return list(self.data[0].keys())
    
    def get_size(self) -> int:
        return len(self.data)
    
    def get_unique_for_smart_column(self, key: str) -> List[Any]:
        try:
            smartColumn = self.get_smart_columns()[key]
            isInRecord = smartColumn["isInRecord"]
            if isInRecord:
                columnName = smartColumn["newColumnName"]
                values = set()
                for record in self.data:
                    if smartColumn["isList"]:
                        for value in record[columnName]:
                            values.add(value)
                    else:
                        values.add(record[columnName])
                # Remove the default value
                if not smartColumn["isList"]:
                    values.discard(smartColumn["default"])
                return list(values)
            else:
                return self.unique_iconographies
        except Exception as e:
            print(e)
            raise Exception({
                "type": "COLUMN_NOT_FOUND",
                "message": f"La colonne {key} n'existe pas."
            })

    def autocomplete_compare(self, query, target, threshold=0.6):
        query = query.lower()
        target = target.lower()

        if len(query) > len(target):
            return False

        if query in target:
            return True
        
        if target.startswith(query):
            return True
        
        matcher = difflib.SequenceMatcher(None, query, target)
        similarity_ratio = matcher.ratio()

        if similarity_ratio >= threshold:
            return True

        return False

    def autocomplete(self, key: str, query: str) -> List[str]:
        try:
            query = str(query)
            unique_values_for_column = self.get_unique_for_smart_column(key)
            unique_values_for_column = [str(value) for value in unique_values_for_column]
            unique_values_for_column = sorted(unique_values_for_column, key=lambda x: len(x))
            unique_values_for_column = [value for value in unique_values_for_column if self.autocomplete_compare(query, value)]

            # Filter the unique values that start with the query
            if len(unique_values_for_column) > 5:
                return unique_values_for_column[:5]
            return unique_values_for_column
        except:
            raise Exception({
                "type": "COLUMN_NOT_FOUND",
                "message": f"La colonne {key} n'existe pas."
            })

    def set_engine(self, engine):
        self.ENGINE = engine

    def insert_mock_data(
            self, 
            records: List[Dict[str, Any]],
            embeddings: List[np.ndarray],
            iconographies
        ):

        self.unique_iconographies = set()

        def flattenIconography(iconography):
            flattened = set()

            def flatten(node):
                if not node:
                    return
                value = node['value']
                children = node.get('children', [])
                if value not in ['root', '<group>']:
                    flattened.add(value)
                    self.unique_iconographies.add(value)

                for child in children:
                    flatten(child)

            flatten(iconography)

            return list(flattened)
        
        self.data.extend(records)
        self.vectors.extend(embeddings)
        self.iconographies = {}

        for i, record in enumerate(records):
            self.indexToRecordID[i] = record['recordID']
            self.recordIDToIndex[record['recordID']] = i
            iconography = iconographies.get(str(record['recordID']), {})
            self.iconographies[i] = flattenIconography(iconography)

        self.unique_iconographies = list(self.unique_iconographies)
        self.cast_columns()

    def get_unique_for_column(self, column: str) -> List[Any]:
        return self.get_unique_for_smart_column(column)

    def get_smart_column_info(self, columnName):
        try:
            return self.smartColumns[columnName]
        except:
            raise Exception({
                "type": "COLUMN_NOT_FOUND",
                "message": f"La colonne {columnName} n'existe pas."
            })

    def evaluate_constraint(self, record, constraint) -> bool:        
        
        constraint_type = constraint["type"]
        key             = constraint["columnName"]
        isNot           = constraint.get("isNot", False)      
        exactMatch      = constraint.get("exactMatch", False)
        caseSensitive   = constraint.get("caseSensitive", False)

        smartColumn     = self.get_smart_column_info(key)
        isInRecord      = smartColumn["isInRecord"]
        columnName      = smartColumn["newColumnName"]
        castUser        = smartColumn["castUser"]
        recordID        = record['recordID']
        comparator      = smartColumn["comparator"]

        # Get the data point to be evaluated
        if isInRecord:
            datapoint = record[columnName] if record[columnName] is not None else smartColumn["default"]
        else:
            datapoint = self.iconographies[self.recordIDToIndex[recordID]]

        condition = False

        if constraint_type == "BETWEEN":
            condition = castUser(constraint["from"]) <= datapoint <= castUser(constraint["to"])
 
        elif constraint_type == "EQUAL":
            if isinstance(datapoint, int) or isinstance(datapoint, float):
                condition = comparator(castUser(constraint["equalTo"]), datapoint, caseSensitive, strict=exactMatch)
            elif isinstance(datapoint, list):
                for element in datapoint:
                    if comparator(castUser(constraint["equalTo"]), element, caseSensitive, strict=exactMatch):
                        condition = True
                        break
            else:
                condition = comparator(castUser(constraint["equalTo"]), datapoint, caseSensitive, strict=exactMatch)
        
        elif constraint_type == "INCLUDES":
            includes = [castUser(include) for include in constraint["includes"]]
            
            if isInRecord:
                # We want to check if a word from includes is in the datapoint
                # Ex: check if a word is in a title
                for include in includes:
                    if type(include)==int or type(include)==float:
                        if comparator(include, datapoint):
                            condition = True
                            break
                    else:
                        if type(datapoint)==list:
                            # We want to check if a word from includes is in the list datapoint
                            # Ex: check if a word is in the list of materials
                            intersection_size = 0
                            includes_set = set(includes)

                            for include in includes_set:
                                for term in datapoint:
                                    if comparator(include, term, caseSensitive, strict=True):
                                        intersection_size += 1

                            if exactMatch:
                                # All the terms from includes NEED to be present
                                condition = intersection_size == len(includes_set)
                            else:
                                # At least one term from includes needs to be present
                                condition = intersection_size > 0
                        else:
                            if comparator(include, datapoint, caseSensitive, strict=False):
                                condition = True
                                break
            else:
                # We want to check if a word from includes is in the iconography
                # Ex: check if a word is in the iconography
                intersection_size = 0
                includes_set = set(includes)

                for include in includes_set:
                    for iconography in datapoint:
                        if comparator(include, iconography, caseSensitive, strict=True):
                            intersection_size += 1

                if exactMatch:
                    # All the terms from includes NEED to be present
                    condition = intersection_size == len(includes_set)
                else:
                    # At least one term from includes needs to be present
                    condition = intersection_size > 0

        else:
            raise ValueError(f"Unsupported constraint type: {constraint_type}")

        return condition if not isNot else not condition

    def parse_constraints(self, record, constraints) -> bool:        
        bool_value = True
        nextOperation = "AND"
        for constraint in constraints:
            if constraint["type"] == "AND":
                nextOperation = "AND"
            elif constraint["type"] == "OR":
                nextOperation = "OR"
            else:
                block_bool = self.evaluate_constraint(record, constraint)
                if nextOperation == "AND":
                    bool_value = bool_value and block_bool
                elif nextOperation == "OR":
                    bool_value = bool_value or block_bool
        
        return bool_value

    def apply_hard_constraints(self, constraints):
        """Filters data based on structured constraints."""
        recordIDs = [record["recordID"] for i, record in enumerate(self.data) if self.parse_constraints(record, constraints)]
        return recordIDs
    
    def get_queries_embedding(self, queries, precomputed={}, version="classic"):
        weights = [query['weight'] for query in queries]

        values = []
        for query in queries:
            if query['type'] == 'term':
                values.append(query['term'])
            elif query['type'] == 'keyword':
                values.append(query['keyword'])
            elif query['type'] == 'color':
                values.append(query['color'])
            elif query['type'] == 'luminosity':
                values.append(query['luminosity'])
            elif query['type'] == 'precomputed':
                values.append(query['recordID'])

        embeddings = []
        for i in range(len(values)):
            if i in precomputed:
                embeddings.append([precomputed[i]])
            else:
                embeddings.append(self.ENGINE.get_query_embedding(values[i]))
        embeddings = np.array(embeddings) # Convert to numpy array

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

    def apply_soft_constraints(
            self, 
            queries: List[Dict[str, Any]], 
            valid_recordIDs: List[int],
            version: str,
        ) -> List[Tuple[int, float]]:   
            precomputed = {}

            for i, query in enumerate(queries):
                if query["type"] != "precomputed":
                    continue
                recordID = query["recordID"]
                precomputed[i] = self.vectors[self.recordIDToIndex[recordID]]
                
            subset_vectors = []
            for recordID in valid_recordIDs:
                i = self.recordIDToIndex[recordID]
                subset_vectors.append(self.vectors[i])
            subset_vectors = np.array(subset_vectors)

            queries_embedding = self.get_queries_embedding(queries, precomputed=precomputed, version=version)
            sims = cosine_similarity(queries_embedding, subset_vectors)[0]
            indexes = np.argsort(sims)[::-1]
        
            return [(valid_recordIDs[i], sims[i]) for i in indexes]

    def query(
            self, 
            filters,
            queries: List[Dict[str, Any]], 
            page: int, 
            page_size: int,
            version: str="classic"
        ) -> List[Dict[str, Any]]:

        filters = filters or []
        queries = queries or []

        if len(filters) == 0:
            valid_recordIDs = [record["recordID"] for record in self.data]
        else:
            valid_recordIDs = self.apply_hard_constraints(filters)

        if len(valid_recordIDs) == 0:
            return []
        
        if len(queries) == 0:
            ranked_results = [(recordID, 0) for recordID in valid_recordIDs]
        else:
            ranked_results = self.apply_soft_constraints(queries, valid_recordIDs, version)

        # Verify that the page is within bounds
        num_pages = len(ranked_results) // page_size
        if page > num_pages:
            return []

        # Normalize the similarity scores to [0, 1]
        min_similarity = min([similarity for _, similarity in ranked_results])
        max_similarity = max([similarity for _, similarity in ranked_results])
        if min_similarity == max_similarity:
            for i in range(len(ranked_results)):
                ranked_results[i] = (ranked_results[i][0], 0)
        else:
            for i in range(len(ranked_results)):
                ranked_results[i] = (ranked_results[i][0], (ranked_results[i][1] - min_similarity) / (max_similarity - min_similarity))

        # TODO: PAGINATION

        paginated_results = []
        for result_index, ranked_result in enumerate(ranked_results):
            if result_index > page_size:
                break

            recordID, similarity = ranked_result
            i = self.recordIDToIndex[recordID]

            data = self.data[i]
            data["iconography"] = self.iconographies[i]
            data["similarity"] = float(similarity)

            # Convert nan to None
            for key, value in data.items():
                if value != value:
                    data[key] = None

            paginated_results.append(data)
        
        return paginated_results