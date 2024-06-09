document.addEventListener('DOMContentLoaded', () => {
    // Load the stored highlight color or set a default color
    chrome.storage.sync.get('highlightColor', (data) => {
        const color = data.highlightColor || '#03daf6';
        document.getElementById('highlightColor').value = color;
    });

    // Update the highlight color when changed
    document.getElementById('highlightColor').addEventListener('change', (event) => {
        chrome.storage.sync.set({ highlightColor: event.target.value });
    });

    // Highlight selected text with the chosen color
    document.getElementById('highlightBtn').addEventListener('click', () => {
        chrome.storage.sync.get('highlightColor', (data) => {
            const color = data.highlightColor || '#03daf6';
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'highlight', color });
            });
        });
    });

    // Add a note to the selected text with the chosen color
    document.getElementById('noteBtn').addEventListener('click', () => {
        chrome.storage.sync.get('highlightColor', (data) => {
            const color = data.highlightColor || '#03daf6';
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'addNote', color });
            });
        });
    });

    // Load and display annotations
    chrome.storage.sync.get({ annotations: [] }, (data) => {
        const annotations = data.annotations;
        const groupedAnnotations = groupAnnotationsByDate(annotations);
        displayAnnotations(groupedAnnotations);
    });

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

        // Sort dates in descending order
        const dates = Object.keys(groupedAnnotations).sort((a, b) => new Date(b) - new Date(a));

        dates.forEach(date => {
            const dateHeader = document.createElement('li');
            dateHeader.textContent = date;
            dateHeader.style.fontWeight = 'bold';
            dateHeader.style.color = '#CBCED8';
            annotationList.appendChild(dateHeader);

            const annotations = groupedAnnotations[date];
            const reversedAnnotations = annotations.slice().reverse();

            if (reversedAnnotations.length > 3) {
                const recentAnnotations = reversedAnnotations.slice(-3).reverse();
                recentAnnotations.forEach(annotation => {
                    createAnnotationListItem(annotation, annotationList);
                });
                const moreLi = document.createElement('li');
                moreLi.textContent = '...more';
                moreLi.classList.add('more-item');
                moreLi.addEventListener('click', () => {
                    displayAllAnnotations(annotations);
                });
                annotationList.appendChild(moreLi);
            } else {
                reversedAnnotations.forEach(annotation => {
                    createAnnotationListItem(annotation, annotationList);
                });
            }
        });
    }

    function createAnnotationListItem(annotation, annotationList) {
        const li = document.createElement('li');
        li.style.color = annotation.color;
        li.textContent = annotation.type === 'note'
            ? `${annotation.select} : ${annotation.text} (${new URL(annotation.url).hostname})`
            : `${annotation.text} (${new URL(annotation.url).hostname})`;

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
            createAnnotationListItem(annotation, annotationList);
        });
    }

    // Search functionality for annotations
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

    function displayFilteredAnnotations(annotations) {
        const annotationList = document.getElementById('annotationList');
        annotationList.innerHTML = '';

        const groupedAnnotations = groupAnnotationsByDate(annotations);
        const dates = Object.keys(groupedAnnotations).sort((a, b) => new Date(b) - new Date(a));

        dates.forEach(date => {
            const dateHeader = document.createElement('li');
            dateHeader.textContent = date;
            dateHeader.style.fontWeight = 'bold';
            dateHeader.style.color = '#CBCED8';
            annotationList.appendChild(dateHeader);

            const dateAnnotations = groupedAnnotations[date];
            dateAnnotations.forEach(annotation => {
                createAnnotationListItem(annotation, annotationList);
            });
        });
    }

    function deleteAnnotation(annotationToDelete) {
        chrome.storage.sync.get({ annotations: [] }, (data) => {
            const annotations = data.annotations.filter(annotation => annotation.timestamp !== annotationToDelete.timestamp);
            chrome.storage.sync.set({ annotations }, () => {
                const groupedAnnotations = groupAnnotationsByDate(annotations);
                displayAnnotations(groupedAnnotations);
            });
        });
    }
});

// Export annotations functionality
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

        // Temporary link for downloading the export
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotations.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
