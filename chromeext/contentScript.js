// contentScript.js

(function () {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'start-selection') {
      activateSelectionMode();
      sendResponse({ success: true }); // Send a response to indicate success
    }
  });

  // ... Existing functions ...

  function sendDataToBackend(dataUrl, rect) {
    // Convert dataUrl to Blob
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        // Convert the Blob to a Base64 string
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;

          // Include selection coordinates and devicePixelRatio
          const scale = window.devicePixelRatio;
          const selectionData = {
            left: rect.left * scale,
            top: rect.top * scale,
            width: rect.width * scale,
            height: rect.height * scale,
          };

          // Send message to background script to perform OCR
          chrome.runtime.sendMessage(
            {
              action: 'performOCR',
              imageData: base64data,
              selection: selectionData,
            },
            (response) => {
              if (response && response.success) {
                const ocrData = response.data;
                if (ocrData.success) {
                  const extractedText = ocrData.extracted_text;
                  getAnswer(extractedText);
                } else {
                  alert('Error processing image: ' + ocrData.error);
                }
              } else {
                alert('Error: ' + (response ? response.error : 'Unknown error'));
              }
            }
          );
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        alert('Failed to process image data: ' + error);
      });
  }

  function getAnswer(extractedText) {
    // Send message to background script to get the answer
    chrome.runtime.sendMessage(
      {
        action: 'getAnswer',
        question: extractedText,
      },
      (response) => {
        if (response && response.success) {
          const qaData = response.data;
          if (qaData.success) {
            const answer = qaData.answer;
            showResultInOverlay(extractedText, answer);
          } else {
            alert('Error generating answer: ' + qaData.error);
          }
        } else {
          alert('Error: ' + (response ? response.error : 'Unknown error'));
        }
      }
    );
  }
  function showResultInOverlay(extractedText, answer) {
    const overlay = document.getElementById('screenshot-overlay');

    // Clear any existing result
    const existingResult = document.getElementById('ocr-result');
    if (existingResult) {
      existingResult.remove();
    }

    const resultDiv = document.createElement('div');
    resultDiv.id = 'ocr-result';
    resultDiv.style.position = 'fixed';
    resultDiv.style.bottom = '10px';
    resultDiv.style.left = '50%';
    resultDiv.style.transform = 'translateX(-50%)';
    resultDiv.style.backgroundColor = '#fff';
    resultDiv.style.padding = '10px';
    resultDiv.style.borderRadius = '5px';
    resultDiv.style.maxWidth = '80%';
    resultDiv.style.maxHeight = '50%';
    resultDiv.style.overflowY = 'auto';
    resultDiv.style.zIndex = '1000000';

    // Create elements for extracted text and answer
    const extractedTextElement = document.createElement('p');
    extractedTextElement.innerText = 'Extracted Text:\n' + extractedText;

    const answerElement = document.createElement('p');
    answerElement.innerText = 'Answer:\n' + answer;

    // Append elements to resultDiv
    resultDiv.appendChild(extractedTextElement);
    resultDiv.appendChild(document.createElement('hr')); // Separator
    resultDiv.appendChild(answerElement);

    overlay.appendChild(resultDiv);
  }

  function retakeSelection() {
    // Remove the existing selection box
    if (selectionBox) {
      selectionBox.remove();
    }

    // Remove existing result if any
    const resultDiv = document.getElementById('ocr-result');
    if (resultDiv) {
      resultDiv.remove();
    }

    // Disable Generate and Retake buttons
    const generateBtn = document.querySelector('#screenshot-controls button:nth-child(1)');
    const retakeBtn = document.querySelector('#screenshot-controls button:nth-child(2)');
    generateBtn.disabled = true;
    retakeBtn.disabled = true;

    // Restart selection
    const overlay = document.getElementById('screenshot-overlay');
    overlay.addEventListener('mousedown', startSelection);
  }

  function cancelSelection() {
    // Remove overlay and all event listeners
    const overlay = document.getElementById('screenshot-overlay');
    if (overlay) {
      overlay.parentNode.removeChild(overlay);
    }

    // Clean up any event listeners
    document.removeEventListener('mousemove', resizeSelection);
    document.removeEventListener('mouseup', finishSelection);
  }
})();
