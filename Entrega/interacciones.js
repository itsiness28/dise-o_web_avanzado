let vidaActual = 100;
let cooldownsTime = 5; //segundos

// Character health data
const characterHealth = [100, 85, 70, 120];
const characterPortraits = [
  'media/120px-Portrait_Shadowheart.png.webp',
  'media/120px-Portrait_Astarion.png.webp',
  'media/120px-Portrait_Gale.png.webp',
  'media/120px-Portrait_Karlach.png.webp'
];
let selectedCharacter = 0;

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
  const maxHealth = 150;
  healthText.textContent = characterHealth[selectedCharacter] + ' / ' + maxHealth;
  healthCircle.style.backgroundImage = `url('${characterPortraits[selectedCharacter]}')`;
}

// Initialize on page load
initCharacterHealth();

// Object to track cooldown state for each skill
const skillCooldowns = {};

// Get all skill elements
const skills = document.querySelectorAll('.skill');

skills.forEach((skill, index) => {
  // Initialize cooldown state for this skill
  skillCooldowns[index] = { active: false, remaining: 0 };
  
  // Add click listener
  skill.addEventListener('click', function() {
    // Only allow click if not on cooldown
    if (!skillCooldowns[index].active) {
      startCooldown(index);
    }
  });
});

function startCooldown(skillIndex) {
  const skill = skills[skillIndex];
  const cooldownText = skill.querySelector('.cooldown-text');
  
  // Mark as active
  skillCooldowns[skillIndex].active = true;
  skillCooldowns[skillIndex].remaining = cooldownsTime;
  skill.classList.add('on-cooldown');
  
  // Update the text to show countdown
  cooldownText.textContent = skillCooldowns[skillIndex].remaining;
  
  // Create interval to countdown
  const interval = setInterval(() => {
    skillCooldowns[skillIndex].remaining--;
    cooldownText.textContent = skillCooldowns[skillIndex].remaining;
    
    // When countdown reaches 0
    if (skillCooldowns[skillIndex].remaining <= 0) {
      clearInterval(interval);
      skillCooldowns[skillIndex].active = false;
      skill.classList.remove('on-cooldown');
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