let vidaActual = 100;
let cooldownsTime = 5; //segundos
const MAX_HEALTH = 150; // máximo de vida usado para calcular el relleno

// Para storear la vida de cada personaje y añadirles la imagen
const characterHealth = [100, 85, 70, 120];
const characterPortraits = [
  'media/120px-Portrait_Shadowheart.png.webp',
  'media/120px-Portrait_Astarion.png.webp',
  'media/120px-Portrait_Gale.png.webp',
  'media/120px-Portrait_Karlach.png.webp'
];
let selectedCharacter = 0;
// Se inicializa a cero porque es lo que controla luego el cambio

// Object to track cooldown state for each interactive button
const skillCooldowns = {};

// ================== TILESET SYSTEM ==================
const TILESET_CONFIG = {
  cols: 32,        // 32 columnas
  rows: 32,        // 32 filas
  iconSize: 64,    // Cada icono es de 64x64 píxeles en la imagen original
  imgWidth: 2048,  // Imagen original 2048x2048
  imgHeight: 2048,
  displaySize: 1408 // Tamaño de visualización en background-size (44/64 * 2048)
};

// Función para establecer el icono del tileset en un elemento
function setTilesetIcon(element, iconIndex) {
  if (!element.classList.contains('tileset')) {
    element.classList.add('tileset');
  }
  
  // Convertir índice (que comienza en 1) a índice interno (0-based)
  const indexZeroBased = iconIndex - 1;
  
  // Calcular fila y columna del icono
  const col = indexZeroBased % TILESET_CONFIG.cols;
  const row = Math.floor(indexZeroBased / TILESET_CONFIG.cols);
  
  // Calcular posición del background ajustado al tamaño de visualización
  const scale = TILESET_CONFIG.displaySize / TILESET_CONFIG.imgWidth;
  const posX = -(col * TILESET_CONFIG.iconSize * scale);
  const posY = -(row * TILESET_CONFIG.iconSize * scale);
  
  element.style.backgroundPosition = `${posX}px ${posY}px`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Detectar automáticamente iconos del tileset por atributo data-icon
  const tilesetElements = document.querySelectorAll('.skill[data-icon]');
  tilesetElements.forEach(el => {
    const iconIndex = parseInt(el.getAttribute('data-icon'));
    setTilesetIcon(el, iconIndex);
  });

  // Initialize character health display
  function initCharacterHealth() {
    const healthTexts = document.querySelectorAll('.character-health');
    const characterSlots = document.querySelectorAll('.character-slot');
    
    healthTexts.forEach((health, index) => {
      health.textContent = characterHealth[index];
      
      // Actualizar la capa roja de daño en cada slot
      const damagePercent = ((MAX_HEALTH - characterHealth[index]) / MAX_HEALTH) * 100;
      characterSlots[index].style.setProperty('--damage-height', damagePercent + '%');
    });
    
    // Update main circle with selected character health
    updateMainHealthCircle();
  }

  // Update main health circle
  function updateMainHealthCircle() {
    const healthText = document.querySelector('#health-text text');
    const healthCircle = document.querySelector('#health-circle');
    const healthFill = document.querySelector('#health-fill');

    const current = characterHealth[selectedCharacter];
    healthText.textContent = current + ' / ' + MAX_HEALTH;
    healthCircle.style.backgroundImage = `url('${characterPortraits[selectedCharacter]}')`;

    // Calcular porcentaje de daño y ajustar altura del overlay rojo (desde abajo)
    const damagePercent = ((MAX_HEALTH - current) / MAX_HEALTH) * 100;
    healthCircle.style.setProperty('--damage-height', damagePercent + '%');
    
    let percent = (current / MAX_HEALTH) * 100;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    if (healthFill) {
      healthFill.style.height = percent + '%';
    }
  }

  // Initialize character health
  initCharacterHealth();

  // Select all interactive buttons: only skills (no placeholders), NO special items
  const interactiveButtons = document.querySelectorAll('.skill:not(.empty)');

  interactiveButtons.forEach((btn, index) => {
    // Initialize cooldown state for this button
    skillCooldowns[index] = { active: false, remaining: 0, interval: null };

    // Add click listener
    btn.addEventListener('click', function() {
      // Only allow click if not on cooldown
      if (!skillCooldowns[index].active) {
        startCooldown(index);
      }
    });
  });

  function startCooldown(buttonIndex) {
    const btn = interactiveButtons[buttonIndex];
    // Ensure cooldown text element exists
    let cooldownText = btn.querySelector('.cooldown-text');
    if (!cooldownText) {
      cooldownText = document.createElement('span');
      cooldownText.className = 'cooldown-text';
      btn.appendChild(cooldownText);
    }

    // Mark as active
    skillCooldowns[buttonIndex].active = true;
    skillCooldowns[buttonIndex].remaining = cooldownsTime;
    btn.classList.add('on-cooldown');

    // Update the text to show countdown
    cooldownText.textContent = skillCooldowns[buttonIndex].remaining;

    // Clear any existing interval just in case
    if (skillCooldowns[buttonIndex].interval) {
      clearInterval(skillCooldowns[buttonIndex].interval);
    }

    // Create interval to countdown
    skillCooldowns[buttonIndex].interval = setInterval(() => {
      skillCooldowns[buttonIndex].remaining--;
      cooldownText.textContent = skillCooldowns[buttonIndex].remaining;

      // When countdown reaches 0
      if (skillCooldowns[buttonIndex].remaining <= 0) {
        clearInterval(skillCooldowns[buttonIndex].interval);
        skillCooldowns[buttonIndex].interval = null;
        skillCooldowns[buttonIndex].active = false;
        btn.classList.remove('on-cooldown');
        cooldownText.textContent = '';
      }
    }, 1000);
  }

  // Character slot selection
  const characterSlots = document.querySelectorAll('.character-slot');

  characterSlots.forEach((slot, index) => {
    slot.addEventListener('click', function() {
      // Remove active class from all slots
      characterSlots.forEach(s => s.classList.remove('active'));
      
      // Add active class to clicked slot
      this.classList.add('active');
      
      // Update selected character and health circle
      selectedCharacter = index;
      updateMainHealthCircle();
    });
  });

  // ================== MINIMAPA INTERACTIVO ==================
  const minimapImage = document.getElementById('minimap-image');
  const minimapContainer = document.getElementById('minimap-container');

  let minimapState = {
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartOffsetX: 0,
    dragStartOffsetY: 0
  };

  // Función para calcular offsets iniciales y centrar la imagen
  function centerMinimapImage() {
    const containerSize = 270; // Tamaño del container en px
    const imageSize = containerSize * minimapZoom;
    const offset = (imageSize - containerSize) / 2;
    
    minimapState.offsetX = offset * 0.5; // Ajuste fino para mejor centrado
    minimapState.offsetY = offset * 0.5; // Ajuste fino para mejor centrado
    
    updateMinimapTransform();
  }

  // Función para actualizar el transform de la imagen
  function updateMinimapTransform() {
    minimapImage.style.transform = `translate(calc(-50% + ${minimapState.offsetX}px), calc(-50% + ${minimapState.offsetY}px)) rotate(${minimapState.rotation}deg)`;
  }

  // Variable para almacenar zoom dinámico
  let minimapZoom = 1.8; // Comienza con 180% de zoom

  // Función para actualizar zoom con scroll
  function updateMinimapZoom(zoomLevel) {
    minimapZoom = Math.max(0.8, Math.min(zoomLevel, 3)); // Limita entre 80% y 300%
    minimapImage.style.width = (minimapZoom * 100) + '%';
    minimapImage.style.height = (minimapZoom * 100) + '%';
  }

  // Centrar imagen al cargar
  centerMinimapImage();

  // Rotación con rueda del ratón (scroll) - con Shift para rotación
  minimapContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    if (e.shiftKey) {
      // Shift + Rueda = Rotación
      minimapState.rotation += (e.deltaY > 0 ? 5 : -5);
      minimapState.rotation = minimapState.rotation % 360;
    } else {
      // Rueda sin Shift = Zoom
      updateMinimapZoom(minimapZoom + (e.deltaY > 0 ? -0.1 : 0.1));
    }
    
    updateMinimapTransform();
  }, { passive: false });

  // Movimiento con arrastrar
  minimapContainer.addEventListener('mousedown', (e) => {
    minimapState.isDragging = true;
    minimapState.dragStartX = e.clientX;
    minimapState.dragStartY = e.clientY;
    minimapState.dragStartOffsetX = minimapState.offsetX;
    minimapState.dragStartOffsetY = minimapState.offsetY;
    minimapContainer.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!minimapState.isDragging) return;
    
    const deltaX = e.clientX - minimapState.dragStartX;
    const deltaY = e.clientY - minimapState.dragStartY;
    
    minimapState.offsetX = minimapState.dragStartOffsetX + deltaX;
    minimapState.offsetY = minimapState.dragStartOffsetY + deltaY;
    
    updateMinimapTransform();
  });

  document.addEventListener('mouseup', () => {
    minimapState.isDragging = false;
    minimapContainer.style.cursor = 'grab';
  });
});