import fs from 'fs';
import path from 'path';

/**
 * Converts ElevenLabs alignment data into an .ass subtitle file
 * .ass allows for advanced styling and "Karaoke" word highlighting
 */
export function generateSubtitles(alignment, outputPath) {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  
  // Reconstruct words from characters
  let words = [];
  let currentWord = "";
  let startTime = character_start_times_seconds[0];

  characters.forEach((char, i) => {
    currentWord += char;
    if (char === " " || i === characters.length - 1) {
      words.push({
        word: currentWord.trim(),
        start: startTime,
        end: character_end_times_seconds[i]
      });
      currentWord = "";
      startTime = character_start_times_seconds[i + 1];
    }
  });

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Impact,70,&H00FFFFFF,&H0000D7FF,&H80000000,&H00000000,-1,0,0,0,100,100,2,0,1,3,2,2,10,10,100,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

  let events = "";
  words.forEach(w => {
    const start = formatTime(w.start);
    const end = formatTime(w.end);
    // Karaoke effect: Secondary color (Gold) highlights as it speaks
    events += `Dialogue: 0,${start},${end},Default,,0,0,0,,{\\k${Math.floor((w.end - w.start)*100)}}${w.word}\n`;
  });

  fs.writeFileSync(outputPath, header + events);
}

function formatTime(s) {
  const date = new Date(s * 1000);
  const hh = date.getUTCHours().toString().padStart(1, '0');
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  const ms = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}