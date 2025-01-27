const input_setName = document.querySelector('#setName');
const input_caption = document.querySelector('#caption');

const info_image = document.querySelector('#image');

const focusIcon_src = document.querySelector('#focusIcon_src');
const focusText = document.querySelector('#focusText');

const save_button = document.querySelector('#saveButton');

const info_out = document.querySelector('#info_out');

const completedText = document.querySelector('#completed');
const totalText = document.querySelector('#total');

let currentData = undefined;

function resetInputs(){
    input_caption.value = '';
}

function getFocusText(focus){
    switch(focus){
        case 'content':
            return 'The objects present in the image such as people, animals, furniture, etc.';
        case 'emotion':
            return 'The emotions or feelings that the image conveys such as happiness, sadness, anger, etc.';
        case 'colors':
            return 'The colors present in the image and the brightness or darkness of the image.';
        default:
            return 'An error occurred';
    }
}

function getFocusImage(focus){
    switch(focus){
        case 'content':
            return 'assets/icon_objects.png';
        case 'emotion':
            return 'assets/icon_emotions.png';
        case 'colors':
            return 'assets/icon_colors.png';
        default:
            return '';
    }
}

function updateFocus(focus){
    const text = getFocusText(focus);
    const image = getFocusImage(focus);

    focusIcon_src.src = image;
    focusText.innerHTML = text;
}

function fetchTask(){
    fetch('http://127.0.0.1:5000/api/get_task/' + input_setName.value)
    .then(response => response.json())
    .then(data => {
        success = data.success;
        if(success){

            resetInputs();

            currentData = data.content;

            info_image.src = 'http://127.0.0.1:5000/images/' + data.content.recordID;
            
            updateFocus(data.content.focus);

            infos = data.infos;
            total = infos.total;
            completed = infos.completed;

            completedText.innerHTML = completed;
            totalText.innerHTML = total;

        } else {
            info_out.innerHTML = data.message;
        }
    });
}

function sendCaption(){
    // POST to /api/send_caption/<string:setName>
    fetch('http://127.0.0.1:5000/api/send_caption/' + input_setName.value, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...currentData,
            caption: input_caption.value
        })
    }).then(response => response.json()).then(data => {
        success = data.success;
        if(!success){
            info_out.innerHTML = data.message;
        } else {
            fetchTask();
        }
    });
}

document.addEventListener('DOMContentLoaded', function(){
    fetchTask();
});

input_setName.addEventListener('change', function(){
    fetchTask();
});

save_button.addEventListener('click', function(){
    sendCaption();
});