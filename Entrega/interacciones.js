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

// para traquear los cooldowns
const skillCooldowns = {};


const TILESET_CONFIG = {
  cols: 32,        // 32 columnas
  rows: 32,        // 32 filas
  iconSize: 64,    // Cada icono es de 64x64 píxeles en la imagen original
  imgWidth: 2048,  // Imagen original 2048x2048
  imgHeight: 2048,
  displaySize: 1408 // Tamaño de visualización en background-size (44/64 * 2048)
};


// Hasta aquí las vars/cons. 



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
    const healthTexts = document.querySelectorAll('#party-container .character-health');
    const characterSlots = document.querySelectorAll('#party-container .character-slot');
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
    const healthText = document.querySelector('#health-text');
    const healthCircle = document.querySelector('#health-circle');
    const healthFill = document.querySelector('#health-fill');

    const current = characterHealth[selectedCharacter];
    if (healthText) {
      healthText.textContent = current + ' / ' + MAX_HEALTH;
    }
    healthCircle.style.backgroundImage = `url('${characterPortraits[selectedCharacter]}')`;

    // Calcular porcentaje de daño y ajustar altura del overlay rojo (desde abajo), porcentualmente
    const damagePercent = ((MAX_HEALTH - current) / MAX_HEALTH) * 100; 
    healthCircle.style.setProperty('--damage-height', damagePercent + '%');
    
    let percent = (current / MAX_HEALTH) * 100;
    // capear valores
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    if (healthFill) {
      healthFill.style.height = percent + '%';
    }
  }

  // Initialize character health
  initCharacterHealth();

  // AUDIO (Y parches)

  const menuAudio = new Audio('media/audio/BALDURS GATE 3 Main Theme Full _ Menu Music Extended Mix [DJYsaFelV-4].mp3');
  menuAudio.loop = true;
  menuAudio.volume = 1;
  menuAudio.muted = false;
  menuAudio.play().catch(() => {
    // Autoplay con audio silenciado puede ser bloqueado, pero se ignorará.
  });

  const gameplayAudio = new Audio('media/audio/BALDURS GATE 3 Karlach Character Introduction Music  Unreleased Soundtrack.mp3');
  gameplayAudio.loop = true;
  gameplayAudio.volume = 1;

  function startMenuAudio() {
    if (menuAudio.paused) {
      menuAudio.play().catch(() => {});
    }
    if (menuAudio.muted) {
      menuAudio.muted = false;
    }
  }

  function stopMenuAudio() {
    if (!menuAudio.paused) {
      menuAudio.pause();
      menuAudio.currentTime = 0;
    }
  }

  function startGameplayAudio() {
    stopMenuAudio();
    if (gameplayAudio.paused) {
      gameplayAudio.currentTime = 0;
      gameplayAudio.play().catch(() => {});
    }
  }

  document.addEventListener('click', function firstUserInteraction(event) {
    if (event.target === document.getElementById('start-button')) {
      // Si el primer click es en el boton start, ignoro la musica del menu y reproduzco directamente la de gameplay.
      document.removeEventListener('click', firstUserInteraction);
      return;
    }
    startMenuAudio();
    document.removeEventListener('click', firstUserInteraction);
  });

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
    // se asegura de que tiene el texto cooldown y si no lo tiene, lo crea por si acasp
    let cooldownText = btn.querySelector('.cooldown-text');
    if (!cooldownText) {
      cooldownText = document.createElement('span');
      cooldownText.className = 'cooldown-text';
      btn.appendChild(cooldownText);
    }

    // Marcado como activo
    skillCooldowns[buttonIndex].active = true;
    skillCooldowns[buttonIndex].remaining = cooldownsTime;
    btn.classList.add('on-cooldown');
    btn.style.setProperty('--cooldown-fill-height', '100%');

    // Update del texto para mostrar el tiempo correcto
    cooldownText.textContent = skillCooldowns[buttonIndex].remaining;

    // Clear por si acaso
    if (skillCooldowns[buttonIndex].interval) {
      clearInterval(skillCooldowns[buttonIndex].interval);
    }

    // contador + fill
    skillCooldowns[buttonIndex].interval = setInterval(() => {
      skillCooldowns[buttonIndex].remaining--;
      cooldownText.textContent = skillCooldowns[buttonIndex].remaining;
      const fillPercent = Math.max(0, (skillCooldowns[buttonIndex].remaining / cooldownsTime) * 100);
      btn.style.setProperty('--cooldown-fill-height', fillPercent + '%');

      // cuando llega a cero
      if (skillCooldowns[buttonIndex].remaining <= 0) {
        clearInterval(skillCooldowns[buttonIndex].interval);
        skillCooldowns[buttonIndex].interval = null;
        skillCooldowns[buttonIndex].active = false;
        btn.classList.remove('on-cooldown');
        btn.style.removeProperty('--cooldown-fill-height');
        cooldownText.textContent = '';
      }
    }, 1000);
  }

  // Selección de personaje
  const characterSlots = document.querySelectorAll('.character-slot');

  characterSlots.forEach((slot, index) => {
    slot.addEventListener('click', function() {
      characterSlots.forEach(s => s.classList.remove('active'));
      

      this.classList.add('active');
      
      // Updatear el personaje
      selectedCharacter = index;
      updateMainHealthCircle();
    });
  });

  const menuInicio = document.getElementById('menu-inicio');
  const gameplay = document.getElementById('gameplay');
  const startButton = document.getElementById('start-button');
  const closeButton = document.getElementById('close-button');

  if (menuInicio && gameplay) {
    gameplay.classList.remove('visible');

    if (startButton) {
      startButton.addEventListener('click', () => {
        menuInicio.classList.add('menu-hidden');
        gameplay.classList.add('visible');
        stopMenuAudio();
        startKarlachAudio();
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        window.close();
      });
    }
  }

});