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
    toggleBtn.style.background = 'none';
    toggleBtn.style.border = 'none';
    toggleBtn.style.color = 'white';
    toggleBtn.style.fontSize = '1.2rem';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.padding = '0';
    toggleBtn.style.display = 'flex';
    toggleBtn.style.alignItems = 'center';
    toggleBtn.style.justifyContent = 'center';
    
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
    
    // Toggle theme on click
    toggleBtn.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      
      // Update button icon
      toggleBtn.innerHTML = isDark ? '☀️' : '🌙';
      
      // Save preference
      localStorage.setItem('darkMode', isDark);
    });
  }
});
