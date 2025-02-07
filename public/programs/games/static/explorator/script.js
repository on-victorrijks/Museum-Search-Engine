const explorator = document.querySelector('.explorator');
const instruction = document.querySelector('#instruction');

let firstRecordID = null;
let secondRecordID = null;

function setInstruction(text) {
    instruction.textContent = text;
}

function setContext(context) {
    document.querySelector('.container').setAttribute('context', context);
}

function clearImages() {
    const images = explorator.querySelectorAll('.image');
    images.forEach(image => image.remove());
}

function clearSlideshow() {
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => slide.remove());
}

function selectAsFirstImage(recordID) {
    firstRecordID = recordID;
    setInstruction('Veuillez choisir la deuxième image');
    getImages(recordID);
}

function selectAsSecondImage(recordID) {
    secondRecordID = recordID;
    getPath();
}

function addStop(entry) {
    const recordID = entry.recordID;
    const firstName = entry["creator.firstNameCreator"];
    const lastName = entry["creator.lastNameCreator"];
    const title = entry["objectWork.titleText"];

    const imageURL = `http://127.0.0.1:5000/images/${recordID}`;
    addSlideToSlideshow(imageURL, firstName, lastName, title);
}

function getPath() {
    fetch('http://127.0.0.1:5000/api/explorator/interpolate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            recordID1: firstRecordID,
            recordID2: secondRecordID,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            clearSlideshow();
            data.message.entries.forEach(entry => {
                addStop(entry)
            });
            setContext('slideshow')
        } else {
            console.error("Error:", data.error);
        }
    })
    .catch(console.error);
}

function addImage(recordID, fromRecordID) {
    const imageDiv = document.createElement('div');
    imageDiv.classList.add('image');

    const image = document.createElement('img');
    image.src = `http://127.0.0.1:5000/images/${recordID}`;

    if (fromRecordID==null) {
        // First image
        imageDiv.onclick = () => selectAsFirstImage(recordID);
    } else {
        // Second image
        imageDiv.onclick = () => selectAsSecondImage(recordID);
    }


    imageDiv.appendChild(image);

    explorator.appendChild(imageDiv);
}

function reset() {
    firstRecordID = null;
    secondRecordID = null;
    clearImages();
    setInstruction('');
    setContext('form');
    clearSlideshow();
}

function startExplorator() {
    setInstruction('Veuillez choisir la première image');
    getImages();
}

function getImages(fromRecordID=null) {
    fetch('http://127.0.0.1:5000/api/explorator/getImages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            fromRecordID: -1,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            clearImages();
            data.message.recordIDs.forEach(recordID => addImage(recordID, fromRecordID));
        } else {
            console.error("Error:", data.error);
        }
    })
    .catch(console.error);
}


// Slideshow START
(function() {
    let currentIndex = 0;
  
    // Show the slide at the given index (wraps around automatically)
    function showSlide(index) {
        const slides = document.querySelectorAll('.slideshow .slide');
        if (slides.length === 0) return;

        const willUserBeAbleToGoBack = index > 0;
        if (!willUserBeAbleToGoBack) {
            document.querySelector('.slideshow .arrow.left').classList.add('disabled');
        } else {
            document.querySelector('.slideshow .arrow.left').classList.remove('disabled');
        }
        const willUserBeAbleToGoForward = index < slides.length - 1;
        if (!willUserBeAbleToGoForward) {
            document.querySelector('.slideshow .arrow.right').classList.add('disabled');
        } else {
            document.querySelector('.slideshow .arrow.right').classList.remove('disabled');
        }
    
        slides.forEach((slide, i) => {
            if (i === index) {
            slide.classList.add('active');
            } else {
            slide.classList.remove('active');
            }
        });
        currentIndex = index;
    }
  
    // Move to the next slide
    function nextSlide() {
      showSlide(currentIndex + 1);
    }
  
    // Move to the previous slide
    function previousSlide() {
      showSlide(currentIndex - 1);
    }
  
    // Attach click events to the arrow controls
    document.querySelector('.slideshow .arrow.left').addEventListener('click', previousSlide);
    document.querySelector('.slideshow .arrow.right').addEventListener('click', nextSlide);
  
    // Expose a function to add a new slide dynamically.
    // Usage: addSlideToSlideshow('newImage.jpg', 'Optional alt text');
    window.addSlideToSlideshow = function(imageUrl, firstName, lastName, title) {
        const isOnlySlide = document.querySelectorAll('.slideshow .slide').length === 0;
        const slide = document.createElement('div');
        slide.className = 'slide';
        if (isOnlySlide) {
            slide.classList.add('active');
            document.querySelector('.slideshow .arrow.left').classList.add('disabled');
            document.querySelector('.slideshow .arrow.right').classList.add('disabled');
        } else {
            document.querySelector('.slideshow .arrow.right').classList.remove('disabled');
        }
        const img = document.createElement('img');
        img.src = imageUrl;

        const caption = document.createElement('div');
        caption.className = 'caption';
        
        const creator = document.createElement('h3');
        creator.textContent = `${firstName} ${lastName}`;
        caption.appendChild(creator);

        const titleText = document.createElement('h2');
        titleText.textContent = title;
        caption.appendChild(titleText);

        slide.appendChild(caption);

        slide.appendChild(img);

        document.querySelector('.slideshow .slides').appendChild(slide);
    };
  
    // Optionally, expose the navigation functions if needed:
    window.nextSlide = nextSlide;
    window.previousSlide = previousSlide;
  })();
  
// Slideshow END

document.addEventListener('DOMContentLoaded', function() {
    reset();
    startExplorator();
});