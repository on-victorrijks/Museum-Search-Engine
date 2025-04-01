from settings import get_db_config, get_paths
from database.db import DatabaseManager
from engine.model import Model

# Start the Database manager
MODELS = {}
print(f"Loading models...")
for embedding in get_paths()["embeddings"]:
    print(f"Loading model {embedding['name']}...")
    MODELS[embedding["name"]] = Model(
        embedding["name"],
        embedding["base_name"],
        embedding["weights_path"],
        device="cpu"
    )
    print(f"✓ : Model {embedding['name']} loaded")
print(f"Models loaded")

DB_MANAGER = DatabaseManager(get_db_config(), get_paths(), MODELS)

if __name__ == "__main__":
    DB_MANAGER.populate_keywords()

    yesno = input("Are you sure you want to reset the database? (y/n): ")
    if yesno == "y":
        DB_MANAGER.reset(full_reset=True)
        DB_MANAGER.populate()
