const candidates_container          = document.querySelector('#candidates');
const candidates_rows               = candidates_container.querySelectorAll('.row');

const start_game                    = document.querySelector('#start_game');

const difficulty_levels_container   = document.querySelector('#difficulty_levels');

const loader_container              = document.querySelector('#loader_container');
const loader_title                  = document.querySelector('#loader_title');
const loader_message                = document.querySelector('#loader_message');

const menu_container                = document.querySelector('#menu_container');
const game_container                = document.querySelector('#game_container');
const questions_container           = document.querySelector('#questions_container');
const user_answers_container        = document.querySelector('#user_answers');
const result_container              = document.querySelector('#result_container');
const larger_container              = document.querySelector('#larger_container');

const result_userGuess              = document.querySelector(".resultSplit[side='user'] #guess");
const result_trueRobot              = document.querySelector(".resultSplit[side='user'] #correct");
const result_robotGuess             = document.querySelector(".resultSplit[side='robot'] #guess");
const result_trueUser               = document.querySelector(".resultSplit[side='robot'] #correct");


// Game variables
let robot_selected_image = null;
let candidates = [];

let userQuestions = [];
let robotQuestions = [];

let questionsThatUserAsked = [];
let questionsThatRobotAsked = [];

let question_index = 0;
let user_answers = [];

let waiting_for_user_guess = false;
let selectedCardRecordID = null;
let playerOdd = true; // true if the player played first, false if the robot played first

const index_to_power = [-1.0, -0.5, 0.0, 0.5, 1.0]

const ROBOT_THINKING_TIME = 750;
const OVERLAY = false;
//

function setLoader({enabled, title, message}) {
    loader_container.setAttribute('enabled', enabled);
    loader_title.innerHTML = title;
    loader_message.innerHTML = message;
    menu_container.setAttribute('loader', enabled);
}

function handleError(error) {
    console.error(error);
}

function sendAnswerToRobot(power) {
    user_answers.push(power);
    launchRound(); // Go to the next round
}

function editCandidateRanking(recordID, ranking) {
    const candidate = candidates_container.querySelector(`.candidate[recordid="${recordID}"]`);
    const ranking_div = candidate.querySelector('.ranking');
    const ranking_text = ranking_div.querySelector('h3');
    ranking_text.innerHTML = ranking;
}

function selectSecretCard(recordID) {
    selectedCardRecordID = recordID;
    game_container.setAttribute('selectCards', 'false');
    const candidate = candidates_container.querySelector(`.candidate[recordid="${recordID}"]`);
    candidate.setAttribute('ownsecret', 'true');

    candidates.forEach((candidate) => {
        setTimeout(() => {
            updateOverlaySizeToMatchImageSize(candidate);
        }, 1000);
    });

    launchRound(); // Start the game
}

function getRobotGuess() {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
}

function endgame(userGuess) {
    const robotGuess = getRobotGuess();

    const isUserRight   = userGuess == robot_selected_image;
    const isRobotRight  = robotGuess == robot_selected_image;

    // Append the cards in the result screen
    appendCandidate(result_userGuess, userGuess);
    appendCandidate(result_trueRobot, robot_selected_image);
    appendCandidate(result_robotGuess, robotGuess);
    appendCandidate(result_trueUser, selectedCardRecordID);

    // Show the result screen
    /*
        id="result_container"
        class="resultScreen"
        enabled="false"
        userCorrectGuess="false"
        robotCorrectGuess="false"
        result="win"
    */
    let result = 0; // 0=lose, 1=draw, 2=win
    let result_text = "";
    if (!isUserRight) {
        result = 0;
        result_text = "lose";
    } else if (isUserRight && isRobotRight) {
        result = 1;
        result_text = "draw";
    } else if (isUserRight && !isRobotRight) {
        result = 2;
        result_text = "win";
    } else {
        result = 0;
        result_text = "lose";
    }

    let resultTitle = "";
    if (result==0) resultTitle = "Vous avez perdu !";
    else if (result==1) resultTitle = "Egalité !";
    else if (result==2) resultTitle = "Vous avez gagné !";

    let userResult = "";
    if (isUserRight) userResult = "Vous avez trouvé la carte secrete du robot !";
    else userResult = "Vous n'avez pas trouvé la carte secrete du robot !";

    let robotResult = "";
    if (isRobotRight) robotResult = "Le robot a trouvé votre carte secrete !";
    else robotResult = "Le robot n'a pas trouvé votre carte secrete !";

    console.log(isUserRight, isRobotRight);

    document.querySelector("#resultTitle").innerHTML = resultTitle;
    document.querySelector(".resultSplit[side='user'] h2").innerHTML = userResult;
    document.querySelector(".resultSplit[side='robot'] h2").innerHTML = robotResult;

    game_container.setAttribute('blurred', 'true');
    result_container.setAttribute('enabled', true);
    result_container.setAttribute('userCorrectGuess', isUserRight);
    result_container.setAttribute('robotCorrectGuess', isRobotRight);
    result_container.setAttribute('result', result_text);

}

function clickOnCard(recordID) {
    // User selecting his secret card
    if (selectedCardRecordID == null) {
        selectSecretCard(recordID);
        return;
    }

    // User guessing the robot secret card
    if (waiting_for_user_guess) {
        // Remove the user guess attribute from all candidates
        Array.from(candidates_container.querySelectorAll('.candidate')).forEach((candidate) => {
            candidate.removeAttribute('userguess');
        });

        const candidate = candidates_container.querySelector(`.candidate[recordid="${recordID}"]`);
        candidate.setAttribute('userguess', 'true');

        endgame(recordID);
    }
}

function setRobotThinking(thinking) {
    game_container.setAttribute('robotthinking', thinking);
}

function getQuestionText(questionData) {
    type = questionData["question"]["type"];
    content = questionData["question"]["content"];

    if (type == "object") {
        return `Est-ce que votre image contient un(e) <b>${content}</b> ?`;
    } else if (type == "color") {
        return `Est-ce que votre image est de couleur <b>${content}</b> ?`;
    } else if (type == "luminosity") {
        return `Est-ce que votre image est <b>${content}</b> ?`;
    }
}

function setRobotQuestion(questionData) {
    game_container.querySelector(".box[context='userselectinganswer'] .messageBubble p").innerHTML = getQuestionText(questionData);
}

function loadRobotQuestions() {
    // Increase the question index (the robot asked a question)
    question_index += 1;

    setRobotThinking(true);
    game_container.setAttribute('context', 'userselectinganswer');

    // Get the robot question
    const questionData = robotQuestions.pop();
    questionsThatRobotAsked.push(questionData);

    // Add a timeout to simulate the robot thinking
    setTimeout(() => {
        // Add the question
        setRobotQuestion(questionData);
        setRobotThinking(false);
    }, ROBOT_THINKING_TIME);
}

function getAnswerText(answer, questionData) {
    type = questionData["question"]["type"];
    content = questionData["question"]["content"];
    if (answer) {
        if (type == "object") {
            return `<b>Oui!</b>, mon image contient un(e) ${content} !`;
        } else if (type == "color") {
            return `<b>Oui!</b>, mon image est de couleur ${content} !`;
        } else if (type == "luminosity") {
            return `<b>Oui!</b>, mon image est ${content} !`;
        }
    } else {
        if (type == "object") {
            return `<b>Non!</b>, mon image ne contient pas de ${content} !`;
        } else if (type == "color") {
            return `<b>Non!</b>, mon image n'est pas de couleur ${content} !`;
        } else if (type == "luminosity") {
            return `<b>Non!</b>, mon image n'est pas ${content} !`;
        }
    }
}

function setRobotAnswer(answer, questionData) {
    game_container.querySelector(".box[context='robotanswering'] .messageBubble p").innerHTML = getAnswerText(answer, questionData);
}

function selectQuestion(questionData, index) {
    // Increase the question index (the user asked a question)
    question_index += 1;

    // Add the question to the list of questions that the user asked
    questionsThatUserAsked.push(questionData);
    // Remove the question from the list of questions
    userQuestions.splice(index, 1);

    setRobotThinking(true);
    game_container.setAttribute('context', 'robotanswering');

    // Get the robot answer
    const indexOfRobotImage = candidates.indexOf(robot_selected_image);
    const robotCosineSimilarities = questionData["answers"];
    const similarityOfRobot = robotCosineSimilarities[indexOfRobotImage];
    const thresholdForThisQuestion = 0.2; // Could be dynamic
    // The robot answer by YES or NO
    const robotAnswer = similarityOfRobot > thresholdForThisQuestion;

    // Add a timeout to simulate the robot thinking
    setTimeout(() => {
        // Add the answer
        setRobotAnswer(robotAnswer, questionData);
        setRobotThinking(false);
    }, ROBOT_THINKING_TIME);
}

function generateQuestionText({type, content}) {
    if (type == "object") {
        return `Est-ce que l'image du robot contient un(e) <b>${content}</b> ?`;
    } else if (type == "color") {
        return `Est-ce que l'image du robot est de couleur <b>${content}</b> ?`;
    } else if (type == "luminosity") {
        return `Est-ce que l'image du robot est <b>${content}</b> ?`;
    }
}

function appendQuestion(questionData, index) {
    let inHTMLIndex = 1;
    Array.from(questions_container.children).forEach((child) => {
        inHTMLIndex += 1;
    });
    
    const div = document.createElement('div');
    div.classList.add('question');
    div.setAttribute('id', `question_${index}`);

    const questionNumber = document.createElement('div');
    questionNumber.classList.add('questionNumber');
    const questionNumberText = document.createElement('h4');
    questionNumberText.innerHTML = inHTMLIndex;
    questionNumber.appendChild(questionNumberText);
    div.appendChild(questionNumber);

    const questionText = document.createElement('h2');
    questionText.innerHTML = generateQuestionText(questionData["question"]);
    div.appendChild(questionText);

    div.onclick = () => selectQuestion(questionData, index);
    
    questions_container.appendChild(div);
}

function clearQuestions() {
    questions_container.innerHTML = '';
}

function loadUserQuestions() {
    //Take 4 random questions from the userQuestions
    const randomIndexes = [];
    let indexes = Array.from(Array(userQuestions.length).keys());
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * indexes.length);
        randomIndexes.push(indexes[randomIndex]);
        indexes.splice(randomIndex, 1);
    }

    // Add questions to the interface
    clearQuestions();

    randomIndexes.forEach((index) => {
        appendQuestion(userQuestions[index], index);
    });    
    
    // Set the context to user selecting question
    game_container.setAttribute('context', 'userselectingquestion');
}

function guessingTime() {
    // Activate the guessing mode
    game_container.setAttribute('guessing', 'true');

    // Ask the user to guess
    setTopInstruction("Clickez sur la carte que vous pensez être la carte secrete du robot !");

    waiting_for_user_guess = true;
}

function launchRound() {
    const isLastQuestion = question_index == (n_players_questions + n_robot_questions - 1);

    if (question_index==0){
        // We select which player goes first
        //playerOdd = Math.random() < 0.5;
        playerOdd = true;
    }
    
    // Is game finished
    if (
        questionsThatUserAsked.length == n_players_questions &&
        questionsThatRobotAsked.length == n_robot_questions
    ) {
        guessingTime();
        return;
    }

    let isPlayerTurn = (question_index % 2 == 1) == playerOdd;
    if (isPlayerTurn){
        // Check if the player still has questions
        if (userQuestions.length == 0) {
            isPlayerTurn = false;
        }
    } else {
        // Check if the robot still has questions
        if (robotQuestions.length == 0) {
            isPlayerTurn = true;
        }
    }

    document.querySelector("#gotoNextQuestion").innerHTML = isLastQuestion ? "Devinez la carte" : "Passer à la question suivante";

    if (isPlayerTurn) {
        setTopInstruction("Vous pouvez choisir la question que vous voulez poser !");
        loadUserQuestions();
    } else {
        setTopInstruction("Le robot va vous poser une question !");
        loadRobotQuestions();
    }
}

function updateOverlaySizeToMatchImageSize(recordID) {
    if (!OVERLAY) return;
    const img = candidates_container.querySelector(`.candidate[recordid="${recordID}"] img`);
    const overlay = candidates_container.querySelector(`.candidate[recordid="${recordID}"] #overlay`);

    var ratio = img.naturalWidth/img.naturalHeight
    var width = img.height*ratio
    var height = img.height
    if (width > img.width) {
      width = img.width
      height = img.width/ratio
    }

    // TO avoid laggy border
    width = width * 1.025;
    height = height * 1.025;

    overlay.style.width = width + 'px';
    overlay.style.height = height + 'px';
}

function showImageInLarge(recordID) {
    const img = larger_container.querySelector('#larger_image');
    img.src = 'http://127.0.0.1:5000/images/' + recordID;
    larger_container.setAttribute('enabled', 'true');
}

function appendCandidate(
    container,
    recordID
) {
    const card = document.createElement('div');
    card.classList.add('candidate');
    card.setAttribute('recordid', recordID);

    const cardContent = document.createElement('div');
    cardContent.classList.add('cardContent');

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('imageContainer');

    const image = document.createElement('img');
    image.src = 'http://127.0.0.1:5000/images/' + recordID;
    imageContainer.appendChild(image);
    imageContainer.onclick = () => clickOnCard(recordID);

    if (OVERLAY){
        const overlay = document.createElement('img');
        overlay.src = 'http://127.0.0.1:5000/static/dixit/assets/border_card.png';
        overlay.setAttribute('id', 'overlay');
        imageContainer.appendChild(overlay);
    }

    cardContent.appendChild(imageContainer);

    const ranking = document.createElement('div');
    ranking.classList.add('ranking');
    const ranking_text = document.createElement('h3');
    ranking_text.innerHTML = '?';
    ranking.appendChild(ranking_text);
    cardContent.appendChild(ranking);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.onclick = () => showImageInLarge(recordID);
    buttonsContainer.classList.add('buttonsContainer');
    const largerButton = document.createElement('button');
    largerButton.innerHTML = 'Voir en grand';

    const decorative_left = document.createElement('div');
    decorative_left.classList.add('decorative');

    const decorative_right = document.createElement('div');
    decorative_right.classList.add('decorative');

    buttonsContainer.appendChild(decorative_left);
    buttonsContainer.appendChild(largerButton);
    buttonsContainer.appendChild(decorative_right);

    cardContent.appendChild(buttonsContainer);

    card.appendChild(cardContent);

    container.appendChild(card);

    setTimeout(() => {
        updateOverlaySizeToMatchImageSize(recordID);
    }, 50);

}

function clearCandidates() {
    Array.from(candidates_rows).forEach((row) => {
        row.innerHTML = '';
    });
}

function getSelectedDifficulty() {
    let selected_difficulty = null;
    Array.from(difficulty_levels_container.children).forEach((child, index) => {
        // Check if the attribute selected == true
        if(child.getAttribute('selected') == 'true'){
            selected_difficulty = index;
        }
    });
    return selected_difficulty;
}

const setMenuVisibility = (visible) => menu_container.setAttribute('enabled', visible);
const setGameVisibility = (visible) => game_container.setAttribute('enabled', visible);

function setTopInstruction(instruction) {
    const topInstruction = document.querySelector('#topInstructionText');
    topInstruction.innerHTML = instruction;
}

function processServerResponse(data) {
    // For now use mock data
    if (false)
    data = {
        success: true,
        message: {
            robot_selected_image: 10156,
            candidates: [
                10156,
                1643,
                4977,
                703,
                1233,
                6292,
                1754,
                4475,
                1652,
                4094
            ],
            n_players_questions: 1,//2,
            n_robot_questions: 2,
            userQuestions: [
                {
                    question: {
                        type: "object",
                        content: "chien"
                    },
                    answers: [0.132, 0.0, 0.0, 0.1, 0.3, 0.0, 0.2, 0.0, 0.2, 0.9], // cosine similarities * ico (if ico available)
                },
                {
                    question: {
                        type: "object",
                        content: "chat"
                    },
                    answers: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0], // cosine similarities * ico (if ico available)
                },
                {
                    question: {
                        type: "color",
                        content: "noir et blanc"
                    },
                    answers: [0.54, 0.0, 0.0, 0.1, 0.3, 0.0, 0.2, 0.0, 0.2, 0.9], // cosine similarities * ico (if ico available)
                },
                {
                    question: {
                        type: "luminosity",
                        content: "sombre"
                    },
                    answers: [0.11, 0.0, 0.0, 0.1, 0.3, 0.0, 0.2, 0.0, 0.2, 0.9], // cosine similarities * ico (if ico available)
                },
                {
                    question: {
                        type: "object",
                        content: "oiseau"
                    },
                    answers: [0.132, 0.0, 0.0, 0.1, 0.3, 0.0, 0.2, 0.0, 0.2, 0.9], // cosine similarities * ico (if ico available)
                },
            ],
            "robotQuestions": [
                {
                    question: {
                        type: "object",
                        content: "chien"
                    },
                    answers: [0.132, 0.0, 0.0, 0.1, 0.3, 0.0, 0.2, 0.0, 0.2, 0.9], // cosine similarities * ico (if ico available)
                },
                {
                    question: {
                        type: "object",
                        content: "chat"
                    },
                    answers: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0], // cosine similarities * ico (if ico available)
                },
            ]
        }
    }

    success = data.success;
    if(success){
        message = data.message;

        robot_selected_image = message.robot_selected_image;
        candidates = message.candidates;
        n_players_questions = message.n_players_questions;
        n_robot_questions = message.n_robot_questions;
        userQuestions = message.userQuestions;
        robotQuestions = message.robotQuestions;

        question_index = 0;
        user_answers = [];

        // Clear candidates
        clearCandidates();

        // Append candidates
        let rows = Array.from(candidates_rows);
        candidates.forEach((candidate, index) => {
            // Find the candidate container row that has less than 5 candidates
            if (index < 5) {
                appendCandidate(rows[0], candidate);
            } else {
                appendCandidate(rows[1], candidate);
            }
        });
            
        // Hide the loader
        setLoader({
            enabled: false,
            title: "",
            message: "",
        });

        setMenuVisibility(false);
        setGameVisibility(true);

    } else {
        handleError(data.error);
    }
}

function clearResultScreen() {
    result_userGuess.innerHTML = '';
    result_trueRobot.innerHTML = '';
    result_robotGuess.innerHTML = '';
    result_trueUser.innerHTML = '';
}

function reset() {
    document.querySelector("#gotoNextQuestion").innerHTML = "Passer à la question suivante";

    game_container.setAttribute('guessing', 'false');

    robot_selected_image = null;
    candidates = [];

    userQuestions = [];
    robotQuestions = [];

    questionsThatUserAsked = [];
    questionsThatRobotAsked = [];

    question_index = 0;
    user_answers = [];

    waiting_for_user_guess = false;
    selectedCardRecordID = null;
    playerOdd = true; // true if the player played first, false if the robot played first

    clearCandidates();
    clearQuestions();

    setTopInstruction("Veuillez selectionner votre carte secrete !");
    game_container.setAttribute('context', 'userselectingcard');
    game_container.setAttribute('blurred', 'false');
    game_container.setAttribute('selectcards', 'true');
    result_container.setAttribute('enabled', "false");
    result_container.setAttribute('userCorrectGuess', "false");
    result_container.setAttribute('robotCorrectGuess', "false");
    result_container.setAttribute('result', "lose");

    clearResultScreen();

}

function create_game() {
    // Show a loader
    setLoader({
        enabled: true,
        title: "Creation de la partie...",
        message: "Veuillez patienter nous trouvons préparons la partie !",
    });

    // reset the game
    reset();
    
    // Ask server to start game
    fetch('http://127.0.0.1:5000/api/dixit/create_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            difficulty: getSelectedDifficulty(),
        }),
    })
    .then(response => response.json())
    .then(data => processServerResponse(data))
    .catch(error => {
        // Debug for now
        handleError(error);
    });
}

// Listeners
document.addEventListener('DOMContentLoaded', () => {
    //
});
start_game.addEventListener('click', create_game);
Array.from(difficulty_levels_container.children).forEach((child, index) => {
    child.addEventListener('click', () => {
        Array.from(difficulty_levels_container.children).forEach((child) => {
            child.setAttribute('selected', 'false');
        });
        child.setAttribute('selected', 'true');
    });
});
document.querySelector("#gotoNextQuestion").addEventListener('click', launchRound);
Array.from(user_answers_container.querySelectorAll('.userAnswer')).forEach((answer) => {
    const index = parseInt(answer.getAttribute('index'));
    answer.addEventListener('click', () => {
        sendAnswerToRobot(index_to_power[index]);
    });
});
document.querySelector("#playAgain").addEventListener('click', () => {
    create_game();
});
document.querySelector("#changeDifficulty").addEventListener('click', () => {
    setMenuVisibility(true);
    setGameVisibility(false);
});
document.querySelector("#close_larger").addEventListener('click', () => {
    larger_container.setAttribute('enabled', 'false');
});