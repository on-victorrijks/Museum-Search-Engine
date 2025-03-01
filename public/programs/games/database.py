import numpy as np
from typing import List, Dict, Any, Tuple
from abc import ABC, abstractmethod
from sklearn.metrics.pairwise import cosine_similarity

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

class MockDB(AbstractDatabase):
    def __init__(self):
        self.ENGINE = None

        self.data = []
        self.vectors = []
        self.iconographies = []

        self.indexToRecordID = {}
        self.recordIDToIndex = {}
    
    def get_columns(self) -> List[str]:
        return list(self.data[0].keys())
    
    def get_size(self) -> int:
        return len(self.data)
    
    def get_unique_for_column(self, column: str) -> List[Any]:
        values = [record[column] for record in self.data]
        # Remove nan
        values = [value for value in values if value == value]
        return list(set(values))

    def set_engine(self, engine):
        self.ENGINE = engine

    def insert_mock_data(
            self, 
            records: List[Dict[str, Any]],
            embeddings: List[np.ndarray],
            iconographies
        ):

        def flattenIconography(iconography):
            flattened = set()

            def flatten(node):
                if not node:
                    return
                value = node['value']
                children = node.get('children', [])
                if value not in ['root', '<group>']:
                    flattened.add(value)

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
    
    def evaluate_constraint(self, record: Dict[str, Any], constraint: Dict) -> bool:        
        constraint_type = constraint["type"]
        if constraint_type=="constant":
            return constraint["value"]

        location = constraint["location"]
        recordID = record['recordID']

        # Get the data point to be evaluated
        if location == "metadatas":
            datapoint = record[constraint["column"]]
        elif location == "iconography":
            datapoint = self.iconographies[self.recordIDToIndex[recordID]]
        else:
            raise ValueError(f"Unsupported location: {location}")

        if constraint_type == "interval":
            return constraint["min"] <= datapoint <= constraint["max"]

        elif constraint_type == "equal":
            return datapoint in constraint["values"]

        elif constraint_type == "not_equal":
            return datapoint not in constraint["values"]
        
        elif constraint_type == "contains":
            if isinstance(datapoint, str):
                datapoint = [datapoint]
            return constraint["term"] in datapoint

        else:
            raise ValueError(f"Unsupported constraint type: {constraint_type}")

    def parse_constraints(self, record: Dict[str, Any], constraints: Any) -> bool:        
        """Recursively evaluates nested constraints on a record."""
        if isinstance(constraints, dict):  # Single constraint
            
            return self.evaluate_constraint(record, constraints)

        elif isinstance(constraints, tuple):  # Nested structure
            
            if len(constraints)==1:
                return self.parse_constraints(record, constraints[0])
            elif len(constraints)==2:
                operator = constraints[0]
                if operator == "NOT":
                    return not self.parse_constraints(record, constraints[1])
                else:
                    raise ValueError(f"(2) Unsupported operator: {operator}")
            elif len(constraints)==3:
                operator = constraints[1]  # AND, OR, NOT
                if operator == "AND":
                    return self.parse_constraints(record, constraints[0]) and self.parse_constraints(record, constraints[2])
                elif operator == "OR":
                    return self.parse_constraints(record, constraints[0]) or self.parse_constraints(record, constraints[2])
                else:
                    raise ValueError(f"(3) Unsupported operator: {operator}")

        else:
            raise ValueError("Invalid constraint format")

    def apply_hard_constraints(self, constraints: Any) -> List[int]:
        """Filters data based on structured constraints."""
        return [i for i, record in enumerate(self.data) if self.parse_constraints(record, constraints)]
    
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
            indices: List[int],
            version: str,
        ) -> List[Tuple[int, float]]:   
            precomputed = {}

            for i, query in enumerate(queries):
                if query["type"] != "precomputed":
                    continue
                recordID = query["recordID"]
                precomputed[i] = self.vectors[self.recordIDToIndex[recordID]]
                
            queries_embedding = self.get_queries_embedding(queries, precomputed=precomputed, version=version)
            sims = cosine_similarity(queries_embedding, self.vectors).squeeze()
            indices = np.argsort(sims)[::-1]
        
            return [(i, sims[i]) for i in indices]

    def query(
            self, 
            filters: Dict[str, Tuple[Any, Any]], 
            queries: List[Dict[str, Any]], 
            page: int, 
            page_size: int,
            version: str="classic"
        ) -> List[Dict[str, Any]]:

        if not filters:
            valid_indices = list(range(len(self.data)))
        else:
            valid_indices = self.apply_hard_constraints(filters)

        if queries is None:
            ranked_results = [(i, 0) for i in valid_indices]
        else:
            ranked_results = self.apply_soft_constraints(queries, valid_indices, version)
        
        # Verify that the page is within bounds
        num_pages = len(ranked_results) // page_size
        if page >= num_pages:
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

        paginated_results = []
        for result_index in range(page * page_size, min((page + 1) * page_size, len(ranked_results))):
            i, similarity = ranked_results[result_index]
            data = self.data[i]
            data["iconography"] = self.iconographies[i]
            data["similarity"] = float(similarity)

            # Convert nan to None
            for key, value in data.items():
                if value != value:
                    data[key] = None

            paginated_results.append(data)
        
        return paginated_results