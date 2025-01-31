const candidates_container = document.querySelector('#candidates');
const start_game = document.querySelector('#start_game');

const question_text = document.querySelector('#question');
const answers_container = document.querySelector('#answers');

const difficulty_levels_container = document.querySelector('#difficulty_levels');

// Game variables
let candidates = [];
let answers = [];
let objects = [];
let sims = [];
let question_index = 0;
let user_answers = [];
//

function handleError(error) {
    console.error(error);
}

function editCandidateRanking(recordID, ranking) {
    const candidate = candidates_container.querySelector(`.candidate[recordid="${recordID}"]`);
    const ranking_div = candidate.querySelector('.ranking');
    const ranking_text = ranking_div.querySelector('h3');
    ranking_text.innerHTML = ranking;
}

function appendCandidate(recordID) {
    const div = document.createElement('div');
    div.classList.add('candidate');
    div.setAttribute('recordid', recordID);

    const image = document.createElement('img');
    image.src = 'http://127.0.0.1:5000/images/' + recordID;
    div.appendChild(image);

    const ranking = document.createElement('div');
    ranking.classList.add('ranking');
    const ranking_text = document.createElement('h3');
    ranking_text.innerHTML = '?';
    ranking.appendChild(ranking_text);
    div.appendChild(ranking);

    candidates_container.appendChild(div);
}

function clearCandidates() {
    candidates_container.innerHTML = '';
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

/*
def get_scoring(N_answered):
    # Compute the score of each candidate
    scores = np.zeros(N_candidates)

    for objectIndex in range(N_answered):
        for candidateIndex in range(N_candidates):
            user_answer = user_answers[objectIndex]
            sim = sims[objectIndex, candidateIndex]
            ico_answer = answers[objectIndex, candidateIndex]
            score = user_answer * sim * ico_answer
            scores[candidateIndex] += score
    
    # Order the candidates by score
    order = np.argsort(scores)[::-1]

    return order, scores
*/
function computeScore() {
    if (user_answers.length==0) {
        return {
            order: Array.from({length: candidates.length}, (_, index) => index),
            scores: Array.from({length: candidates.length}, () => 0),
        };
    }

    let score_per_candidate = Array.from({length: candidates.length}, () => 0);
    
    for (let objectIndex = 0; objectIndex < user_answers.length; objectIndex++) {
        for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
            const user_answer = user_answers[objectIndex];
            const sim = sims[objectIndex][candidateIndex]; // inverse ?
            const ico_answer = answers[objectIndex][candidateIndex];
            const score = user_answer * sim * ico_answer;
            score_per_candidate[candidateIndex] += score;
        }
    }

    // Order the candidates by score
    const order = score_per_candidate.map((value, index) => index).sort((a, b) => score_per_candidate[b] - score_per_candidate[a]);

    // Update the ranking
    order.forEach((candidateIndex, ranking) => {
        let recordID = candidates[candidateIndex];
        editCandidateRanking(recordID, ranking + 1);
    });

    return {
        order: order,
        scores: score_per_candidate,
    };
}

function ask_question() {
    if (question_index > answers.length) {
        return;
    }

    const {order, scores} = computeScore();

    if (question_index == answers.length) {
        // We guess !
        const guessed_candidate = order[0];
        const guessed_candidate_recordID = candidates[guessed_candidate];
        // Add the winner candidate the winner attribute
        const candidate = candidates_container.querySelector(`.candidate[recordid="${guessed_candidate_recordID}"]`);
        candidate.setAttribute('winner', 'true');
    } else {
        // We ask a question
        question_text.innerHTML = objects[question_index];
    }
}

function create_game() {
    // Ask server to start game
    fetch('http://127.0.0.1:5000/api/dixit/create_game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            difficulty: getSelectedDifficulty(),
        }),
    }).then(response => response.json()).then(data => {
        success = data.success;
        if(success){
            message = data.message;

            candidates = message.candidates;
            answers = message.answers;
            objects = message.objects;
            sims = message.sims;
            question_index = 0;
            user_answers = [];

            // Clear candidates
            clearCandidates();

            // Append candidates
            candidates.forEach((candidate) => {
                appendCandidate(candidate);
            });

            // Ask the first question
            ask_question();
                
        } else {
            handleError(data.error);
        }
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
Array.from(answers_container.children).forEach((child, index) => {
    child.addEventListener('click', () => {
        // Get the attribute power
        const power = child.getAttribute('power');
        // Convert to float
        const power_float = parseFloat(power);
        user_answers.push(power_float);
        question_index++;
        ask_question();
    });
});