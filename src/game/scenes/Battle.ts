import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import {
  ROBOTS,
  ITEMS,
  PARTS,
  SYNERGIES,
  findEnemyDef,
  ROBOT_ULTIMATES,
  ENEMY_ULTIMATES,
  type PartCategory,
  type RobotKey
} from '@/data';
import type { EquippedEntry } from '../systems/runState';
import { BALANCE } from '@/data/balance';
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
import { t, bl } from '../systems/i18n';
import { playMusic, MUSIC_KEYS, setMusicPlaybackRate } from '../systems/music';
import { applyHiDpiToScene, TEXT_DPR, showDebugBadge } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
import { attachFpsMeter } from '../systems/fpsMeter';
import { setupLayoutDebug } from '../systems/layoutDebug';
import { isDebugEnabled } from '../systems/debug';
import {
  createSlotState,
  tickSlotMachine,
  resolveUltimatePress,
  checkAuraAppear,
  RUSH_CHARGE_MULT,
  AURA_HEX,
  AURA_CSS,
  type SlotState
} from '../systems/slotMachine';
import { rollPrediction } from '@/data/predictions';
import { ULT_PITCH_BY_ROBOT } from '@/data/audioProfile';
import { MANTRAS, THESIS_PROOF } from '@/data/storyText';
import { mountBattleOverlay, type BattleOverlayHandle } from '../overlays/battleOverlay';
import { mountMandalaOverlay } from '../overlays/mandalaOverlay';
import {
  SLOT_HIT_DAMAGE_MULT,
  GIJIREN_CHANCE,
  GIJIREN_PULSE_WEIGHTS,
  GIJIREN_PULSE_INTERVAL_MS
} from '@/data/slotConfig';

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
  private battleOverlay: BattleOverlayHandle | null = null;
  private elapsedBattleSec = 0;
  private debugTimerText!: GameObjects.Text;
  private playerHpTrail!: GameObjects.Rectangle;
  private enemyHpTrail!: GameObjects.Rectangle;
  private playerStatusTexts: GameObjects.Text[] = [];
  private ultPercentText!: GameObjects.Text;
  /** Flag to pause combat during round-start intro animation. */
  private introActive = false;
  /** Tracks the last BGM rate so we only change it when crossing the threshold. */
  private lastBgmRate = 1;
  /** Pachislot hit system state. */
  private slotState!: SlotState;
  /** Placement-synergy bonus to the pachislot hit probability per second. */
  private slotMachineHitBonus = 0;
  /** Placement synergies currently active, pushed to log on battle start. */
  private activePlacementSynergies: readonly import('@/data').PlacementSynergyDef[] = [];
  /** Visual: aura ring around player (null = no aura). */
  private auraRing: GameObjects.Arc | null = null;
  /** Visual: aura color label. */
  private auraLabel: GameObjects.Text | null = null;
  /** Whether combat is frozen waiting for ultimate button press. */
  private ultReady = false;
  /** The big ULTIMATE button (shown during freeze). */
  private ultButton: GameObjects.Container | null = null;
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
    this.slotState = createSlotState();
    this.auraRing = null;
    this.auraLabel = null;
    this.ultFiring = false;
    this.ultReady = false;

    const robot = ROBOTS[state.robotKey];
    this.playerRobotArchetypeLabel = robot.archetype.toUpperCase();
    const stats = computeLoadoutStats(robot, state.equipped, state.acquiredSkills);
    this.slotMachineHitBonus = stats.placementSynergies.hitChancePerSec;
    this.activePlacementSynergies = stats.placementSynergies.active;

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
    // Every round starts at full HP.

    // Merge equippedBuffs (from blueprint buff slots) into battleBuffs, then clear both.
    const allBuffs = [...state.battleBuffs, ...state.equippedBuffs];
    if (allBuffs.length > 0 || state.equippedBuffs.length > 0) {
      setRunState(this, { ...state, battleBuffs: [], equippedBuffs: [] });
    }

    // Apply and consume all buff items.
    for (const itemKey of allBuffs) {
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
      autoFireUltimate: true,
      ultimateStrikes: 1,
      ultimateDmgPerStrike: 0,
      ultimateChargeRate: 1,
      ultimateLifesteal: 0,
      ultimateArmorBreak: false,
      isAwakened: false
    };

    // Header (DOM overlay — see overlays/battleOverlay.ts)
    this.battleOverlay = mountBattleOverlay({
      round: state.currentRound,
      totalRounds,
      roundLabel: t('ROUND'),
      speedLabel: t('SPEED'),
      isBoss: genRound.isBoss === true,
      subheadingBattle: t('BATTLE'),
      subheadingBoss: t('⚠  BOSS BATTLE  ⚠'),
      initialSpeed: this.timeScale,
    });
    this.events.once('shutdown', () => {
      this.battleOverlay?.unmount();
      this.battleOverlay = null;
    });
    this.events.once('destroy', () => {
      this.battleOverlay?.unmount();
      this.battleOverlay = null;
    });

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
      .setOrigin(0.5)
      .setColor('#ffffff')
      .setStroke('#000000', 3);

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
      .setOrigin(0.5)
      .setColor('#ffffff')
      .setStroke('#000000', 3);

    // Status effect indicators next to player HP bar
    this.playerStatusTexts = [];

    // Ultimate gauge bars (thin bar below HP)
    const ultBarY = arenaY + SPRITE_H / 2 + 56;
    const ultBarH = 6;
    this.add.rectangle(playerX, ultBarY, HP_BAR_W, ultBarH, 0x222233, 1).setOrigin(0.5);
    this.playerUltFill = this.add
      .rectangle(playerX - HP_BAR_W / 2, ultBarY, 0, ultBarH, 0xffd94a, 1)
      .setOrigin(0, 0.5);
    this.add.rectangle(enemyX, ultBarY, HP_BAR_W, ultBarH, 0x222233, 1).setOrigin(0.5);
    this.enemyUltFill = this.add
      .rectangle(enemyX - HP_BAR_W / 2, ultBarY, 0, ultBarH, 0xff6a6a, 1)
      .setOrigin(0, 0.5);

    // Ultimate gauge percentage text (right of the gauge bar)
    this.ultPercentText = this.add
      .text(playerX + HP_BAR_W / 2 + 28, ultBarY, '0%', textStyles.small)
      .setOrigin(0.5)
      .setDepth(10);

    // Ultimate stats under player gauge bar
    const ultDisplayName = (this.player.isAwakened && playerUlt?.awakenedName) ? playerUlt.awakenedName : (playerUlt?.name ?? 'ULT');
    const strikeWord = this.player.ultimateStrikes === 1 ? 'strike' : 'strikes';
    const ultSummary = `${ultDisplayName}: ${this.player.ultimateStrikes} ${strikeWord} × ${this.player.ultimateDmgPerStrike} dmg`;
    this.add
      .text(playerX, ultBarY + 20, ultSummary, textStyles.small)
      .setOrigin(0.5)
      .setColor('#ffd94a')
      .setAlpha(0.85);

    // Active synergies: detect and show aura + labels
    const activeSynergies = this.getActiveSynergies(state.equipped);
    if (activeSynergies.length > 0) {
      // Pulsing aura ring around the player
      const aura = this.add
        .circle(playerX, arenaY, SPRITE_W * 0.6, 0xffd94a, 0)
        .setStrokeStyle(3, 0xffd94a)
        .setAlpha(0);
      this.tweens.add({
        targets: aura,
        alpha: { from: 0, to: 0.4 },
        scale: { from: 0.9, to: 1.1 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const synergyText = activeSynergies.map((s) => `⚡ ${s}`).join('  ');
      const label = this.add
        .text(playerX, ultBarY + 38, synergyText, textStyles.small)
        .setOrigin(0.5)
        .setColor('#ffd94a');
      this.tweens.add({
        targets: label,
        alpha: { from: 0.5, to: 1 },
        duration: 800,
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

    // SPEED indicator is rendered via battleOverlay.setSpeed().

    // Debug: elapsed real-time counter (only visible when debug mode is ON).
    this.debugTimerText = this.add
      .text(gameWidth - 24, 56, '0.0s', textStyles.small)
      .setOrigin(1, 0)
      .setAlpha(0.6)
      .setVisible(isDebugEnabled());

    this.pushLog(t('Survive until SOUL STRIKE is ready!'));

    // Log active placement synergies so the player can see the buffs
    // their slot arrangement unlocked. Empty when nothing triggers.
    for (const syn of this.activePlacementSynergies) {
      this.pushLog(`◆ ${t(syn.name)} — ${t(syn.description)}`);
    }

    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.ultReady) this.triggerPlayerUltimate();
    });
    this.input.keyboard?.on('keydown-S', () => this.cycleSpeed());
    this.input.on('pointerdown', () => {
      if (this.ultReady) this.triggerPlayerUltimate();
    });

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
    runVisualChecks(this);
    setupLayoutDebug(this);
    attachFpsMeter(this);
  }

  private cycleSpeed(): void {
    const sequence = [1, 2, 4, 6];
    const idx = sequence.indexOf(this.timeScale);
    this.timeScale = sequence[(idx + 1) % sequence.length]!;
    this.battleOverlay?.setSpeed(this.timeScale);
    playSfx('click');
  }

  update(_time: number, delta: number): void {
    if (!this.player || !this.enemy) return;
    const realDtSec = delta / 1000;

    // Track real elapsed time for auto fast-forward and debug display.
    this.elapsedBattleSec += realDtSec;
    this.debugTimerText.setText(`${this.elapsedBattleSec.toFixed(1)}s`);

    // Pachislot: tick hit determination + aura check
    if (!this.finished && !this.introActive) {
      const hitTriggered = tickSlotMachine(this.slotState, realDtSec, this.slotMachineHitBonus);
      if (hitTriggered) {
        playSfx('combo');
      }
      // Check aura appearance at 70% gauge during rush
      if (this.player.ultimate) {
        const gaugeRatio = this.player.ultimateGauge / this.player.ultimate.gaugeFillRatio;
        checkAuraAppear(this.slotState, gaugeRatio);
      }
      // Apply rush charge multiplier
      if (this.slotState.inRush) {
        this.player.ultimateChargeRate = RUSH_CHARGE_MULT;
      }
      this.updateAuraVisual();
    }

    // Auto fast-forward after AUTO_FF_SEC of real time.
    if (
      this.elapsedBattleSec >= Battle.AUTO_FF_SEC &&
      this.timeScale < Battle.AUTO_FF_SPEED
    ) {
      this.timeScale = Battle.AUTO_FF_SPEED;
      this.battleOverlay?.setSpeed(this.timeScale);
    }

    const dtSec = realDtSec * this.timeScale;

    // Frozen: waiting for ultimate button press
    if (this.ultReady) return;

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

    // Check if ultimate gauge just filled → freeze → 擬似連 → button
    if (!this.ultReady && !this.finished && this.player.ultimate &&
        this.player.ultimateGauge >= this.player.ultimate.gaugeFillRatio) {
      this.ultReady = true;
      this.startGijiren();
    }
  }

  private getActiveSynergies(equipped: Readonly<Record<string, EquippedEntry>>): string[] {
    const counts: Record<PartCategory, number> = { module: 0, implant: 0, charger: 0, booster: 0, soul: 0 };
    const categories = new Set<PartCategory>();
    for (const entry of Object.values(equipped)) {
      if (!entry?.key) continue;
      const part = PARTS[entry.key];
      if (!part) continue;
      counts[part.category] += 1;
      categories.add(part.category);
    }
    const hasAll = categories.size >= 5;
    const active: string[] = [];
    for (const synKey of Object.keys(SYNERGIES) as (keyof typeof SYNERGIES)[]) {
      const syn = SYNERGIES[synKey];
      let triggered = false;
      switch (syn.trigger.kind) {
        case 'booster_count':  triggered = counts.booster >= syn.trigger.threshold; break;
        case 'module_count':   triggered = counts.module >= syn.trigger.threshold; break;
        case 'implant_count':  triggered = counts.implant >= syn.trigger.threshold; break;
        case 'soul_count':     triggered = counts.soul >= syn.trigger.threshold; break;
        case 'all_categories': triggered = hasAll; break;
        case 'category_pair': {
          let a = false, b = false;
          for (const entry of Object.values(equipped)) {
            if (!entry?.key) continue;
            const p = PARTS[entry.key];
            if (!p) continue;
            if (p.category === syn.trigger.a) a = true;
            if (p.category === syn.trigger.b) b = true;
          }
          triggered = a && b;
          break;
        }
      }
      if (triggered) active.push(syn.name);
    }
    return active;
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

    // Ultimate gauge (smooth tween instead of instant jump)
    const pUltMax = this.player.ultimate?.gaugeFillRatio ?? 1;
    const pUltRatio = this.player.ultimateUsed ? 0 : Math.min(1, this.player.ultimateGauge / pUltMax);
    const pUltTargetW = HP_BAR_W * pUltRatio;
    if (Math.abs(this.playerUltFill.width - pUltTargetW) > 1) {
      this.tweens.killTweensOf(this.playerUltFill);
      this.tweens.add({ targets: this.playerUltFill, width: pUltTargetW, duration: 200, ease: 'Sine.easeOut' });
    }

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

    // Ultimate gauge percentage text
    const pctValue = Math.min(100, Math.round(pUltRatio * 100));
    if (ultReady) {
      this.ultPercentText.setText(t('READY!'));
      this.ultPercentText.setColor('#ffffff');
      if (!this.ultPercentText.getData('pulsing')) {
        this.ultPercentText.setData('pulsing', true);
        this.tweens.add({
          targets: this.ultPercentText,
          alpha: { from: 0.6, to: 1 },
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      this.ultPercentText.setText(`${pctValue}%`);
      this.ultPercentText.setColor('#ffd94a');
      if (this.ultPercentText.getData('pulsing')) {
        this.ultPercentText.setData('pulsing', false);
        this.tweens.killTweensOf(this.ultPercentText);
        this.ultPercentText.setAlpha(1);
      }
    }

    // Player status effect indicators
    this.refreshStatusIndicators();

    // BGM tempo: speed up when player HP is critical
    const desiredRate = pRatio < BALANCE.bgmUrgentHpRatio ? BALANCE.bgmUrgentRate : 1.0;
    if (desiredRate !== this.lastBgmRate) {
      this.lastBgmRate = desiredRate;
      setMusicPlaybackRate(desiredRate);
    }
  }

  private refreshStatusIndicators(): void {
    // Destroy previous indicators
    for (const txt of this.playerStatusTexts) txt.destroy();
    this.playerStatusTexts = [];

    const STATUS_COLORS: Record<string, string> = {
      burn: '#ff7a00',
      freeze: '#3ab0ff',
      poison: '#3aff7a'
    };

    const hpBarY = gameOptions.gameHeight * 0.44 + SPRITE_H / 2 + 32;
    let offsetX = 0;
    for (const se of this.player.statusEffects) {
      const label = t(se.kind.toUpperCase());
      const color = STATUS_COLORS[se.kind] ?? '#ffffff';
      const indicator = this.add
        .text(this.playerBaseX - HP_BAR_W / 2 + offsetX, hpBarY - 18, label, {
          ...gameOptions.textStyles.small,
          color,
          fontStyle: 'bold'
        })
        .setOrigin(0, 0.5)
        .setDepth(15);

      // Pulsing effect for burn
      if (se.kind === 'burn') {
        this.tweens.add({
          targets: indicator,
          alpha: { from: 0.5, to: 1 },
          duration: 300,
          yoyo: true,
          repeat: 0,
          ease: 'Sine.easeInOut'
        });
      }

      this.playerStatusTexts.push(indicator);
      offsetX += indicator.width + 8;
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
      carryHp: 0,
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

  private spawnUltimateFlash(_x: number, _y: number, name: string, fromPlayer: boolean, isCritical = false): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    const D = 200; // depth base

    if (fromPlayer) {
      const robotKey = getRunState(this).robotKey;
      const ultPitch = robotKey && robotKey in ULT_PITCH_BY_ROBOT
        ? ULT_PITCH_BY_ROBOT[robotKey as keyof typeof ULT_PITCH_BY_ROBOT]
        : 1;
      playSfx('ultimate', ultPitch);
      const allParts: GameObjects.GameObject[] = [];
      const destroy = () => allParts.forEach((p) => p.destroy());

      // B-10: spawn a DOM mandala behind the cut-in for Retina-sharp
      // ritual framing. Auto-dismisses shortly after the cut-in ends.
      const mandalaUnmount = mountMandalaOverlay({
        soulDialProgress: 1.0,
        showTitle: false,
        autoDismissMs: 1700,
      });
      void mandalaUnmount;

      // Color theme: normal = gold, critical = red-gold
      const accentColor = isCritical ? 0xff2222 : 0xffd94a;
      const accentHex = isCritical ? '#ff2222' : '#ffd94a';
      const flashColor = isCritical ? 0xff0000 : 0xffffff;
      const ringColor2 = isCritical ? 0xff4444 : 0xffffff;

      // === Phase 0: Time freeze — zoom camera ===
      this.cameras.main.zoomTo(isCritical ? 1.15 : 1.08, 200, 'Cubic.easeOut');

      // === Phase 1: White flash → black overlay (0-150ms) ===
      const whiteFlash = this.add
        .rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, flashColor, isCritical ? 1 : 0.8)
        .setDepth(D);
      allParts.push(whiteFlash);
      this.tweens.add({ targets: whiteFlash, alpha: 0, duration: 150 });

      const overlay = this.add
        .rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0)
        .setDepth(D + 1);
      allParts.push(overlay);
      this.tweens.add({ targets: overlay, alpha: 0.75, duration: 200 });

      // === Phase 2: Diagonal slash lines sweep across (100-300ms) ===
      const slashCount = 5;
      for (let i = 0; i < slashCount; i += 1) {
        const sy = gameHeight * 0.2 + (gameHeight * 0.6 / slashCount) * i;
        const slash = this.add
          .rectangle(-gameWidth, sy, gameWidth * 2.5, 3 + Math.random() * 6, accentColor, 0.6 + Math.random() * 0.3)
          .setAngle(-12 + Math.random() * 4)
          .setDepth(D + 2);
        allParts.push(slash);
        this.tweens.add({
          targets: slash,
          x: gameWidth * 1.5,
          duration: 180,
          delay: 80 + i * 40,
          ease: 'Cubic.easeOut',
          onComplete: () => this.tweens.add({ targets: slash, alpha: 0, duration: 200 })
        });
      }

      // === Phase 3: Screen split line — V-shape crack (200ms) ===
      const splitL = this.add
        .rectangle(gameWidth / 2, -50, 4, gameHeight + 100, 0xffffff, 0.9)
        .setAngle(8).setDepth(D + 3).setAlpha(0);
      const splitR = this.add
        .rectangle(gameWidth / 2, -50, 4, gameHeight + 100, 0xffffff, 0.9)
        .setAngle(-8).setDepth(D + 3).setAlpha(0);
      allParts.push(splitL, splitR);
      this.time.delayedCall(200, () => {
        this.tweens.add({ targets: splitL, alpha: 0.9, duration: 80, yoyo: true, hold: 100 });
        this.tweens.add({ targets: splitR, alpha: 0.9, duration: 80, yoyo: true, hold: 100 });
        this.cameras.main.shake(100, 0.008);
      });

      // === Phase 4: Character portrait slides in (250-500ms) ===
      const state = getRunState(this);
      const robot = state.robotKey ? ROBOTS[state.robotKey] : null;
      const battleKey = robot?.battleAssetKey ?? '';
      let portrait: GameObjects.Image | GameObjects.Rectangle;

      if (this.textures.exists(battleKey)) {
        portrait = this.add.image(-500, gameHeight / 2, battleKey)
          .setScale(1.0).setDepth(D + 10);
      } else {
        portrait = this.add
          .rectangle(-500, gameHeight / 2, 420, 540,
            robot ? ROBOT_COLORS[robot.archetype] : 0x9bbdff, 1)
          .setStrokeStyle(4, 0xffffff).setDepth(D + 10);
      }
      allParts.push(portrait);
      this.tweens.add({
        targets: portrait,
        x: gameWidth * 0.32,
        duration: 300,
        delay: 250,
        ease: 'Back.easeOut'
      });

      // === Phase 5: Ultimate name — big text from right (350-600ms) ===
      const displayName = isCritical ? `CRITICAL ${name.toUpperCase()}` : name.toUpperCase();
      const ultName = this.add
        .text(gameWidth + 300, gameHeight * 0.38, displayName, {
          ...textStyles.title, fontSize: isCritical ? '80px' : '72px', color: accentHex, fontStyle: 'bold'
        })
        .setOrigin(0.5).setDepth(D + 11).setResolution(TEXT_DPR).setAlpha(0);
      allParts.push(ultName);
      this.time.delayedCall(350, () => {
        ultName.setAlpha(1);
        this.tweens.add({
          targets: ultName,
          x: gameWidth * 0.68,
          duration: 250,
          ease: 'Back.easeOut'
        });
      });

      // Robot name below
      const robotLabel = this.add
        .text(gameWidth + 300, gameHeight * 0.52, robot ? t(robot.name) : '', {
          ...textStyles.body, color: '#ffffff'
        })
        .setOrigin(0.5).setDepth(D + 11).setResolution(TEXT_DPR).setAlpha(0);
      allParts.push(robotLabel);
      this.time.delayedCall(420, () => {
        robotLabel.setAlpha(0.8);
        this.tweens.add({
          targets: robotLabel,
          x: gameWidth * 0.68,
          duration: 250,
          ease: 'Cubic.easeOut'
        });
      });

      // === Phase 5b: Mantra text — fades in beneath name (500-700ms) ===
      if (state.robotKey) {
        const mantra = MANTRAS[state.robotKey as RobotKey];
        if (mantra) {
          const mantraLabel = this.add
            .text(gameWidth * 0.68, gameHeight * 0.60, mantra.text, {
              ...textStyles.small, fontStyle: 'italic', color: accentHex,
            })
            .setOrigin(0.5).setDepth(D + 11).setResolution(TEXT_DPR).setAlpha(0);
          allParts.push(mantraLabel);
          this.time.delayedCall(500, () => {
            this.tweens.add({ targets: mantraLabel, alpha: 0.5, duration: 300, ease: 'Sine.easeIn' });
          });
        }
      }

      // === Phase 6: Strike count — "3... 2... 1..." countdown (600-900ms) ===
      const strikes = this.player.ultimateStrikes;
      for (let i = 0; i < Math.min(strikes, 5); i += 1) {
        this.time.delayedCall(650 + i * 80, () => {
          const num = this.add
            .text(gameWidth * 0.68, gameHeight * 0.65 + i * 30, `${i + 1} HIT`, {
              ...textStyles.body, color: '#ff7a00', fontStyle: 'bold'
            })
            .setOrigin(0.5).setDepth(D + 12).setScale(0.5).setResolution(TEXT_DPR);
          allParts.push(num);
          this.tweens.add({
            targets: num,
            scale: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Back.easeOut',
            onComplete: () => num.setScale(1)
          });
        });
      }

      // === Phase 7: Shockwave ring at hold point (1000ms) ===
      this.time.delayedCall(1000, () => {
        const ring = this.add
          .circle(gameWidth / 2, gameHeight / 2, 10, accentColor, 0)
          .setStrokeStyle(isCritical ? 10 : 6, accentColor)
          .setDepth(D + 15);
        allParts.push(ring);
        this.tweens.add({
          targets: ring,
          scale: 15,
          alpha: { from: 0.8, to: 0 },
          duration: 400,
          ease: 'Cubic.easeOut'
        });
        // Second shockwave
        const ring2 = this.add
          .circle(gameWidth / 2, gameHeight / 2, 10, ringColor2, 0)
          .setStrokeStyle(isCritical ? 6 : 3, ringColor2)
          .setDepth(D + 15);
        allParts.push(ring2);
        this.tweens.add({
          targets: ring2,
          scale: 20,
          alpha: { from: 0.5, to: 0 },
          duration: 500,
          delay: 80,
          ease: 'Cubic.easeOut'
        });
        this.cameras.main.shake(isCritical ? 400 : 200, isCritical ? 0.025 : 0.015);

        // Critical-only: massive pulsing text
        if (isCritical) {
          const critText = this.add
            .text(gameWidth / 2, gameHeight / 2, 'CRITICAL!', {
              ...textStyles.title, fontSize: '100px', color: '#ff0000', fontStyle: 'bold'
            })
            .setOrigin(0.5).setDepth(D + 20).setResolution(TEXT_DPR).setScale(0.3);
          allParts.push(critText);
          this.tweens.add({
            targets: critText,
            scale: { from: 0.3, to: 2.0 },
            alpha: { from: 1, to: 0 },
            angle: { from: -5, to: 5 },
            duration: 600,
            ease: 'Cubic.easeOut'
          });
          // Extra shockwaves for critical
          for (let i = 0; i < 3; i += 1) {
            const extraRing = this.add
              .circle(gameWidth / 2, gameHeight / 2, 10, 0xff0000, 0)
              .setStrokeStyle(4, 0xff4444)
              .setDepth(D + 16);
            allParts.push(extraRing);
            this.tweens.add({
              targets: extraRing,
              scale: 25,
              alpha: { from: 0.6, to: 0 },
              duration: 500,
              delay: i * 120,
              ease: 'Cubic.easeOut'
            });
          }
        }
      });

      // === Phase 7b: Thesis proof — closes the 3-second thesis arc started
      //     on Title (ATMAN denial) and Select (prologue). Only appears on
      //     critical hits so it feels earned. ===
      if (isCritical) {
        this.time.delayedCall(1150, () => {
          const proof = bl(THESIS_PROOF);
          const proofText = this.add
            .text(gameWidth / 2, gameHeight * 0.78, proof, {
              ...textStyles.body,
              fontSize: '18px',
              fontStyle: 'italic',
              color: '#ffd94a',
            })
            .setOrigin(0.5)
            .setDepth(D + 21)
            .setResolution(TEXT_DPR)
            .setAlpha(0);
          allParts.push(proofText);
          this.tweens.add({
            targets: proofText,
            alpha: 1,
            y: gameHeight * 0.76,
            duration: 200,
            ease: 'Cubic.easeOut',
          });
        });
      }

      // === Phase 8: Dismiss everything + camera restore (1400ms) ===
      this.time.delayedCall(1400, () => {
        this.cameras.main.zoomTo(1, 300, 'Cubic.easeOut');
        this.tweens.add({
          targets: allParts.filter((p) => p.active),
          alpha: 0,
          duration: 250,
          onComplete: destroy
        });
      });

    } else {
      // === Enemy ultimate: aggressive red flash ===
      playSfx('lose');
      this.cameras.main.shake(200, 0.015);

      const flash = this.add
        .rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0xff0000, 0.4)
        .setDepth(D);
      this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

      const label = this.add
        .text(gameWidth / 2, gameHeight * 0.3, `★ ${name} ★`, {
          ...textStyles.title, fontSize: '48px', color: '#ff4444', fontStyle: 'bold'
        })
        .setOrigin(0.5).setDepth(D + 1).setResolution(TEXT_DPR).setScale(0.3);
      this.tweens.add({
        targets: label,
        scale: 1.5,
        alpha: { from: 1, to: 0 },
        y: gameHeight * 0.25,
        duration: 1000,
        ease: 'Cubic.easeOut',
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

  private updateAuraVisual(): void {
    const aura = this.slotState.aura;
    if (aura) {
      // Create or update aura ring
      if (!this.auraRing) {
        this.auraRing = this.add
          .circle(this.playerBaseX, gameOptions.gameHeight * 0.44, SPRITE_W * 0.55, AURA_HEX[aura], 0)
          .setStrokeStyle(4, AURA_HEX[aura])
          .setDepth(5);
        this.tweens.add({
          targets: this.auraRing,
          alpha: { from: 0.1, to: 0.5 },
          scale: { from: 0.95, to: 1.1 },
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        this.auraLabel = this.add
          .text(this.playerBaseX, gameOptions.gameHeight * 0.44 + SPRITE_H / 2 + 100,
            `${aura.toUpperCase()} AURA`, {
              ...gameOptions.textStyles.small, color: AURA_CSS[aura], fontStyle: 'bold'
            })
          .setOrigin(0.5).setDepth(5);
        playSfx('skill_acquire');
      } else {
        this.auraRing.setStrokeStyle(4, AURA_HEX[aura]);
        this.auraLabel?.setText(`${aura.toUpperCase()} AURA`).setColor(AURA_CSS[aura]);
      }
    } else if (!this.slotState.inRush && this.auraRing) {
      // Rush ended, remove aura
      this.auraRing.destroy();
      this.auraRing = null;
      this.auraLabel?.destroy();
      this.auraLabel = null;
    }

    // Show "RUSH" indicator during rush mode (even before aura appears)
    if (this.slotState.inRush && !this.auraRing) {
      // Gauge bar pulses during rush (visual cue)
      this.playerUltFill.setFillStyle(0xff7a00, 1);
    }
  }

  /**
   * 擬似連 (Pseudo-continuation): mandala pulses before the button appears.
   * Roll for number of pulses, then play them sequentially.
   */
  private startGijiren(): void {
    // Roll: does 擬似連 happen at all?
    if (Math.random() >= GIJIREN_CHANCE) {
      // No 擬似連 — show button immediately
      this.showUltimateButton();
      return;
    }

    // Roll pulse count based on hit state
    const isHit = this.slotState.nextIsHit || (this.slotState.inRush && !!this.slotState.aura);
    const weights = GIJIREN_PULSE_WEIGHTS.map(([, wH, wM]) => isHit ? wH : wM);
    const total = weights.reduce((s, w) => s + w, 0);
    let roll = Math.random() * total;
    let pulseCount = 1;
    for (let i = 0; i < GIJIREN_PULSE_WEIGHTS.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) { pulseCount = GIJIREN_PULSE_WEIGHTS[i]![0]; break; }
    }

    // Play pulses sequentially, then show button
    this.playMandalaPulses(pulseCount, 0);
  }

  private playMandalaPulses(total: number, current: number): void {
    if (current >= total) {
      // All pulses done → show button
      this.showUltimateButton();
      return;
    }

    this.spawnMandalaPulse(current + 1, total);

    this.time.delayedCall(GIJIREN_PULSE_INTERVAL_MS, () => {
      this.playMandalaPulses(total, current + 1);
    });
  }

  private spawnMandalaPulse(pulseNum: number, _totalPulses: number): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;

    // Mandala ring — gets bigger and more intense with each pulse
    const baseSize = 60 + pulseNum * 30;
    const color = pulseNum >= 4 ? 0xff2222 : pulseNum >= 3 ? 0xffd94a : 0xffffff;

    // Outer ring
    const ring = this.add
      .circle(gameWidth / 2, gameHeight / 2, baseSize, color, 0)
      .setStrokeStyle(3 + pulseNum, color)
      .setDepth(190)
      .setAlpha(0);

    this.tweens.add({
      targets: ring,
      alpha: { from: 0, to: 0.8 },
      scale: { from: 0.3, to: 1.5 },
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: ring, alpha: 0, duration: 200,
          onComplete: () => ring.destroy()
        });
      }
    });

    // Inner cross pattern
    const crossH = this.add
      .rectangle(gameWidth / 2, gameHeight / 2, baseSize * 2, 2, color, 0.6)
      .setDepth(190);
    const crossV = this.add
      .rectangle(gameWidth / 2, gameHeight / 2, 2, baseSize * 2, color, 0.6)
      .setDepth(190);

    this.tweens.add({
      targets: [crossH, crossV],
      alpha: 0,
      scale: 2,
      duration: 400,
      delay: 100,
      onComplete: () => { crossH.destroy(); crossV.destroy(); }
    });

    // Screen shake — stronger with each pulse
    this.cameras.main.shake(100 + pulseNum * 50, 0.005 * pulseNum);

    // "DON" sound
    playSfx('shield_block');

    // Pulse counter text
    const dots = '●'.repeat(pulseNum);
    const counterText = this.add
      .text(gameWidth / 2, gameHeight / 2 + baseSize + 30, dots, {
        ...textStyles.body,
        color: pulseNum >= 3 ? '#ffd94a' : '#ffffff',
        fontSize: `${20 + pulseNum * 4}px`
      })
      .setOrigin(0.5)
      .setDepth(191);

    this.tweens.add({
      targets: counterText,
      alpha: { from: 1, to: 0 },
      y: counterText.y - 20,
      duration: 500,
      delay: 200,
      onComplete: () => counterText.destroy()
    });
  }

  private showUltimateButton(): void {
    // ultReady already set by startGijiren caller
    const { gameWidth, gameHeight, textStyles } = gameOptions;

    // Darken + freeze feel
    const container = this.add.container(0, 0).setDepth(180);

    const overlay = this.add.rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0.4);
    container.add(overlay);
    this.tweens.add({ targets: overlay, alpha: { from: 0, to: 0.4 }, duration: 200 });

    // Big pulsing ULTIMATE button
    const btnY = gameHeight / 2;
    const btnBg = this.add
      .rectangle(gameWidth / 2, btnY, 360, 100, 0xffd94a, 1)
      .setStrokeStyle(4, 0xffffff);
    container.add(btnBg);

    const btnText = this.add
      .text(gameWidth / 2, btnY, 'SOUL STRIKE', { ...textStyles.title, fontSize: '52px', color: '#0a0a10', fontStyle: 'bold' })
      .setOrigin(0.5);
    container.add(btnText);

    // Pulsing animation
    this.tweens.add({
      targets: [btnBg, btnText],
      scale: { from: 0.8, to: 1.05 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // "PRESS SPACE" hint
    const hint = this.add
      .text(gameWidth / 2, btnY + 70, 'PRESS SPACE or CLICK', textStyles.small)
      .setOrigin(0.5).setAlpha(0.6);
    container.add(hint);
    this.tweens.add({ targets: hint, alpha: { from: 0.3, to: 0.8 }, duration: 500, yoyo: true, repeat: -1 });

    // Aura color indicator if in rush
    if (this.slotState.aura) {
      const auraHint = this.add
        .text(gameWidth / 2, btnY - 70, `${this.slotState.aura.toUpperCase()} AURA`, {
          ...textStyles.body, color: AURA_CSS[this.slotState.aura], fontStyle: 'bold'
        })
        .setOrigin(0.5);
      container.add(auraHint);
      this.tweens.add({ targets: auraHint, scale: { from: 1, to: 1.15 }, duration: 300, yoyo: true, repeat: -1 });

      // Color the button to match aura
      btnBg.setFillStyle(AURA_HEX[this.slotState.aura], 1);
    }

    // Prediction effect: randomly chosen when a hit is flagged (not always shown)
    if (this.slotState.nextIsHit || (this.slotState.inRush && this.slotState.aura)) {
      this.spawnPrediction(container, gameWidth, gameHeight, btnBg);
    }

    this.ultButton = container;
    playSfx('shield_block');
  }

  /**
   * Spawn a prediction effect on the ultimate button screen.
   * Prediction data comes from src/data/predictions.ts.
   */
  private spawnPrediction(
    container: GameObjects.Container,
    gw: number,
    gh: number,
    btnBg: GameObjects.Rectangle
  ): void {
    const { textStyles } = gameOptions;
    const isActualHit = this.slotState.nextIsHit || (this.slotState.inRush && !!this.slotState.aura);
    const pred = rollPrediction(isActualHit);

    switch (pred.id) {
      case 'rainbow_btn': {
        playSfx('pred_rainbow');
        const colors = [0xff0000, 0xff7a00, 0xffd94a, 0x3aff7a, 0x3ab0ff, 0xcc66ff];
        let ci = 0;
        const timer = this.time.addEvent({
          delay: 120, loop: true,
          callback: () => { btnBg.setFillStyle(colors[ci % colors.length]!, 1); ci++; }
        });
        container.once('destroy', () => timer.destroy());
        const txt = this.add.text(gw / 2, gh / 2 - 90, '★ RAINBOW ★', {
          ...textStyles.body, color: '#ff00ff', fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(txt);
        this.tweens.add({ targets: txt, scale: { from: 1, to: 1.3 }, duration: 300, yoyo: true, repeat: -1 });
        break;
      }
      case 'fish': {
        playSfx('pred_fish');
        for (let i = 0; i < 8; i++) {
          const fish = this.add.text(-60, gh * 0.3 + i * 25 + Math.random() * 20, '🐟', { fontSize: '24px' });
          container.add(fish);
          this.tweens.add({ targets: fish, x: gw + 60, duration: 1500 + Math.random() * 500, delay: i * 100, ease: 'Linear' });
        }
        break;
      }
      case 'red_flash': {
        playSfx('pred_red_flash');
        const flash = this.add.rectangle(gw / 2, gh / 2, gw, gh, 0xff0000, 0);
        container.add(flash);
        this.tweens.add({ targets: flash, alpha: { from: 0, to: 0.3 }, duration: 200, yoyo: true, repeat: 2 });
        break;
      }
      case 'exclaim': {
        playSfx('pred_exclaim');
        const ex = this.add.text(gw / 2, gh / 2 - 120, '! !', {
          ...textStyles.title, fontSize: '80px', color: '#ff7a00', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);
        container.add(ex);
        this.tweens.add({ targets: ex, alpha: 1, scale: { from: 2, to: 1 }, duration: 300, ease: 'Back.easeOut' });
        break;
      }
      case 'lightning': {
        playSfx('pred_lightning');
        // 3 white flashes: rectangle alpha 0→0.6→0, 100ms each
        for (let i = 0; i < 3; i++) {
          const rect = this.add.rectangle(gw / 2, gh / 2, gw, gh, 0xffffff, 0).setDepth(190);
          container.add(rect);
          this.tweens.add({
            targets: rect,
            alpha: { from: 0, to: 0.6 },
            duration: 50,
            delay: i * 100,
            yoyo: true,
            ease: 'Linear',
            onComplete: () => rect.setAlpha(0)
          });
        }
        break;
      }
      case 'mandala': {
        playSfx('pred_mandala');
        // Circle + cross pattern in gold, fades in and out over 800ms
        const cx = gw / 2;
        const cy = gh / 2 - 80;
        const radius = 80;
        const mandalaCircle = this.add.circle(cx, cy, radius, 0xffd94a, 0)
          .setStrokeStyle(3, 0xffd94a).setAlpha(0).setDepth(190);
        const innerCircle = this.add.circle(cx, cy, radius * 0.5, 0xffd94a, 0)
          .setStrokeStyle(2, 0xffd94a).setAlpha(0).setDepth(190);
        const crossH = this.add.rectangle(cx, cy, radius * 2, 2, 0xffd94a, 0).setDepth(190);
        const crossV = this.add.rectangle(cx, cy, 2, radius * 2, 0xffd94a, 0).setDepth(190);
        const crossD1 = this.add.rectangle(cx, cy, radius * 2, 2, 0xffd94a, 0).setAngle(45).setDepth(190);
        const crossD2 = this.add.rectangle(cx, cy, radius * 2, 2, 0xffd94a, 0).setAngle(-45).setDepth(190);
        const mandalaParts = [mandalaCircle, innerCircle, crossH, crossV, crossD1, crossD2];
        for (const part of mandalaParts) container.add(part);
        this.tweens.add({
          targets: mandalaParts,
          alpha: { from: 0, to: 0.8 },
          duration: 400,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
        break;
      }
      case 'glitch': {
        playSfx('pred_glitch');
        // 5 thin horizontal lines at random y positions, random colors, flash for 200ms
        const glitchColors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0x00ffff];
        for (let i = 0; i < 5; i++) {
          const ly = Math.random() * gh;
          const lh = 2 + Math.random() * 4;
          const color = glitchColors[i % glitchColors.length]!;
          const line = this.add.rectangle(gw / 2, ly, gw, lh, color, 0.8).setDepth(190);
          container.add(line);
          this.tweens.add({
            targets: line,
            alpha: 0,
            duration: 200,
            delay: Math.random() * 100,
            ease: 'Linear'
          });
        }
        break;
      }
    }
  }

  private ultFiring = false;

  private triggerPlayerUltimate(): void {
    if (!this.ultReady) return;
    if (this.ultFiring) return;
    if (!this.player.ultimate) return;

    this.ultFiring = true;

    // Dismiss button but keep frozen
    if (this.ultButton) {
      this.ultButton.destroy();
      this.ultButton = null;
    }

    // Pachislot hit resolution
    const isHit = resolveUltimatePress(this.slotState);
    const isCritical = isHit;
    const origDmg = this.player.ultimateDmgPerStrike;
    if (isHit) {
      this.player.ultimateDmgPerStrike = Math.round(origDmg * SLOT_HIT_DAMAGE_MULT);
    }

    const attacks: AttackEvent[] = [];
    fireUltimate(this.player, this.enemy, attacks);

    // Restore original damage
    this.player.ultimateDmgPerStrike = origDmg;

    // Play cut-in animation (combat stays frozen during this)
    const ultDisplayName = (this.player.isAwakened && this.player.ultimate.awakenedName)
      ? this.player.ultimate.awakenedName
      : this.player.ultimate.name;
    this.spawnUltimateFlash(this.playerSprite.x, this.playerSprite.y, ultDisplayName, true, isCritical);

    // After full animation: apply damage, then unfreeze combat
    this.time.delayedCall(1800, () => {
      attacks.forEach((e) => this.onAttack(e, this.enemySprite, true));
      this.refreshHp();

      // Unfreeze
      this.ultReady = false;
      this.ultFiring = false;

      if (this.enemy.hp <= 0) {
        this.finishBattle('win');
      }
    });
  }

  private goToResult(): void {
    fadeToScene(this, 'Result');
  }
}
