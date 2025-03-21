from settings import get_db_config, get_paths
from database.db import DatabaseManager
# Start the Database manager
DB_MANAGER = DatabaseManager(get_db_config(), get_paths())

if __name__ == "__main__":
    DB_MANAGER.reset()
    DB_MANAGER.populate()
