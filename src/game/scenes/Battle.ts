import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import {
  ROBOTS,
  type PartKey
} from '@/data';
import { getRunState, setRunState } from '../systems/runState';
import { PALETTE, ROBOT_COLORS } from '../systems/palette';
import { computeLoadoutStats } from '../systems/stats';
import {
  createPlayerCombatant,
  tickCombatant,
  type Combatant,
  type AttackEvent
} from '../systems/combat';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { recordRoundReached } from '../systems/savedata';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { applyHiDpiToScene, TEXT_DPR } from '../helper/hiDpiText';
import { isDebugEnabled } from '../systems/debug';

const HP_BAR_W = 280;
const HP_BAR_H = 20;
const SPRITE_W = 280;
const SPRITE_H = 360;
const LOG_LINE_COUNT = 5;
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
  private logText!: GameObjects.Text;
  private logLines: string[] = [];
  private finished = false;
  private finishDelay = 0;
  private overdriveLabel: GameObjects.Text | null = null;
  private timeScale = 2;
  private speedLabel!: GameObjects.Text;
  private elapsedBattleSec = 0;
  private debugTimerText!: GameObjects.Text;
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
    const stats = computeLoadoutStats(robot, state.equipped);

    // Pull the pre-generated enemy for this round from the run state.
    const genRound = state.generatedRounds[state.currentRound - 1];
    if (!genRound) {
      this.scene.start('Title');
      return;
    }
    const totalRounds = state.generatedRounds.length;
    const roundEnemy = genRound.enemy;

    this.player = createPlayerCombatant(robot.name, stats);
    this.enemy = {
      name: roundEnemy.name,
      maxHp: roundEnemy.hp,
      hp: roundEnemy.hp,
      damageReductionFlat: 0,
      damageReductionPct: roundEnemy.damageReductionPct,
      weapons: [
        {
          label: 'Enemy Strike',
          damage: roundEnemy.damage,
          cooldownSec: roundEnemy.cooldownSec,
          timer: roundEnemy.cooldownSec
        }
      ],
      overdriveMultiplier: 0,
      overdriveThresholdHp: 0,
      overdriveActive: false,
      repairIntervalSec: 0,
      repairAmount: 0,
      repairTimer: 0
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

    // Use the real battle sprite if the image asset has been loaded,
    // otherwise fall back to the archetype-colored rectangle placeholder.
    const battleKey = robot.battleAssetKey;
    if (this.textures.exists(battleKey)) {
      const img = this.add.image(playerX, arenaY, battleKey);
      const scale = Math.min(SPRITE_W / img.width, SPRITE_H / img.height);
      img.setScale(scale);
      this.playerSprite = this.add
        .rectangle(playerX, arenaY, SPRITE_W, SPRITE_H, 0x000000, 0);
    } else {
      this.playerSprite = this.add
        .rectangle(playerX, arenaY, SPRITE_W, SPRITE_H, ROBOT_COLORS[robot.archetype], 1)
        .setStrokeStyle(3, PALETTE.textPrimary);
    }

    this.add
      .text(playerX, arenaY - SPRITE_H / 2 - 28, t(robot.name), textStyles.body)
      .setOrigin(0.5);

    this.enemySprite = this.add
      .rectangle(enemyX, arenaY, SPRITE_W, SPRITE_H, PALETTE.accentRed, 1)
      .setStrokeStyle(3, PALETTE.textPrimary);

    this.add
      .text(enemyX, arenaY - SPRITE_H / 2 - 28, t(roundEnemy.name), textStyles.body)
      .setOrigin(0.5);

    // HP bars
    this.add
      .rectangle(playerX, arenaY + SPRITE_H / 2 + 32, HP_BAR_W, HP_BAR_H, PALETTE.hpBarBg, 1)
      .setOrigin(0.5);
    this.playerHpFill = this.add
      .rectangle(playerX - HP_BAR_W / 2, arenaY + SPRITE_H / 2 + 32, HP_BAR_W, HP_BAR_H, PALETTE.hpBarFill, 1)
      .setOrigin(0, 0.5);
    this.playerHpText = this.add
      .text(playerX, arenaY + SPRITE_H / 2 + 32, '', textStyles.small)
      .setOrigin(0.5);

    this.add
      .rectangle(enemyX, arenaY + SPRITE_H / 2 + 32, HP_BAR_W, HP_BAR_H, PALETTE.hpBarBg, 1)
      .setOrigin(0.5);
    this.enemyHpFill = this.add
      .rectangle(enemyX - HP_BAR_W / 2, arenaY + SPRITE_H / 2 + 32, HP_BAR_W, HP_BAR_H, PALETTE.hpBarFillEnemy, 1)
      .setOrigin(0, 0.5);
    this.enemyHpText = this.add
      .text(enemyX, arenaY + SPRITE_H / 2 + 32, '', textStyles.small)
      .setOrigin(0.5);

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

    this.pushLog(t('Combat begins…  (SPACE: speed toggle x1 / x2 / x4)'));

    this.input.keyboard?.on('keydown-R', () => fadeToScene(this, 'Title'));
    this.input.keyboard?.on('keydown-SPACE', () => this.cycleSpeed());

    // Record best round reached (even if this battle is lost).
    recordRoundReached(state.currentRound);

    this.refreshHp();

    applyHiDpiToScene(this);
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

    const playerTick = tickCombatant(this.player, this.enemy, dtSec);
    playerTick.attacks.forEach((e) => this.onAttack(e, this.enemySprite, true));
    if (playerTick.healed > 0) this.spawnHealPopup(this.playerSprite.x, this.playerSprite.y, playerTick.healed);
    if (playerTick.overdriveTriggered) this.triggerOverdriveIndicator();

    if (this.enemy.hp <= 0) {
      this.finishBattle('win');
      return;
    }

    const enemyTick = tickCombatant(this.enemy, this.player, dtSec);
    enemyTick.attacks.forEach((e) => this.onAttack(e, this.playerSprite, false));

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

    const weaponKey = event.weaponLabel.toLowerCase();
    const isRanged = weaponKey.includes('laser') || weaponKey.includes('cannon') || weaponKey.includes('strike');
    playSfx(fromPlayer ? (isRanged ? 'attack_ranged' : 'attack_melee') : 'hit');

    this.tweens.add({
      targets: targetSprite,
      alpha: { from: 0.25, to: 1 },
      duration: 140,
      ease: 'Cubic.easeOut'
    });
    this.cameras.main.shake(80, fromPlayer ? 0.002 : 0.004);

    this.spawnDamagePopup(targetSprite.x, targetSprite.y - 20, event.finalDamage, fromPlayer);

    if (event.killed) {
      this.tweens.add({
        targets: targetSprite,
        scaleX: 0.6,
        scaleY: 0.6,
        alpha: 0.3,
        duration: 400
      });
    }
  }

  private spawnDamagePopup(x: number, y: number, damage: number, fromPlayer: boolean): void {
    const text = this.add
      .text(x, y, `-${damage}`, {
        ...gameOptions.textStyles.body,
        color: fromPlayer ? '#ffd94a' : '#ff6a6a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
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
    setRunState(this, {
      ...state,
      battleOutcome: finalOutcome,
      lastResultMessage: message,
      lastDefeatedEnemyId: outcome === 'win' && genRound ? genRound.enemyId : ''
    });
    this.pushLog(message);
    playSfx(finalOutcome === 'victory' ? 'victory' : outcome === 'win' ? 'win' : 'lose');
    this.refreshHp();
  }

  private goToResult(): void {
    fadeToScene(this, 'Result');
  }
}
