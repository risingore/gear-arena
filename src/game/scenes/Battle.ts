import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import {
  ROBOTS,
  ITEMS,
  findEnemyDef,
  ROBOT_ULTIMATES,
  ENEMY_ULTIMATES,
  type PartKey
} from '@/data';
import { getRunState, setRunState } from '../systems/runState';
import { PALETTE, ROBOT_COLORS } from '../systems/palette';
import { computeLoadoutStats } from '../systems/stats';
import {
  createPlayerCombatant,
  tickCombatant,
  fireUltimate,
  type Combatant,
  type AttackEvent
} from '../systems/combat';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { recordRoundReached } from '../systems/savedata';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS, setMusicPlaybackRate } from '../systems/music';
import { applyHiDpiToScene, TEXT_DPR, showDebugBadge } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';

const HP_BAR_W = 280;
const HP_BAR_H = 20;
const SPRITE_W = 280;
const SPRITE_H = 360;
const LOG_LINE_COUNT = 3;
const POPUP_RISE_PX = 48;
const POPUP_DURATION_MS = 600;

export class Battle extends Scene {
  private player!: Combatant;
  private enemy!: Combatant;
  private playerRobotArchetypeLabel = '';
  private playerSprite!: GameObjects.Rectangle;
  private enemySprite!: GameObjects.Rectangle;
  private playerHpFill!: GameObjects.Rectangle;
  private enemyHpFill!: GameObjects.Rectangle;
  private playerHpText!: GameObjects.Text;
  private enemyHpText!: GameObjects.Text;
  private playerUltFill!: GameObjects.Rectangle;
  private enemyUltFill!: GameObjects.Rectangle;
  private logText!: GameObjects.Text;
  private logLines: string[] = [];
  private finished = false;
  private finishDelay = 0;
  private overdriveLabel: GameObjects.Text | null = null;
  private playerImg: GameObjects.Image | null = null;
  private enemyImg: GameObjects.Image | null = null;
  private playerBaseX = 0;
  private enemyBaseX = 0;
  private timeScale = 2;
  private speedLabel!: GameObjects.Text;
  private elapsedBattleSec = 0;
  private debugTimerText!: GameObjects.Text;
  private playerHpTrail!: GameObjects.Rectangle;
  private enemyHpTrail!: GameObjects.Rectangle;
  /** Flag to pause combat during round-start intro animation. */
  private introActive = false;
  /** Tracks the last BGM rate so we only change it when crossing the threshold. */
  private lastBgmRate = 1;
  /** Real seconds elapsed before auto fast-forward kicks in. */
  private static readonly AUTO_FF_SEC = 15;
  /** Speed multiplier applied after AUTO_FF_SEC elapses. */
  private static readonly AUTO_FF_SPEED = 6;

  constructor() {
    super('Battle');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    const state = getRunState(this);
    if (!state.robotKey) {
      this.scene.start('Title');
      return;
    }

    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);
    playMusic(this, MUSIC_KEYS.battle);
    this.finished = false;
    this.finishDelay = 0;
    this.logLines = [];
    this.timeScale = 2;
    this.elapsedBattleSec = 0;

    const robot = ROBOTS[state.robotKey];
    this.playerRobotArchetypeLabel = robot.archetype.toUpperCase();
    const stats = computeLoadoutStats(robot, state.equipped, state.acquiredSkills);

    // Pull the pre-generated enemy for this round from the run state.
    const genRound = state.generatedRounds[state.currentRound - 1];
    if (!genRound) {
      this.scene.start('Title');
      return;
    }
    const totalRounds = state.generatedRounds.length;
    const roundEnemy = genRound.enemy;

    const playerUlt = state.robotKey ? (ROBOT_ULTIMATES[state.robotKey] ?? null) : null;
    this.player = createPlayerCombatant(robot.name, stats, playerUlt);
    // HP carry-over: previous battle's remaining HP carries into the next round.
    // Round 1 starts at full HP (carryHp = 0 from initial state).
    if (state.carryHp > 0) {
      this.player.hp = Math.min(this.player.maxHp, state.carryHp);
    }

    // Apply and consume next-battle item buffs.
    for (const itemKey of state.battleBuffs) {
      const item = ITEMS[itemKey as keyof typeof ITEMS];
      if (!item) continue;
      switch (item.effect.kind) {
        case 'attack_speed':
          for (const w of this.player.weapons) {
            w.cooldownSec = Math.max(0.2, w.cooldownSec / item.effect.multiplier);
          }
          break;
        case 'damage_reduction':
          this.player.damageReductionPct = Math.min(
            0.8,
            this.player.damageReductionPct + item.effect.amount
          );
          break;
        case 'enemy_vulnerability':
          // "Enemy takes +X% damage" = multiply player weapon damage.
          for (const w of this.player.weapons) {
            w.damage = Math.round(w.damage * item.effect.multiplier);
          }
          break;
      }
    }
    // Clear consumed buffs from run state.
    if (state.battleBuffs.length > 0) {
      setRunState(this, { ...state, battleBuffs: [] });
    }

    // Build enemy weapons list: primary + any extra weapons from EnemyDef.
    const enemyWeapons: import('../systems/combat').CombatWeapon[] = [
      { label: 'Strike', damage: roundEnemy.damage, cooldownSec: roundEnemy.cooldownSec, timer: roundEnemy.cooldownSec }
    ];
    // Retrieve the original EnemyDef to access extraWeapons / shieldCharges / repair.
    const originalDef = findEnemyDef(genRound.enemyId);
    if (originalDef?.extraWeapons) {
      for (const ew of originalDef.extraWeapons) {
        enemyWeapons.push({ label: ew.label, damage: ew.damage, cooldownSec: ew.cooldownSec, timer: ew.cooldownSec });
      }
    }

    this.enemy = {
      name: roundEnemy.name,
      maxHp: roundEnemy.hp,
      hp: roundEnemy.hp,
      damageReductionFlat: 0,
      damageReductionPct: roundEnemy.damageReductionPct,
      weapons: enemyWeapons,
      overdriveMultiplier: 0,
      overdriveThresholdHp: 0,
      overdriveActive: false,
      repairIntervalSec: originalDef?.repairIntervalSec ?? 0,
      repairAmount: originalDef?.repairAmount ?? 0,
      repairTimer: originalDef?.repairIntervalSec ?? 0,
      shieldCharges: originalDef?.shieldCharges ?? 0,
      ultimate: originalDef ? (ENEMY_ULTIMATES[originalDef.category] ?? null) : null,
      ultimateGauge: 0,
      ultimateUsed: false,
      ultimateEffectTimer: 0,
      tempDrBoost: 0,
      tempSpeedMult: 1,
      weaponDisableTimer: 0,
      statusEffects: [],
      evasionChance: 0,
      comboCount: 0,
      autoFireUltimate: true
    };

    // Header
    this.add
      .text(gameWidth / 2, 48, `${t('ROUND')} ${state.currentRound} / ${totalRounds}`, textStyles.title)
      .setOrigin(0.5);
    this.add
      .text(gameWidth / 2, 92, genRound.isBoss ? t('⚠  BOSS BATTLE  ⚠') : t('BATTLE'), textStyles.body)
      .setOrigin(0.5)
      .setColor(genRound.isBoss ? '#ff7a00' : '#ffffff');

    // Player side — pushed apart so the large sprites have room to breathe.
    const playerX = gameWidth * 0.25;
    const enemyX = gameWidth * 0.75;
    const arenaY = gameHeight * 0.44;

    // Player visual — full-body image or placeholder rectangle.
    this.playerBaseX = playerX;
    this.playerImg = null;
    const battleKey = robot.battleAssetKey;
    if (this.textures.exists(battleKey)) {
      this.playerImg = this.add.image(playerX, arenaY, battleKey);
      const scale = Math.min(SPRITE_W / this.playerImg.width, SPRITE_H / this.playerImg.height);
      this.playerImg.setScale(scale);
    }
    this.playerSprite = this.add
      .rectangle(playerX, arenaY, SPRITE_W, SPRITE_H, this.playerImg ? 0x000000 : ROBOT_COLORS[robot.archetype], this.playerImg ? 0 : 1);
    if (!this.playerImg) this.playerSprite.setStrokeStyle(3, PALETTE.textPrimary);

    this.add
      .text(playerX, arenaY - SPRITE_H / 2 - 28, t(robot.name), textStyles.body)
      .setOrigin(0.5);

    // Enemy visual — placeholder rectangle (real sprites come later).
    this.enemyBaseX = enemyX;
    this.enemyImg = null;
    this.enemySprite = this.add
      .rectangle(enemyX, arenaY, SPRITE_W, SPRITE_H, PALETTE.accentRed, 1)
      .setStrokeStyle(3, PALETTE.textPrimary);

    // --- Idle breathing animation ---
    for (const target of [this.playerImg ?? this.playerSprite, this.enemySprite]) {
      this.tweens.add({
        targets: target,
        y: (target as { y: number }).y - 5,
        duration: 1400 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.add
      .text(enemyX, arenaY - SPRITE_H / 2 - 28, t(roundEnemy.name), textStyles.body)
      .setOrigin(0.5);

    // HP bars (trail bar drawn first so it renders behind the main fill)
    const hpBarY = arenaY + SPRITE_H / 2 + 32;
    this.add
      .rectangle(playerX, hpBarY, HP_BAR_W, HP_BAR_H, PALETTE.hpBarBg, 1)
      .setOrigin(0.5);
    this.playerHpTrail = this.add
      .rectangle(playerX - HP_BAR_W / 2, hpBarY, HP_BAR_W, HP_BAR_H, 0x882222, 1)
      .setOrigin(0, 0.5);
    this.playerHpFill = this.add
      .rectangle(playerX - HP_BAR_W / 2, hpBarY, HP_BAR_W, HP_BAR_H, PALETTE.hpBarFill, 1)
      .setOrigin(0, 0.5);
    this.playerHpText = this.add
      .text(playerX, hpBarY, '', textStyles.small)
      .setOrigin(0.5);

    this.add
      .rectangle(enemyX, hpBarY, HP_BAR_W, HP_BAR_H, PALETTE.hpBarBg, 1)
      .setOrigin(0.5);
    this.enemyHpTrail = this.add
      .rectangle(enemyX - HP_BAR_W / 2, hpBarY, HP_BAR_W, HP_BAR_H, 0x662222, 1)
      .setOrigin(0, 0.5);
    this.enemyHpFill = this.add
      .rectangle(enemyX - HP_BAR_W / 2, hpBarY, HP_BAR_W, HP_BAR_H, PALETTE.hpBarFillEnemy, 1)
      .setOrigin(0, 0.5);
    this.enemyHpText = this.add
      .text(enemyX, hpBarY, '', textStyles.small)
      .setOrigin(0.5);

    // Ultimate gauge bars (thin bar below HP)
    const ultBarY = arenaY + SPRITE_H / 2 + 48;
    const ultBarH = 6;
    this.add.rectangle(playerX, ultBarY, HP_BAR_W, ultBarH, 0x222233, 1).setOrigin(0.5);
    this.playerUltFill = this.add
      .rectangle(playerX - HP_BAR_W / 2, ultBarY, 0, ultBarH, 0xffd94a, 1)
      .setOrigin(0, 0.5);
    this.add.rectangle(enemyX, ultBarY, HP_BAR_W, ultBarH, 0x222233, 1).setOrigin(0.5);
    this.enemyUltFill = this.add
      .rectangle(enemyX - HP_BAR_W / 2, ultBarY, 0, ultBarH, 0xff6a6a, 1)
      .setOrigin(0, 0.5);

    // Ultimate name labels
    if (playerUlt) {
      this.add.text(playerX, ultBarY + 10, playerUlt.name, textStyles.small)
        .setOrigin(0.5).setAlpha(0.5);
    }
    if (this.enemy.ultimate) {
      this.add.text(enemyX, ultBarY + 10, this.enemy.ultimate.name, textStyles.small)
        .setOrigin(0.5).setAlpha(0.5);
    }

    // Equipped parts summary under player HP bar
    const weaponSummary =
      this.player.weapons.length === 0
        ? t('(no weapons)')
        : this.player.weapons.map((w) => `${t(w.label)} ${w.damage}/${w.cooldownSec.toFixed(1)}s`).join('  ·  ');
    this.add
      .text(playerX, arenaY + SPRITE_H / 2 + 62, weaponSummary, textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.85);

    // Turbo Combo detection (engine_turbo + weapon_laser both equipped).
    // Solo combat currently has no target to pierce through, so the indicator
    // is visual-only until schema gets a damage_flat effect variant.
    if (this.hasTurboCombo(state.equipped)) {
      const label = this.add
        .text(playerX, arenaY + SPRITE_H / 2 + 84, t('⚡ TURBO COMBO ⚡'), textStyles.small)
        .setOrigin(0.5)
        .setColor('#ffd94a');
      this.tweens.add({
        targets: label,
        alpha: { from: 0.4, to: 1 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Archetype badge for the player
    this.add
      .text(playerX, arenaY - SPRITE_H / 2 - 6, this.playerRobotArchetypeLabel, textStyles.small)
      .setOrigin(0.5)
      .setAlpha(0.6);

    // Combat log
    this.logText = this.add
      .text(gameWidth / 2, gameHeight - 120, '', textStyles.small)
      .setOrigin(0.5, 0)
      .setAlpha(0.9);

    this.speedLabel = this.add
      .text(gameWidth - 24, 24, `${t('SPEED')} x${this.timeScale}`, textStyles.body)
      .setOrigin(1, 0)
      .setAlpha(0.8);

    // Debug: elapsed real-time counter (only visible when debug mode is ON).
    this.debugTimerText = this.add
      .text(gameWidth - 24, 56, '0.0s', textStyles.small)
      .setOrigin(1, 0)
      .setAlpha(0.6)
      .setVisible(isDebugEnabled());

    this.pushLog(t('SPACE / Click = ULTIMATE  |  S = speed toggle'));

    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-SPACE', () => this.triggerPlayerUltimate());
    this.input.keyboard?.on('keydown-S', () => this.cycleSpeed());
    // Click to trigger ultimate too
    this.input.on('pointerdown', () => this.triggerPlayerUltimate());

    // Record best round reached (even if this battle is lost).
    recordRoundReached(state.currentRound);

    this.refreshHp();

    // --- Round start animation ---
    this.introActive = true;
    this.lastBgmRate = 1;
    const isBossRound = genRound.isBoss;
    const introLabel = isBossRound
      ? `ROUND ${state.currentRound} — BOSS`
      : `ROUND ${state.currentRound}`;
    const introText = this.add
      .text(gameWidth / 2, gameHeight / 2, introLabel, {
        ...textStyles.title,
        color: isBossRound ? '#ff7a00' : '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setScale(2)
      .setDepth(300)
      .setResolution(TEXT_DPR);
    this.tweens.add({
      targets: introText,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(500, () => {
          this.tweens.add({
            targets: introText,
            alpha: 0,
            duration: 300,
            ease: 'Linear',
            onComplete: () => {
              introText.destroy();
              this.introActive = false;
            }
          });
        });
      }
    });

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }

  private cycleSpeed(): void {
    const sequence = [1, 2, 4, 6];
    const idx = sequence.indexOf(this.timeScale);
    this.timeScale = sequence[(idx + 1) % sequence.length]!;
    this.speedLabel.setText(`${t('SPEED')} x${this.timeScale}`);
    playSfx('click');
  }

  update(_time: number, delta: number): void {
    if (!this.player || !this.enemy) return;
    const realDtSec = delta / 1000;

    // Track real elapsed time for auto fast-forward and debug display.
    this.elapsedBattleSec += realDtSec;
    this.debugTimerText.setText(`${this.elapsedBattleSec.toFixed(1)}s`);

    // Auto fast-forward after AUTO_FF_SEC of real time.
    if (
      this.elapsedBattleSec >= Battle.AUTO_FF_SEC &&
      this.timeScale < Battle.AUTO_FF_SPEED
    ) {
      this.timeScale = Battle.AUTO_FF_SPEED;
      this.speedLabel.setText(`${t('SPEED')} x${this.timeScale}`);
    }

    const dtSec = realDtSec * this.timeScale;

    if (this.finished) {
      this.finishDelay -= realDtSec;
      if (this.finishDelay <= 0) this.goToResult();
      return;
    }

    // Pause combat during round-start intro animation.
    if (this.introActive) return;

    const playerTick = tickCombatant(this.player, this.enemy, dtSec);
    playerTick.attacks.forEach((e) => this.onAttack(e, this.enemySprite, true));
    if (playerTick.healed > 0) this.spawnHealPopup(this.playerSprite.x, this.playerSprite.y, playerTick.healed);
    if (playerTick.overdriveTriggered) this.triggerOverdriveIndicator();
    if (playerTick.ultimateFired) this.spawnUltimateFlash(this.playerSprite.x, this.playerSprite.y, playerTick.ultimateFired, true);

    // Accumulate run stats from player tick.
    {
      const rs = getRunState(this).runStats;
      for (const a of playerTick.attacks) rs.totalDamageDealt += a.finalDamage;
      if (playerTick.healed > 0) rs.totalHealed += playerTick.healed;
    }

    if (this.enemy.hp <= 0) {
      this.finishBattle('win');
      return;
    }

    const enemyTick = tickCombatant(this.enemy, this.player, dtSec);
    enemyTick.attacks.forEach((e) => this.onAttack(e, this.playerSprite, false));
    if (enemyTick.healed > 0) this.spawnHealPopup(this.enemySprite.x, this.enemySprite.y, enemyTick.healed);
    if (enemyTick.ultimateFired) this.spawnUltimateFlash(this.enemySprite.x, this.enemySprite.y, enemyTick.ultimateFired, false);

    // Accumulate run stats from enemy tick.
    {
      const rs = getRunState(this).runStats;
      for (const a of enemyTick.attacks) rs.totalDamageTaken += a.finalDamage;
    }

    if (this.player.hp <= 0) {
      this.finishBattle('lose');
      return;
    }

    this.refreshHp();
  }

  private hasTurboCombo(equipped: Readonly<Record<string, PartKey>>): boolean {
    let hasTurbo = false;
    let hasLaser = false;
    for (const slotId of Object.keys(equipped)) {
      const key = equipped[slotId];
      if (!key) continue;
      if (key === 'engine_turbo') hasTurbo = true;
      if (key === 'weapon_laser') hasLaser = true;
      if (hasTurbo && hasLaser) return true;
    }
    return false;
  }

  private onAttack(event: AttackEvent, targetSprite: GameObjects.Rectangle, fromPlayer: boolean): void {
    this.pushLog(`${t(event.attackerName)} → ${t(event.defenderName)}: ${t(event.weaponLabel)}  ${event.finalDamage}`);

    // Dodge event — special visual
    if (event.weaponLabel === 'DODGE') {
      playSfx('dodge');
      const dodgeText = this.add
        .text(targetSprite.x, targetSprite.y - 30, 'DODGE', { ...gameOptions.textStyles.body, color: '#3aff7a', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(100).setResolution(TEXT_DPR);
      this.tweens.add({ targets: dodgeText, y: dodgeText.y - 40, alpha: 0, duration: 600, onComplete: () => dodgeText.destroy() });
      return;
    }

    const weaponKey = event.weaponLabel.toLowerCase();
    const isMelee = weaponKey.includes('blade') || weaponKey.includes('fist') || weaponKey.includes('bash') || weaponKey.includes('sweep') || weaponKey.includes('pound');
    const isLaser = weaponKey.includes('laser') || weaponKey.includes('beam') || weaponKey.includes('arc');
    const isFire = weaponKey.includes('flame') || weaponKey.includes('burn') || weaponKey.includes('fire');
    const isHeavy = weaponKey.includes('cannon') || weaponKey.includes('rail') || weaponKey.includes('crash') || weaponKey.includes('charge');

    if (isFire) playSfx('attack_melee');
    else if (isMelee) playSfx('attack_melee');
    else playSfx(fromPlayer ? 'attack_ranged' : 'hit');

    // Attacker slide — melee slides far, ranged slides less
    const attackerVisual = fromPlayer
      ? (this.playerImg ?? this.playerSprite)
      : (this.enemyImg ?? this.enemySprite);
    const slideDir = fromPlayer ? 1 : -1;
    const attackerBaseX = fromPlayer ? this.playerBaseX : this.enemyBaseX;
    const slideDist = isMelee ? 80 : isHeavy ? 20 : 40;
    this.tweens.add({
      targets: attackerVisual,
      x: attackerBaseX + slideDist * slideDir,
      duration: isMelee ? 60 : 100,
      yoyo: true,
      ease: 'Cubic.easeOut'
    });

    // --- Angle tween for attack / hit feel ---
    if (fromPlayer) {
      // Player attacks: lean forward
      const pv = this.playerImg ?? this.playerSprite;
      this.tweens.add({ targets: pv, angle: -5, duration: 80, yoyo: true, ease: 'Cubic.easeOut' });
    } else {
      // Player got hit: reel backward
      const pv = this.playerImg ?? this.playerSprite;
      this.tweens.add({ targets: pv, angle: 5, duration: 100, yoyo: true, ease: 'Back.easeOut' });
    }

    // --- Defender knockback + flash ---
    const defenderVisual = fromPlayer
      ? (this.enemyImg ?? this.enemySprite)
      : (this.playerImg ?? this.playerSprite);
    this.tweens.add({
      targets: defenderVisual,
      alpha: { from: 0.3, to: 1 },
      duration: 160,
      ease: 'Cubic.easeOut'
    });
    const defenderBaseX = fromPlayer ? this.enemyBaseX : this.playerBaseX;
    this.tweens.add({
      targets: defenderVisual,
      x: defenderBaseX + 25 * -slideDir,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut'
    });

    const shakeIntensity = isHeavy ? 0.01 : fromPlayer ? 0.002 : 0.005;
    this.cameras.main.shake(isHeavy ? 120 : 60, shakeIntensity);

    // --- Weapon-specific visual effect ---
    const effectColor = isFire ? 0xff6600 : isLaser ? 0x3ab0ff : isHeavy ? 0xffffff : fromPlayer ? 0xffd94a : 0xff6a6a;
    this.spawnSlashEffect(targetSprite.x, targetSprite.y, fromPlayer, effectColor);

    this.spawnDamagePopup(targetSprite.x, targetSprite.y - 20, event.finalDamage, fromPlayer, event.combo);

    if (event.killed) {
      this.tweens.add({
        targets: defenderVisual,
        scaleX: 0.5,
        scaleY: 0.5,
        alpha: 0,
        y: (defenderVisual as { y: number }).y + 30,
        duration: 500,
        ease: 'Cubic.easeIn'
      });
      this.spawnKillExplosion(targetSprite.x, targetSprite.y, fromPlayer);
    }
  }

  private spawnDamagePopup(x: number, y: number, damage: number, fromPlayer: boolean, combo = 0): void {
    const comboLabel = combo >= 3 ? ` x${combo}` : '';
    const scale = combo >= 5 ? 1.3 : combo >= 3 ? 1.15 : 1;
    const text = this.add
      .text(x + (Math.random() - 0.5) * 30, y, `-${damage}${comboLabel}`, {
        ...gameOptions.textStyles.body,
        color: fromPlayer ? '#ffd94a' : '#ff6a6a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setScale(scale)
      .setResolution(TEXT_DPR);
    this.tweens.add({
      targets: text,
      y: y - POPUP_RISE_PX,
      alpha: { from: 1, to: 0 },
      duration: POPUP_DURATION_MS,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private spawnHealPopup(x: number, y: number, amount: number): void {
    playSfx('repair');
    const text = this.add
      .text(x, y - 20, `+${amount}`, {
        ...gameOptions.textStyles.body,
        color: '#3aff7a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setResolution(TEXT_DPR);
    this.tweens.add({
      targets: text,
      y: y - 20 - POPUP_RISE_PX,
      alpha: { from: 1, to: 0 },
      duration: POPUP_DURATION_MS,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private triggerOverdriveIndicator(): void {
    if (this.overdriveLabel) return;
    const { textStyles } = gameOptions;
    this.overdriveLabel = this.add
      .text(this.playerSprite.x, this.playerSprite.y - SPRITE_H / 2 - 56, t('OVERDRIVE!'), {
        ...textStyles.body,
        color: '#ff7a00',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setResolution(TEXT_DPR);
    this.tweens.add({
      targets: this.overdriveLabel,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1.2 },
      duration: 240,
      yoyo: true,
      ease: 'Cubic.easeOut',
      onComplete: () => this.overdriveLabel?.setScale(1)
    });
  }

  private pushLog(line: string): void {
    this.logLines.push(line);
    while (this.logLines.length > LOG_LINE_COUNT) this.logLines.shift();
    this.logText.setText(this.logLines.join('\n'));
  }

  private refreshHp(): void {
    const pRatio = Math.max(0, this.player.hp / this.player.maxHp);
    const eRatio = Math.max(0, this.enemy.hp / this.enemy.maxHp);
    this.playerHpFill.width = HP_BAR_W * pRatio;
    this.enemyHpFill.width = HP_BAR_W * eRatio;
    this.playerHpText.setText(`${Math.max(0, this.player.hp)} / ${this.player.maxHp}`);
    this.enemyHpText.setText(`${Math.max(0, this.enemy.hp)} / ${this.enemy.maxHp}`);

    // Trailing HP bar: tween the trail down to match main fill over 400ms
    const pTrailTarget = HP_BAR_W * pRatio;
    if (this.playerHpTrail.width > pTrailTarget) {
      this.tweens.add({
        targets: this.playerHpTrail,
        width: pTrailTarget,
        duration: 400,
        ease: 'Cubic.easeOut'
      });
    }
    const eTrailTarget = HP_BAR_W * eRatio;
    if (this.enemyHpTrail.width > eTrailTarget) {
      this.tweens.add({
        targets: this.enemyHpTrail,
        width: eTrailTarget,
        duration: 400,
        ease: 'Cubic.easeOut'
      });
    }

    // Ultimate gauge
    const pUltMax = this.player.ultimate?.gaugeFillRatio ?? 1;
    const pUltRatio = this.player.ultimateUsed ? 0 : Math.min(1, this.player.ultimateGauge / pUltMax);
    this.playerUltFill.width = HP_BAR_W * pUltRatio;

    const eUltMax = this.enemy.ultimate?.gaugeFillRatio ?? 1;
    const eUltRatio = this.enemy.ultimateUsed ? 0 : Math.min(1, this.enemy.ultimateGauge / eUltMax);
    this.enemyUltFill.width = HP_BAR_W * eUltRatio;

    // Ultimate ready indicator
    const ultReady = this.player.ultimate && !this.player.ultimateUsed &&
      this.player.ultimateGauge >= this.player.ultimate.gaugeFillRatio;
    if (ultReady) {
      this.playerUltFill.setFillStyle(0xffffff, 1);
    } else {
      this.playerUltFill.setFillStyle(0xffd94a, 1);
    }

    // BGM tempo: speed up when player HP is critical
    const desiredRate = pRatio < 0.3 ? 1.15 : 1.0;
    if (desiredRate !== this.lastBgmRate) {
      this.lastBgmRate = desiredRate;
      setMusicPlaybackRate(desiredRate);
    }
  }

  private finishBattle(outcome: 'win' | 'lose'): void {
    this.finished = true;
    this.finishDelay = 0.9;
    const state = getRunState(this);
    const totalRounds = state.generatedRounds.length;
    const isFinalRound = state.currentRound >= totalRounds;
    const finalOutcome = outcome === 'win' && isFinalRound ? 'victory' : outcome;
    const genRound = state.generatedRounds[state.currentRound - 1];
    const message =
      outcome === 'win'
        ? isFinalRound
          ? t('VICTORY!  All rounds cleared.')
          : `${t('Round')} ${state.currentRound} ${t('cleared.')}`
        : `${t(this.player.name)} ${t('was destroyed.')}`;
    // Update run stats for round outcome.
    const updatedStats = { ...state.runStats };
    if (outcome === 'win') {
      updatedStats.roundsCleared += 1;
      updatedStats.enemiesDefeated += 1;
    }
    updatedStats.partsUsed = Object.keys(state.equipped).length;

    setRunState(this, {
      ...state,
      battleOutcome: finalOutcome,
      lastResultMessage: message,
      lastDefeatedEnemyId: outcome === 'win' && genRound ? genRound.enemyId : '',
      carryHp: outcome === 'win' ? Math.max(1, this.player.hp) : 0,
      runStats: updatedStats
    });
    this.pushLog(message);
    playSfx(finalOutcome === 'victory' ? 'victory' : outcome === 'win' ? 'win' : 'lose');
    this.refreshHp();
  }

  private spawnSlashEffect(x: number, y: number, fromPlayer: boolean, color = fromPlayer ? 0xffd94a : 0xff6a6a): void {
    const angle = fromPlayer ? -30 : 30;
    const slash = this.add
      .rectangle(x, y, 120, 4, color, 0.9)
      .setAngle(angle)
      .setDepth(100);
    this.tweens.add({
      targets: slash,
      scaleX: { from: 0.2, to: 1.5 },
      scaleY: { from: 1, to: 0.3 },
      alpha: { from: 0.9, to: 0 },
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => slash.destroy()
    });
    // Flash circle
    const flash = this.add
      .circle(x, y, 30, 0xffffff, 0.6)
      .setDepth(99);
    this.tweens.add({
      targets: flash,
      scale: { from: 0.5, to: 2 },
      alpha: { from: 0.6, to: 0 },
      duration: 150,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy()
    });
  }

  private spawnUltimateFlash(x: number, y: number, name: string, fromPlayer: boolean): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    playSfx(fromPlayer ? 'victory' : 'lose');
    this.cameras.main.shake(200, fromPlayer ? 0.01 : 0.015);

    if (fromPlayer) {
      // --- Cut-in: large robot portrait slides in from the left ---
      const cutinDuration = 800;
      const holdDuration = 500;

      // Darken background
      const overlay = this.add
        .rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0.6)
        .setDepth(200);

      // Diagonal slash lines
      const slash1 = this.add
        .rectangle(gameWidth / 2, gameHeight / 2, gameWidth * 2, 80, 0xffd94a, 0.15)
        .setAngle(-15).setDepth(201);
      const slash2 = this.add
        .rectangle(gameWidth / 2, gameHeight / 2 + 60, gameWidth * 2, 40, 0xffd94a, 0.1)
        .setAngle(-15).setDepth(201);

      // Robot portrait (large image or placeholder)
      const state = getRunState(this);
      const robot = state.robotKey ? ROBOTS[state.robotKey] : null;
      const battleKey = robot?.battleAssetKey ?? '';
      let cutinVisual: GameObjects.Image | GameObjects.Rectangle;

      if (this.textures.exists(battleKey)) {
        cutinVisual = this.add.image(-400, gameHeight / 2, battleKey)
          .setScale(0.8).setDepth(210);
      } else {
        cutinVisual = this.add
          .rectangle(-400, gameHeight / 2, 400, 500,
            robot ? ROBOT_COLORS[robot.archetype] : 0x9bbdff, 1)
          .setStrokeStyle(4, 0xffffff).setDepth(210);
      }

      // Slide in from left
      this.tweens.add({
        targets: cutinVisual,
        x: gameWidth * 0.35,
        duration: cutinDuration * 0.4,
        ease: 'Back.easeOut'
      });

      // Ultimate name text (right side)
      const ultText = this.add
        .text(gameWidth + 200, gameHeight / 2 - 40, `★ ${name} ★`, {
          ...textStyles.title,
          color: '#ffd94a',
          fontStyle: 'bold'
        })
        .setOrigin(0.5).setDepth(211).setResolution(TEXT_DPR);

      const robotNameText = this.add
        .text(gameWidth + 200, gameHeight / 2 + 30, robot ? t(robot.name) : '', textStyles.body)
        .setOrigin(0.5).setDepth(211).setAlpha(0.8).setResolution(TEXT_DPR);

      // Slide text in from right
      this.tweens.add({
        targets: [ultText, robotNameText],
        x: gameWidth * 0.7,
        duration: cutinDuration * 0.4,
        ease: 'Cubic.easeOut'
      });

      // Hold, then dismiss everything
      this.time.delayedCall(cutinDuration + holdDuration, () => {
        this.tweens.add({
          targets: [cutinVisual, ultText, robotNameText],
          alpha: 0,
          duration: 300,
          onComplete: () => {
            cutinVisual.destroy();
            ultText.destroy();
            robotNameText.destroy();
          }
        });
        this.tweens.add({
          targets: [overlay, slash1, slash2],
          alpha: 0,
          duration: 300,
          onComplete: () => { overlay.destroy(); slash1.destroy(); slash2.destroy(); }
        });
      });
    } else {
      // Enemy ultimate: simpler flash
      const flash = this.add
        .rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0xff4444, 0.3)
        .setDepth(140);
      this.tweens.add({
        targets: flash, alpha: 0, duration: 400,
        onComplete: () => flash.destroy()
      });

      const label = this.add
        .text(x, y - 60, `★ ${name} ★`, {
          ...textStyles.body, color: '#ff6a6a', fontStyle: 'bold'
        })
        .setOrigin(0.5).setDepth(150).setResolution(TEXT_DPR);
      this.tweens.add({
        targets: label,
        scale: { from: 0.5, to: 1.5 }, alpha: { from: 1, to: 0 }, y: y - 120,
        duration: 1200, ease: 'Cubic.easeOut',
        onComplete: () => label.destroy()
      });
    }

    this.pushLog(`★ ${name} ★`);
  }

  private spawnKillExplosion(x: number, y: number, fromPlayer: boolean): void {
    const tint = fromPlayer ? PALETTE.hpBarFillEnemy : PALETTE.hpBarFill;
    const colors = [tint, 0xffffff, 0xffd94a, 0xff6a6a];
    const particleCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i += 1) {
      const size = 4 + Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)]!;
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const dx = Math.cos(angle) * speed * 0.5;
      const dy = Math.sin(angle) * speed * 0.5;
      const particle = this.add
        .rectangle(x, y, size, size, color, 1)
        .setDepth(150);
      this.tweens.add({
        targets: particle,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  private triggerPlayerUltimate(): void {
    if (this.finished || this.introActive) return;
    if (!this.player.ultimate || this.player.ultimateUsed) return;
    if (this.player.ultimateGauge < this.player.ultimate.gaugeFillRatio) return;

    const attacks: AttackEvent[] = [];
    fireUltimate(this.player, this.enemy, attacks);
    attacks.forEach((e) => this.onAttack(e, this.enemySprite, true));
    this.spawnUltimateFlash(this.playerSprite.x, this.playerSprite.y, this.player.ultimate.name, true);

    if (this.enemy.hp <= 0) {
      this.finishBattle('win');
    }
    this.refreshHp();
  }

  private goToResult(): void {
    fadeToScene(this, 'Result');
  }
}
