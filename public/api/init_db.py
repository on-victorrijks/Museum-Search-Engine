from settings import get_db_config, get_paths
from database.db import DatabaseManager

# Start the Database manager
DB_MANAGER = DatabaseManager(get_db_config(), get_paths())

if __name__ == "__main__":
    yesno = input("Are you sure you want to reset the database? (y/n): ")
    if yesno == "y":
        DB_MANAGER.reset(full_reset=True)
        DB_MANAGER.populate()
