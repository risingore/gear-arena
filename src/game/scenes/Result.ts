import { Scene } from 'phaser';

import gameOptions from '../helper/gameOptions';
import { createButton, createPanel } from '../helper/uiFactory';
import { PARTS, ROBOTS, rollSkillChoices, type PartCategory, type PartKey } from '@/data';
import { BALANCE } from '@/data/balance';
import type { SkillDef } from '@/data/skills';
import { getRunState, setRunState } from '../systems/runState';
import { PALETTE } from '../systems/palette';
import { awardRoundReward } from '../systems/loadout';
import { generateShopOffer } from '../systems/shop';
import { playSfx } from '../systems/audio';
import { fadeInCurrent, fadeToScene } from '../systems/transition';
import { recordVictory, recordDefeatedEnemy, recordUsedPart, recordAcquiredSkill, recordScrap } from '../systems/savedata';
import { t } from '../systems/i18n';
import { playMusic, MUSIC_KEYS } from '../systems/music';
import { applyHiDpiToScene, showDebugBadge } from '../helper/hiDpiText';
import { runVisualChecks } from '../systems/visualDebugger';
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
      for (const partKey of Object.values(state.equipped)) {
        if (partKey) recordUsedPart(partKey as PartKey);
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
      .text(gameWidth / 2, gameHeight * 0.3, titleMap[outcome], textStyles.title)
      .setOrigin(0.5)
      .setColor(titleColor);

    this.add
      .text(gameWidth / 2, gameHeight * 0.44, state.lastResultMessage, textStyles.body)
      .setOrigin(0.5);

    if (outcome === 'win') {
      const rewarded = awardRoundReward(state);
      const advanced = {
        ...rewarded,
        currentRound: state.currentRound + 1,
        battleOutcome: 'pending' as const,
        shopOffer: generateShopOffer()
      };
      setRunState(this, advanced);

      // Gold count-up animation
      const goldEarned = advanced.gold - state.gold;
      const goldCounter = { value: state.gold };
      createPanel(this, gameWidth / 2, gameHeight * 0.55, 300, 80, { fillAlpha: 0.5, depth: 0 });
      const goldText = this.add
        .text(gameWidth / 2, gameHeight * 0.52, `${state.gold}g`, { ...textStyles.title, fontSize: '48px' })
        .setOrigin(0.5)
        .setColor('#ffd94a');
      this.tweens.add({
        targets: goldCounter,
        value: advanced.gold,
        duration: 800,
        ease: 'Cubic.easeOut',
        onUpdate: () => goldText.setText(`${Math.floor(goldCounter.value)}g`)
      });
      this.add
        .text(gameWidth / 2, gameHeight * 0.60, `+${goldEarned}g`, textStyles.body)
        .setOrigin(0.5)
        .setColor('#3aff7a')
        .setAlpha(0.8);
      playSfx('buy');

      // Check if the cleared round was a boss → offer skill selection.
      const clearedRound = state.generatedRounds[state.currentRound - 1];
      const isBossRound = clearedRound?.isBoss === true;
      const isBigBoss = clearedRound && !clearedRound.isSuperBoss && state.currentRound >= 10;
      const isSuperRoute = state.generatedRounds.length > 10;

      if (isBossRound && advanced.acquiredSkills.length < 3) {
        // Big boss skills only offered on super-boss route.
        const offerSkills = isBigBoss ? isSuperRoute : true;
        if (offerSkills) {
          const tier = isBigBoss ? 'bigBoss' as const : 'midBoss' as const;
          const choices = rollSkillChoices(tier, advanced.acquiredSkills);
          if (choices.length > 0) {
            this.showSkillSelection(choices, advanced);
            return;
          }
        }
      }

      this.showContinueButtons();
    } else if (outcome === 'victory') {
      if (state.robotKey) recordVictory(state.robotKey);
      // Convert remaining gold to scrap.
      const scrapEarned = Math.floor(state.gold * BALANCE.scrapConversionRate);
      if (scrapEarned > 0) recordScrap(scrapEarned);

      const totalRounds = state.generatedRounds.length;
      this.add
        .text(
          gameWidth / 2,
          gameHeight * 0.50,
          `${t('All')} ${totalRounds} ${t('rounds cleared. Final gold:')} ${state.gold}g`,
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

      createButton(this, gameWidth / 2, gameHeight * 0.78, 280, 48, t('RETURN TO TITLE'), () => {
        playSfx('click');
        fadeToScene(this, 'Title');
      });
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
  }

  private showAcquiredLabel(skillName: string): void {
    const { gameWidth, gameHeight, textStyles } = gameOptions;
    this.add
      .text(gameWidth / 2, gameHeight * 0.64, `Acquired: ${t(skillName)}`, textStyles.body)
      .setOrigin(0.5)
      .setColor('#3aff7a');
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

    this.add
      .text(gameWidth / 2, gameHeight * 0.56, t('CHOOSE A SKILL'), textStyles.body)
      .setOrigin(0.5)
      .setColor('#ffd94a');

    const cardW = 280;
    const cardH = 100;
    const gap = 20;
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

      this.add.text(x, cardY - 28, t(skill.name), textStyles.body).setOrigin(0.5).setColor('#ffd94a');
      this.add.text(x, cardY + 8, t(skill.description), textStyles.small).setOrigin(0.5);

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
        this.showAcquiredLabel(skill.name);
        this.showContinueButtons();
      });
    });

    applyHiDpiToScene(this);
    showDebugBadge(this, isDebugEnabled());
  }

  /**
   * Reinforce the "Machines" theme on the victory screen by describing the
   * assembled loadout: "Your KNIGHT-01 contained 2 weapons, 3 gears, 1 engine".
   */
  private buildMachineSummary(
    robotKey: string | null,
    equipped: Readonly<Record<string, string>>
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
      const key = equipped[slotId];
      if (!key) continue;
      if (!(key in PARTS)) continue;
      const part = PARTS[key as keyof typeof PARTS];
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
}
