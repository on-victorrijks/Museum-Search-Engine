const input_setName = document.querySelector('#setName');

const info_image = document.querySelector('#image');

const focusIcon_src = document.querySelector('#focusIcon_src');
const focusText = document.querySelector('#focusText');

const save_button = document.querySelector('#saveButton');

const info_out = document.querySelector('#info_out');

const completedText = document.querySelector('#completed');
const totalText = document.querySelector('#total');
const percentageText = document.querySelector('#percentage');

let currentData = undefined;

function getFocusText(focus){
    switch(focus){
        case 'content':
            return 'The objects present in the image such as people, animals, furniture, etc.';
        case 'emotion':
            return 'The emotions or feelings that the image conveys such as happiness, sadness, anger, etc.';
        case 'colors':
            return 'The tint of the images, the vividness of the colors, etc.';
        case 'luminosity':
            return 'The brightness or darkness of the image.';
        default:
            return 'An error occurred';
    }
}

function getFocusImage(focus){
    switch(focus){
        case 'content':
            return './static/assets/icon_objects.png';
        case 'emotion':
            return './static/assets/icon_emotions.png';
        case 'colors':
            return './static/assets/icon_colors.png';
        case 'luminosity':
            return './static/assets/icon_luminosity.png';
        default:
            return '';
    }
}

function hideAllForms(){
    ["content", "emotion", "colors", "luminosity"].forEach(name => {
        document.querySelector('#form_' + name).style.display = 'none';
    });
}

function unselectAllValues(){
    // Content
    document.querySelector('#caption').value = '';

    // Emotion
    Array.from(document.querySelector('.emotions').children).forEach(div => {
        div.setAttribute('isSelected', 'false');
    });

    // Colors
    Array.from(document.querySelector('.colors').children).forEach(div => {
        div.setAttribute('isSelected', 'false');
    });

    // Luminosity
    Array.from(document.querySelector('.luminosities').children).forEach(div => {
        div.setAttribute('isSelected', 'false');
    });
}

function showForm(focus){
    document.querySelector('#form_' + focus).setAttribute('style', 'display: block;');
}

function updateFocus(focus){
    const text = getFocusText(focus);
    const image = getFocusImage(focus);

    // Update explanation
    focusIcon_src.src = image;
    focusText.innerHTML = text;

    // Show correct form
    hideAllForms();
    unselectAllValues();
    showForm(focus);
}

function updateInfos(infos){
    total = infos.total;
    completed = infos.completed;

    completedText.innerHTML = completed;
    totalText.innerHTML = total;
    percentageText.innerHTML = Math.round(completed / total * 100, 3);
    

    ["colors", "content", "emotion", "luminosity"].forEach(name => {
        const completed = infos.completed_per_focus[name];
        const total = infos.total_per_focus[name];

        const stringToDisplay = completed + ' / ' + total;

        document.querySelector('#info_' + name).innerHTML = stringToDisplay;
    });
}

function fetchTask(){
    fetch('http://127.0.0.1:5000/api/get_task/' + input_setName.value)
    .then(response => response.json())
    .then(data => {
        success = data.success;
        if(success){

            currentData = data.content;

            info_image.src = 'http://127.0.0.1:5000/images/' + data.content.recordID;
            
            updateFocus(data.content.focus);
            updateInfos(data.infos);
        } else {
            info_out.innerHTML = data.message;
        }
    });
}

const focus_to_parent_div = {
    'content': '.content',
    'emotion': '.emotions',
    'colors': '.colors',
    'luminosity': '.luminosities'
};

function get_data_from_form(focus){
    if (focus === 'content'){
        return {
            caption: document.querySelector('#caption').value
        };
    } else {
        const selected = [];
        Array.from(document.querySelector(focus_to_parent_div[focus]).children).forEach(div => {
            if(div.getAttribute('isselected') === 'true'){
                let h3_text = div.querySelector('h3').innerHTML;
                selected.push(h3_text);
            }
        });
        if (selected.length === 0){
            return {
                caption: 'Neutre'
            };
        }

        return {
            caption: selected.join(', ')
        };
    }
}


function sendCaption(){
    // POST to /api/send_caption/<string:setName>
    const caption = get_data_from_form(currentData.focus);
    console.log(caption);
    fetch('http://127.0.0.1:5000/api/send_caption/' + input_setName.value, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...currentData,
            ...caption
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

    // Content
    // Nothing to do

    // Emotion
    Array.from(document.querySelector('.emotions').children).forEach(div => {
        div.addEventListener('click', function(){
            const isSelected = div.getAttribute('isSelected');
            div.setAttribute('isSelected', isSelected === 'true' ? 'false' : 'true');
        });
    });

    // Colors
    Array.from(document.querySelector('.colors').children).forEach(div => {
        div.addEventListener('click', function(){
            const isSelected = div.getAttribute('isSelected');
            div.setAttribute('isSelected', isSelected === 'true' ? 'false' : 'true');
        });
    });

    // Luminosity
    Array.from(document.querySelector('.luminosities').children).forEach(div => {
        div.addEventListener('click', function(){
            const isSelected = div.getAttribute('isSelected');
            div.setAttribute('isSelected', isSelected === 'true' ? 'false' : 'true');
        });
    });

    fetchTask();

});

input_setName.addEventListener('change', function(){
    fetchTask();
});

save_button.addEventListener('click', function(){
    sendCaption();
});