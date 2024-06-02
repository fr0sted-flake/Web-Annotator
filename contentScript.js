// document.addEventListener('mouseup', function() {
//     let selectedText = window.getSelection().toString().trim();
//     if (selectedText.length > 0) {
//       let highlightColor = localStorage.getItem('highlightColor') || 'yellow';
//       let span = document.createElement('span');
//       span.style.backgroundColor = highlightColor;
//       span.classList.add('highlight');
//       span.textContent = selectedText;
  
//       let range = window.getSelection().getRangeAt(0);
//       range.deleteContents();
//       range.insertNode(span);
  
//       let note = prompt('Add a note (optional):');
//       if (note) {
//         span.setAttribute('data-note', note);
//         span.classList.add('note');
//       }
  
//       saveAnnotation(span);
//     }
//   });
  
//   function saveAnnotation(span) {
//     let annotations = JSON.parse(localStorage.getItem('annotations') || '[]');
//     annotations.push({
//       text: span.textContent,
//       color: span.style.backgroundColor,
//       note: span.getAttribute('data-note') || '',
//       position: getXPathForElement(span)
//     });
//     localStorage.setItem('annotations', JSON.stringify(annotations));
//   }
  
//   function getXPathForElement(element) {
//     const idx = (sib, name) => sib ? idx(sib.previousElementSibling, name||sib.localName) + (sib.localName == name) : 1;
//     const segs = el => !el || el.nodeType !== 1 ? [''] : 
//       el.id && document.getElementById(el.id) === el ? [`id("${el.id}")`] : 
//       [...segs(el.parentNode), `${el.localName}[${idx(el)}]`];
//     return segs(element).join('/');
//   }









// const mediumHighlighter = document.createElement("medium-highlighter");
// document.body.appendChild(mediumHighlighter);

// const setMarkerPosition = (markerPosition) =>
//   mediumHighlighter.setAttribute(
//     "markerPosition",
//     JSON.stringify(markerPosition)
//   );

// setMarkerPosition({
//   left: 0,
//   top: 0,
//   display: "flex",
// });
  




// const getSelectedText = () => window.getSelection().toString();

// document.addEventListener("click", () => {
//   if (getSelectedText().length > 0) {
//     setMarkerPosition(getMarkerPosition());
//   }
// });

// document.addEventListener("selectionchange", () => {
//   if (getSelectedText().length === 0) {
//     setMarkerPosition({ display: "none" });
//   }
// });


// function getMarkerPosition() {
//   const rangeBounds = window
//     .getSelection()
//     .getRangeAt(0)
//     .getBoundingClientRect();
//   return {
//     // Substract width of marker button -> 40px / 2 = 20
//     left: rangeBounds.left + rangeBounds.width / 2 - 20,
//     top: rangeBounds.top - 30,
//     display: "flex",
//   };
// }