document.addEventListener('DOMContentLoaded', () => {
    loadHighlightColor();
    addHighlightColorChangeListener();
    addButtonEventListeners();
    displayStoredAnnotations();
    addSearchButtonEventListener();
});

function loadHighlightColor() {
    chrome.storage.sync.get('highlightColor', (data) => {
        const color = data.highlightColor || '#03daf6'; // Default color
        document.getElementById('highlightColor').value = color;
    });
}

function addHighlightColorChangeListener() {
    document.getElementById('highlightColor').addEventListener('change', (event) => {
        chrome.storage.sync.set({ highlightColor: event.target.value });
    });
}

function addButtonEventListeners() {
    document.getElementById('highlightBtn').addEventListener('click', () => {
        sendMessageToCurrentTab('highlight');
    });

    document.getElementById('noteBtn').addEventListener('click', () => {
        sendMessageToCurrentTab('addNote');
    });
}

function sendMessageToCurrentTab(action) {
    chrome.storage.sync.get('highlightColor', (data) => {
        const color = data.highlightColor || '#03daf6'; // Default color
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: action, color: color });
        });
    });
}

function displayStoredAnnotations() {
    chrome.storage.sync.get({ annotations: [] }, (data) => {
        const annotations = data.annotations;
        const groupedAnnotations = groupAnnotationsByDate(annotations);
        displayAnnotations(groupedAnnotations);
    });
}

function groupAnnotationsByDate(annotations) {
    const grouped = {};
    annotations.forEach(annotation => {
        const date = new Date(annotation.timestamp).toLocaleDateString();
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(annotation);
    });

    for (const date in grouped) {
        grouped[date].sort((a, b) => b.timestamp - a.timestamp);
    }

    return grouped;
}

function displayAnnotations(groupedAnnotations) {
    const annotationList = document.getElementById('annotationList');
    annotationList.innerHTML = ''; 

    const dates = Object.keys(groupedAnnotations).sort((a, b) => new Date(b) - new Date(a));

    dates.forEach(date => {
        const dateHeader = document.createElement('li');
        dateHeader.textContent = date;
        dateHeader.style.fontWeight = 'bold';
        dateHeader.style.color = '#CBCED8';
        annotationList.appendChild(dateHeader);

        const annotations = groupedAnnotations[date];
        const rannotations = annotations.slice().reverse();

        if (rannotations.length > 3) {
            const recentAnnotations = rannotations.slice(-3).reverse();
            recentAnnotations.forEach(annotation => {
                const li = document.createElement('li');
                li.style.color = annotation.color;
                if (annotation.type == 'note') {
                    li.textContent = `${annotation.select} : ${annotation.text} (${new URL(annotation.url).hostname})`;
                }
                else {
                    li.textContent = `${annotation.text} (${new URL(annotation.url).hostname})`;
                }
                const deleteIcon = document.createElement('span');
                deleteIcon.textContent = ' \u2716';
                deleteIcon.style.color = 'red';
                deleteIcon.style.cursor = 'pointer';
                deleteIcon.style.marginLeft = '5px';
                deleteIcon.addEventListener('click', () => {
                    deleteAnnotation(annotation);
                });
                li.appendChild(deleteIcon);
                annotationList.appendChild(li);
            });
            const moreLi = document.createElement('li');
            moreLi.textContent = '...more';
            moreLi.classList.add('more-item');
            moreLi.addEventListener('click', () => {
                displayAllAnnotations(annotations);
            });
            annotationList.appendChild(moreLi);
        } else {
            const reversedAnnotations = rannotations.slice().reverse();
            reversedAnnotations.forEach(annotation => {
                const li = document.createElement('li');
                li.style.color = annotation.color;
                if (annotation.type == 'note') {
                    li.textContent = `${annotation.select}: ${annotation.text} (${new URL(annotation.url).hostname})`;
                }
                else {
                    li.textContent = `${annotation.text} (${new URL(annotation.url).hostname})`;
                }
                const deleteIcon = document.createElement('span');
                deleteIcon.textContent = ' \u2716';
                deleteIcon.style.color = 'red';
                deleteIcon.style.cursor = 'pointer';
                deleteIcon.style.marginLeft = '5px';
                deleteIcon.addEventListener('click', () => {
                    deleteAnnotation(annotation);
                });
                li.appendChild(deleteIcon);
                annotationList.appendChild(li);
            });
        }
    });
}

function displayAllAnnotations(annotations) {
    const annotationList = document.getElementById('annotationList');
    annotationList.innerHTML = ''; 

    const date = new Date(annotations[0].timestamp).toLocaleDateString();
    const dateHeader = document.createElement('li');
    dateHeader.textContent = date;
    dateHeader.style.fontWeight = 'bold';
    dateHeader.style.color = '#CBCED8';
    annotationList.appendChild(dateHeader);

    annotations.forEach(annotation => {
        const li = document.createElement('li');
        li.style.color = annotation.color;
        if (annotation.type === 'note') {
            li.textContent = `${annotation.select}: ${annotation.text} (${new URL(annotation.url).hostname})`;
        } else {
            li.textContent = `${annotation.text} (${new URL(annotation.url).hostname})`;
        }
        const deleteIcon = document.createElement('span');
        deleteIcon.textContent = ' \u2716';
        deleteIcon.style.color = 'red';
        deleteIcon.style.cursor = 'pointer';
        deleteIcon.style.marginLeft = '5px';
        deleteIcon.addEventListener('click', () => {
            deleteAnnotation(annotation);
        });
        li.appendChild(deleteIcon);
        annotationList.appendChild(li);
    });
}

function addSearchButtonEventListener() {
    document.getElementById('searchBtn').addEventListener('click', () => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        chrome.storage.sync.get({ annotations: [] }, (data) => {
            const annotations = data.annotations;
            const filteredAnnotations = annotations.filter(annotation => {
                const annotationText = annotation.type === 'note'
                    ? `${annotation.select}: ${annotation.text}`
                    : annotation.text;
                return annotationText.toLowerCase().includes(searchTerm);
            });
            displayFilteredAnnotations(filteredAnnotations);
        });
    });
}

function deleteAnnotation(annotationToDelete) {
    chrome.storage.sync.get({ annotations: [] }, (data) => {
        const annotations = data.annotations;
        const updatedAnnotations = annotations.filter(annotation => annotation.timestamp !== annotationToDelete.timestamp);
        chrome.storage.sync.set({ annotations: updatedAnnotations }, () => {
            const groupedAnnotations = groupAnnotationsByDate(updatedAnnotations);
            displayAnnotations(groupedAnnotations);
        });
    });
}

document.getElementById('exportIcon').addEventListener('click', () => {
    exportAnnotations();
});

function exportAnnotations() {
    chrome.storage.sync.get({ annotations: [] }, (data) => {
        const annotations = data.annotations;

        const highlights = annotations.filter(annotation => annotation.type === 'highlight');
        const notes = annotations.filter(annotation => annotation.type === 'note');

        let exportText = '';

        if (highlights.length > 0) {
            exportText += 'Highlights:\n';
            highlights.forEach(highlight => {
                exportText += `- Text: ${highlight.text}\n  Color: ${highlight.color}\n  URL: ${highlight.url}\n\n`;
            });
        }

        if (notes.length > 0) {
            exportText += 'Notes:\n';
            notes.forEach(note => {
                exportText += `- Text: ${note.text}\n  Color: ${note.color}\n  URL: ${note.url}\n  Selected Text: ${note.select}\n\n`;
            });
        }

        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        //temp div download ke liye
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotations.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); 
    });
}
