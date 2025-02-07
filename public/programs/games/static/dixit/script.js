const candidates_container          = document.querySelector('#candidates');
const candidates_rows               = candidates_container.querySelectorAll('.row');

const start_game                    = document.querySelector('#start_game');

const difficulty_levels_container   = document.querySelector('#difficulty_levels');

const loader_container              = document.querySelector('#loader_container');
const loader_title                  = document.querySelector('#loader_title');
const loader_message                = document.querySelector('#loader_message');

const menu_container                = document.querySelector('#menu_container');
const game_container                = document.querySelector('#game_container');
const user_answers_container        = document.querySelector('#user_answers');
const result_container              = document.querySelector('#result_container');
const larger_container              = document.querySelector('#larger_container');
const counters_container            = document.querySelector('#counters_container');

const result_userGuess              = document.querySelector(".resultSplit[side='user'] #guess");
const result_trueRobot              = document.querySelector(".resultSplit[side='user'] #correct");
const result_robotGuess             = document.querySelector(".resultSplit[side='robot'] #guess");
const result_trueUser               = document.querySelector(".resultSplit[side='robot'] #correct");


// Game variables
let candidates = [];
let robot_selected_image = null;
let index_robot_selected_image = null;
let n_players_questions = 0;
let n_robot_questions = 0;
let user_questions = [];
let robot_questions = [];
let questionsThatUserAsked = [];
let questionsThatRobotAsked = [];
let question_index = 0;

let user_questions_index = 0;
let robot_questions_index = 0;

let waiting_for_user_guess = false;
let selectedCardRecordID = null;
let playerOdd = true; // true if the player played first, false if the robot played first

const index_to_power = [-1.0, -0.5, 0.0, 0.5, 1.0]

const ROBOT_THINKING_TIME = 500;
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
    // Increase the question index (the robot received an answer)
    updateCounters();
    // Add the answer to the list of answers
    const lastQuestionThatRobotAsked = questionsThatRobotAsked[questionsThatRobotAsked.length - 1];
    lastQuestionThatRobotAsked["user_answer"] = power;
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

function updateCounters() {
    const userQuestionsCounter = counters_container.querySelector(".counter#user #done");
    const robotQuestionsCounter = counters_container.querySelector(".counter#robot #done");

    userQuestionsCounter.innerHTML = questionsThatUserAsked.length;
    robotQuestionsCounter.innerHTML = questionsThatRobotAsked.length;
}

function depr__getRobotGuess() {
    const scores = Array.from(Array(candidates.length).keys()).map(() => 0);
    questionsThatRobotAsked.forEach((questionData, answerIndex) => {
        const power = questionData["user_answer"];
        const similarities = questionData["cosine_similarities"];
        console.log(power, similarities);
        candidates.forEach((candidate, candidateIndex) => {
            scores[candidateIndex] += similarities[candidateIndex] * power;
        });
    });

    // Get the index of the candidate with the highest score
    const maxScore = Math.max(...scores);
    const maxScoreIndex = scores.indexOf(maxScore);

    return candidates[maxScoreIndex];
}

function getRobotGuess(callback) {
    fetch('http://127.0.0.1:5000/api/dixit/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            candidates: candidates,
            questions: questionsThatRobotAsked
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            callback(data.message.guess);
        } else {
            handleError(data.error);
            callback(null);
        }
    })
    .catch((error) => {
        handleError(error);
        callback(null);
    });
}


function loadRobotIndice() {
    const questionData = user_questions[user_questions_index];
    // Increase the question index (the user asked a question)
    question_index += 1;
    user_questions_index += 1;

    // Add the question to the list of questions that the user asked
    questionsThatUserAsked.push(questionData);
    updateCounters();

    setRobotThinking(true);
    game_container.setAttribute('context', 'robotanswering');

    // Get the robot answer
    const answerForQuestion = questionData["answers_iconography"][index_robot_selected_image];
    const robotAnswer = answerForQuestion == 1;

    // Add a timeout to simulate the robot thinking
    setTimeout(() => {
        // Add the answer
        setRobotAnswer(robotAnswer, questionData);
        setRobotThinking(false);
    }, ROBOT_THINKING_TIME);
}


function endgame(userGuess) {
    getRobotGuess((robotGuess) => {
        const isUserRight   = userGuess == robot_selected_image;
        const isRobotRight  = robotGuess == selectedCardRecordID;
    
        // Append the cards in the result screen
        appendCandidate(result_userGuess, userGuess, false);
        appendCandidate(result_trueRobot, robot_selected_image, false);
        appendCandidate(result_robotGuess, robotGuess, false);
        appendCandidate(result_trueUser, selectedCardRecordID, false);
    
        // Show the result screen
        let result = 0; // 0=lose, 1=draw, 2=win
        let result_text = "";
        if ((isUserRight && isRobotRight) || (!isUserRight && !isRobotRight)) {
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
    
        document.querySelector("#resultTitle").innerHTML = resultTitle;
        document.querySelector(".resultSplit[side='user'] h2").innerHTML = userResult;
        document.querySelector(".resultSplit[side='robot'] h2").innerHTML = robotResult;
    
        game_container.setAttribute('blurred', 'true');
        result_container.setAttribute('enabled', true);
        result_container.setAttribute('userCorrectGuess', isUserRight);
        result_container.setAttribute('robotCorrectGuess', isRobotRight);
        result_container.setAttribute('result', result_text);
    
        console.log("User question: ");
        questionsThatUserAsked.forEach((questionData) => {
            const term = questionData["content"];
            const answer = questionData["answers_iconography"][index_robot_selected_image]==1;
            console.log(term, ":", answer);
        });
    
        console.log("Robot question: ");
        questionsThatRobotAsked.forEach((questionData) => {
            const term = questionData["content"];
            const answer = questionData["user_answer"];
            console.log(term, ":", answer);
        });
    });
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
    type = questionData["type"];
    content = questionData["content"];

    if (type == "object") {
        return `Est-ce que votre image contient un(e) <b>${content}</b> ?`;
    } else if (type == "colors") {
        return `Est-ce que votre image est de couleur: <b>${content}</b> ?`;
    } else if (type == "luminosities") {
        return `Est-ce que votre image est de luminosité: <b>${content}</b> ?`;
    } else if (type == "types") {
        return `Est-ce que votre image est un(e) <b>${content}</b> ?`;
    } else {
        return type + " " + content;
    }
}

function setRobotQuestion(questionData) {
    game_container.querySelector(".box[context='userselectinganswer'] .messageBubble p").innerHTML = getQuestionText(questionData);
}

function loadRobotQuestions() {
    setRobotThinking(true);
    game_container.setAttribute('context', 'userselectinganswer');

    // Get the robot question
    const questionData = robot_questions[robot_questions_index];

    // Add the question to the list of questions that the robot asked
    questionsThatRobotAsked.push(questionData);

    // Increase the question index (the robot asked a question)
    question_index += 1;
    robot_questions_index += 1;

    // Add a timeout to simulate the robot thinking
    setTimeout(() => {
        // Add the question
        setRobotQuestion(questionData);
        setRobotThinking(false);
    }, ROBOT_THINKING_TIME);
}

function getAnswerText(answer, questionData) {
    type = questionData["type"];
    content = questionData["content"];
    if (answer) {
        return `Mon image contient un(e) <b>${content}</b> !`;
    } else {
        return `Mon image ne contient pas de <b>${content}</b> !`;
    }
}

function setRobotAnswer(answer, questionData) {
    game_container.querySelector(".box[context='robotanswering'] .messageBubble p").innerHTML = getAnswerText(answer, questionData);
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
        playerOdd = Math.random() < 0.5;
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
        if (n_players_questions - questionsThatUserAsked.length == 0) {
            isPlayerTurn = false;
        }
    } else {
        // Check if the robot still has questions
        if (n_robot_questions - questionsThatRobotAsked.length == 0) {
            isPlayerTurn = true;
        }
    }

    document.querySelector("#gotoNextQuestion").innerHTML = isLastQuestion ? "Devinez la carte" : "Passer à la question suivante";

    if (isPlayerTurn) {
        setTopInstruction("Le robot vous donne un indice !");
        loadRobotIndice();
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
    recordID,
    interactive
) {
    const card = document.createElement('div');
    card.classList.add('candidate');
    card.setAttribute('recordid', recordID);
    card.setAttribute('interactive', interactive ? 'true' : 'false');

    const cardContent = document.createElement('div');
    cardContent.classList.add('cardContent');

    const imageContainer = document.createElement('div');
    imageContainer.classList.add('imageContainer');

    const image = document.createElement('img');
    image.src = 'http://127.0.0.1:5000/images/' + recordID;
    imageContainer.appendChild(image);
    if (interactive) {
        imageContainer.onclick = () => clickOnCard(recordID);
    }

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
    return selected_difficulty - 1;
}

const setMenuVisibility = (visible) => menu_container.setAttribute('enabled', visible);
const setGameVisibility = (visible) => game_container.setAttribute('enabled', visible);

function setTopInstruction(instruction) {
    const topInstruction = document.querySelector('#topInstructionText');
    topInstruction.innerHTML = instruction;
}

function processServerResponse(data) {
    success = data.success;
    if(success){
        message = data.message;

        /*
        {
            "candidates": List<Int>,
            "n_players_questions": 9,
            "n_robot_questions": 3,
            "robot_questions": [
                {
                    "answers_iconography": List<Int> (0/1),
                    "content": "aile",
                    "cosine_similarities": List<Float>,
                    "robot_can_ask": true,
                    "robot_score": 0.8888888888888888,
                    "score": 0.16000000000000003,
                    "type": "object",
                    "user_can_ask": true
                },
            ],
            "robot_selected_image": 6124,
            "user_questions": [
                {
                    "answers_iconography": List<Int> (0/1),
                    "content": "femme",
                    "cosine_similarities": List<Float>,
                    "robot_can_ask": true,
                    "robot_score": 0.4444444444444444,
                    "score": 0.24,
                    "type": "object",
                    "user_can_ask": true
                },
                ...
            ]
        }
        */
        candidates = message.candidates;
        robot_selected_image = message.robot_selected_image;
        index_robot_selected_image = candidates.indexOf(robot_selected_image);
        n_players_questions = message.n_players_questions;
        n_robot_questions = message.n_robot_questions;
        robot_questions = message.robot_questions;
        user_questions = message.user_questions;

        question_index = 0;
        user_questions_index = 0;
        robot_questions_index = 0;

        // Clear candidates
        clearCandidates();

        // Update the counters
        const userTot = counters_container.querySelector(".counter#user #tot");
        const robotTot = counters_container.querySelector(".counter#robot #tot");

        userTot.innerHTML = n_players_questions;
        robotTot.innerHTML = n_robot_questions;

        updateCounters();

        // Append candidates
        let rows = Array.from(candidates_rows);
        candidates.forEach((candidate, index) => {
            // Find the candidate container row that has less than 5 candidates
            if (index < 5) {
                appendCandidate(rows[0], candidate, true);
            } else {
                appendCandidate(rows[1], candidate, true);
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

    candidates = [];
    robot_selected_image = null;
    index_robot_selected_image = null;
    n_players_questions = 0;
    n_robot_questions = 0;
    user_questions = [];
    robot_questions = [];
    questionsThatUserAsked = [];
    questionsThatRobotAsked = [];

    question_index = 0;

    waiting_for_user_guess = false;
    selectedCardRecordID = null;
    playerOdd = true; // true if the player played first, false if the robot played first

    clearCandidates();

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
    result_container.setAttribute('enabled', false);
    setMenuVisibility(true);
    setGameVisibility(false);
});
document.querySelector("#close_larger").addEventListener('click', () => {
    larger_container.setAttribute('enabled', 'false');
});