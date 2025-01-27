import os
from dotenv import load_dotenv 


def create_folders(path):
    # 1) Remove the content after the last slash
    pathSplit = path.split('/')
    pathWithoutLast = '/'.join(pathSplit[:-1]) + '/'
    # 2) Create the folders
    os.makedirs(pathWithoutLast, exist_ok=True)
    print(f"Folder {pathWithoutLast} created")

NAMES = [
    "FOLDER_TABLE",
    "FILE_FABRITIUS_DATA",
    "FILE_FABRITIUS_DATA_FILTERED",
    "FOLDER_FIGURES",
    "WRITTEN_CAPTIONS_TESTING_SET",
    "WRITTEN_CAPTIONS_VALIDATION_SET",
]

if __name__ == "__main__":
    load_dotenv("./private_data/.env")
    for name in NAMES:
        create_folders(os.getenv(name))