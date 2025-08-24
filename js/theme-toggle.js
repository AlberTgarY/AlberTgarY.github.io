document.addEventListener('DOMContentLoaded', function() {
  // Create theme toggle button
  const navUl = document.querySelector('header nav ul');
  
  if (navUl) {
    // Create list item for the toggle
    const toggleLi = document.createElement('li');
    toggleLi.style.marginLeft = '15px';
    
    // Create the toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'theme-toggle';
    toggleBtn.innerHTML = '🌙';
    toggleBtn.setAttribute('aria-label', 'Toggle dark/light mode');
    toggleBtn.title = 'Toggle dark/light mode';
    
    // Style the toggle button
    toggleBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      transition: transform 0.3s ease, opacity 0.2s ease;
    `;
    
    // Append button to list item
    toggleLi.appendChild(toggleBtn);
    navUl.appendChild(toggleLi);
    
    // Check for saved theme preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // Apply initial theme
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      toggleBtn.innerHTML = '☀️';
    }
    
    // Add CSS for smooth animations
    const style = document.createElement('style');
    style.textContent = `
      #theme-toggle:hover {
        transform: scale(1.1);
      }
      
      #theme-toggle.rotating {
        animation: clockwiseRotate 0.8s ease-in-out;
      }
      
      @keyframes clockwiseRotate {
        from { transform: scale(1.1) rotate(0deg); }
        to { transform: scale(1.1) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    // Toggle theme on click
    toggleBtn.addEventListener('click', function() {
      // Prevent multiple clicks during animation
      if (toggleBtn.classList.contains('rotating')) return;
      
      // Add rotation class
      toggleBtn.classList.add('rotating');
      
      // Toggle theme immediately
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      
      // Change icon during rotation (at 180 degrees)
      setTimeout(() => {
        toggleBtn.innerHTML = isDark ? '☀️' : '🌙';
      }, 400);
      
      // Remove rotation class after animation
      setTimeout(() => {
        toggleBtn.classList.remove('rotating');
      }, 800);
      
      // Save preference
      localStorage.setItem('darkMode', isDark);
    });
  }
});
