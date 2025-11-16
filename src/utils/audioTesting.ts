import { TextToSpeechService } from '@/services/audio/textToSpeech';
import { SoundEffectsService } from '@/services/audio/soundEffects';
import { SOUND_EFFECTS } from '@/config/audio';
import { playBeep } from './audioUtils';

/**
 * Test voice announcement with current settings
 * @param text - Text to speak (default: sample text)
 */
export function testVoiceAnnouncement(text?: string): void {
  const testText = text || "This is how your workout announcements will sound. You've got this!";

  const tts = new TextToSpeechService();
  tts.speak(testText, { priority: 'high' });
}

/**
 * Test a specific sound effect
 * @param soundKey - Sound effect key from SOUND_EFFECTS
 */
export async function testSoundEffect(soundKey: keyof typeof SOUND_EFFECTS): Promise<void> {
  const sfx = new SoundEffectsService();

  try {
    await sfx.play(soundKey);
  } catch (error) {
    console.warn(`Sound effect ${soundKey} not available, playing beep instead`);
    // Fallback to beep if sound file not found
    await playBeep();
  }
}

/**
 * Test full workout audio sequence
 * Simulates a complete workout with all audio cues
 */
export async function testFullWorkoutSequence(): Promise<void> {
  const tts = new TextToSpeechService();
  const sfx = new SoundEffectsService();

  console.log('Starting full workout audio sequence test...');

  // 1. Workout Start
  console.log('1. Workout start');
  try {
    await sfx.play('WORKOUT_START');
  } catch {
    await playBeep(600, 300);
  }
  await tts.speak("Let's do this! Starting workout.");
  await sleep(2000);

  // 2. Exercise Start
  console.log('2. Exercise start');
  await tts.speak("Starting squats. 3 sets for 10 reps");
  await sleep(2000);

  // 3. Set Complete
  console.log('3. Set complete');
  try {
    await sfx.play('SET_COMPLETE');
  } catch {
    await playBeep(800, 200);
  }
  await tts.speak("Great set!");
  await sleep(2000);

  // 4. Rest Start
  console.log('4. Rest start');
  try {
    await sfx.play('REST_START');
  } catch {
    await playBeep(500, 300);
  }
  await tts.speak("Rest for 30 seconds");
  await sleep(2000);

  // 5. Rest Countdown
  console.log('5. Rest countdown');
  await tts.speak("10 seconds");
  await sleep(1500);

  console.log('6. Final countdown');
  try {
    await sfx.play('COUNTDOWN_TICK');
  } catch {
    await playBeep(700, 100);
  }
  await tts.speak("3");
  await sleep(800);

  try {
    await sfx.play('COUNTDOWN_TICK');
  } catch {
    await playBeep(700, 100);
  }
  await tts.speak("2");
  await sleep(800);

  try {
    await sfx.play('COUNTDOWN_FINAL');
  } catch {
    await playBeep(900, 200);
  }
  await tts.speak("1");
  await sleep(1000);

  // 6. Rest End
  console.log('7. Rest end');
  try {
    await sfx.play('REST_END');
  } catch {
    await playBeep(800, 300);
  }
  await tts.speak("Get ready!");
  await sleep(2000);

  // 7. Halfway Point
  console.log('8. Halfway');
  try {
    await sfx.play('HALFWAY');
  } catch {
    await playBeep(750, 300);
  }
  await tts.speak("You're halfway there!");
  await sleep(2000);

  // 8. PR Achieved
  console.log('9. PR achieved');
  try {
    await sfx.play('PR_ACHIEVED');
  } catch {
    await playBeep(1000, 500);
  }
  await tts.speak("New personal record on squats: 100 kilograms!");
  await sleep(3000);

  // 9. Workout Complete
  console.log('10. Workout complete');
  try {
    await sfx.play('WORKOUT_COMPLETE');
  } catch {
    await playBeep(600, 500);
  }
  await tts.speak("Workout complete! Great job!");

  console.log('Full workout audio sequence test completed!');
}

/**
 * Test all sound effects in sequence
 */
export async function testAllSoundEffects(): Promise<void> {
  const sfx = new SoundEffectsService();
  const soundKeys = Object.keys(SOUND_EFFECTS) as (keyof typeof SOUND_EFFECTS)[];

  console.log('Testing all sound effects...');

  for (const key of soundKeys) {
    console.log(`Playing: ${key}`);
    try {
      await sfx.play(key);
      await sleep(1000);
    } catch (error) {
      console.warn(`Failed to play ${key}:`, error);
      await playBeep();
      await sleep(1000);
    }
  }

  console.log('All sound effects tested!');
}

/**
 * Test voice selection with different voices
 */
export async function testVoiceSelection(): Promise<void> {
  const tts = new TextToSpeechService();
  const voices = tts.getVoices();

  console.log(`Found ${voices.length} voices`);

  // Test first 3 English voices
  const englishVoices = voices.filter(v => v.lang.startsWith('en')).slice(0, 3);

  for (const voice of englishVoices) {
    console.log(`Testing voice: ${voice.name} (${voice.lang})`);
    tts.setVoice(voice);
    await tts.speak(`This is ${voice.name}`);
    await sleep(3000);
  }

  console.log('Voice selection test completed!');
}

/**
 * Test volume levels
 */
export async function testVolumeLevels(): Promise<void> {
  const tts = new TextToSpeechService();
  const levels = [0.3, 0.5, 0.7, 1.0];

  for (const volume of levels) {
    console.log(`Testing volume: ${volume * 100}%`);
    tts.setVolume(volume);
    await tts.speak(`Volume at ${volume * 100} percent`);
    await sleep(2000);
  }

  console.log('Volume level test completed!');
}

/**
 * Test speech rate
 */
export async function testSpeechRate(): Promise<void> {
  const tts = new TextToSpeechService();
  const rates = [0.5, 1.0, 1.5, 2.0];

  const testPhrase = "Testing speech rate";

  for (const rate of rates) {
    console.log(`Testing rate: ${rate}x`);
    tts.setRate(rate);
    await tts.speak(`${testPhrase} at ${rate} times speed`);
    await sleep(3000);
  }

  console.log('Speech rate test completed!');
}

/**
 * Test audio interruption and priority
 */
export async function testAudioPriority(): Promise<void> {
  const tts = new TextToSpeechService();

  console.log('Starting low priority announcement...');
  tts.speak('This is a long low priority announcement that can be interrupted', {
    priority: 'low',
    interruptible: true,
  });

  await sleep(1000);

  console.log('Interrupting with high priority...');
  tts.speak('High priority interruption!', {
    priority: 'high',
    interruptible: false,
  });

  console.log('Audio priority test completed!');
}

/**
 * Test countdown sequence
 */
export async function testCountdown(from: number = 10): Promise<void> {
  const tts = new TextToSpeechService();
  const sfx = new SoundEffectsService();

  for (let i = from; i > 0; i--) {
    if (i <= 3) {
      try {
        await sfx.play(i === 1 ? 'COUNTDOWN_FINAL' : 'COUNTDOWN_TICK');
      } catch {
        await playBeep(i === 1 ? 900 : 700, 100);
      }
    }

    await tts.speak(i.toString());
    await sleep(1000);
  }

  await tts.speak('Go!');
  console.log('Countdown test completed!');
}

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export all test functions as a single object for easy access
export const AudioTests = {
  voice: testVoiceAnnouncement,
  sound: testSoundEffect,
  fullSequence: testFullWorkoutSequence,
  allSounds: testAllSoundEffects,
  voices: testVoiceSelection,
  volume: testVolumeLevels,
  rate: testSpeechRate,
  priority: testAudioPriority,
  countdown: testCountdown,
};
