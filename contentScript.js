chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'highlight') {
        applyHighlight(request.color);
    } else if (request.action === 'addNote') {
        createNoteWithHighlight(request.color);
    }
});

function applyHighlight(color) {
    const userSelection = window.getSelection();
    if (!userSelection.rangeCount) {
        alert('Please select some text to highlight.');
        return;
    }

    const selectedRange = userSelection.getRangeAt(0);
    const selectedText = selectedRange.toString();

    if (selectedText) {
        const highlightSpan = document.createElement('span');
        highlightSpan.style.backgroundColor = color;

        const extractedContent = selectedRange.extractContents();
        extractedContent.childNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.style.backgroundColor) {
                node.style.backgroundColor = '';
            }
        });

        highlightSpan.appendChild(extractedContent);
        selectedRange.insertNode(highlightSpan);
        userSelection.removeAllRanges();

        const uniqueSelector = generateUniqueSelector(highlightSpan.parentElement);

        const newAnnotation = {
            text: selectedText,
            url: window.location.href,
            color: color,
            type: 'highlight',
            timestamp: Date.now(),
            selector: uniqueSelector
        };

        chrome.storage.sync.get({ annotations: [] }, (data) => {
            const annotationsList = data.annotations;
            annotationsList.push(newAnnotation);
            chrome.storage.sync.set({ annotations: annotationsList });
        });

    } else {
        alert('Please select any text to highlight.');
    }
}

function createNoteWithHighlight(color) {
    const userSelection = window.getSelection();
    if (userSelection.rangeCount > 0) {
        const selectedRange = userSelection.getRangeAt(0);
        const selectedText = selectedRange.toString();

        applyHighlight(color); // Highlight the selected text

        const noteElement = document.createElement('div');
        noteElement.contentEditable = true;
        noteElement.style.border = '0.5px dashed black';
        noteElement.style.backgroundColor = color;
        noteElement.style.display = 'inline-block';
        noteElement.style.marginLeft = '5px';
        noteElement.style.padding = '3px';
        noteElement.style.fontSize = '0.8em';
        noteElement.textContent = 'add note...';
        selectedRange.collapse(false);
        selectedRange.insertNode(noteElement);

        const uniqueSelector = generateUniqueSelector(noteElement.parentElement);

        const newNote = {
            text: noteElement.textContent,
            url: window.location.href,
            color: color,
            type: 'note',
            select: selectedText,
            timestamp: Date.now(),
            selector: uniqueSelector
        };

        chrome.storage.sync.get({ annotations: [] }, (data) => {
            const annotationsList = data.annotations;
            annotationsList.push(newNote);
            chrome.storage.sync.set({ annotations: annotationsList });
        });

        noteElement.addEventListener('input', () => {
            newNote.text = noteElement.textContent;
            chrome.storage.sync.get({ annotations: [] }, (data) => {
                const annotationsList = data.annotations;
                const index = annotationsList.findIndex(a => a.timestamp === newNote.timestamp);
                if (index > -1) {
                    annotationsList[index] = newNote;
                    chrome.storage.sync.set({ annotations: annotationsList });
                }
            });
        });
    }
}

function generateUniqueSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    if (element.className) {
        return `.${element.className.trim().split(/\s+/).join('.')}`;
    }
    return element.tagName.toLowerCase();
}

function reloadAnnotations() {
    chrome.storage.sync.get('annotations', (result) => {
        const annotationsList = result.annotations || [];
        annotationsList.forEach((annotation) => {
            const elements = document.querySelectorAll(annotation.selector);
            elements.forEach((element) => {
                const innerHTML = element.innerHTML;
                if (annotation.type === 'highlight') {
                    const highlightedHTML = `<span style="background-color:${annotation.color}">${annotation.text}</span>`;
                    element.innerHTML = innerHTML.replace(annotation.text, highlightedHTML);
                } else if (annotation.type === 'note') {
                    const noteHTML = `<span style="background-color:${annotation.color}">${annotation.select}</span><div contentEditable="true" style="border: 0.5px dashed black; background-color:${annotation.color}; display: inline-block; margin-left: 5px; padding: 3px; font-size: 0.8em;">${annotation.text}</div>`;
                    element.innerHTML = innerHTML.replace(annotation.select, noteHTML);
                }
            });
        });
    });
}

// document.addEventListener('DOMContentLoaded', reloadAnnotations);
reloadAnnotations();

