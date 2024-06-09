chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'highlight') {
      applyHighlight(request.color);
  } else if (request.action === 'addNote') {
      appendNoteToSelection(request.color);
  }
});

function applyHighlight(color) {
  const selection = window.getSelection();
  if (!selection.rangeCount) {
      alert('Please select some text to highlight.');
      return;
  }

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (selectedText) {
      const highlightSpan = document.createElement('span');
      highlightSpan.style.backgroundColor = color;

      const documentFragment = range.extractContents();

      documentFragment.childNodes.forEach(node => {
          if (node.nodeType === 1 && node.style.backgroundColor) {
              node.style.backgroundColor = '';
          }
      });

      highlightSpan.appendChild(documentFragment);

      range.insertNode(highlightSpan);

      selection.removeAllRanges();

      const uniqueSelector = generateUniqueSelector(highlightSpan.parentElement);

      const annotation = {
          text: selectedText,
          url: window.location.href,
          color: color,
          type: 'highlight',
          timestamp: Date.now(),
          selector: uniqueSelector
      };

      chrome.storage.sync.get({ annotations: [] }, (data) => {
          const annotations = data.annotations;
          annotations.push(annotation);
          chrome.storage.sync.set({ annotations: annotations });
      });
  } else {
      alert('Please select some text to highlight.');
  }
}

function restoreAnnotations() {
  chrome.storage.sync.get('annotations', function (result) {
      const annotations = result.annotations || [];
      annotations.forEach(function (annotation) {
          const elements = document.querySelectorAll(annotation.selector);
          elements.forEach(function (element) {
              const innerHTML = element.innerHTML;
              if (annotation.type === 'highlight') {
                  const highlightedText = `<span style="background-color:${annotation.color}">${annotation.text}</span>`;
                  element.innerHTML = innerHTML.replace(annotation.text, highlightedText);
              } else if (annotation.type === 'note') {
                  const noteText = `<span style="background-color:${annotation.color}">${annotation.select}</span><div contentEditable="true" style="border: 0.5px dashed black; background-color:${annotation.color}; display: inline-block; margin-left: 5px; padding: 3px; font-size: 0.8em;">${annotation.text}</div>`;
                  element.innerHTML = innerHTML.replace(annotation.select, noteText);
              }
          });
      });
  });
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

// document.addEventListener('DOMContentLoaded', function () {
  restoreAnnotations();
// });

function appendNoteToSelection(color) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      applyHighlight(color);  // Highlight the selection

      const note = document.createElement('div');
      note.contentEditable = true;
      note.style.border = '0.5px dashed black';
      note.style.backgroundColor = color;
      note.style.display = 'inline-block';
      note.style.marginLeft = '5px';
      note.style.padding = '3px';
      note.style.fontSize = '0.8em';
      note.textContent = 'add note...';
      range.collapse(false);
      range.insertNode(note);

      const uniqueSelector = generateUniqueSelector(note.parentElement);

      const annotation = {
          text: note.textContent,
          url: window.location.href,
          color: color,
          type: 'note',
          select: selectedText,
          timestamp: Date.now(),
          selector: uniqueSelector
      };

      chrome.storage.sync.get({ annotations: [] }, (data) => {
          const annotations = data.annotations;
          annotations.push(annotation);
          chrome.storage.sync.set({ annotations: annotations });
      });

      note.addEventListener('input', () => {
          annotation.text = note.textContent;
          chrome.storage.sync.get({ annotations: [] }, (data) => {
              const annotations = data.annotations;
              const index = annotations.findIndex(a => a.timestamp === annotation.timestamp);
              if (index > -1) {
                  annotations[index] = annotation;
                  chrome.storage.sync.set({ annotations: annotations });
              }
          });
      });
  }
}

console.log("Content Script Loaded");
