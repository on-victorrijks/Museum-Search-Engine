# AI Museum Search Engine

[![License](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

This repository contains the source code for the "AI Museum Search Engine," a web application designed to help museum staff and the general public explore and search a database of artworks, artists, and subject matters (iconographies).

The tool leverages Artificial Intelligence to enhance the search experience through features like:

* **AI-powered Result Sorting:** Intelligent algorithms to rank search results based on relevance.
* **Collection Augmentation:** AI capabilities to potentially enrich collection data.
* **Collection Sorting:** Advanced sorting options for curated collections.
* **Result Refinement:** AI and other algorithms to narrow down and improve search accuracy.

This project was specifically created to assist museums, particularly the Royal Museums of Fine Arts of Belgium. It is intended to remain a free and accessible resource for museums and is not intended for commercial sale as a full product or subscription service.

## Table of Contents

* [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
* [Running the Application](#running-the-application)
* [Usage](#usage)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

## Getting Started

This repository contains only the front-end and the back-end. For this project to work, one must have received the *private_data* folder containing the museum's data. The .env file in this folder contains the required environment variables loaded in the various python files.

### Prerequisites

The project was developped with the following tools:

* Python 3.9.0
* npm 9.5.0
* Node.js v22.12.0
* PostgreSQL 17.4 and pgvector

### Installation

1.  **Backend Setup (if applicable):**
    ```bash
    # Create a venv environment and go into it
    python3 -m venv venv
    .venv/Script/activate
    
    # Install Python dependencies
    cd public
    pip install -r requirements_backend.txt

    # Use a docker with PostgreSQL 17.4 and pgvector
    # The .env file in private_data contains the necessary informations for the connections
    ```

3.  **Frontend Setup:**
    ```bash
    cd webtool

    # Install Node.js dependencies (using npm or yarn)
    npm install # or yarn install

    # Run the dev version 
    npm run dev
    ```

4.  **How to add a model**
    ```bash
    # This section should be added after the models's system has been improved. Ideally, the user would just launch a script with a model base name, a training and validation dataset path, hypterparameters, etc. 
    # Then the user could add this model in a json file that would be read when the api starts. The embeddings etc should be added in batches !
    ```

## Running the Application

This section explains how to start the different parts of the application.

1.  **Start the Backend:**
    ```bash
    # Launch the docker instance for the PostgreSQL database
    .venv/Scripts/activate
    cd public/api
    python api.py
    ```

2.  **Start the Frontend:**
    ```bash
    cd webtool
    npm run dev
    ```

3.  **Access the Application:**
    * The url is provided by npm in the console

## Contributing

While this project is primarily intended for the Royal Museums of Fine Arts of Belgium, if you have suggestions or identify issues, feel free to:

* **Submit bug reports:** Open an issue on GitHub detailing the problem.
* **Suggest enhancements:** Open an issue with your proposed changes or features.

We appreciate any contributions that help improve the tool.

## License

This project is licensed under the **GNU General Public License version 3 (GPLv3)**.

### Full license
```
This tool does not have a definitive name, it is called : “AI Museum Search Engine” for now.
 
This repository contains a web application allowing users (staff from the museum or the general public) to search a database of artworks, artists and subject matters (iconographies). The tool uses AI to sort the results, augment collections, sort collections and refine the results. Other additional algorithms are used to refine the results or to sort the collections.
 
This tool has been made to help the museums (more specifically the Royal Museums of Fine Arts of Belgium). It is not intended to be sold to them as a full product or as a subscription-based product. I wish that this tool remains free and accessible to museums. 
 
Copyright (C) 2025  VICTOR RIJKS
 
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 
For commercial use or custom licensing, please contact the author at victor.rijks12@gmail.com.
```