document.addEventListener('DOMContentLoaded', function() {
  const nameElement = document.querySelector('header h1');
  if (nameElement) {
    const fullText = nameElement.textContent;
    nameElement.textContent = '';
    
    // Create a span for the cursor
    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'typing-cursor';
    cursorSpan.textContent = '|';
    cursorSpan.style.animation = 'blink 0.7s infinite';
    nameElement.appendChild(cursorSpan);
    
    // Add typing effect
    let i = 0;
    function typeWriter() {
      if (i < fullText.length) {
        nameElement.insertBefore(
          document.createTextNode(fullText.charAt(i)), 
          cursorSpan
        );
        i++;
        setTimeout(typeWriter, 80); // Adjust typing speed here
      } else {
        // Keep cursor blinking for a while, then fade it out
        setTimeout(function() {
          cursorSpan.style.animation = 'fadeOut 1s forwards';
          setTimeout(function() {
            cursorSpan.remove();
          }, 1000);
        }, 1500);
      }
    }
    
    // Start typing after a short delay
    setTimeout(typeWriter, 100);
  }
});
