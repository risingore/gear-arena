import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { createButton, createPanel } from '../helper/uiFactory';
import { PARTS, ROBOTS, rollSkillChoices, type PartCategory } from '@/data';
import { BALANCE } from '@/data/balance';
import type { SkillDef } from '@/data/skills';
import { findEnemyDef } from '@/data/enemies';
import {
  ATMAN_NORMAL_STATEMENTS,
  ATMAN_MIDBOSS_STATEMENTS,
  ATMAN_BIGBOSS_STATEMENTS,
  HYAKKI_YAKOU_TEASER,
} from '@/data/storyText';
import { getRunState, setRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { bl } from '../systems/i18n';
import { awardRoundReward } from '../systems/loadout';
import { generateShopOffer } from '../systems/shop';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { recordVictory, recordDefeatedEnemy, recordUsedPart, recordAcquiredSkill, recordScrap } from '../systems/savedata';
import { mountEdOverlay } from '../overlays/edOverlay';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
import { setupLayoutDebug } from '../systems/layoutDebug';
import { isDebugEnabled } from '../systems/debug';

export class Result extends Scene {
  constructor() {
    super('Result');
  }

  create(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.cameras.main.setBackgroundColor(PALETTE.bg);
    fadeInCurrent(this);

    const state = getRunState(this);
    const outcome = state.battleOutcome;
    if (outcome === 'victory') playMusic(this, MUSIC_KEYS.victory);

    // Track defeated enemies and used parts in the collection.
    if ((outcome === 'win' || outcome === 'victory') && state.lastDefeatedEnemyId) {
      recordDefeatedEnemy(state.lastDefeatedEnemyId);
    }
    if (outcome === 'win' || outcome === 'victory') {
      for (const entry of Object.values(state.equipped)) {
        if (entry?.key) recordUsedPart(entry.key);
      }
    }

    const titleMap: Record<typeof outcome, string> = {
      pending: '...',
      win: t('ROUND CLEARED'),
      lose: t('DEFEATED'),
      victory: t('VICTORY')
    };
    const titleColor =
      outcome === 'victory'
        ? '#ffd94a'
        : outcome === 'win'
          ? '#3aff7a'
          : '#ff4444';

    this.add
      .text(gameWidth / 2, gameHeight * 0.18, titleMap[outcome], textStyles.title)
      .setOrigin(0.5)
      .setColor(titleColor);

    if (outcome === 'win') {
      const rewarded = awardRoundReward(state);
      const advanced = {
        ...rewarded,
        currentRound: state.currentRound + 1,
        battleOutcome: 'pending' as const,
        shopOffer: generateShopOffer()
      };
      setRunState(this, advanced);

      // Gold panel
      const goldEarned = advanced.gold - state.gold;
      const goldCounter = { value: state.gold };
      const goldY = gameHeight * 0.32;
      createPanel(this, gameWidth / 2, goldY, 260, 70, { fillAlpha: 0.5, depth: 0 });
      const goldText = this.add
        .text(gameWidth / 2, goldY - 8, `${state.gold} g`, { ...textStyles.title, fontSize: '42px' })
        .setOrigin(0.5)
        .setDepth(1)
        .setColor('#ffd94a');
      this.tweens.add({
        targets: goldCounter,
        value: advanced.gold,
        duration: 800,
        ease: 'Cubic.easeOut',
        onUpdate: () => goldText.setText(`${Math.floor(goldCounter.value)} g`)
      });
      this.add
        .text(gameWidth / 2, goldY + 22, `+${goldEarned} g`, textStyles.body)
        .setOrigin(0.5)
        .setDepth(1)
        .setColor('#3aff7a')
        .setAlpha(0.8);
      playSfx('buy');

      // Check if the cleared round was a boss → offer skill selection.
      const clearedRound = state.generatedRounds[state.currentRound - 1];
      const isBossRound = clearedRound?.isBoss === true;
      const isBigBoss = clearedRound && !clearedRound.isSuperBoss && state.currentRound >= 10;
      const isSuperRoute = state.generatedRounds.length > 10;
      let showSkills = false;

      if (isBossRound && advanced.acquiredSkills.length < 3) {
        const offerSkills = isBigBoss ? isSuperRoute : true;
        if (offerSkills) {
          const tier = isBigBoss ? 'bigBoss' as const : 'midBoss' as const;
          const choices = rollSkillChoices(tier, advanced.acquiredSkills);
          if (choices.length > 0) {
            // ATMAN statement above skill area (smaller Y)
            if (state.lastDefeatedEnemyId) {
              this.showAtmanStatement(state.lastDefeatedEnemyId, gameHeight * 0.44);
            }
            this.showSkillSelection(choices, advanced);
            showSkills = true;
          }
        }
      }

      if (!showSkills) {
        // ATMAN statement in normal position
        if (state.lastDefeatedEnemyId) {
          this.showAtmanStatement(state.lastDefeatedEnemyId, gameHeight * 0.50);
        }
        this.showContinueButtons();
      }
    } else if (outcome === 'victory') {
      if (state.robotKey) recordVictory(state.robotKey);
      const scrapEarned = Math.floor(state.gold * BALANCE.scrapConversionRate);
      if (scrapEarned > 0) recordScrap(scrapEarned);

      // ATMAN statement for victory
      if (state.lastDefeatedEnemyId) {
        this.showAtmanStatement(state.lastDefeatedEnemyId, gameHeight * 0.36);
      }

      const totalRounds = state.generatedRounds.length;
      this.add
        .text(
          gameWidth / 2,
          gameHeight * 0.50,
          `${t('All')} ${totalRounds} ${t('rounds cleared. Final gold:')} ${state.gold} g`,
          textStyles.body
        )
        .setOrigin(0.5)
        .setColor('#ffd94a');

      if (scrapEarned > 0) {
        this.add
          .text(gameWidth / 2, gameHeight * 0.54, `+${scrapEarned} Scrap`, textStyles.small)
          .setOrigin(0.5)
          .setColor('#aeeaff');
      }

      // Run stats summary
      const rs = state.runStats;
      const statsLines = [
        `DMG Dealt: ${rs.totalDamageDealt}   DMG Taken: ${rs.totalDamageTaken}`,
        `Healed: ${rs.totalHealed}   Rounds: ${rs.roundsCleared}   Enemies: ${rs.enemiesDefeated}`,
        `Parts Used: ${rs.partsUsed}`
      ];
      this.add
        .text(gameWidth / 2, gameHeight * 0.60, statsLines.join('\n'), textStyles.small)
        .setOrigin(0.5)
        .setAlpha(0.7);

      const summary = this.buildMachineSummary(state.robotKey, state.equipped);
      if (summary) {
        this.add
          .text(gameWidth / 2, gameHeight * 0.68, summary, textStyles.small)
          .setOrigin(0.5)
          .setAlpha(0.85);
      }

      this.showEdSequence();
      this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'Title'));
    } else if (outcome === 'lose') {
      createButton(this, gameWidth / 2, gameHeight * 0.70, 240, 48, t('CONTINUE'), () => {
        playSfx('click');
        fadeToScene(this, 'GameOver');
      });
      this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'GameOver'));
      this.time.delayedCall(2500, () => fadeToScene(this, 'GameOver'));
    } else {
      createButton(this, gameWidth / 2, gameHeight * 0.70, 280, 48, t('RETURN TO TITLE'), () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      });
      this.input.keyboard?.once('keydown-SPACE', () => fadeToScene(this, 'Title'));
    }

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
    runVisualChecks(this);
    setupLayoutDebug(this);
  }

  private showAcquiredLabel(skillName: string): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.add
      .text(gameWidth / 2, gameHeight * 0.64, `Acquired: ${t(skillName)}`, textStyles.body)
      .setOrigin(0.5)
      .setColor('#3aff7a');
  }

  /**
   * Victory ED: HYAKKI YAKOU — STANDING BY teaser, then
   * TO BE CONTINUED: SOUL BREAKER reveal. Sets up the three-episode arc
   * (STRIKE -> BREAKER -> SAMSARA) as defined in docs/story.md.
   */
  private showEdSequence(): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;

    // Phase 1 (delay 1800ms): HYAKKI YAKOU glitch line for 0.7s
    this.time.delayedCall(1800, () => {
      const teaser = bl(HYAKKI_YAKOU_TEASER);
      const t1 = this.add
        .text(gameWidth / 2, gameHeight * 0.88, teaser, {
          ...textStyles.small,
          color: '#aeeaff',
          fontStyle: 'italic',
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(10);
      this.tweens.add({
        targets: t1,
        alpha: { from: 0, to: 0.6 },
        duration: 200,
        yoyo: true,
        hold: 500,
        ease: 'Linear',
        onComplete: () => t1.destroy(),
      });
    });

    // Phase 2 (delay 3600ms): DOM-based ED reveal. Native browser text gives
    // the SOUL BREAKER headline crisp edges that Phaser text shadows can't
    // match — matches the Title overlay's rendering path.
    this.time.delayedCall(3600, () => {
      mountEdOverlay({
        continuedLabel: t('TO BE CONTINUED:'),
        heroText: 'SOUL BREAKER',
        holdMs: 3500,
      });
      void gameWidth;
      void gameHeight;
      void textStyles;
    });

    // Manual return button (under the bottom HUD)
    createButton(this, gameWidth / 2, gameHeight * 0.92, 240, 38, t('RETURN TO TITLE'), () => {
      playSfx('click');
      fadeToScene(this, 'Title');
    });
  }

  private showContinueButtons(): void {
    const { gameWidth, gameHeight } = gameOptions;
    createButton(this, gameWidth / 2, gameHeight * 0.70, 260, 48, t('NEXT ROUND'), () => {
      playSfx('click');
      fadeToScene(this, 'Build');
    }, { variant: 'accent', accentColor: 0x3aff7a });
    createButton(this, gameWidth / 2, gameHeight * 0.78, 240, 44, t('QUIT TO TITLE'), () => {
      playSfx('click');
      fadeToScene(this, 'Title');
    });
    this.input.keyboard?.once('keydown-SPACE', () => { playSfx('click'); fadeToScene(this, 'Build'); });
    applyHiDpiToScene(this);
  }

  private showSkillSelection(choices: SkillDef[], currentState: import('../systems/runState').RunState): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;

    const skillElements: GameObjects.GameObject[] = [];

    const chooseLabel = this.add
      .text(gameWidth / 2, gameHeight * 0.56, t('CHOOSE A SKILL'), textStyles.body)
      .setOrigin(0.5)
      .setColor('#ffd94a');
    skillElements.push(chooseLabel);

    const cardW = 240;
    const cardH = 90;
    const gap = 16;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = gameWidth / 2 - totalW / 2 + cardW / 2;
    const cardY = gameHeight * 0.70;

    choices.forEach((skill, i) => {
      const x = startX + i * (cardW + gap);
      const bg = createPanel(this, x, cardY, cardW, cardH, {
        fillColor: PALETTE.cardBg,
        borderColor: PALETTE.cardStroke
      });
      bg.setInteractive({ useHandCursor: true });
      skillElements.push(bg);

      const nameLabel = this.add.text(x, cardY - 20, t(skill.name), textStyles.body).setOrigin(0.5).setColor('#ffd94a');
      const descLabel = this.add.text(x, cardY + 12, t(skill.description), {
        ...textStyles.small, wordWrap: { width: cardW - 20 }, align: 'center'
      }).setOrigin(0.5);
      skillElements.push(nameLabel, descLabel);

      bg.on('pointerover', () => bg.setStrokeStyle(3, PALETTE.accentOrange));
      bg.on('pointerout', () => bg.setStrokeStyle(2, PALETTE.cardStroke));
      bg.on('pointerdown', () => {
        playSfx('buy');
        recordAcquiredSkill(skill.id);
        const updated = {
          ...currentState,
          acquiredSkills: [...currentState.acquiredSkills, skill.id]
        };
        setRunState(this, updated);
        // Destroy all skill selection elements before showing continue buttons
        for (const el of skillElements) el.destroy();
        this.showAcquiredLabel(skill.name);
        this.showContinueButtons();
      });
    });

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }

  /**
   * Reinforce the "Machines" theme on the victory screen by describing the
   * assembled loadout: "Your INDRA contained 2 weapons, 3 gears, 1 engine".
   */
  private buildMachineSummary(
    robotKey: string | null,
    equipped: Readonly<Record<string, import('../systems/runState').EquippedEntry>>
  ): string {
    if (!robotKey || !(robotKey in ROBOTS)) return '';
    const robot = ROBOTS[robotKey as keyof typeof ROBOTS];
    const counts: Record<PartCategory, number> = {
      module: 0,
      implant: 0,
      charger: 0,
      booster: 0,
      soul: 0
    };
    for (const slotId of Object.keys(equipped)) {
      const entry = equipped[slotId];
      if (!entry?.key) continue;
      if (!(entry.key in PARTS)) continue;
      const part = PARTS[entry.key as keyof typeof PARTS];
      counts[part.category] += 1;
    }
    const parts: string[] = [];
    if (counts.module > 0) parts.push(`${counts.module} ${t('modules')}`);
    if (counts.implant > 0) parts.push(`${counts.implant} ${t('implants')}`);
    if (counts.charger > 0) parts.push(`${counts.charger} ${t('chargers')}`);
    if (counts.booster > 0) parts.push(`${counts.booster} ${t('boosters')}`);
    if (counts.soul > 0) parts.push(`${counts.soul} ${t('souls')}`);
    if (parts.length === 0) return '';
    return `${t('Your')} ${t(robot.name)} ${t('contained')}: ${parts.join(', ')}`;
  }

  private showAtmanStatement(enemyId: string, centerY: number): void {
    const { gameWidth, textStyles } = gameOptions;
    const def = findEnemyDef(enemyId);
    if (!def) return;

    let statement: { en: string; ja: string } | undefined;

    if (def.category === 'midBoss') {
      statement = ATMAN_MIDBOSS_STATEMENTS[def.id];
    } else if (def.category === 'bigBoss') {
      statement = ATMAN_BIGBOSS_STATEMENTS[def.id];
    }

    if (!statement) {
      const idx = Math.floor(Math.random() * ATMAN_NORMAL_STATEMENTS.length);
      statement = ATMAN_NORMAL_STATEMENTS[idx];
    }

    if (!statement) return;

    const text = bl(statement);
    const frameW = 560;
    const frameH = 72;

    // Holographic frame background
    const frameBg = this.add
      .rectangle(gameWidth / 2, centerY, frameW, frameH, 0x0a2030, 0.85)
      .setStrokeStyle(1, 0x00ccff)
      .setDepth(5);

    // Scan line effect (thin horizontal lines)
    for (let i = 0; i < 3; i++) {
      const lineY = centerY - frameH / 2 + 8 + i * (frameH / 3);
      this.add
        .rectangle(gameWidth / 2, lineY, frameW - 4, 1, 0x00ccff, 0.15)
        .setDepth(6);
    }

    // Corner brackets
    const bLen = 12;
    const bOff = 2;
    const corners = [
      [-frameW / 2 + bOff, -frameH / 2 + bOff, bLen, 0, bLen],
      [frameW / 2 - bOff, -frameH / 2 + bOff, -bLen, 0, bLen],
      [-frameW / 2 + bOff, frameH / 2 - bOff, bLen, 0, -bLen],
      [frameW / 2 - bOff, frameH / 2 - bOff, -bLen, 0, -bLen],
    ];
    for (const [cx, cy, dx, , dy] of corners) {
      this.add.rectangle(gameWidth / 2 + cx + dx / 2, centerY + cy, Math.abs(dx), 1, 0x00ccff, 0.8).setDepth(7);
      this.add.rectangle(gameWidth / 2 + cx, centerY + cy + dy / 2, 1, Math.abs(dy), 0x00ccff, 0.8).setDepth(7);
    }

    // ATMAN label
    this.add
      .text(gameWidth / 2, centerY - 16, '— ATMAN —', {
        ...textStyles.small, color: '#00ccff', fontSize: '12px',
      })
      .setOrigin(0.5)
      .setDepth(8)
      .setAlpha(0.8);

    // Statement text
    const label = this.add
      .text(gameWidth / 2, centerY + 6, text, {
        ...textStyles.small,
        color: '#88ddff',
        wordWrap: { width: frameW - 40 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(8);

    // Fade-in animation
    const allElements = [frameBg, label];
    for (const el of allElements) {
      el.setAlpha(0);
      this.tweens.add({
        targets: el,
        alpha: el === frameBg ? 0.85 : 0.9,
        duration: 800,
        delay: 400,
        ease: 'Sine.easeIn',
      });
    }
  }
}
