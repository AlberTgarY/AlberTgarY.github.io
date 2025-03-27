document.addEventListener('DOMContentLoaded', function() {
  const header = document.querySelector('header');
  
  if (header) {
    console.log("Header found, initializing wave animation");
    
    // Create wave container with enhanced CSS
    const waveContainer = document.createElement('div');
    waveContainer.className = 'wave-container';
    
    // Add hardware acceleration hint to container
    waveContainer.style.transform = 'translate3d(0,0,0)';
    
    // Create 3 different wave elements
    for (let i = 1; i <= 3; i++) {
      const wave = document.createElement('div');
      wave.className = `wave wave${i}`;
      
      // Add hardware acceleration hints
      wave.style.transform = 'translate3d(0,0,0)';
      wave.style.backfaceVisibility = 'hidden';
      
      waveContainer.appendChild(wave);
    }
    
    // Insert wave container at the beginning of header
    header.insertBefore(waveContainer, header.firstChild);
    
    // Create subtle floating particles for additional peaceful effect
    createParticles(waveContainer);
    
    // Check if the SVG is loading correctly
    const img = new Image();
    img.onload = function() {
      console.log("Wave SVG loaded successfully");
      // Force a repaint to ensure smooth start of animations
      setTimeout(() => {
        document.querySelectorAll('.wave').forEach(wave => {
          wave.style.visibility = 'hidden';
          // Force a repaint
          void wave.offsetWidth;
          wave.style.visibility = 'visible';
        });
      }, 50);
    };
    
    img.onerror = function() {
      console.error("Error loading wave SVG");
      // Fallback to a more elegant CSS-based wave if SVG fails
      document.querySelectorAll('.wave').forEach((wave, index) => {
        const delay = index * -5;
        wave.style.background = "none";
        wave.style.borderRadius = "40%";
        wave.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.3)";
        wave.style.animation = `silkWaveFallback 15s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite alternate`;
        wave.style.animationDelay = `${delay}s`;
        
        // Add keyframes for fallback animation
        if (!document.getElementById('waveFallbackStyle')) {
          const style = document.createElement('style');
          style.id = 'waveFallbackStyle';
          style.textContent = `
            @keyframes silkWaveFallback {
              0% { transform: translateX(-50%) translateY(10px) rotate(0deg) translateZ(0); }
              25% { transform: translateX(-37.5%) translateY(5px) rotate(0.5deg) translateZ(0); }
              50% { transform: translateX(-25%) translateY(0) rotate(1deg) translateZ(0); }
              75% { transform: translateX(-12.5%) translateY(5px) rotate(0.5deg) translateZ(0); }
              100% { transform: translateX(0%) translateY(10px) rotate(0deg) translateZ(0); }
            }
          `;
          document.head.appendChild(style);
        }
      });
    };
    img.src = 'Img/wave.svg';
  }
  
  // Function to create floating particles with smoother animation
  function createParticles(container) {
    const particleCount = 15;
    const colors = ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'];
    
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      
      // Style the particle
      const size = Math.random() * 8 + 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.background = color;
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.bottom = `${Math.random() * 60}%`;
      particle.style.opacity = Math.random() * 0.5 + 0.2;
      
      // Set animation properties
      const duration = Math.random() * 10 + 10;
      const delay = Math.random() * 5;
      
      particle.style.animation = `float ${duration}s ease-in-out infinite`;
      particle.style.animationDelay = `${delay}s`;
      
      fragment.appendChild(particle);
    }
    
    container.appendChild(fragment);
    
    // Updated animation style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translate3d(0, 0, 0); }
        25% { transform: translate3d(5px, -10px, 0); }
        50% { transform: translate3d(10px, -20px, 0); }
        75% { transform: translate3d(5px, -10px, 0); }
        100% { transform: translate3d(0, 0, 0); }
      }
    `;
    document.head.appendChild(style);
  }
});
