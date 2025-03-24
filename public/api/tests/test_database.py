import unittest
import os
from database.db import DatabaseManager
from settings import get_db_config_test, get_paths_test

class TestDatabaseManager(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Configuration initiale pour tous les tests"""
        cls.config = get_db_config_test()    
        cls.paths = get_paths_test()
        assert cls.config["name"] == "test_db"

        cls.db = DatabaseManager(cls.config, cls.paths)

        cls.base_query = """
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

    def setUp(self):
        # We assume that test_db is already populated ! (a copy of the original db)
        pass

    def test_apply_hard_constraints_empty(self):
        query, params = self.db.get_hard_query([])
        self.assertEqual(query, self.base_query)
        self.assertEqual(params, [])
        # Execute the query and check that there are results !
        with self.db._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                results = cursor.fetchall()
                self.assertGreater(len(results), 0)

    def test_apply_hard_constraints_1D_mix(self):
        constraints = [
            {
                "type": "EQUAL",
                "selectedColumn": {"key": "title"},
                "equalTo": "un",
                "exactMatch": False,
                "caseSensitive": False,
            },
            {
                "type": "AND",          
            },
            {
                "type": "BETWEEN",
                "selectedColumn": {
                    "key": "creationEarliestDate"
                },
                "from": 1500,
                "to": 2000,
                "isNot": True,
                "caseSensitive": True,
            },
            {
                "type": "OR",         
            },
            {
                "type": "INCLUDES",
                "selectedColumn": {
                    "key": "IFT_values"
                },
                "values": ["femme", "homme"],
                "isNot": False,
                "exactMatch": False,
                "caseSensitive": True,
            }
        ]
        conditions = """LOWER(a.title) LIKE LOWER(%s) AND NOT (a.creationEarliestDate BETWEEN %s AND %s) OR IFT.values && ARRAY[%s] """
        expected_query = self.base_query + " AND " + conditions
        expected_params = ["%un%", 1500, 2000, ["femme", "homme"]]

        generated_query, generated_params = self.db.get_hard_query(constraints)

        print(expected_query)
        print("")
        print(generated_query)

        # Verify the params
        self.assertEqual(generated_params, expected_params)
        
        # Verify the query
        # Execute both queries and compare the results (compare the recordIDs)
        with self.db._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(expected_query, expected_params)
                expected_results = cursor.fetchall()
                expected_recordIDs = [row[0] for row in expected_results]

                cursor.execute(generated_query, generated_params)
                results = cursor.fetchall()

                recordIDs = [row[0] for row in results]

                self.assertGreaterEqual(len(results), 0)
                self.assertEqual(len(expected_results), len(results))
                self.assertEqual(expected_recordIDs, recordIDs)

    def test_apply_hard_constraints_1D_INCLUDES(self):
        constraints = [
            {
                "type": "INCLUDES",
                "selectedColumn": {
                    "key": "title"
                },
                "values": ["caravane", "Syrie"],
                "isNot": False,
                "exactMatch": True,
                "caseSensitive": False,
            }
        ]
        conditions = """a.title LIKE %s AND a.title LIKE %s """
        expected_query = self.base_query + " AND " + conditions
        expected_params = ["%caravane%", "%Syrie%"]

        generated_query, generated_params = self.db.get_hard_query(constraints)

        # Verify the params
        self.assertEqual(generated_params, expected_params)

        # Verify the query
        # Execute both queries and compare the results (compare the recordIDs)
        with self.db._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(expected_query, expected_params)
                expected_results = cursor.fetchall()
                expected_recordIDs = [row[0] for row in expected_results]

                cursor.execute(generated_query, generated_params)
                results = cursor.fetchall()
                recordIDs = [row[0] for row in results]

                self.assertGreaterEqual(len(results), 0)
                self.assertEqual(expected_recordIDs, recordIDs)

                # Verify the results
                titles = [row[4] for row in results]
                for title in titles:
                    title = title.lower()
                    self.assertIn("caravane", title)
                    self.assertIn("syrie", title)


    def test_apply_hard_constraints_2D_mix(self):
        constraints = [
            {
                "type": "EQUAL",
                "selectedColumn": {"key": "title"},
                "equalTo": "un père",
                "exactMatch": False,
                "caseSensitive": False,
            },
            {
                "type": "OR",
            },
            {
                "type": "GROUP",
                "children": [
                    {
                        "type": "EQUAL",
                        "selectedColumn": {"key": "title"},
                        "equalTo": "enfant",
                        "exactMatch": False,
                        "caseSensitive": False,
                    },
                    {
                        "type": "AND",
                    },
                    {
                        "type": "EQUAL",
                        "selectedColumn": {"key": "title"},
                        "equalTo": "mère",
                        "exactMatch": False,
                        "caseSensitive": False,
                    }
                ]
            }
        ]
        conditions = """
        LOWER(a.title) LIKE LOWER(%s) OR (
            LOWER(a.title) LIKE LOWER(%s) 
            AND LOWER(a.title) LIKE LOWER(%s)
        )
        """
        expected_query = self.base_query + " AND " + conditions
        expected_params = ["%un père%", "%enfant%", "%mère%"]

        generated_query, generated_params = self.db.get_hard_query(constraints)

        # Verify the params
        self.assertEqual(generated_params, expected_params)

        # Verify the query
        # Execute both queries and compare the results (compare the recordIDs)
        with self.db._connect() as conn:
            with conn.cursor() as cursor:
                cursor.execute(expected_query, expected_params)
                expected_results = cursor.fetchall()
                expected_recordIDs = [row[0] for row in expected_results]

                cursor.execute(generated_query, generated_params)
                results = cursor.fetchall()
                recordIDs = [row[0] for row in results]

                self.assertGreaterEqual(len(results), 0)
                self.assertEqual(expected_recordIDs, recordIDs)

                # Verify the results
                titles = [row[4] for row in results]
                for title in titles:
                    title = title.lower()
                    first_equal_true = "un père" in title
                    second_equal_true = "enfant" in title and "mère" in title
                    self.assertTrue(first_equal_true or second_equal_true)



if __name__ == '__main__':
    unittest.main() 