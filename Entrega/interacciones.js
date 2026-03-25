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

// Initialize character health display
function initCharacterHealth() {
  const healthTexts = document.querySelectorAll('.character-health');
  healthTexts.forEach((health, index) => {
    health.textContent = characterHealth[index];
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

  // Calcular porcentaje y ajustar altura del overlay rojo (desde abajo)
  let percent = (current / MAX_HEALTH) * 100;
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;
  if (healthFill) {
    healthFill.style.height = percent + '%';
  }
}

// Initialize on page load
initCharacterHealth();

// Object to track cooldown state for each interactive button
const skillCooldowns = {};

// Select all interactive buttons: skills (no placeholders) and special items
const interactiveButtons = document.querySelectorAll('.skill:not(.empty), .special-item');

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