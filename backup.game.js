class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        this.gameState = 'menu';
        this.score = 0;
        this.lives = 3;
        this.shieldHealth = 100;
        this.maxShieldHealth = 100;
        this.chaosLevel = 1;
        this.killCount = 0;
        this.killsForNextChaos = 10;
        this.scrollSpeed = 2;
        
        this.keys = {};
        this.player = new Player(100, 300);
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.powerups = [];
        this.particles = [];
        this.background = [];
        this.floatingTexts = [];
        this.ghosts = [];
        this.portals = [];
        this.groundHoles = [];
        this.troopCarriers = [];
        this.maxParticles = 200;
        this.maxFloatingTexts = 50;
        this.holeSpawnTimer = 0;
        
        this.enemySpawnTimer = 0;
        this.powerupSpawnTimer = 0;
        this.troopCarrierTimer = 0;
        this.chaosEffects = [];
        
        this.initializeBackground();
        this.setupEventListeners();
        window.game = this;
        this.gameLoop();
    }
    
    initializeBackground() {
        for (let i = 0; i < 20; i++) {
            this.background.push({
                x: i * 50,
                y: Math.random() * 100 + 300,
                type: Math.random() > 0.5 ? 'tree' : 'rock'
            });
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        if (this.killCount >= this.killsForNextChaos) {
            this.chaosLevel++;
            this.killCount = 0;
            this.killsForNextChaos += Math.floor(this.chaosLevel * 5);
            this.addChaosEffect();
            this.showChaosLevelUp();
        }
        
        this.player.update(this.keys);
        
        this.updateEnemies();
        this.updateTroopCarriers();
        this.updateBullets();
        this.updateEnemyBullets();
        this.updatePowerups();
        this.updateParticles();
        this.updateBackground();
        this.updateFloatingTexts();
        this.updateGhosts();
        this.updatePortals();
        this.updateGroundHoles();
        
        this.spawnEnemies();
        this.spawnPowerups();
        this.spawnTroopCarriers();
        
        this.checkCollisions();
        this.applyChaosEffects();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update();
            if (this.enemies[i].x < -50) {
                this.enemies.splice(i, 1);
            }
        }
    }
    
    updateTroopCarriers() {
        for (let i = this.troopCarriers.length - 1; i >= 0; i--) {
            const shouldRemove = !this.troopCarriers[i].update();
            if (shouldRemove) {
                this.troopCarriers.splice(i, 1);
            }
        }
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            if (this.bullets[i].x > this.canvas.width) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updatePowerups() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].update();
            if (this.powerups[i].x < -50) {
                // Don't remove the powerup immediately - let it go further offscreen
                // This ensures the label stays visible longer
                if (this.powerups[i].x < -150) {
                    this.powerups.splice(i, 1);
                }
            }
        }
    }
    
    updateParticles() {
        // Limit particle count for performance
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, this.particles.length - this.maxParticles);
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateFloatingTexts() {
        // Limit floating text count for performance
        if (this.floatingTexts.length > this.maxFloatingTexts) {
            this.floatingTexts.splice(0, this.floatingTexts.length - this.maxFloatingTexts);
        }
        
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update();
            if (this.floatingTexts[i].life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }
    
    updateGhosts() {
        for (let i = this.ghosts.length - 1; i >= 0; i--) {
            this.ghosts[i].update();
            if (this.ghosts[i].life <= 0) {
                this.ghosts.splice(i, 1);
            }
        }
    }
    
    updatePortals() {
        for (let i = this.portals.length - 1; i >= 0; i--) {
            this.portals[i].update();
            if (this.portals[i].life <= 0) {
                this.portals.splice(i, 1);
            }
        }
    }
    
    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            this.enemyBullets[i].update();
            if (this.enemyBullets[i].x < -50 || this.enemyBullets[i].y > 500) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }
    
    updateGroundHoles() {
        this.holeSpawnTimer++;
        
        // Spawn holes starting at level 3, more frequent at higher levels
        const holeSpawnRate = Math.max(300, 600 - this.chaosLevel * 50);
        
        if (this.holeSpawnTimer > holeSpawnRate && this.chaosLevel >= 3) {
            this.groundHoles.push(new GroundHole(this.canvas.width));
            this.holeSpawnTimer = 0;
        }
        
        // Update and remove old holes
        for (let i = this.groundHoles.length - 1; i >= 0; i--) {
            this.groundHoles[i].update();
            if (this.groundHoles[i].x < -this.groundHoles[i].width) {
                this.groundHoles.splice(i, 1);
            }
        }
    }
    
    updateBackground() {
        for (let bg of this.background) {
            bg.x -= this.scrollSpeed;
            if (bg.x < -50) {
                bg.x = this.canvas.width + Math.random() * 200;
                bg.y = Math.random() * 150 + 150;
                bg.type = Math.random() > 0.5 ? 'tree' : 'rock';
            }
        }
    }
    
    spawnEnemies() {
        this.enemySpawnTimer++;
        const spawnRate = Math.max(15, 120 - this.chaosLevel * 6); // Slower spawn at high chaos
        
        if (this.enemySpawnTimer > spawnRate) {
            let enemyCount;
            
            if (this.chaosLevel >= 5) {
                // Cap enemy count to prevent performance issues
                enemyCount = Math.min(2 + Math.floor((this.chaosLevel - 4) * 1.5), 6);
            } else {
                enemyCount = Math.min(1 + Math.floor(this.chaosLevel / 3), 3);
            }
            
            // Limit total enemies on screen to prevent performance issues
            if (this.enemies.length >= 50) {
                return; // Don't spawn more enemies if too many already
            }
            
            for (let i = 0; i < enemyCount; i++) {
                const enemyType = this.getRandomEnemyType();
                
                // Much more vertical variation
                let yPosition;
                if (this.chaosLevel >= 5) {
                    // High chaos: enemies can spawn anywhere vertically
                    yPosition = 100 + Math.random() * 200;
                } else {
                    // Lower chaos: more ground-based with some variation
                    yPosition = 250 + Math.random() * 80;
                }
                
                const xOffset = i * (20 + Math.random() * 40);
                this.enemies.push(new Enemy(this.canvas.width + xOffset, enemyType, 0, yPosition));
            }
            this.enemySpawnTimer = 0;
        }
    }
    
    spawnPowerups() {
        this.powerupSpawnTimer++;
        const spawnRate = 300 - this.chaosLevel * 10;
        
        if (this.powerupSpawnTimer > spawnRate) {
            const powerupType = this.getRandomPowerupType();
            const powerup = new Powerup(this.canvas.width, powerupType);
            this.powerups.push(powerup);
            this.powerupSpawnTimer = 0;
        }
    }
    
    spawnTroopCarriers() {
        // Only spawn carriers in later levels (6+) and not too frequently
        if (this.chaosLevel < 6) return;
        
        this.troopCarrierTimer++;
        const spawnRate = 1800 - this.chaosLevel * 50; // 30-20 seconds depending on chaos level
        
        if (this.troopCarrierTimer > spawnRate) {
            // Don't spawn if there are already carriers on screen
            if (this.troopCarriers.length < 2) {
                this.troopCarriers.push(new TroopCarrier(
                    this.canvas.width + 60,
                    324 - 24 // Ground level minus carrier height
                ));
            }
            this.troopCarrierTimer = 0;
        }
    }
    
    getRandomEnemyType() {
        const types = ['grunt', 'fast', 'heavy'];
        if (this.chaosLevel > 3) types.push('exploder', 'teleporter', 'shield');
        if (this.chaosLevel > 5) types.push('flyer', 'spinner');
        if (this.chaosLevel > 6) types.push('mutant', 'glitcher');
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getRandomPowerupType() {
        const types = ['rapidfire', 'health'];
        if (this.chaosLevel > 2) types.push('multishot', 'timefreeze', 'spread_shot', 'spin_attack');
        if (this.chaosLevel > 4) types.push('laser', 'nuke', 'clone');
        if (this.chaosLevel > 6 && Math.random() < 0.3) types.push('shield'); // Shield powerup rare and high level only
        if (this.chaosLevel > 6) types.push('chaos', 'reality_break', 'god_mode', 'time_warp');
        if (this.chaosLevel > 8) types.push('black_hole', 'dimension_rift', 'matter_converter');
        
        // BIG BOY is rare and only appears at very high chaos levels
        if (this.chaosLevel >= 7 && Math.random() < 0.15) { // 15% chance at level 7+
            types.push('big_boy');
        }
        
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getPowerupDisplayName(type) {
        const names = {
            'rapidfire': 'RAPID FIRE',
            'shield': 'SHIELD',
            'health': 'HEALTH+',
            'spin_attack': 'SPIN ATTACK',
            'multishot': 'TRIPLE SHOT',
            'spread_shot': 'SPREAD GUN',
            'laser': 'LASER BEAM',
            'nuke': 'NUCLEAR BOMB',
            'clone': 'CLONE SHOT',
            'big_boy': 'BIG BOY',
            'timefreeze': 'TIME FREEZE',
            'god_mode': 'GOD MODE',
            'time_warp': 'TIME WARP',
            'black_hole': 'BLACK HOLE',
            'chaos': 'CHAOS ORB',
            'reality_break': 'REALITY BREAK',
            'dimension_rift': 'DIMENSION RIFT',
            'matter_converter': 'MATTER HACK',
            'shield_repair': 'SHIELD REPAIR'
        };
        return names[type] || type.toUpperCase();
    }
    
    addChaosEffect() {
        const effects = ['screen_shake', 'color_invert', 'heavy_gravity', 'speed_chaos'];
        if (this.chaosLevel > 5) effects.push('reality_glitch', 'dimension_shift');
        
        const effect = effects[Math.floor(Math.random() * effects.length)];
        this.chaosEffects.push({
            type: effect,
            duration: 300 + Math.random() * 300,
            intensity: this.chaosLevel
        });
    }
    
    showChaosLevelUp() {
        const chaosMessages = [
            'CHAOS LEVEL 2: ENEMIES GO WILD!',
            'CHAOS LEVEL 3: REALITY BENDS!',
            'CHAOS LEVEL 4: PHYSICS BREAK!',
            'CHAOS LEVEL 5: TOTAL MAYHEM!',
            'CHAOS LEVEL 6: MADNESS UNLEASHED!',
            'CHAOS LEVEL 7: DIMENSION FRACTURES!',
            'CHAOS LEVEL 8: REALITY COLLAPSES!',
            'CHAOS LEVEL 9: APOCALYPSE MODE!',
            'CHAOS LEVEL 10+: BEYOND COMPREHENSION!'
        ];
        
        let message;
        let description;
        
        if (this.chaosLevel <= chaosMessages.length + 1) {
            message = chaosMessages[this.chaosLevel - 2];
        } else {
            message = `CHAOS LEVEL ${this.chaosLevel}: UNIVERSE ERROR!`;
        }
        
        // Add description of what this chaos level does
        const descriptions = [
            'Enemies move unpredictably',
            'Screen shakes and colors invert',
            'Gravity becomes stronger',
            'Multiple enemies spawn',
            'Reality glitches appear',
            'Time warps and distorts',
            'Enemies teleport and mutate',
            'Physics completely break',
            'All systems overloaded'
        ];
        
        if (this.chaosLevel <= descriptions.length + 1) {
            description = descriptions[this.chaosLevel - 2];
        } else {
            description = 'Unknown effects - proceed with caution';
        }
        
        this.floatingTexts.push(new FloatingText(
            this.canvas.width / 2,
            this.canvas.height / 2,
            message,
            'chaos_level'
        ));
        
        this.floatingTexts.push(new FloatingText(
            this.canvas.width / 2,
            this.canvas.height / 2 + 30,
            description,
            'chaos_description'
        ));
        
        // Add screen flash effect
        this.chaosEffects.push({
            type: 'screen_flash',
            duration: 30,
            intensity: this.chaosLevel
        });
    }
    
    applyChaosEffects() {
        for (let i = this.chaosEffects.length - 1; i >= 0; i--) {
            const effect = this.chaosEffects[i];
            effect.duration--;
            
            switch (effect.type) {
                case 'screen_shake':
                    this.ctx.save();
                    this.ctx.translate(
                        (Math.random() - 0.5) * effect.intensity,
                        (Math.random() - 0.5) * effect.intensity
                    );
                    break;
                case 'screen_flash':
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${effect.duration / 30 * 0.5})`;
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    break;
                case 'heavy_gravity':
                    // Applied in player physics update
                    break;
                case 'speed_chaos':
                    this.scrollSpeed = 2 + Math.sin(Date.now() * 0.01) * effect.intensity;
                    break;
            }
            
            if (effect.duration <= 0) {
                this.chaosEffects.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Player vs Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.player.collidesWith(this.enemies[i])) {
                if (!this.player.invincible) {
                    const damage = this.getEnemyDamage(this.enemies[i].type);
                    this.takeDamage(damage, this.enemies[i].x, this.enemies[i].y);
                    this.enemies.splice(i, 1);
                }
                continue;
            }
            
            // Enemies fire bullets at level 5+ (heavily reduced frequency)
            const firingRate = Math.min(0.001 * this.chaosLevel, 0.003); // Cap at 0.3% chance
            if (this.chaosLevel >= 5 && Math.random() < firingRate) {
                this.enemies[i].shoot();
            }
            
            // Bullets vs Enemies
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                if (this.bullets[j].collidesWith(this.enemies[i]) && this.enemies[i].spawnProtection <= 0) {
                    // Handle shield enemies first
                    if (this.enemies[i].type === 'shield' && this.enemies[i].shieldHealth > 0) {
                        this.enemies[i].shieldHealth--;
                        this.floatingTexts.push(new FloatingText(
                            this.enemies[i].x + this.enemies[i].width / 2,
                            this.enemies[i].y - 10,
                            'SHIELD HIT!',
                            'collected'
                        ));
                        // Remove bullet but don't kill enemy yet
                        if (!this.bullets[j].piercing) {
                            this.bullets.splice(j, 1);
                        }
                        continue;
                    }
                    
                    // Calculate damage based on bullet type
                    const damage = this.getPlayerBulletDamage(this.bullets[j]);
                    this.enemies[i].hp -= damage;
                    
                    // Show damage number
                    this.floatingTexts.push(new FloatingText(
                        this.enemies[i].x + this.enemies[i].width / 2,
                        this.enemies[i].y - 10,
                        '-' + damage,
                        'damage'
                    ));
                    
                    // Visual effects for different bullet types
                    if (this.bullets[j].explosive) {
                        for (let k = 0; k < 10; k++) {
                            this.particles.push(new Particle(this.enemies[i].x, this.enemies[i].y, 'nuke'));
                        }
                    } else if (this.bullets[j] instanceof BigBoyBullet) {
                        for (let k = 0; k < 15; k++) {
                            this.particles.push(new Particle(this.enemies[i].x, this.enemies[i].y, 'nuke'));
                        }
                    } else {
                        // Standard hit effect
                        for (let k = 0; k < 3; k++) {
                            this.particles.push(new Particle(this.enemies[i].x, this.enemies[i].y, 'hit'));
                        }
                    }
                    
                    // Check if enemy is dead
                    if (this.enemies[i].hp <= 0) {
                        this.score += this.enemies[i].points;
                        this.killCount++;
                        this.createExplosion(this.enemies[i].x, this.enemies[i].y);
                        
                        // Chance for shield repair drop
                        if (Math.random() < 0.02) { // 2% chance
                            this.powerups.push(new Powerup(this.enemies[i].x, 'shield_repair', this.enemies[i].y));
                        }
                        
                        // Handle explosive area damage
                        if (this.bullets[j].explosive) {
                            for (let k = this.enemies.length - 1; k >= 0; k--) {
                                if (k !== i && this.getDistance(this.enemies[i], this.enemies[k]) < 50) {
                                    // Skip area damage if target enemy has spawn protection
                                    if (this.enemies[k].spawnProtection > 0) {
                                        continue;
                                    }
                                    
                                    this.enemies[k].hp -= Math.floor(damage / 2); // Half damage to nearby enemies
                                    if (this.enemies[k].hp <= 0) {
                                        this.score += this.enemies[k].points;
                                        this.killCount++;
                                        this.createExplosion(this.enemies[k].x, this.enemies[k].y);
                                        this.enemies.splice(k, 1);
                                        if (k < i) i--; // Adjust index
                                    }
                                }
                            }
                        }
                        
                        // Screen shake from Big Boy bullets
                        if (this.bullets[j] instanceof BigBoyBullet) {
                            this.chaosEffects.push({
                                type: 'screen_shake',
                                duration: 20,
                                intensity: 5
                            });
                        }
                        
                        this.enemies.splice(i, 1);
                    }
                    
                    // Remove bullet if not piercing
                    if (!this.bullets[j].piercing) {
                        this.bullets.splice(j, 1);
                    }
                    break;
                }
            }
        }
        
        // Player Bullets vs Enemy Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (!this.bullets[i]) continue; // Safety check
            
            for (let j = this.enemyBullets.length - 1; j >= 0; j--) {
                if (!this.enemyBullets[j]) continue; // Safety check
                
                // Check collision between player bullet and enemy bullet
                if (this.bullets[i].x < this.enemyBullets[j].x + this.enemyBullets[j].width &&
                    this.bullets[i].x + this.bullets[i].width > this.enemyBullets[j].x &&
                    this.bullets[i].y < this.enemyBullets[j].y + this.enemyBullets[j].height &&
                    this.bullets[i].y + this.bullets[i].height > this.enemyBullets[j].y) {
                    
                    // Create small explosion effect
                    for (let k = 0; k < 5; k++) {
                        this.particles.push(new Particle(
                            this.enemyBullets[j].x + this.enemyBullets[j].width / 2,
                            this.enemyBullets[j].y + this.enemyBullets[j].height / 2,
                            'bullet_clash'
                        ));
                    }
                    
                    // Remove enemy bullet
                    this.enemyBullets.splice(j, 1);
                    
                    // Remove player bullet only if it's not piercing
                    if (!this.bullets[i].piercing) {
                        this.bullets.splice(i, 1);
                        break; // Exit inner loop since bullet is destroyed
                    }
                }
            }
        }
        
        // Player vs Enemy Bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            if (this.player.collidesWith(this.enemyBullets[i]) && !this.player.invincible) {
                const damage = this.getBulletDamage(this.enemyBullets[i].type);
                this.takeDamage(damage, this.enemyBullets[i].x, this.enemyBullets[i].y);
                this.enemyBullets.splice(i, 1);
            }
        }
        
        // Player vs Lava Pits
        let playerInLava = false;
        if (this.player.onGround) {
            for (let hole of this.groundHoles) {
                if (this.player.x + this.player.width > hole.x && 
                    this.player.x < hole.x + hole.width &&
                    this.player.y + this.player.height >= 324) { // Ground level
                    playerInLava = true;
                    
                    if (!this.player.inLava) {
                        this.player.inLava = true;
                        this.player.lavaContactTime = 0;
                        this.floatingTexts.push(new FloatingText(
                            this.player.x + this.player.width / 2,
                            this.player.y - 20,
                            'BURNING IN LAVA!',
                            'collected'
                        ));
                    }
                    
                    this.player.lavaContactTime++;
                    
                    // Take damage every 6 frames (0.1 seconds at 60fps)
                    if (this.player.lavaContactTime % 6 === 0 && !this.player.invincible) {
                        this.takeDamage(5, this.player.x, this.player.y);
                    }
                    
                    // Bounce away after 18 frames (0.3 seconds at 60fps)
                    if (this.player.lavaContactTime >= 18) {
                        // Push player away from lava center
                        const holeCenter = hole.x + hole.width / 2;
                        const playerCenter = this.player.x + this.player.width / 2;
                        const bounceDirection = playerCenter < holeCenter ? -1 : 1;
                        
                        this.player.vx = bounceDirection * 15; // Much stronger horizontal push
                        this.player.vy = -12; // Stronger upward bounce
                        this.player.spinVelocity = bounceDirection * 0.3; // Add spin effect
                        this.player.inLava = false;
                        this.player.lavaContactTime = 0;
                        
                        this.floatingTexts.push(new FloatingText(
                            this.player.x + this.player.width / 2,
                            this.player.y - 30,
                            'KNOCKED BACK!',
                            'collected'
                        ));
                    }
                    break; // Only process one lava pit collision at a time
                }
            }
        }
        
        // Reset lava state if not in contact
        if (!playerInLava && this.player.inLava) {
            this.player.inLava = false;
            this.player.lavaContactTime = 0;
        }
        
        // Bullets vs Troop Carriers
        for (let i = this.troopCarriers.length - 1; i >= 0; i--) {
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                if (this.bullets[j].collidesWith(this.troopCarriers[i])) {
                    const damage = this.getPlayerBulletDamage(this.bullets[j]);
                    const destroyed = this.troopCarriers[i].takeDamage(damage);
                    
                    // Show damage number
                    this.floatingTexts.push(new FloatingText(
                        this.troopCarriers[i].x + this.troopCarriers[i].width / 2,
                        this.troopCarriers[i].y - 10,
                        '-' + damage,
                        'damage'
                    ));
                    
                    // Remove bullet if not piercing
                    if (!this.bullets[j].piercing) {
                        this.bullets.splice(j, 1);
                    }
                    
                    // Remove carrier if destroyed
                    if (destroyed) {
                        this.score += 100; // More points for carrier
                        this.troopCarriers.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        // Player vs Powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            if (this.player.collidesWith(this.powerups[i])) {
                this.player.applyPowerup(this.powerups[i].type);
                this.createPowerupEffect(this.powerups[i].x, this.powerups[i].y);
                // Create floating text that moves up and fades
                this.floatingTexts.push(new FloatingText(
                    this.powerups[i].x + this.powerups[i].width / 2, 
                    this.powerups[i].y - 10, 
                    this.getPowerupDisplayName(this.powerups[i].type),
                    'collected'
                ));
                this.powerups.splice(i, 1);
            }
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, 'explosion'));
        }
    }
    
    createPowerupEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y, 'powerup'));
        }
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getEnemyDamage(enemyType) {
        switch (enemyType) {
            case 'grunt': return 15;
            case 'fast': return 12;
            case 'heavy': return 25;
            case 'exploder': return 30;
            case 'teleporter': return 20;
            default: return 10;
        }
    }
    
    getBulletDamage(bulletType) {
        switch (bulletType) {
            case 'basic': return 10;
            case 'fast': return 8;
            case 'homing': return 15;
            default: return 10;
        }
    }
    
    getPlayerBulletDamage(bullet) {
        // Determine damage based on bullet type/class
        if (bullet instanceof BigBoyBullet) {
            return 3; // High damage, slow rate of fire
        } else if (bullet instanceof LaserBullet) {
            return 2; // Medium damage, piercing
        } else if (bullet.explosive) {
            return 2; // Explosive bullets do more damage
        } else {
            return 1; // Standard bullet damage
        }
    }
    
    takeDamage(damage, x, y) {
        if (this.shieldHealth > 0) {
            // Shield absorbs damage
            this.shieldHealth = Math.max(0, this.shieldHealth - damage);
            
            // Shield visual effects
            for (let i = 0; i < Math.min(5, damage / 5); i++) {
                this.particles.push(new Particle(x, y, 'shield_hit'));
            }
            
            // Show damage number
            this.floatingTexts.push(new FloatingText(
                x, y - 10, `-${damage} SHIELD`, 'shield_damage'
            ));
            
            // Shield broken effect
            if (this.shieldHealth <= 0) {
                this.floatingTexts.push(new FloatingText(
                    this.player.x + this.player.width / 2,
                    this.player.y - 30,
                    'SHIELD BROKEN!',
                    'collected'
                ));
                // Add screen flash
                this.chaosEffects.push({
                    type: 'screen_flash',
                    duration: 15,
                    intensity: 3
                });
            }
        } else {
            // No shield - lose life
            this.lives--;
            // Spawn ghost animation
            this.ghosts.push(new Ghost(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2
            ));
            this.createExplosion(x, y);
            this.floatingTexts.push(new FloatingText(
                this.player.x + this.player.width / 2,
                this.player.y - 20,
                'LIFE LOST!',
                'collected'
            ));
        }
    }
    
    render() {
        // Clear canvas completely to prevent artifacts
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        
        // Apply chaos color effects
        const hasColorInvert = this.chaosEffects.some(e => e.type === 'color_invert');
        if (hasColorInvert) {
            // Flash red overlay instead of expensive filter
            this.ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.02) * 0.1;
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1.0;
        }
        
        this.renderBackground();
        this.renderGameObjects();
        
        if (hasColorInvert) {
            this.ctx.filter = 'none';
        }
        
        // Reset any transformations from chaos effects
        this.ctx.restore();
        this.ctx.save();
        
        this.renderUI();
        
        // Final reset to prevent accumulating transforms
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    renderBackground() {
        this.ctx.fillStyle = '#003300';
        for (let bg of this.background) {
            if (bg.type === 'tree') {
                this.ctx.fillRect(bg.x, bg.y, 8, 20);
                this.ctx.fillStyle = '#006600';
                this.ctx.fillRect(bg.x - 4, bg.y - 10, 16, 12);
                this.ctx.fillStyle = '#003300';
            } else {
                this.ctx.fillStyle = '#666666';
                this.ctx.fillRect(bg.x, bg.y + 15, 12, 8);
                this.ctx.fillStyle = '#003300';
            }
        }
    }
    
    renderGround() {
        // Draw ground
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(0, 324, this.canvas.width, this.canvas.height - 324);
        
        // Draw holes in ground
        this.ctx.fillStyle = '#000000';
        for (let hole of this.groundHoles) {
            hole.render(this.ctx);
        }
    }
    
    renderGameObjects() {
        this.player.render(this.ctx);
        
        this.renderGround();
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        this.troopCarriers.forEach(carrier => carrier.draw(this.ctx));
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        this.enemyBullets.forEach(bullet => bullet.render(this.ctx));
        this.powerups.forEach(powerup => {
            powerup.render(this.ctx);
            powerup.label.render(this.ctx);
        });
        this.portals.forEach(portal => portal.render(this.ctx));
        this.particles.forEach(particle => particle.render(this.ctx));
        this.ghosts.forEach(ghost => ghost.render(this.ctx));
        this.floatingTexts.forEach(text => text.render(this.ctx));
    }
    
    renderUI() {
        if (this.gameState === 'playing') {
            document.getElementById('score').textContent = this.score;
            document.getElementById('lives').textContent = this.lives;
            document.getElementById('chaosLevel').textContent = this.chaosLevel;
            document.getElementById('shieldHealth').textContent = this.shieldHealth;
            document.getElementById('killsToNext').textContent = this.killsForNextChaos - this.killCount;
            
            // Update active powerups display
            const activePowerups = [];
            for (let effect in this.player.powerupEffects) {
                const timeLeft = Math.ceil(this.player.powerupEffects[effect] / 60);
                activePowerups.push(`${this.getPowerupDisplayName(effect)} (${timeLeft}s)`);
            }
            document.getElementById('powerupList').textContent = activePowerups.length > 0 ? activePowerups.join(', ') : 'None';
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('gameCanvas').classList.add('hidden');
        document.getElementById('ui').classList.add('hidden');
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalChaos').textContent = this.chaosLevel;
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 16;
        this.height = 24;
        this.onGround = false;
        this.shootCooldown = 0;
        this.powerupEffects = {};
        this.invincible = false;
        this.godModeGun = false;
        this.originalWidth = this.width;
        this.originalHeight = this.height;
        this.sizeMultiplier = 1;
        this.pKeyPressed = false;
        this.oKeyPressed = false;
        this.iKeyPressed = false;
        this.uKeyPressed = false;
        this.yKeyPressed = false;
        this.tKeyPressed = false;
        this.lavaContactTime = 0;
        this.inLava = false;
        this.spinVelocity = 0;
        this.rotation = 0;
        this.spinAttackTimer = 0;
        this.currentWeaponName = 'BASIC RIFLE';
    }
    
    update(keys) {
        // Movement
        this.vx *= 0.8;
        if (keys['a'] || keys['ArrowLeft']) this.vx -= 0.8;
        if (keys['d'] || keys['ArrowRight']) this.vx += 0.8;
        
        // Jumping
        if ((keys['w'] || keys['ArrowUp'] || keys[' ']) && this.onGround) {
            this.vy = -12;
            this.onGround = false;
            
            // Spin attack powerup triggers on jump
            if (this.powerupEffects.spin_attack && this.spinAttackTimer <= 0) {
                this.spinVelocity = 0.4; // Fast spin when jumping
                this.spinAttackTimer = 60; // Spin for 1 second
                game.floatingTexts.push(new FloatingText(
                    this.x + this.width / 2,
                    this.y - 20,
                    'SPIN ATTACK!',
                    'collected'
                ));
            }
        }
        
        // Testing: Y key to give spin attack powerup
        if (keys['y']) {
            if (!this.yKeyPressed) {
                this.powerupEffects.spin_attack = 300; // Give spin attack powerup
                game.floatingTexts.push(new FloatingText(
                    this.x + this.width / 2,
                    this.y - 20,
                    'SPIN ATTACK GRANTED!',
                    'collected'
                ));
                this.yKeyPressed = true;
            }
        } else {
            this.yKeyPressed = false;
        }
        
        // Testing: P key to advance chaos level
        if (keys['p']) {
            if (!this.pKeyPressed) {
                game.chaosLevel++;
                game.killCount = 0;
                game.killsForNextChaos += Math.floor(game.chaosLevel * 5);
                game.addChaosEffect();
                game.showChaosLevelUp();
                this.pKeyPressed = true;
            }
        } else {
            this.pKeyPressed = false;
        }
        
        // Testing: O key to toggle invincibility
        if (keys['o']) {
            if (!this.oKeyPressed) {
                this.invincible = !this.invincible;
                game.floatingTexts.push(new FloatingText(
                    this.x + this.width / 2,
                    this.y - 20,
                    this.invincible ? 'INVINCIBLE ON' : 'INVINCIBLE OFF',
                    'debug'
                ));
                this.oKeyPressed = true;
            }
        } else {
            this.oKeyPressed = false;
        }
        
        // Testing: I key to toggle god mode gun
        if (keys['i']) {
            if (!this.iKeyPressed) {
                this.godModeGun = !this.godModeGun;
                game.floatingTexts.push(new FloatingText(
                    this.x + this.width / 2,
                    this.y - 20,
                    this.godModeGun ? 'GOD GUN ON' : 'GOD GUN OFF',
                    'debug'
                ));
                this.iKeyPressed = true;
            }
        } else {
            this.iKeyPressed = false;
        }
        
        // Testing: U key to toggle big boy mode
        if (keys['u']) {
            if (!this.uKeyPressed) {
                if (this.powerupEffects.big_boy) {
                    delete this.powerupEffects.big_boy;
                    game.floatingTexts.push(new FloatingText(
                        this.x + this.width / 2,
                        this.y - 20,
                        'BIG BOY OFF',
                        'debug'
                    ));
                } else {
                    this.powerupEffects.big_boy = 600; // 10 seconds for testing
                    game.floatingTexts.push(new FloatingText(
                        this.x + this.width / 2,
                        this.y - 20,
                        'BIG BOY ON',
                        'debug'
                    ));
                }
                this.uKeyPressed = true;
            }
        } else {
            this.uKeyPressed = false;
        }
        
        // Testing: T key to spawn troop carrier
        if (keys['t']) {
            if (!this.tKeyPressed) {
                game.troopCarriers.push(new TroopCarrier(
                    game.canvas.width + 60,
                    324 - 24 // Ground level minus carrier height
                ));
                game.floatingTexts.push(new FloatingText(
                    this.x + this.width / 2,
                    this.y - 20,
                    'CARRIER SPAWNED!',
                    'debug'
                ));
                this.tKeyPressed = true;
            }
        } else {
            this.tKeyPressed = false;
        }
        
        // Auto-fire (continuous shooting)
        if (this.shootCooldown <= 0) {
            if (this.powerupEffects.big_boy) {
                // Fire BIG BOY bullets
                const bigBoyBullet = new BigBoyBullet(
                    this.x + this.width,
                    this.y + this.height / 2 - 100
                );
                game.bullets.push(bigBoyBullet);
                this.shootCooldown = 45; // Much slower firing for big boys
            } else {
                // Normal bullet creation
                this.createBullets();
                this.shootCooldown = this.powerupEffects.rapidfire ? 3 : 15;
            }
        }
        
        // Physics - check for heavy gravity chaos effect
        let gravityStrength = 0.5;
        if (game.chaosEffects.some(effect => effect.type === 'heavy_gravity')) {
            gravityStrength = 1.2; // Much stronger gravity during chaos
        }
        this.vy += gravityStrength;
        this.x += this.vx;
        this.y += this.vy;
        
        // Ground collision
        if (this.y > 300) {
            this.y = 300;
            this.vy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Screen bounds
        this.x = Math.max(0, Math.min(this.x, 800 - this.width));
        
        if (this.shootCooldown > 0) this.shootCooldown--;
        
        // Update spin physics
        this.rotation += this.spinVelocity;
        
        // Handle spin attack
        if (this.spinAttackTimer > 0) {
            this.spinAttackTimer--;
            this.spinVelocity = 0.4; // Maintain fast spin during attack
            
            // Shoot bullets in all directions every 10 frames (reduced frequency for performance)
            if (this.spinAttackTimer % 10 === 0) {
                const bulletDirections = 8; // 8 directions
                
                // Handle Big Boy bullets separately (fewer but bigger)
                if (this.powerupEffects.big_boy) {
                    for (let i = 0; i < bulletDirections; i++) {
                        const angle = (i / bulletDirections) * Math.PI * 2;
                        const vx = Math.cos(angle) * 6; // Slightly slower for big bullets
                        const vy = Math.sin(angle) * 6;
                        
                        const bigBoyBullet = new BigBoyBullet(
                            this.x + this.width / 2 - 50,
                            this.y + this.height / 2 - 50
                        );
                        bigBoyBullet.vx = vx;
                        bigBoyBullet.vy = vy;
                        game.bullets.push(bigBoyBullet);
                    }
                } else {
                    // Regular bullets with all powerup combinations
                    for (let i = 0; i < bulletDirections; i++) {
                        const angle = (i / bulletDirections) * Math.PI * 2;
                        const vx = Math.cos(angle) * 8;
                        const vy = Math.sin(angle) * 8;
                        
                        // Determine bullet type
                        let bulletType = 'normal';
                        if (this.powerupEffects.laser) bulletType = 'laser';
                        
                        // Clone effect - multiply all bullets
                        const cloneCount = this.powerupEffects.clone ? 2 : 1;
                        
                        for (let clone = 0; clone < cloneCount; clone++) {
                            const cloneOffset = clone * 6;
                            
                            // Spread shot - create fan pattern in each direction
                            if (this.powerupEffects.spread_shot) {
                                for (let spread = -2; spread <= 2; spread++) {
                                    const spreadAngle = angle + (spread * 0.3); // 0.3 radian spread
                                    const spreadVx = Math.cos(spreadAngle) * 8;
                                    const spreadVy = Math.sin(spreadAngle) * 8;
                                    
                                    this.createSingleBullet(
                                        this.x + this.width / 2 + cloneOffset,
                                        this.y + this.height / 2,
                                        bulletType,
                                        spreadVx - 8,
                                        spreadVy - 0
                                    );
                                }
                            } else {
                                // Single bullet per direction
                                this.createSingleBullet(
                                    this.x + this.width / 2 + cloneOffset,
                                    this.y + this.height / 2,
                                    bulletType,
                                    vx - 8,
                                    vy - 0
                                );
                            }
                            
                            // Multishot - additional bullets around each direction
                            if (this.powerupEffects.multishot) {
                                for (let multi = -1; multi <= 1; multi++) {
                                    if (multi === 0) continue; // Skip center (already created)
                                    
                                    if (this.powerupEffects.spread_shot) {
                                        // Spread + Multishot combo
                                        for (let spread = -2; spread <= 2; spread++) {
                                            const spreadAngle = angle + (spread * 0.3);
                                            const spreadVx = Math.cos(spreadAngle) * 8;
                                            const spreadVy = Math.sin(spreadAngle) * 8;
                                            
                                            this.createSingleBullet(
                                                this.x + this.width / 2 + cloneOffset,
                                                this.y + this.height / 2 + multi * 6,
                                                bulletType,
                                                spreadVx - 8,
                                                spreadVy + multi * 0.5
                                            );
                                        }
                                    } else {
                                        this.createSingleBullet(
                                            this.x + this.width / 2 + cloneOffset,
                                            this.y + this.height / 2 + multi * 6,
                                            bulletType,
                                            vx - 8,
                                            vy + multi * 0.5
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
                
                // God Mode / God Gun - additional chaos bullets
                if (this.powerupEffects.god_mode || this.godModeGun) {
                    for (let i = 0; i < bulletDirections; i++) {
                        const angle = (i / bulletDirections) * Math.PI * 2;
                        const vx = Math.cos(angle) * 10; // Faster chaos bullets
                        const vy = Math.sin(angle) * 10;
                        
                        this.createSingleBullet(
                            this.x + this.width / 2,
                            this.y + this.height / 2,
                            'chaos',
                            vx - 8,
                            vy - 0
                        );
                        
                        // Extra god gun effects
                        if (this.godModeGun) {
                            // Explosive bullets in each direction
                            let explosiveBullet = new Bullet(
                                this.x + this.width / 2, 
                                this.y + this.height / 2,
                                vx,
                                vy
                            );
                            explosiveBullet.explosive = true;
                            explosiveBullet.piercing = true;
                            game.bullets.push(explosiveBullet);
                        }
                    }
                }
            }
        } else {
            // Normal spin physics when not in spin attack
            this.spinVelocity *= 0.95; // Gradually slow down spin
            if (Math.abs(this.spinVelocity) < 0.01) {
                this.spinVelocity = 0;
                this.rotation = 0; // Reset to upright when spin stops
            }
        }
        
        // Update powerup timers
        for (let effect in this.powerupEffects) {
            this.powerupEffects[effect]--;
            if (this.powerupEffects[effect] <= 0) {
                if (effect === 'matter_converter') {
                    // Reset player size
                    this.sizeMultiplier = 1;
                    this.width = this.originalWidth;
                    this.height = this.originalHeight;
                }
                delete this.powerupEffects[effect];
            }
        }
    }
    
    render(ctx) {
        // Save context for rotation
        ctx.save();
        
        // Apply rotation if spinning
        if (this.rotation !== 0) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.rotation);
            ctx.translate(-centerX, -centerY);
        }
        
        // Human soldier with pixel art style
        let bodyColor = '#2d5a2d'; // Military green uniform
        if (this.invincible) {
            bodyColor = Math.sin(Date.now() * 0.01) > 0 ? '#ff00ff' : '#00ffff';
        } else if (this.powerupEffects.matter_converter) {
            bodyColor = Math.sin(Date.now() * 0.02) > 0 ? '#00ff00' : '#0088ff';
        } else if (window.game && window.game.shieldHealth > 75) {
            bodyColor = '#2d5a5a';
        } else if (window.game && window.game.shieldHealth > 25) {
            bodyColor = '#5a5a2d';
        } else if (window.game && window.game.shieldHealth > 0) {
            bodyColor = '#5a2d2d';
        }
        
        // Body (torso)
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x + 2, this.y + 8, 12, 10);
        
        // Head
        ctx.fillStyle = '#ffdbac'; // Skin tone
        ctx.fillRect(this.x + 4, this.y + 2, 8, 8);
        
        // Hair
        ctx.fillStyle = '#8b4513'; // Brown hair
        ctx.fillRect(this.x + 5, this.y + 1, 6, 3);
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 6, this.y + 4, 1, 1);
        ctx.fillRect(this.x + 9, this.y + 4, 1, 1);
        
        // Arms
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x + 1, this.y + 10, 2, 6); // Left arm
        ctx.fillRect(this.x + 13, this.y + 10, 2, 6); // Right arm
        
        // Legs
        ctx.fillStyle = '#1a4d1a'; // Darker green pants
        ctx.fillRect(this.x + 4, this.y + 18, 3, 6); // Left leg
        ctx.fillRect(this.x + 9, this.y + 18, 3, 6); // Right leg
        
        // Boots
        ctx.fillStyle = '#4d2d1a'; // Brown boots
        ctx.fillRect(this.x + 4, this.y + 22, 3, 2);
        ctx.fillRect(this.x + 9, this.y + 22, 3, 2);
        
        // Gun
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x + this.width, this.y + 10, 8, 3);
        
        // Equipment belt
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x + 2, this.y + 16, 12, 2);
        
        // Shield percentage over head
        const shieldPercent = Math.round((window.game.shieldHealth / window.game.maxShieldHealth) * 100);
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        
        // Color based on shield level
        if (shieldPercent > 75) {
            ctx.fillStyle = '#00ff00'; // Green for high shield
        } else if (shieldPercent > 50) {
            ctx.fillStyle = '#ffff00'; // Yellow for medium shield  
        } else if (shieldPercent > 25) {
            ctx.fillStyle = '#ff8800'; // Orange for low shield
        } else {
            ctx.fillStyle = '#ff0000'; // Red for very low shield
        }
        
        // Black outline for readability
        ctx.fillStyle = '#000000';
        ctx.fillText(`${shieldPercent}%`, this.x + this.width / 2 - 1, this.y - 5 - 1);
        ctx.fillText(`${shieldPercent}%`, this.x + this.width / 2 + 1, this.y - 5 - 1);
        ctx.fillText(`${shieldPercent}%`, this.x + this.width / 2 - 1, this.y - 5 + 1);
        ctx.fillText(`${shieldPercent}%`, this.x + this.width / 2 + 1, this.y - 5 + 1);
        
        // Color text based on shield level
        if (shieldPercent > 75) {
            ctx.fillStyle = '#00ff00';
        } else if (shieldPercent > 50) {
            ctx.fillStyle = '#ffff00';
        } else if (shieldPercent > 25) {
            ctx.fillStyle = '#ff8800';
        } else {
            ctx.fillStyle = '#ff0000';
        }
        
        ctx.fillText(`${shieldPercent}%`, this.x + this.width / 2, this.y - 5);
        ctx.textAlign = 'left'; // Reset text align
        
        // Restore context after rotation
        ctx.restore();
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    
    getWeaponName() {
        const effects = this.powerupEffects;
        let name = '';
        
        // Check for specific powerful combinations first
        if (effects.big_boy && effects.laser && effects.multishot && effects.spread_shot) {
            name = 'COSMIC DEVASTATOR';
        } else if (effects.god_mode || this.godModeGun) {
            if (effects.spin_attack) name = 'CHAOS WHIRLWIND';
            else if (effects.laser) name = 'DIVINE ANNIHILATOR';
            else name = 'GOD\'S WRATH';
        } else if (effects.spin_attack) {
            if (effects.big_boy) name = 'TITAN CYCLONE';
            else if (effects.laser && effects.multishot) name = 'PLASMA TORNADO';
            else if (effects.laser) name = 'LASER VORTEX';
            else if (effects.multishot && effects.spread_shot) name = 'BULLET HURRICANE';
            else if (effects.spread_shot) name = 'SCATTER STORM';
            else if (effects.multishot) name = 'TRIPLE TWISTER';
            else name = 'SPIN CANNON';
        } else if (effects.big_boy) {
            if (effects.laser) name = 'MEGA BEAM CANNON';
            else if (effects.multishot) name = 'TRIPLE DESTROYER';
            else name = 'BIG BOY LAUNCHER';
        } else if (effects.laser) {
            if (effects.multishot && effects.spread_shot) name = 'PRISM DEVASTATOR';
            else if (effects.multishot) name = 'TRIPLE LASER';
            else if (effects.spread_shot) name = 'LASER SHOTGUN';
            else if (effects.clone) name = 'TWIN BEAM';
            else name = 'LASER RIFLE';
        } else if (effects.multishot && effects.spread_shot) {
            if (effects.clone) name = 'QUAD STORM';
            else name = 'SPREAD TRIPLER';
        } else if (effects.multishot) {
            if (effects.clone) name = 'SEXTUPLE SHOT';
            else name = 'TRIPLE SHOT';
        } else if (effects.spread_shot) {
            if (effects.clone) name = 'TWIN SHOTGUN';
            else name = 'SCATTER GUN';
        } else if (effects.clone) {
            name = 'TWIN RIFLE';
        } else if (effects.rapidfire) {
            name = 'RAPID RIFLE';
        } else {
            name = 'BASIC RIFLE';
        }
        
        return name;
    }
    
    updateWeaponName() {
        const newName = this.getWeaponName();
        if (newName !== this.currentWeaponName) {
            this.currentWeaponName = newName;
            game.floatingTexts.push(new FloatingText(
                this.x + this.width / 2,
                this.y - 40,
                newName,
                'weapon_name'
            ));
        }
    }
    
    applyPowerup(type) {
        const chaosMultiplier = Math.max(1, game.chaosLevel * 0.5);
        
        switch (type) {
            case 'rapidfire':
                this.powerupEffects.rapidfire = Math.floor(300 * chaosMultiplier);
                break;
            case 'spin_attack':
                this.powerupEffects.spin_attack = Math.floor(180 * chaosMultiplier);
                break;
            case 'shield':
                const shieldBoost = 50;
                window.game.shieldHealth = Math.min(window.game.maxShieldHealth, window.game.shieldHealth + shieldBoost);
                game.floatingTexts.push(new FloatingText(
                    this.x + this.width / 2,
                    this.y - 20,
                    `+${shieldBoost} SHIELD`,
                    'shield_repair_text'
                ));
                break;
            case 'health':
                game.lives += Math.floor(1 + game.chaosLevel / 5);
                break;
            case 'multishot':
                this.powerupEffects.multishot = Math.floor(450 * chaosMultiplier);
                break;
            case 'spread_shot':
                this.powerupEffects.spread_shot = Math.floor(400 * chaosMultiplier);
                break;
            case 'laser':
                this.powerupEffects.laser = Math.floor(300 * chaosMultiplier);
                break;
            case 'nuke':
                this.triggerNuke();
                break;
            case 'clone':
                this.powerupEffects.clone = Math.floor(600 * chaosMultiplier);
                break;
            case 'big_boy':
                this.powerupEffects.big_boy = 600; // Fixed 10 seconds (600 frames at 60fps)
                break;
            case 'god_mode':
                this.powerupEffects.god_mode = 180;
                this.powerupEffects.rapidfire = 180;
                this.powerupEffects.shield = 180;
                break;
            case 'time_warp':
                this.powerupEffects.time_warp = 300;
                break;
            case 'black_hole':
                this.triggerBlackHole();
                break;
            case 'dimension_rift':
                this.triggerDimensionRift();
                break;
            case 'matter_converter':
                this.triggerMatterConverter();
                break;
            case 'shield_repair':
                const repairAmount = 25 + game.chaosLevel * 5;
                window.game.shieldHealth = Math.min(window.game.maxShieldHealth, window.game.shieldHealth + repairAmount);
                game.floatingTexts.push(new FloatingText(
                    this.x + this.width / 2,
                    this.y - 20,
                    `+${repairAmount} SHIELD`,
                    'shield_repair_text'
                ));
                break;
            case 'chaos':
                game.addChaosEffect();
                game.score += 100 * game.chaosLevel;
                break;
        }
        
        // Update weapon name after applying any powerup
        this.updateWeaponName();
    }
    
    triggerNuke() {
        for (let i = 0; i < 50; i++) {
            game.particles.push(new Particle(400, 200, 'nuke'));
        }
        game.enemies = [];
        game.score += 500 * game.chaosLevel;
    }
    
    triggerBlackHole() {
        this.powerupEffects.black_hole = 180;
        for (let enemy of game.enemies) {
            enemy.vx -= 5;
            enemy.vy -= 2;
        }
    }
    
    triggerDimensionRift() {
        // Create multiple portals that warp bullet trajectories
        for (let i = 0; i < 5; i++) {
            game.portals.push(new Portal(
                100 + Math.random() * 600,
                100 + Math.random() * 200,
                'dimension_rift'
            ));
        }
        
        game.floatingTexts.push(new FloatingText(
            400, 200, 'DIMENSION RIFTS OPENED!', 'collected'
        ));
    }
    
    triggerMatterConverter() {
        // Convert all enemies to powerups
        const enemyCount = game.enemies.length;
        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            // Create powerup at enemy location
            const powerupType = game.getRandomPowerupType();
            game.powerups.push(new Powerup(enemy.x, powerupType, enemy.y));
            game.enemies.splice(i, 1);
        }
        
        // Make player bigger temporarily
        this.sizeMultiplier = 2;
        this.width = this.originalWidth * this.sizeMultiplier;
        this.height = this.originalHeight * this.sizeMultiplier;
        this.powerupEffects.matter_converter = 600;
        
        game.score += enemyCount * 50;
        game.floatingTexts.push(new FloatingText(
            400, 200, 'MATTER CONVERTED!', 'collected'
        ));
    }
    
    triggerBigBoy() {
        // Create a massive slow-moving bullet
        game.bullets.push(new BigBoyBullet(this.x + this.width, this.y + this.height / 2));
        
        game.floatingTexts.push(new FloatingText(
            this.x + this.width / 2,
            this.y - 30,
            'BIG BOY DEPLOYED!',
            'collected'
        ));
    }
    
    createBullets() {
        const hasLaser = this.powerupEffects.laser;
        const hasMultishot = this.powerupEffects.multishot;
        const hasSpread = this.powerupEffects.spread_shot;
        const hasClone = this.powerupEffects.clone;
        
        let bulletCount = 1;
        let spreadPattern = false;
        let tripleShot = false;
        let bulletType = 'normal';
        
        // Determine bullet type and pattern
        if (hasLaser) bulletType = 'laser';
        if (hasMultishot) tripleShot = true;
        if (hasSpread) spreadPattern = true;
        if (hasClone) bulletCount *= 2;
        
        // Create bullets based on combinations
        for (let clone = 0; clone < bulletCount; clone++) {
            const cloneOffset = clone * 8;
            
            if (tripleShot && spreadPattern) {
                // Triple spread combo: 3x5 grid of bullets
                for (let row = 0; row < 3; row++) {
                    for (let col = -2; col <= 2; col++) {
                        this.createSingleBullet(
                            this.x + this.width + cloneOffset,
                            this.y + this.height / 2 + (row - 1) * 8,
                            bulletType,
                            col * 2,
                            (row - 1) * 1.5
                        );
                    }
                }
            } else if (tripleShot) {
                // Triple shot: 3 bullets vertically
                for (let i = -1; i <= 1; i++) {
                    this.createSingleBullet(
                        this.x + this.width + cloneOffset,
                        this.y + this.height / 2 + i * 8,
                        bulletType,
                        0,
                        i * 0.5
                    );
                }
            } else if (spreadPattern) {
                // Spread shot: 5 bullets in fan
                for (let i = -2; i <= 2; i++) {
                    this.createSingleBullet(
                        this.x + this.width + cloneOffset,
                        this.y + this.height / 2,
                        bulletType,
                        0,
                        i * 2
                    );
                }
            } else {
                // Single bullet
                this.createSingleBullet(
                    this.x + this.width + cloneOffset,
                    this.y + this.height / 2,
                    bulletType,
                    0,
                    0
                );
            }
        }
        
        // God mode creates chaos bullets
        if (this.powerupEffects.god_mode || this.godModeGun) {
            for (let i = 0; i < 3; i++) {
                this.createSingleBullet(
                    this.x + this.width,
                    this.y + this.height / 2 + (Math.random() - 0.5) * 20,
                    'chaos',
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 6
                );
            }
        }
        
        // God mode gun adds extra effects
        if (this.godModeGun) {
            // Spread laser chaos
            for (let i = -2; i <= 2; i++) {
                this.createSingleBullet(
                    this.x + this.width,
                    this.y + this.height / 2,
                    'laser',
                    0,
                    i * 2
                );
            }
            // Explosive bullets
            for (let i = 0; i < 2; i++) {
                let bullet = new Bullet(this.x + this.width, this.y + this.height / 2 + (i - 0.5) * 10);
                bullet.explosive = true;
                bullet.piercing = true;
                game.bullets.push(bullet);
            }
        }
    }
    
    createSingleBullet(x, y, type, vxMod = 0, vyMod = 0) {
        let bullet;
        
        switch (type) {
            case 'laser':
                bullet = new LaserBullet(x, y);
                break;
            case 'chaos':
                bullet = new ChaosBullet(x, y);
                break;
            default:
                bullet = new Bullet(x, y);
                break;
        }
        
        bullet.vx += vxMod;
        bullet.vy = vyMod;
        
        // Apply powerup modifiers
        if (this.powerupEffects.nuke && Math.random() < 0.1) {
            bullet.explosive = true;
        }
        
        if (this.powerupEffects.time_warp) {
            bullet.vx *= 1.5;
        }
        
        game.bullets.push(bullet);
    }
}

class Enemy {
    constructor(x, type, yOffset = 0, customY = null) {
        this.x = x;
        this.type = type;
        this.width = 16;
        this.height = 16;
        this.vx = -2 - game.chaosLevel * 0.2;
        this.vy = 0;
        this.points = 10;
        this.yOffset = yOffset;
        this.customY = customY;
        this.chaosTimer = 0;
        this.baseVx = this.vx;
        this.baseVy = this.vy;
        this.wiggleTimer = Math.random() * 60;
        this.jumpTimer = Math.random() * 120;
        this.spawnProtection = 30; // 0.5 seconds at 60fps
        this.playerSeekingMode = false;
        this.animationTimer = 0;
        this.variant = Math.floor(Math.random() * 3); // 0, 1, or 2 for visual variety
        this.shootCooldown = 0;
        
        switch (type) {
            case 'grunt':
                this.y = this.customY || (324 - this.height - this.yOffset);
                this.color = '#ff4444';
                break;
            case 'fast':
                this.y = this.customY || (324 - this.height - this.yOffset);
                this.vx = -4 - game.chaosLevel * 0.3;
                this.color = '#ff8844';
                this.points = 15;
                break;
            case 'heavy':
                this.y = this.customY || (324 - this.height - this.yOffset);
                this.width = 20;
                this.height = 20;
                this.vx = -1 - game.chaosLevel * 0.1;
                this.color = '#ff0000';
                this.points = 25;
                break;
            case 'exploder':
                this.y = this.customY || (324 - this.height - this.yOffset);
                this.color = '#ffff00';
                this.points = 30;
                break;
            case 'teleporter':
                this.y = this.customY || (250 + Math.random() * 100 - this.yOffset);
                this.color = '#ff00ff';
                this.teleportTimer = 60 + Math.random() * 60;
                this.points = 40;
                break;
            case 'flyer':
                this.y = this.customY || (100 + Math.random() * 100 - this.yOffset);
                this.color = '#44ff44';
                this.vx = -1.5 - game.chaosLevel * 0.15;
                this.vy = Math.sin(Date.now() * 0.01) * 2;
                this.points = 35;
                this.bombCooldown = 120; // 2 seconds
                break;
            case 'shield':
                this.y = this.customY || (324 - this.height - this.yOffset);
                this.color = '#4444ff';
                this.points = 50;
                this.shieldHealth = 3; // Shield must be hit 3 times
                this.maxShieldHealth = 3;
                break;
            case 'spinner':
                this.y = this.customY || (250 + Math.random() * 100 - this.yOffset);
                this.color = '#ff44ff';
                this.points = 60;
                this.rotation = 0;
                this.spinSpeed = 0.2;
                this.shootTimer = 0;
                this.shootInterval = 80; // Shoot every 80 frames (50% slower)
                break;
        }
        
        // Set HP based on enemy type for balanced gameplay
        this.maxHP = this.getMaxHPForType(type);
        this.hp = this.maxHP;
    }
    
    getMaxHPForType(type) {
        switch (type) {
            case 'grunt': return 1;     // Basic cannon fodder
            case 'fast': return 1;      // Fast but fragile
            case 'heavy': return 3;     // Armored unit
            case 'exploder': return 2;  // Medium durability
            case 'teleporter': return 2; // Medium durability
            case 'shield': return 2;    // 2 HP + 3 shield hits = 5 total
            case 'flyer': return 2;     // Flying unit
            case 'spinner': return 4;   // Toughest regular enemy
            default: return 1;
        }
    }
    
    updateMovementPattern(chaosIntensity) {
        // Initialize movement pattern if not set
        if (!this.movementPattern) {
            this.movementPattern = this.getRandomMovementPattern();
            this.patternTimer = 0;
            this.patternDuration = 180 + Math.random() * 120; // 3-5 seconds
        }
        
        this.patternTimer++;
        
        // Change pattern periodically
        if (this.patternTimer > this.patternDuration) {
            this.movementPattern = this.getRandomMovementPattern();
            this.patternTimer = 0;
            this.patternDuration = 180 + Math.random() * 120;
        }
        
        // Apply current movement pattern
        switch (this.movementPattern) {
            case 'sine_wave':
                // Reduced vertical movement for ground enemies
                const verticalPower = this.type === 'flyer' ? 2 : 1;
                this.vy += Math.sin(this.patternTimer * 0.05) * verticalPower * (1 + chaosIntensity) * 0.3;
                break;
                
            case 'zigzag':
                // Ground enemies do smaller zigzag movements
                const zigzagPower = this.type === 'flyer' ? 1.5 : 0.8;
                if (this.patternTimer % 40 < 20) {
                    this.vy += zigzagPower + chaosIntensity * 0.5;
                } else {
                    this.vy -= zigzagPower + chaosIntensity * 0.5;
                }
                break;
                
            case 'spiral':
                const radius = 30 + chaosIntensity * 20;
                const spiralPower = this.type === 'flyer' ? 3 : 1.5;
                this.vy += Math.sin(this.patternTimer * 0.08) * spiralPower * 0.4;
                this.vx += Math.cos(this.patternTimer * 0.08) * 1 * 0.3;
                break;
                
            case 'aggressive':
                // Move toward player position
                const player = game.player;
                if (player) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 50) {
                        this.vy += (dy / distance) * 0.5 * (1 + chaosIntensity);
                        this.vx += (dx / distance) * 0.3;
                    }
                }
                break;
                
            case 'erratic':
                if (this.patternTimer % 20 === 0) {
                    const erraticPower = this.type === 'flyer' ? 4 : 2;
                    this.vy += (Math.random() - 0.5) * erraticPower * (1 + chaosIntensity) * 0.6;
                    this.vx += (Math.random() - 0.5) * 2;
                }
                break;
                
            case 'bouncy':
                if (this.patternTimer % 45 === 0) {
                    this.vy = -2 - Math.random() * 3;
                }
                break;
                
            case 'hovering':
                const hoverY = 200 + Math.sin(this.patternTimer * 0.03) * 50;
                const currentY = this.y + this.height / 2;
                this.vy += (hoverY - currentY) * 0.02;
                break;
                
            case 'straight':
            default:
                // Basic straight movement with slight wobble
                this.vy += Math.sin(this.patternTimer * 0.02) * 0.5;
                break;
        }
        
        // Type-specific movement modifications
        this.applyTypeSpecificMovement(chaosIntensity);
    }
    
    getRandomMovementPattern() {
        const patterns = ['sine_wave', 'zigzag', 'spiral', 'aggressive', 'erratic', 'bouncy', 'hovering', 'straight'];
        
        // Some enemy types prefer certain patterns
        switch (this.type) {
            case 'fast':
                return Math.random() < 0.4 ? 'aggressive' : patterns[Math.floor(Math.random() * patterns.length)];
            case 'flyer':
                return Math.random() < 0.3 ? 'hovering' : ['sine_wave', 'spiral', 'erratic'][Math.floor(Math.random() * 3)];
            case 'heavy':
                return Math.random() < 0.6 ? 'straight' : ['bouncy', 'zigzag'][Math.floor(Math.random() * 2)];
            case 'teleporter':
                return ['erratic', 'spiral', 'aggressive'][Math.floor(Math.random() * 3)];
            default:
                return patterns[Math.floor(Math.random() * patterns.length)];
        }
    }
    
    applyTypeSpecificMovement(chaosIntensity) {
        switch (this.type) {
            case 'fast':
                // Fast enemies move more aggressively
                this.vx += Math.sin(this.patternTimer * 0.1) * 0.5;
                if (Math.random() < 0.02 * (1 + chaosIntensity)) {
                    this.vy += (Math.random() - 0.5) * 8;
                }
                break;
                
            case 'heavy':
                // Heavy enemies are more predictable but can charge
                if (Math.random() < 0.008 * (1 + chaosIntensity)) {
                    this.vx = this.baseVx - 2; // Temporary speed boost
                }
                break;
                
            case 'exploder':
                // Exploders get increasingly unstable
                if (Math.random() < 0.015 * (1 + chaosIntensity)) {
                    this.vy += (Math.random() - 0.5) * 6;
                    this.vx += (Math.random() - 0.5) * 3;
                }
                break;
                
            case 'spinner':
                // Spinners have circular movement
                this.vy += Math.sin(this.patternTimer * 0.1) * 1.5;
                break;
        }
    }
    
    update() {
        this.chaosTimer++;
        this.wiggleTimer++;
        this.jumpTimer++;
        
        // Handle launched enemies (from troop carrier)
        if (this.launched && this.launchTime > 0) {
            this.launchTime--;
            // Use launch trajectory instead of normal movement
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.4; // Stronger gravity for better arcs
            
            // Add air resistance for more realistic physics
            this.vx *= 0.995;
            this.vy *= 0.998;
            
            // Create trail particles while airborne
            if (Math.random() < 0.3 && game.particles.length < game.maxParticles) {
                game.particles.push(new Particle(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 6,
                    this.y + this.height / 2 + (Math.random() - 0.5) * 6,
                    'bullet_spark'
                ));
            }
            
            // Check if hit ground with bounce effect
            if (this.y > 324 - this.height) {
                this.y = 324 - this.height;
                this.launched = false;
                this.vy = 0;
                
                // Create landing particles
                for (let i = 0; i < 5; i++) {
                    game.particles.push(new Particle(
                        this.x + this.width / 2,
                        this.y + this.height,
                        'explosion'
                    ));
                }
                
                // Resume normal enemy behavior with modified speed
                this.vx = -1 - game.chaosLevel * 0.1;
                
                // Small screen shake on landing
                if (Math.abs(this.vx) > 2) {
                    game.chaosEffects.push({
                        type: 'screen_shake',
                        duration: 5,
                        intensity: 2
                    });
                }
            }
            return; // Skip normal update logic while launched
        }
        
        // Reduce spawn protection
        if (this.spawnProtection > 0) {
            this.spawnProtection--;
        }
        
        // Base chaos level affects all enemies
        const chaosIntensity = game.chaosLevel * 0.1;
        
        // Enhanced dynamic movement based on enemy type
        this.updateMovementPattern(chaosIntensity);
        
        // Global chaos effects (applied to all enemies)
        if (Math.random() < chaosIntensity * 0.015) {
            // Sudden direction change
            this.vy += (Math.random() - 0.5) * 6;
            this.vx += (Math.random() - 0.5) * 3;
        }
        
        // Chaotic jumping with more variety
        if (this.jumpTimer > 60 && Math.random() < chaosIntensity * 0.04) {
            const jumpPower = 2 + Math.random() * 4;
            this.vy = -jumpPower;
            this.jumpTimer = 0;
        }
        
        // Type-specific chaos behaviors
        if (this.type === 'teleporter') {
            this.teleportTimer--;
            if (this.teleportTimer <= 0) {
                this.x -= 50 + Math.random() * 100;
                this.y += (Math.random() - 0.5) * 100;
                this.teleportTimer = 60;
            }
        }
        
        if (this.type === 'fast') {
            // Fast enemies get extra erratic at high chaos
            if (Math.random() < chaosIntensity * 0.05) {
                this.vx = this.baseVx + (Math.random() - 0.5) * 6;
            }
        }
        
        if (this.type === 'exploder') {
            // Exploders get increasingly unstable
            if (Math.random() < chaosIntensity * 0.01) {
                this.vx += (Math.random() - 0.5) * 2;
                this.vy += (Math.random() - 0.5) * 3;
            }
        }
        
        if (this.type === 'heavy') {
            // Heavy enemies resist some chaos but still affected
            if (Math.random() < chaosIntensity * 0.008) {
                this.vy = (Math.random() - 0.5) * 2;
            }
        }
        
        // New enemy type behaviors
        if (this.type === 'flyer') {
            // Flyers have sine wave movement and drop bombs
            this.vy = Math.sin(this.chaosTimer * 0.05) * 2;
            this.bombCooldown--;
            if (this.bombCooldown <= 0 && game.chaosLevel >= 5) {
                // Drop bomb directly below
                game.enemyBullets.push(new EnemyBullet(
                    this.x + this.width / 2,
                    this.y + this.height,
                    'bomb'
                ));
                this.bombCooldown = 120 + Math.random() * 60; // 2-3 seconds
            }
        }
        
        if (this.type === 'spinner') {
            // Spinners rotate and shoot in all directions
            this.rotation += this.spinSpeed;
            this.shootTimer++;
            
            if (this.shootTimer >= this.shootInterval) {
                // Shoot bullets in 3 directions (50% reduction from 6)
                const directions = 3;
                for (let i = 0; i < directions; i++) {
                    const angle = (i / directions) * Math.PI * 2 + this.rotation;
                    const vx = Math.cos(angle) * 3;
                    const vy = Math.sin(angle) * 3;
                    
                    const bullet = new EnemyBullet(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        'basic'
                    );
                    bullet.vx = vx;
                    bullet.vy = vy;
                    game.enemyBullets.push(bullet);
                }
                this.shootTimer = 0;
            }
        }
        
        // Player-seeking behavior starts at level 2, increases with level
        const seekChance = Math.max(0, (game.chaosLevel - 1) * 0.01);
        if (Math.random() < seekChance) {
            this.playerSeekingMode = !this.playerSeekingMode;
        }
        
        if (this.playerSeekingMode && game.chaosLevel >= 2) {
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const seekSpeed = 0.5 + (game.chaosLevel - 2) * 0.2;
                this.vx += (dx / distance) * seekSpeed * 0.05;
                this.vy += (dy / distance) * seekSpeed * 0.05;
            }
        }
        
        // Apply gravity and damping
        this.vy += 0.2; // Gravity
        this.vy *= 0.95; // Air resistance
        this.vx *= 0.98; // Slight horizontal damping
        
        // Keep some forward momentum (but allow seeking to override)
        if (this.vx > -0.5 && !this.playerSeekingMode) {
            this.vx = Math.min(this.vx - 0.1, this.baseVx);
        }
        
        // Ground collision
        if (this.y > 308 - this.yOffset) {
            this.y = 308 - this.yOffset;
            this.vy = 0;
            // Chance to bounce on ground at high chaos
            if (Math.random() < chaosIntensity * 0.02) {
                this.vy = -2 - Math.random() * 2;
            }
        }
        
        // Enhanced movement constraints and damping
        this.applyMovementConstraints();
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.shootCooldown > 0) this.shootCooldown--;
    }
    
    applyMovementConstraints() {
        // Velocity damping to prevent runaway speeds
        this.vx *= 0.98;
        this.vy *= 0.95;
        
        // Velocity limits
        const maxVx = 8;
        const maxVy = 6;
        this.vx = Math.max(-maxVx, Math.min(maxVx, this.vx));
        this.vy = Math.max(-maxVy, Math.min(maxVy, this.vy));
        
        // Screen boundary constraints
        const screenTop = 50;
        const screenBottom = 350;
        const margin = 20;
        
        // Top boundary
        if (this.y < screenTop) {
            this.y = screenTop;
            this.vy = Math.abs(this.vy) * 0.8; // Bounce with energy loss
        }
        
        // Bottom boundary
        if (this.y + this.height > screenBottom) {
            this.y = screenBottom - this.height;
            this.vy = -Math.abs(this.vy) * 0.8;
        }
        
        // Side boundaries (prevent moving too far right)
        if (this.x > 850) {
            this.x = 850;
            this.vx = Math.min(this.vx, 0);
        }
        
        // Ground collision for non-flying enemies
        const groundLevel = 324; // Adjusted to match actual ground level
        if (this.type !== 'flyer') {
            if (this.y + this.height >= groundLevel) {
                this.y = groundLevel - this.height;
                if (this.vy > 0) {
                    this.vy = -this.vy * 0.6; // Bounce with energy loss
                }
                // Ensure enemies stay grounded unless jumping
                if (Math.abs(this.vy) < 0.5) {
                    this.vy = 0; // Stop small bouncing
                }
            } else {
                // Apply stronger gravity to pull enemies down to ground
                this.vy += 0.3;
            }
        }
    }
    
    shoot() {
        if (this.shootCooldown <= 0 && game.chaosLevel >= 5) {
            const bulletType = this.getEnemyBulletType();
            game.enemyBullets.push(new EnemyBullet(
                this.x,
                this.y + this.height / 2,
                bulletType
            ));
            this.shootCooldown = 60 + Math.random() * 120; // 1-3 seconds
        }
    }
    
    getEnemyBulletType() {
        if (game.chaosLevel >= 8) {
            const types = ['basic', 'fast', 'homing'];
            return types[Math.floor(Math.random() * types.length)];
        } else if (game.chaosLevel >= 6) {
            const types = ['basic', 'fast'];
            return types[Math.floor(Math.random() * types.length)];
        } else {
            return 'basic';
        }
    }
    
    render(ctx) {
        this.animationTimer++;
        const chaosIntensity = game.chaosLevel * 0.1;
        
        // Reduce visual chaos effects at very high levels for performance
        const effectIntensity = Math.min(chaosIntensity, 1.0); // Cap at level 10
        
        // Spawn protection visual effect
        let renderColor = this.color;
        if (this.spawnProtection > 0) {
            // Flash white during spawn protection
            renderColor = Math.sin(Date.now() * 0.05) > 0 ? '#ffffff' : this.color;
        } else if (Math.random() < effectIntensity * 0.03) { // Reduced frequency
            renderColor = '#ffffff';
        }
        
        // Slight jitter in rendering position at high chaos
        const jitterX = Math.random() < effectIntensity * 0.05 ? (Math.random() - 0.5) * 2 : 0;
        const jitterY = Math.random() < effectIntensity * 0.05 ? (Math.random() - 0.5) * 2 : 0;
        
        // Draw main body with variations
        ctx.fillStyle = renderColor;
        
        switch (this.type) {
            case 'grunt':
                this.renderGrunt(ctx, jitterX, jitterY);
                break;
            case 'fast':
                this.renderFast(ctx, jitterX, jitterY, chaosIntensity);
                break;
            case 'heavy':
                this.renderHeavy(ctx, jitterX, jitterY);
                break;
            case 'exploder':
                this.renderExploder(ctx, jitterX, jitterY);
                break;
            case 'teleporter':
                this.renderTeleporter(ctx, jitterX, jitterY);
                break;
            case 'flyer':
                this.renderFlyer(ctx, jitterX, jitterY);
                break;
            case 'shield':
                this.renderShield(ctx, jitterX, jitterY);
                break;
            case 'spinner':
                this.renderSpinner(ctx, jitterX, jitterY);
                break;
            default:
                ctx.fillRect(this.x + jitterX, this.y + jitterY, this.width, this.height);
                break;
        }
        
        // Eyes (sometimes crazy colors at high chaos)
        let eyeColor = '#ffffff';
        if (Math.random() < effectIntensity * 0.01) { // Reduced frequency
            eyeColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        }
        
        ctx.fillStyle = eyeColor;
        const eyeSize = this.type === 'heavy' ? 3 : 2;
        const eyeOffset = this.type === 'heavy' ? 4 : 3;
        
        // Animated blinking
        if (this.animationTimer % 120 < 110) {
            ctx.fillRect(this.x + eyeOffset + jitterX, this.y + 3 + jitterY, eyeSize, eyeSize);
            ctx.fillRect(this.x + this.width - eyeOffset - eyeSize + jitterX, this.y + 3 + jitterY, eyeSize, eyeSize);
        }
    }
    
    renderGrunt(ctx, jitterX, jitterY) {
        // Basic grunt with helmet variations
        ctx.fillRect(this.x + jitterX, this.y + jitterY, this.width, this.height);
        
        // Helmet variants
        ctx.fillStyle = '#1a1a1a';
        switch (this.variant) {
            case 0: // Standard helmet
                ctx.fillRect(this.x + 2 + jitterX, this.y - 2 + jitterY, 12, 6);
                break;
            case 1: // Spiked helmet
                ctx.fillRect(this.x + 2 + jitterX, this.y - 2 + jitterY, 12, 6);
                ctx.fillRect(this.x + 7 + jitterX, this.y - 4 + jitterY, 2, 2);
                break;
            case 2: // Wide brim helmet
                ctx.fillRect(this.x + 1 + jitterX, this.y - 2 + jitterY, 14, 6);
                break;
        }
        
        // Belt/gear
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x + 1 + jitterX, this.y + 10 + jitterY, this.width - 2, 2);
    }
    
    renderFast(ctx, jitterX, jitterY, chaosIntensity) {
        // Fast enemy with streamlined design
        ctx.fillRect(this.x + jitterX, this.y + jitterY, this.width, this.height);
        
        // Speed lines based on variant
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.6;
        
        switch (this.variant) {
            case 0: // Single trail
                ctx.fillRect(this.x + this.width + jitterX, this.y + 4 + jitterY, 6, 8);
                break;
            case 1: // Double trail
                ctx.fillRect(this.x + this.width + jitterX, this.y + 2 + jitterY, 8, 4);
                ctx.fillRect(this.x + this.width + jitterX, this.y + 10 + jitterY, 8, 4);
                break;
            case 2: // Wavy trail
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(this.x + this.width + i * 3 + jitterX, 
                               this.y + 6 + Math.sin(this.animationTimer * 0.2 + i) * 2 + jitterY, 2, 4);
                }
                break;
        }
        ctx.globalAlpha = 1;
        
        // Goggles
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x + 2 + jitterX, this.y + 2 + jitterY, 12, 4);
    }
    
    renderHeavy(ctx, jitterX, jitterY) {
        // Heavy enemy with armor variations
        ctx.fillRect(this.x + jitterX, this.y + jitterY, this.width, this.height);
        
        // Armor plating variants
        ctx.fillStyle = '#660000';
        switch (this.variant) {
            case 0: // Standard armor
                ctx.fillRect(this.x + 2 + jitterX, this.y + 6 + jitterY, this.width - 4, 8);
                break;
            case 1: // Segmented armor
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(this.x + 2 + jitterX, this.y + 6 + i * 3 + jitterY, this.width - 4, 2);
                }
                break;
            case 2: // Reinforced armor with spikes
                ctx.fillRect(this.x + 1 + jitterX, this.y + 6 + jitterY, this.width - 2, 8);
                // Spikes
                ctx.fillStyle = '#444444';
                ctx.fillRect(this.x + 4 + jitterX, this.y + 4 + jitterY, 2, 2);
                ctx.fillRect(this.x + 8 + jitterX, this.y + 4 + jitterY, 2, 2);
                ctx.fillRect(this.x + 12 + jitterX, this.y + 4 + jitterY, 2, 2);
                break;
        }
    }
    
    renderExploder(ctx, jitterX, jitterY) {
        // Exploder with pulsing effect
        const pulse = Math.sin(this.animationTimer * 0.3) * 2;
        ctx.fillRect(this.x + jitterX, this.y + jitterY, this.width + pulse, this.height + pulse);
        
        // Warning lights based on variant
        ctx.fillStyle = '#ff0000';
        switch (this.variant) {
            case 0: // Single warning light
                if (this.animationTimer % 30 < 15) {
                    ctx.fillRect(this.x + 7 + jitterX, this.y + 2 + jitterY, 2, 2);
                }
                break;
            case 1: // Double warning lights
                if (this.animationTimer % 20 < 10) {
                    ctx.fillRect(this.x + 4 + jitterX, this.y + 2 + jitterY, 2, 2);
                    ctx.fillRect(this.x + 10 + jitterX, this.y + 2 + jitterY, 2, 2);
                }
                break;
            case 2: // Hazard stripes
                ctx.fillStyle = '#ffff00';
                for (let i = 0; i < 3; i++) {
                    if ((this.animationTimer + i * 10) % 20 < 10) {
                        ctx.fillRect(this.x + i * 4 + 2 + jitterX, this.y + 12 + jitterY, 3, 2);
                    }
                }
                break;
        }
    }
    
    renderTeleporter(ctx, jitterX, jitterY) {
        // Teleporter with glitch effect
        const glitch = Math.sin(this.animationTimer * 0.5) > 0.5;
        
        if (glitch) {
            ctx.globalAlpha = 0.7;
            ctx.fillRect(this.x + jitterX + 2, this.y + jitterY, this.width, this.height);
            ctx.fillRect(this.x + jitterX - 2, this.y + jitterY, this.width, this.height);
            ctx.globalAlpha = 1;
        }
        
        ctx.fillRect(this.x + jitterX, this.y + jitterY, this.width, this.height);
        
        // Portal effect based on variant
        ctx.fillStyle = '#8800ff';
        switch (this.variant) {
            case 0: // Swirling portal
                const angle = this.animationTimer * 0.2;
                for (let i = 0; i < 4; i++) {
                    const x = this.x + 8 + Math.cos(angle + i * Math.PI / 2) * 4;
                    const y = this.y + 8 + Math.sin(angle + i * Math.PI / 2) * 4;
                    ctx.fillRect(x + jitterX, y + jitterY, 1, 1);
                }
                break;
            case 1: // Energy rings
                for (let ring = 0; ring < 2; ring++) {
                    ctx.globalAlpha = 0.5 - ring * 0.2;
                    ctx.fillRect(this.x + 6 - ring + jitterX, this.y + 6 - ring + jitterY, 
                               this.width - 8 + ring * 2, this.height - 8 + ring * 2);
                }
                ctx.globalAlpha = 1;
                break;
            case 2: // Static lines
                for (let i = 0; i < 4; i++) {
                    if (Math.random() > 0.5) {
                        ctx.fillRect(this.x + i * 3 + 2 + jitterX, this.y + jitterY, 1, this.height);
                    }
                }
                break;
        }
    }
    
    renderFlyer(ctx, jitterX, jitterY) {
        // Flyer with wings
        ctx.fillRect(this.x + jitterX, this.y + jitterY, this.width, this.height);
        
        // Wings that flap
        const wingFlap = Math.sin(this.animationTimer * 0.4) * 2;
        ctx.fillStyle = '#228822';
        ctx.fillRect(this.x - 4 + jitterX, this.y + 4 + wingFlap + jitterY, 4, 8);
        ctx.fillRect(this.x + this.width + jitterX, this.y + 4 + wingFlap + jitterY, 4, 8);
        
        // Bomb bay indicator
        if (this.bombCooldown <= 30) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 6 + jitterX, this.y + 12 + jitterY, 4, 2);
        }
    }
    
    renderShield(ctx, jitterX, jitterY) {
        // Main body
        ctx.fillRect(this.x + jitterX, this.y + jitterY, this.width, this.height);
        
        // Shield in front
        if (this.shieldHealth > 0) {
            const shieldAlpha = this.shieldHealth / this.maxShieldHealth;
            ctx.globalAlpha = shieldAlpha;
            ctx.fillStyle = '#0088ff';
            ctx.fillRect(this.x - 4 + jitterX, this.y - 2 + jitterY, 6, this.height + 4);
            ctx.globalAlpha = 1;
            
            // Shield health indicator
            for (let i = 0; i < this.shieldHealth; i++) {
                ctx.fillStyle = '#00aaff';
                ctx.fillRect(this.x - 3 + jitterX, this.y + i * 6 + jitterY, 4, 4);
            }
        }
    }
    
    renderSpinner(ctx, jitterX, jitterY) {
        // Spinning body with rotation
        ctx.save();
        ctx.translate(this.x + this.width / 2 + jitterX, this.y + this.height / 2 + jitterY);
        ctx.rotate(this.rotation);
        
        // Main body
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Spinning arms/spikes
        ctx.fillStyle = '#cc22cc';
        for (let i = 0; i < 6; i++) {
            const armAngle = (i / 6) * Math.PI * 2;
            const armX = Math.cos(armAngle) * 12;
            const armY = Math.sin(armAngle) * 12;
            ctx.fillRect(armX - 1, armY - 1, 2, 6);
        }
        
        ctx.restore();
        
        // Center dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 7 + jitterX, this.y + 7 + jitterY, 2, 2);
    }
}

class Bullet {
    constructor(x, y, vx = 8, vy = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.width = 6;
        this.height = 2;
        this.piercing = false;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.explosive && Math.random() < 0.05) {
            game.particles.push(new Particle(this.x, this.y, 'bullet_spark'));
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class LaserBullet extends Bullet {
    constructor(x, y) {
        super(x, y);
        this.width = 20;
        this.height = 3;
        this.piercing = true;
        this.color = '#00ffff';
        this.explosive = false;
    }
    
    update() {
        super.update();
        if (this.explosive && Math.random() < 0.1) {
            game.createExplosion(this.x, this.y);
        }
    }
    
    render(ctx) {
        if (this.explosive) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(this.x - 2, this.y - 1, this.width + 4, this.height + 2);
        }
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class ChaosBullet extends Bullet {
    constructor(x, y) {
        super(x, y);
        this.width = 8;
        this.height = 4;
        this.piercing = true;
        this.color = '#ff00ff';
        this.trail = [];
        this.wiggle = 0;
    }
    
    update() {
        this.wiggle += 0.3;
        this.vy += Math.sin(this.wiggle) * 0.5;
        this.trail.push({x: this.x, y: this.y, life: 10});
        
        // Update trail
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life--;
            if (this.trail[i].life <= 0) {
                this.trail.splice(i, 1);
            }
        }
        
        super.update();
    }
    
    render(ctx) {
        // Render trail
        for (let t of this.trail) {
            ctx.globalAlpha = t.life / 10 * 0.5;
            ctx.fillStyle = this.color;
            ctx.fillRect(t.x, t.y, this.width / 2, this.height / 2);
        }
        ctx.globalAlpha = 1;
        
        // Main bullet with rainbow effect
        const hue = (Date.now() * 0.01) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class BigBoyBullet extends Bullet {
    constructor(x, y) {
        super(x, y);
        this.width = 400; // 50% of 800px screen width
        this.height = 200; // 50% of 400px screen height
        this.vx = 2; // Much slower than normal bullets (8)
        this.vy = 0;
        this.piercing = true;
        this.color = '#ff8800';
        this.animationTimer = 0;
        this.particles = [];
    }
    
    update() {
        this.animationTimer++;
        
        // Create trailing particles (reduced for performance)
        if (this.animationTimer % 6 === 0 && game.particles.length < game.maxParticles) {
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: this.x + Math.random() * this.width,
                    y: this.y + Math.random() * this.height,
                    vx: -2 - Math.random() * 3,
                    vy: (Math.random() - 0.5) * 2,
                    life: 20, // Shorter life
                    maxLife: 20
                });
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        super.update();
    }
    
    render(ctx) {
        // Render trailing particles first
        for (let p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(p.x, p.y, 3, 3);
        }
        ctx.globalAlpha = 1;
        
        // Main bullet with pulsing effect
        const pulse = Math.sin(this.animationTimer * 0.1) * 10;
        
        // Outer glow
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.x - 5, this.y - 5, this.width + 10 + pulse, this.height + 10 + pulse);
        
        // Main body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width + pulse, this.height + pulse);
        
        // Inner core with different color
        ctx.fillStyle = '#ffff00';
        const coreSize = pulse / 2;
        ctx.fillRect(this.x + 20 - coreSize, this.y + 20 - coreSize, 
                    this.width - 40 + coreSize * 2, this.height - 40 + coreSize * 2);
        
        // Energy lines across the bullet
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 10; i++) {
            const lineY = this.y + (i * this.height / 10) + Math.sin(this.animationTimer * 0.2 + i) * 5;
            ctx.fillRect(this.x + 10, lineY, this.width - 20, 2);
        }
    }
    
    collidesWith(other) {
        // Custom collision for the massive bullet
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class Portal {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 40;
        this.height = 40;
        this.life = 600; // 10 seconds
        this.maxLife = 600;
        this.animationTimer = 0;
        this.warpRadius = 50;
    }
    
    update() {
        this.life--;
        this.animationTimer++;
        
        // Check for bullets within warp radius
        for (let bullet of game.bullets) {
            const dx = bullet.x - (this.x + this.width / 2);
            const dy = bullet.y - (this.y + this.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.warpRadius) {
                // Warp bullet trajectory
                const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI;
                const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                bullet.vx = Math.cos(angle) * speed;
                bullet.vy = Math.sin(angle) * speed;
                
                // Visual effect
                for (let i = 0; i < 5; i++) {
                    game.particles.push(new Particle(bullet.x, bullet.y, 'portal_warp'));
                }
            }
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        
        // Swirling portal effect
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Outer ring
        ctx.fillStyle = '#8800ff';
        for (let i = 0; i < 12; i++) {
            const angle = (this.animationTimer * 0.1) + (i * Math.PI / 6);
            const x = centerX + Math.cos(angle) * 15;
            const y = centerY + Math.sin(angle) * 15;
            ctx.fillRect(x - 1, y - 1, 2, 2);
        }
        
        // Inner swirl
        ctx.fillStyle = '#ff00ff';
        for (let i = 0; i < 8; i++) {
            const angle = -(this.animationTimer * 0.15) + (i * Math.PI / 4);
            const x = centerX + Math.cos(angle) * 8;
            const y = centerY + Math.sin(angle) * 8;
            ctx.fillRect(x - 1, y - 1, 2, 2);
        }
        
        // Center core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
        
        ctx.globalAlpha = 1;
    }
}

class Powerup {
    constructor(x, type, customY = null) {
        this.x = x;
        this.y = customY || (280 + Math.random() * 40);
        this.type = type;
        this.width = 12;
        this.height = 12;
        this.vx = -3;
        this.bounce = 0;
        this.label = new PowerupLabel(this.x, this.y - 15, game.getPowerupDisplayName(type));
    }
    
    update() {
        this.x += this.vx;
        this.bounce += 0.1;
        this.y += Math.sin(this.bounce) * 0.5;
        
        // Update label position to follow powerup
        this.label.x = this.x + this.width / 2;
        this.label.y = this.y - 15 + Math.sin(this.bounce) * 0.3;
        this.label.update();
    }
    
    render(ctx) {
        const colors = {
            'rapidfire': '#00ff00',
            'shield': '#0088ff',
            'health': '#ff0088',
            'spin_attack': '#ff8800',
            'multishot': '#88ff00',
            'spread_shot': '#ffff00',
            'laser': '#00ffff',
            'nuke': '#ff0000',
            'clone': '#8800ff',
            'big_boy': '#ff8800',
            'timefreeze': '#00ffff',
            'god_mode': '#ffffff',
            'time_warp': '#ff8800',
            'black_hole': '#000088',
            'chaos': '#ff8800',
            'reality_break': '#ff00ff',
            'dimension_rift': '#880088',
            'matter_converter': '#888888',
            'shield_repair': '#00aaff'
        };
        
        ctx.fillStyle = colors[this.type] || '#ffffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Icon representation
        ctx.fillStyle = '#000000';
        switch (this.type) {
            case 'rapidfire':
                ctx.fillRect(this.x + 2, this.y + 5, 8, 2);
                break;
            case 'spin_attack':
                // Draw spinning symbol
                ctx.beginPath();
                ctx.arc(this.x + 6, this.y + 6, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(this.x + 4, this.y + 4, 1, 4);
                ctx.fillRect(this.x + 7, this.y + 4, 1, 4);
                break;
            case 'shield':
                ctx.fillRect(this.x + 4, this.y + 2, 4, 8);
                break;
            case 'health':
                ctx.fillRect(this.x + 5, this.y + 2, 2, 8);
                ctx.fillRect(this.x + 2, this.y + 5, 8, 2);
                break;
            case 'nuke':
                ctx.fillRect(this.x + 3, this.y + 3, 6, 6);
                ctx.fillRect(this.x + 5, this.y + 1, 2, 2);
                break;
            case 'laser':
                ctx.fillRect(this.x + 1, this.y + 5, 10, 2);
                break;
            case 'big_boy':
                // Draw a big chunky bullet icon
                ctx.fillRect(this.x + 3, this.y + 3, 6, 6);
                ctx.fillStyle = '#444444';
                ctx.fillRect(this.x + 4, this.y + 4, 4, 4);
                break;
            case 'god_mode':
                ctx.fillRect(this.x + 2, this.y + 2, 8, 8);
                ctx.fillStyle = colors[this.type];
                ctx.fillRect(this.x + 4, this.y + 4, 4, 4);
                break;
        }
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30;
        this.maxLife = 30;
        this.type = type;
        this.size = 2 + Math.random() * 2;
        
        if (type === 'nuke') {
            this.vx = (Math.random() - 0.5) * 12;
            this.vy = (Math.random() - 0.5) * 12;
            this.life = 60;
            this.maxLife = 60;
            this.size = 4 + Math.random() * 4;
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life--;
        this.size *= 0.98;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        let color = '#00ff88';
        
        switch (this.type) {
            case 'explosion':
                color = '#ff8800';
                break;
            case 'nuke':
                color = Math.random() > 0.5 ? '#ffffff' : '#ff0000';
                break;
            case 'bullet_spark':
                color = '#ffff00';
                break;
            case 'bullet_clash':
                color = '#00ffff';
                break;
            case 'shield_block':
                color = '#ffff00';
                break;
            case 'shield_hit':
                color = '#0088ff';
                break;
            case 'portal_warp':
                color = '#ff00ff';
                break;
            case 'powerup':
                color = '#00ff88';
                break;
        }
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class PowerupLabel {
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.bob = 0;
    }
    
    update() {
        this.bob += 0.05;
    }
    
    render(ctx) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '8px Courier New';
        ctx.textAlign = 'center';
        
        // Add slight bobbing animation
        const bobOffset = Math.sin(this.bob) * 0.5;
        
        // Black outline for better visibility
        ctx.fillStyle = '#000000';
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                ctx.fillText(this.text, this.x + dx, this.y + dy + bobOffset);
            }
        }
        
        // Green text
        ctx.fillStyle = '#00ff00';
        ctx.fillText(this.text, this.x, this.y + bobOffset);
        ctx.textAlign = 'left';
    }
}

class Ghost {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.startY = y;
        this.vx = (Math.random() - 0.5) * 3; // Slightly more horizontal drift
        this.vy = -3 - Math.random() * 2; // Float upward faster
        this.life = 90; // 1.5 seconds at 60fps (shorter duration)
        this.maxLife = 90;
        this.size = 12;
        this.oscillation = 0;
        this.fadeDelay = 20; // Start fading almost immediately
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.oscillation += 0.1;
        this.life--;
        
        // Gentle floating motion
        this.x += Math.sin(this.oscillation) * 0.3;
        this.vy += Math.sin(this.oscillation * 0.5) * 0.05;
        
        // Slow down over time
        this.vx *= 0.98;
        this.vy *= 0.99;
    }
    
    render(ctx) {
        const age = this.maxLife - this.life;
        
        // Calculate alpha for fading effect
        let alpha = 1;
        if (age > this.fadeDelay) {
            const fadeProgress = (age - this.fadeDelay) / (this.maxLife - this.fadeDelay);
            alpha = 1 - fadeProgress;
        }
        
        if (alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Ghost body (simple oval shape)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size * 0.6, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ghost tail (wavy bottom)
        ctx.fillStyle = '#ffffff';
        const waveOffset = Math.sin(this.oscillation * 2) * 2;
        for (let i = 0; i < 3; i++) {
            const waveX = this.x + (i - 1) * 4 + Math.sin(this.oscillation + i) * 2;
            const waveY = this.y + this.size * 0.6 + Math.sin(this.oscillation * 1.5 + i * 0.8) * 2;
            ctx.beginPath();
            ctx.arc(waveX, waveY, 3, 0, Math.PI);
            ctx.fill();
        }
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = alpha * 0.8;
        const eyeSize = 2;
        const eyeOffset = this.size * 0.2;
        ctx.fillRect(this.x - eyeOffset, this.y - 2, eyeSize, eyeSize);
        ctx.fillRect(this.x + eyeOffset - eyeSize, this.y - 2, eyeSize, eyeSize);
        
        // Mouth (small 'o' shape)
        ctx.beginPath();
        ctx.arc(this.x, this.y + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, type = 'normal') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.type = type;
        
        if (type === 'collected') {
            this.vy = -2;
            this.life = 90;
            this.maxLife = 90;
        } else if (type === 'chaos_level') {
            this.vy = -1.5;
            this.life = 240;
            this.maxLife = 240;
            this.scale = 1.5;
        } else if (type === 'chaos_description') {
            this.vy = -0.5;
            this.life = 360;
            this.maxLife = 360;
            this.scale = 1.2;
        } else if (type === 'debug') {
            this.vy = -1;
            this.life = 120;
            this.maxLife = 120;
            this.scale = 1;
        } else if (type === 'shield_damage') {
            this.vy = -1.5;
            this.life = 90;
            this.maxLife = 90;
            this.scale = 0.8;
        } else if (type === 'shield_repair_text') {
            this.vy = -1;
            this.life = 120;
            this.maxLife = 120;
            this.scale = 1;
        } else if (type === 'weapon_name') {
            this.vy = -0.5;
            this.life = 180;
            this.maxLife = 180;
            this.scale = 1.3;
        } else {
            this.vy = -1;
            this.life = 120;
            this.maxLife = 120;
            this.scale = 1;
        }
    }
    
    update() {
        this.y += this.vy;
        this.life--;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        
        if (this.type === 'collected') {
            ctx.fillStyle = '#ffff00';
            ctx.font = '12px Courier New';
        } else if (this.type === 'chaos_level') {
            ctx.fillStyle = '#ff0000';
            ctx.font = `${Math.floor(16 * (this.scale || 1))}px Courier New`;
        } else if (this.type === 'chaos_description') {
            ctx.fillStyle = '#ffaa00';
            ctx.font = `${Math.floor(18 * (this.scale || 1))}px Courier New`;
        } else if (this.type === 'debug') {
            ctx.fillStyle = '#00ffff';
            ctx.font = `${Math.floor(14 * (this.scale || 1))}px Courier New`;
        } else if (this.type === 'shield_damage') {
            ctx.fillStyle = '#ff4444';
            ctx.font = `${Math.floor(12 * (this.scale || 1))}px Courier New`;
        } else if (this.type === 'shield_repair_text') {
            ctx.fillStyle = '#00aaff';
            ctx.font = `${Math.floor(14 * (this.scale || 1))}px Courier New`;
        } else if (this.type === 'weapon_name') {
            ctx.fillStyle = '#ff8800';
            ctx.font = `bold ${Math.floor(16 * (this.scale || 1))}px Courier New`;
        } else {
            ctx.fillStyle = '#00ff00';
            ctx.font = '10px Courier New';
        }
        
        ctx.textAlign = 'center';
        
        // Black outline for special text
        if (this.type === 'collected' || this.type === 'chaos_level' || this.type === 'chaos_description' || this.type === 'debug' || this.type === 'shield_damage' || this.type === 'shield_repair_text') {
            ctx.fillStyle = '#000000';
            const outlineSize = this.type === 'chaos_level' ? 2 : 1;
            for (let dx = -outlineSize; dx <= outlineSize; dx++) {
                for (let dy = -outlineSize; dy <= outlineSize; dy++) {
                    ctx.fillText(this.text, this.x + dx, this.y + dy);
                }
            }
            if (this.type === 'collected') {
                ctx.fillStyle = '#ffff00';
            } else if (this.type === 'chaos_level') {
                ctx.fillStyle = '#ff0000';
            } else if (this.type === 'chaos_description') {
                ctx.fillStyle = '#ffaa00';
            } else if (this.type === 'debug') {
                ctx.fillStyle = '#00ffff';
            } else if (this.type === 'shield_damage') {
                ctx.fillStyle = '#ff4444';
            } else if (this.type === 'shield_repair_text') {
                ctx.fillStyle = '#00aaff';
            }
        }
        
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }
}

class TroopCarrier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 24;
        this.vx = -1.5; // Slower than regular enemies
        this.vy = 0;
        this.hp = 10;
        this.maxHp = 10;
        this.color = '#666666';
        this.wheelOffset = 0;
        this.animationTimer = 0;
        this.spawnProtection = 0; // No spawn protection for carriers
        this.destroyed = false;
    }
    
    update() {
        this.x += this.vx;
        this.wheelOffset += Math.abs(this.vx) * 0.3; // Wheel animation
        this.animationTimer++;
        
        // Keep on ground
        this.y = 324 - this.height;
        
        // Check if off screen
        if (this.x < -this.width) {
            return false;
        }
        return true;
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0 && !this.destroyed) {
            this.destroyed = true;
            this.spawnTroops();
            return true; // Should be removed
        }
        return false;
    }
    
    spawnTroops() {
        // Spawn 10 random enemies in all directions with more exciting launch
        const enemyTypes = ['grunt', 'fast', 'heavy', 'exploder', 'teleporter', 'flyer', 'shield', 'spinner'];
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Create multiple explosions for more drama
        for (let e = 0; e < 5; e++) {
            setTimeout(() => {
                game.createExplosion(
                    centerX + (Math.random() - 0.5) * this.width,
                    centerY + (Math.random() - 0.5) * this.height
                );
            }, e * 100);
        }
        
        // Add screen shake effect
        game.chaosEffects.push({
            type: 'screen_shake',
            duration: 30,
            intensity: 8
        });
        
        for (let i = 0; i < 10; i++) {
            // More dramatic launch angles and speeds
            const angle = (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.8; // More randomness
            const speed = 4 + Math.random() * 6; // Faster launch speeds
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            // Stagger the enemy spawning for more visual impact
            setTimeout(() => {
                // Create enemy at carrier position with slight offset
                const enemy = new Enemy(
                    centerX + (Math.random() - 0.5) * 20,
                    randomType,
                    0,
                    centerY + (Math.random() - 0.5) * 10
                );
                
                // Enhanced launch trajectory with more dramatic arcs
                enemy.vx = Math.cos(angle) * speed;
                enemy.vy = Math.sin(angle) * speed - 2 - Math.random() * 3; // More upward launch
                enemy.launched = true;
                enemy.launchTime = 90 + Math.random() * 30; // Longer launch time for better arcs
                
                // Add launch particles
                for (let p = 0; p < 8; p++) {
                    game.particles.push(new Particle(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        'explosion'
                    ));
                }
                
                game.enemies.push(enemy);
            }, i * 50); // 50ms between each enemy spawn
        }
        
        // Enhanced floating text
        game.floatingTexts.push(new FloatingText(
            centerX,
            centerY - 30,
            'CARRIER DESTROYED!',
            'chaos_description'
        ));
        
        // Add bonus score popup
        setTimeout(() => {
            game.floatingTexts.push(new FloatingText(
                centerX,
                centerY - 50,
                'TROOPS DEPLOYED!',
                'damage'
            ));
        }, 500);
    }
    
    draw(ctx) {
        // Main body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Darker outline
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Cabin
        ctx.fillStyle = '#555555';
        ctx.fillRect(this.x + 5, this.y - 8, 20, 8);
        
        // Wheels
        ctx.fillStyle = '#333333';
        const wheel1X = this.x + 10 + Math.sin(this.wheelOffset) * 1;
        const wheel2X = this.x + this.width - 15 + Math.sin(this.wheelOffset) * 1;
        const wheelY = this.y + this.height;
        
        ctx.fillRect(wheel1X, wheelY, 8, 6);
        ctx.fillRect(wheel2X, wheelY, 8, 6);
        
        // HP Bar
        const barWidth = this.width;
        const barHeight = 4;
        const barX = this.x;
        const barY = this.y - 8;
        
        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill
        const healthPercent = this.hp / this.maxHp;
        ctx.fillStyle = healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

class EnemyBullet {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 6;
        this.height = 4;
        this.vx = -4;
        this.vy = 0;
        this.color = '#ff0000';
        this.life = 300;
        
        switch (type) {
            case 'basic':
                this.color = '#ff4444';
                break;
            case 'fast':
                this.vx = -8;
                this.color = '#ff8800';
                break;
            case 'bomb':
                this.vx = 0;
                this.vy = 2; // Falls down
                this.width = 8;
                this.height = 8;
                this.color = '#ffaa00';
                this.explosive = true;
                break;
            case 'homing':
                this.color = '#ff00ff';
                this.homingStrength = 0.1;
                break;
        }
    }
    
    update() {
        if (this.type === 'homing' && this.life > 0) {
            // Home in on player
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.vx += (dx / distance) * this.homingStrength;
                this.vy += (dy / distance) * this.homingStrength;
            }
        }
        
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        if (this.type === 'homing') {
            // Add trail for homing bullets
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(this.x - 4, this.y, 4, this.height);
            ctx.globalAlpha = 1;
        }
    }
    
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class GroundHole {
    constructor(x) {
        this.x = x;
        this.y = 324; // Ground level
        this.width = 40 + Math.random() * 60; // Variable width
        this.height = 76; // To bottom of screen
        this.vx = -2;
        this.animationTime = 0;
    }
    
    update() {
        this.x += this.vx;
        this.animationTime += 0.1;
    }
    
    render(ctx) {
        // Lava pit base
        ctx.fillStyle = '#cc2200';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Animated lava bubbles
        const bubbleCount = 3;
        for (let i = 0; i < bubbleCount; i++) {
            const bubbleX = this.x + (this.width / bubbleCount) * i + (this.width / bubbleCount) / 2;
            const bubbleY = this.y + 20 + Math.sin(this.animationTime + i * 2) * 5;
            const bubbleSize = 4 + Math.sin(this.animationTime * 2 + i) * 2;
            
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Animated lava glow
        const glowIntensity = 0.7 + Math.sin(this.animationTime * 3) * 0.3;
        ctx.fillStyle = `rgba(255, 100, 0, ${glowIntensity * 0.4})`;
        ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        
        // Warning markers
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x - 5, this.y - 5, 5, 5);
        ctx.fillRect(this.x + this.width, this.y - 5, 5, 5);
    }
}

// Library System
function openLibrary() {
    document.getElementById('library').classList.remove('hidden');
    populateLibrary();
}

function closeLibrary() {
    document.getElementById('library').classList.add('hidden');
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + 'Section').classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function populateLibrary() {
    populatePowerups();
    populateEnemies();
    populateChaosLevels();
}

function populatePowerups() {
    const powerupData = [
        { type: 'rapidfire', name: 'RAPID FIRE', color: '#00ff00', description: 'Increases firing rate significantly (1 damage/bullet)' },
        { type: 'multishot', name: 'MULTISHOT', color: '#88ff00', description: 'Fires 3 bullets vertically (1 damage each)' },
        { type: 'spread_shot', name: 'SPREAD SHOT', color: '#ffff00', description: 'Fires 5 bullets in a fan pattern (1 damage each)' },
        { type: 'laser', name: 'LASER', color: '#00ffff', description: 'Fires piercing laser beams (2 damage, pierces enemies)' },
        { type: 'clone', name: 'CLONE SHOT', color: '#8800ff', description: 'Doubles all bullet patterns (damage unchanged)' },
        { type: 'big_boy', name: 'BIG BOY', color: '#ff8800', description: 'Massive bullets for 10 seconds (3 damage each!)' },
        { type: 'spin_attack', name: 'SPIN ATTACK', color: '#ff8800', description: 'Jump to spin and fire in all directions (1 damage)' },
        { type: 'shield', name: 'SHIELD BOOST', color: '#0088ff', description: 'Restores 50 shield points' },
        { type: 'health', name: 'HEALTH+', color: '#ff0088', description: 'Grants extra life' },
        { type: 'nuke', name: 'NUCLEAR BOMB', color: '#ff0000', description: 'Massive explosion clears screen (instant kill)' },
        { type: 'timefreeze', name: 'TIME FREEZE', color: '#00ffff', description: 'Freezes time briefly' },
        { type: 'god_mode', name: 'GOD MODE', color: '#ffffff', description: 'Temporary invincibility + rapid fire (1 damage)' },
        { type: 'time_warp', name: 'TIME WARP', color: '#ff8800', description: 'Slows down time' },
        { type: 'black_hole', name: 'BLACK HOLE', color: '#000088', description: 'Absorbs nearby enemies (instant kill)' },
        { type: 'dimension_rift', name: 'DIMENSION RIFT', color: '#880088', description: 'Teleports enemies away' },
        { type: 'matter_converter', name: 'MATTER CONVERTER', color: '#888888', description: 'Changes player size and abilities' },
        { type: 'shield_repair', name: 'SHIELD REPAIR', color: '#00aaff', description: 'Repairs damaged shield' }
    ];
    
    const weaponCombos = [
        { name: 'COSMIC DEVASTATOR', components: 'Big Boy + Laser + Multishot + Spread' },
        { name: 'CHAOS WHIRLWIND', components: 'God Mode + Spin Attack' },
        { name: 'PLASMA TORNADO', components: 'Spin + Laser + Multishot' },
        { name: 'TITAN CYCLONE', components: 'Spin + Big Boy' },
        { name: 'LASER VORTEX', components: 'Spin + Laser' },
        { name: 'BULLET HURRICANE', components: 'Spin + Multishot + Spread' },
        { name: 'MEGA BEAM CANNON', components: 'Big Boy + Laser' },
        { name: 'PRISM DEVASTATOR', components: 'Laser + Multishot + Spread' },
        { name: 'QUAD STORM', components: 'Multishot + Spread + Clone' },
        { name: 'TRIPLE DESTROYER', components: 'Big Boy + Multishot' }
    ];
    
    let powerupsHTML = '';
    powerupData.forEach((powerup, index) => {
        powerupsHTML += '<div class="powerup-item">' +
            '<canvas id="powerupCanvas' + index + '" class="powerup-sprite" width="40" height="40"></canvas>' +
            '<div class="item-info">' +
                '<div class="item-name">' + powerup.name + '</div>' +
                '<div class="item-description">' + powerup.description + '</div>' +
            '</div>' +
        '</div>';
    });
    
    let combosHTML = '';
    weaponCombos.forEach(combo => {
        combosHTML += '<div class="weapon-combo">' +
            '<div class="combo-name">' + combo.name + '</div>' +
            '<div class="combo-components">' + combo.components + '</div>' +
        '</div>';
    });
    
    document.getElementById('powerupsList').innerHTML = powerupsHTML;
    document.getElementById('weaponCombos').innerHTML = combosHTML;
    
    // Draw the powerup sprites after HTML is added
    setTimeout(() => drawPowerupSprites(powerupData), 10);
}

function drawPowerupSprites(powerupData) {
    const colors = {
        'rapidfire': '#00ff00',
        'shield': '#0088ff',
        'health': '#ff0088',
        'spin_attack': '#ff8800',
        'multishot': '#88ff00',
        'spread_shot': '#ffff00',
        'laser': '#00ffff',
        'nuke': '#ff0000',
        'clone': '#8800ff',
        'big_boy': '#ff8800',
        'timefreeze': '#00ffff',
        'god_mode': '#ffffff',
        'time_warp': '#ff8800',
        'black_hole': '#000088',
        'chaos': '#ff8800',
        'reality_break': '#ff00ff',
        'dimension_rift': '#880088',
        'matter_converter': '#888888',
        'shield_repair': '#00aaff'
    };
    
    powerupData.forEach((powerup, index) => {
        const canvas = document.getElementById('powerupCanvas' + index);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const size = 40;
        const scale = 3; // Scale up from original 12px size
        
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Draw background
        ctx.fillStyle = colors[powerup.type] || '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // Draw icon representation
        ctx.fillStyle = '#000000';
        switch (powerup.type) {
            case 'rapidfire':
                ctx.fillRect(6, 17, 24, 6);
                break;
            case 'spin_attack':
                ctx.beginPath();
                ctx.arc(20, 20, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(14, 14, 3, 12);
                ctx.fillRect(23, 14, 3, 12);
                break;
            case 'shield':
                ctx.fillRect(14, 6, 12, 28);
                break;
            case 'health':
                ctx.fillRect(17, 6, 6, 28);
                ctx.fillRect(6, 17, 28, 6);
                break;
            case 'nuke':
                ctx.fillRect(10, 10, 20, 20);
                ctx.fillRect(17, 3, 6, 6);
                break;
            case 'laser':
                ctx.fillRect(3, 17, 34, 6);
                break;
            case 'big_boy':
                ctx.fillRect(8, 12, 24, 16);
                ctx.fillRect(12, 8, 16, 24);
                break;
            case 'multishot':
                ctx.fillRect(6, 17, 28, 3);
                ctx.fillRect(6, 21, 28, 3);
                ctx.fillRect(6, 25, 28, 3);
                break;
            case 'spread_shot':
                ctx.fillRect(6, 20, 28, 3);
                ctx.fillRect(8, 14, 24, 2);
                ctx.fillRect(8, 26, 24, 2);
                break;
            case 'clone':
                ctx.fillRect(8, 8, 12, 12);
                ctx.fillRect(20, 20, 12, 12);
                break;
            case 'timefreeze':
                ctx.beginPath();
                ctx.arc(20, 20, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = colors[powerup.type];
                ctx.fillRect(18, 8, 4, 12);
                ctx.fillRect(14, 18, 12, 4);
                break;
            case 'god_mode':
                ctx.fillRect(12, 6, 16, 28);
                ctx.fillRect(6, 12, 28, 16);
                break;
            case 'black_hole':
                ctx.beginPath();
                ctx.arc(20, 20, 15, 0, Math.PI * 2);
                ctx.fill();
                break;
            default:
                ctx.fillRect(14, 14, 12, 12);
        }
    });
}

function populateEnemies() {
    const enemyData = [
        { type: 'grunt', name: 'GRUNT', color: '#ff4444', hp: 1, points: 10, description: 'Basic infantry unit - weak but numerous' },
        { type: 'fast', name: 'SCOUT', color: '#ff8844', hp: 1, points: 15, description: 'Fast-moving reconnaissance unit - fragile but quick' },
        { type: 'heavy', name: 'HEAVY', color: '#ff0000', hp: 3, points: 25, description: 'Slow but armored unit - requires 3 hits to kill' },
        { type: 'exploder', name: 'EXPLODER', color: '#ffff00', hp: 2, points: 30, description: 'Unstable explosive unit - moderate durability' },
        { type: 'teleporter', name: 'TELEPORTER', color: '#ff00ff', hp: 2, points: 40, description: 'Can teleport around battlefield - medium toughness' },
        { type: 'shield', name: 'SHIELD TROOPER', color: '#4444ff', hp: 2, points: 50, description: 'Protected by shield (3 hits) + 2 HP = 5 total hits' },
        { type: 'flyer', name: 'BOMBER', color: '#44ff44', hp: 2, points: 35, description: 'Flying bomber unit - moderate HP, appears at Level 5+' },
        { type: 'spinner', name: 'SPINNER', color: '#ff44ff', hp: 4, points: 60, description: 'Toughest enemy - heavily armored spinner, Level 5+' }
    ];
    
    let enemiesHTML = '';
    enemyData.forEach((enemy, index) => {
        enemiesHTML += '<div class="enemy-item">' +
            '<canvas id="enemyCanvas' + index + '" class="enemy-sprite" width="40" height="40"></canvas>' +
            '<div class="hp-bar-container">' +
                '<div class="hp-bar-bg">' +
                    '<div class="hp-bar-fill" style="width: 100%;"></div>' +
                '</div>' +
                '<div class="hp-text">' + enemy.hp + ' HP</div>' +
            '</div>' +
            '<div class="item-info">' +
                '<div class="item-name">' + enemy.name + '</div>' +
                '<div class="item-description">' + enemy.description + '</div>' +
                '<div class="item-description">Points: ' + enemy.points + '</div>' +
            '</div>' +
        '</div>';
    });
    
    document.getElementById('enemiesList').innerHTML = enemiesHTML;
    
    // Draw the enemy sprites after HTML is added
    setTimeout(() => drawEnemySprites(enemyData), 10);
}

function drawEnemySprites(enemyData) {
    enemyData.forEach((enemy, index) => {
        const canvas = document.getElementById('enemyCanvas' + index);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const canvasSize = 40;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        // Scale factor to make sprites larger
        const scale = 2.2;
        const originalWidth = enemy.type === 'heavy' ? 20 : 16;
        const originalHeight = enemy.type === 'heavy' ? 20 : 16;
        const scaledWidth = originalWidth * scale;
        const scaledHeight = originalHeight * scale;
        
        // Center the sprite in the canvas
        const centerX = (canvasSize - scaledWidth) / 2;
        const centerY = (canvasSize - scaledHeight) / 2;
        
        // Create a mock enemy for rendering
        const mockEnemy = {
            x: centerX,
            y: centerY,
            type: enemy.type,
            color: enemy.color,
            width: scaledWidth,
            height: scaledHeight,
            variant: 0,
            animationTimer: 0,
            spawnProtection: 0,
            shieldHealth: enemy.type === 'shield' ? 3 : 0,
            maxShieldHealth: 3,
            rotation: 0,
            bombCooldown: 60,
            scale: scale
        };
        
        // Render the enemy using the same logic as the game
        ctx.fillStyle = enemy.color;
        
        switch (enemy.type) {
            case 'grunt':
                renderGruntSprite(ctx, mockEnemy);
                break;
            case 'fast':
                renderFastSprite(ctx, mockEnemy);
                break;
            case 'heavy':
                renderHeavySprite(ctx, mockEnemy);
                break;
            case 'exploder':
                renderExploderSprite(ctx, mockEnemy);
                break;
            case 'teleporter':
                renderTeleporterSprite(ctx, mockEnemy);
                break;
            case 'flyer':
                renderFlyerSprite(ctx, mockEnemy);
                break;
            case 'shield':
                renderShieldSprite(ctx, mockEnemy);
                break;
            case 'spinner':
                renderSpinnerSprite(ctx, mockEnemy);
                break;
            default:
                ctx.fillRect(mockEnemy.x, mockEnemy.y, mockEnemy.width, mockEnemy.height);
                break;
        }
        
        // Add eyes to all enemies (white dots)
        ctx.fillStyle = '#ffffff';
        const eyeSize = (enemy.type === 'heavy' ? 3 : 2) * scale;
        const eyeOffset = (enemy.type === 'heavy' ? 4 : 3) * scale;
        
        ctx.fillRect(mockEnemy.x + eyeOffset, mockEnemy.y + 3 * scale, eyeSize, eyeSize);
        ctx.fillRect(mockEnemy.x + mockEnemy.width - eyeOffset - eyeSize, mockEnemy.y + 3 * scale, eyeSize, eyeSize);
    });
}

function renderGruntSprite(ctx, enemy) {
    const s = enemy.scale;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Standard helmet
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(enemy.x + 2*s, enemy.y - 2*s, 12*s, 6*s);
    
    // Belt/gear
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(enemy.x + 1*s, enemy.y + 10*s, enemy.width - 2*s, 2*s);
}

function renderFastSprite(ctx, enemy) {
    const s = enemy.scale;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Speed trail
    ctx.fillStyle = enemy.color;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(enemy.x + enemy.width, enemy.y + 4*s, 6*s, 8*s);
    ctx.globalAlpha = 1;
    
    // Goggles
    ctx.fillStyle = '#333333';
    ctx.fillRect(enemy.x + 2*s, enemy.y + 2*s, 12*s, 4*s);
}

function renderHeavySprite(ctx, enemy) {
    const s = enemy.scale;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Standard armor
    ctx.fillStyle = '#660000';
    ctx.fillRect(enemy.x + 2*s, enemy.y + 6*s, enemy.width - 4*s, 8*s);
}

function renderExploderSprite(ctx, enemy) {
    const s = enemy.scale;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Warning light (always on for library display)
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(enemy.x + 7*s, enemy.y + 2*s, 2*s, 2*s);
}

function renderTeleporterSprite(ctx, enemy) {
    const s = enemy.scale;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Portal effect
    ctx.fillStyle = '#8800ff';
    for (let i = 0; i < 4; i++) {
        const x = enemy.x + 8*s + Math.cos(i * Math.PI / 2) * 4*s;
        const y = enemy.y + 8*s + Math.sin(i * Math.PI / 2) * 4*s;
        ctx.fillRect(x, y, 1*s, 1*s);
    }
}

function renderFlyerSprite(ctx, enemy) {
    const s = enemy.scale;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Wings
    ctx.fillStyle = '#228822';
    ctx.fillRect(enemy.x - 4*s, enemy.y + 4*s, 4*s, 8*s);
    ctx.fillRect(enemy.x + enemy.width, enemy.y + 4*s, 4*s, 8*s);
    
    // Bomb bay indicator
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(enemy.x + 6*s, enemy.y + 12*s, 4*s, 2*s);
}

function renderShieldSprite(ctx, enemy) {
    const s = enemy.scale;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Shield in front
    ctx.fillStyle = '#0088ff';
    ctx.fillRect(enemy.x - 4*s, enemy.y - 2*s, 6*s, enemy.height + 4*s);
    
    // Shield health indicators
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(enemy.x - 3*s, enemy.y + i * 6*s, 4*s, 4*s);
    }
}

function renderSpinnerSprite(ctx, enemy) {
    const s = enemy.scale;
    ctx.save();
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    
    // Main body
    ctx.fillStyle = enemy.color;
    ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
    
    // Spinning arms/spikes
    ctx.fillStyle = '#cc22cc';
    for (let i = 0; i < 6; i++) {
        const armAngle = (i / 6) * Math.PI * 2;
        const armX = Math.cos(armAngle) * 12*s;
        const armY = Math.sin(armAngle) * 12*s;
        ctx.fillRect(armX - 1*s, armY - 1*s, 2*s, 6*s);
    }
    
    ctx.restore();
    
    // Center dot
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(enemy.x + 7*s, enemy.y + 7*s, 2*s, 2*s);
}

function populateChaosLevels() {
    const chaosData = [
        { level: 1, effects: 'Basic gameplay' },
        { level: 2, effects: 'Enemies start seeking player' },
        { level: 3, effects: 'Ground lava pits spawn, Shield Troopers appear' },
        { level: 4, effects: 'Exploders and Teleporters join the fight' },
        { level: 5, effects: 'Enemies start firing bullets, Bombers and Spinners appear' },
        { level: 6, effects: 'Chaos effects: Screen shake, Color changes, Heavy gravity' },
        { level: 7, effects: 'Big Boy powerups become available, Advanced enemies' },
        { level: 8, effects: 'Mutants and Glitchers appear' },
        { level: 9, effects: 'Reality glitches and dimension shifts' },
        { level: 10, effects: 'Maximum chaos - All effects active' }
    ];
    
    let chaosHTML = '';
    chaosData.forEach(chaos => {
        chaosHTML += '<div class="chaos-item">' +
            '<div class="item-info">' +
                '<div class="item-name">LEVEL ' + chaos.level + '</div>' +
                '<div class="item-description">' + chaos.effects + '</div>' +
            '</div>' +
        '</div>';
    });
    
    document.getElementById('chaosLevels').innerHTML = chaosHTML;
}

let game;

function startGame() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.getElementById('ui').classList.remove('hidden');
    
    game = new Game();
    game.gameState = 'playing';
}

function restartGame() {
    document.getElementById('gameOver').classList.add('hidden');
    startGame();
}

// Animated Logo System
class AnimatedLogo {
    constructor() {
        this.canvas = document.getElementById('logoCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.time = 0;
        this.letters = [];
        this.particles = [];
        this.initLetters();
        this.animate();
    }
    
    initLetters() {
        const text = 'GENERAL CHAOS';
        // Calculate actual width needed
        let totalWidth = 0;
        for (let i = 0; i < text.length; i++) {
            totalWidth += text[i] === ' ' ? 15 : 25;
        }
        totalWidth -= 5; // Remove extra spacing from last letter
        
        const startX = (this.canvas.width - totalWidth) / 2; // Center horizontally
        const startY = 20; // Position from top
        
        // Define pixelated letter patterns (8x8 grid for each letter)
        const letterPatterns = {
            'G': [
                [0,1,1,1,1,1,0,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,1,1,1,1,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [0,1,1,1,1,1,0,0],
                [0,0,0,0,0,0,0,0]
            ],
            'E': [
                [1,1,1,1,1,1,1,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,0,0],
                [1,1,1,1,1,1,0,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,0,0],
                [1,1,1,1,1,1,1,0],
                [0,0,0,0,0,0,0,0]
            ],
            'N': [
                [1,0,0,0,0,0,1,0],
                [1,1,0,0,0,0,1,0],
                [1,0,1,0,0,0,1,0],
                [1,0,0,1,0,0,1,0],
                [1,0,0,0,1,0,1,0],
                [1,0,0,0,0,1,1,0],
                [1,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,0]
            ],
            'R': [
                [1,1,1,1,1,1,0,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [1,1,1,1,1,1,0,0],
                [1,0,0,1,0,0,0,0],
                [1,0,0,0,1,0,0,0],
                [1,0,0,0,0,1,0,0],
                [0,0,0,0,0,0,0,0]
            ],
            'A': [
                [0,0,1,1,1,0,0,0],
                [0,1,0,0,0,1,0,0],
                [1,0,0,0,0,0,1,0],
                [1,1,1,1,1,1,1,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,0]
            ],
            'L': [
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,0,0],
                [1,1,1,1,1,1,1,0],
                [0,0,0,0,0,0,0,0]
            ],
            'C': [
                [0,1,1,1,1,1,0,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,0,0],
                [1,0,0,0,0,0,1,0],
                [0,1,1,1,1,1,0,0],
                [0,0,0,0,0,0,0,0]
            ],
            'H': [
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [1,1,1,1,1,1,1,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [0,0,0,0,0,0,0,0]
            ],
            'O': [
                [0,1,1,1,1,1,0,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [0,1,1,1,1,1,0,0],
                [0,0,0,0,0,0,0,0]
            ],
            'S': [
                [0,1,1,1,1,1,0,0],
                [1,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,0,0],
                [0,1,1,1,1,0,0,0],
                [0,0,0,0,0,0,1,0],
                [1,0,0,0,0,0,1,0],
                [0,1,1,1,1,1,0,0],
                [0,0,0,0,0,0,0,0]
            ],
            ' ': [
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0]
            ]
        };
        
        let currentX = startX;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const pattern = letterPatterns[char] || letterPatterns[' '];
            
            this.letters.push({
                char: char,
                x: currentX,
                y: startY,
                pattern: pattern,
                animationDelay: i * 100,
                glitchTimer: Math.random() * 200
            });
            
            currentX += char === ' ' ? 15 : 25; // Space between letters
        }
    }
    
    animate() {
        this.time += 16; // ~60fps
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and render letters
        this.letters.forEach((letter, index) => {
            this.renderLetter(letter, index);
        });
        
        // Update particles
        this.updateParticles();
        
        // Add random chaos particles
        if (Math.random() < 0.1) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 60,
                maxLife: 60,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    renderLetter(letter, index) {
        const pixelSize = 3;
        const appearTime = letter.animationDelay;
        
        // Letter appearance animation
        const appeared = this.time > appearTime;
        if (!appeared) return;
        
        // Glitch effect
        letter.glitchTimer++;
        const isGlitching = letter.glitchTimer % 200 < 10;
        
        // Color chaos effect
        const baseHue = (this.time * 0.5 + index * 30) % 360;
        let color = `hsl(${baseHue}, 80%, 60%)`;
        
        if (isGlitching) {
            color = Math.random() > 0.5 ? '#ff0000' : '#00ffff';
        }
        
        this.ctx.fillStyle = color;
        
        // Render pixel pattern
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                if (letter.pattern[y][x]) {
                    const pixelX = letter.x + x * pixelSize;
                    const pixelY = letter.y + y * pixelSize; // Fixed: now adding y instead of subtracting
                    
                    // Add chaos jitter
                    const jitterX = isGlitching ? (Math.random() - 0.5) * 4 : 0;
                    const jitterY = isGlitching ? (Math.random() - 0.5) * 4 : 0;
                    
                    this.ctx.fillRect(
                        pixelX + jitterX, 
                        pixelY + jitterY, 
                        pixelSize, 
                        pixelSize
                    );
                }
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillRect(particle.x, particle.y, 2, 2);
            this.ctx.globalAlpha = 1;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}

// Initialize logo when page loads
window.addEventListener('load', () => {
    new AnimatedLogo();
});