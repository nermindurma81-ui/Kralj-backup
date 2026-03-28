import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'

const execAsync = promisify(exec)

// Assemble video from scenes with images + audio
export async function assembleVideo(scenes, mediaFiles, audioFiles, options = {}) {
  const {
    outputDir = './output',
    filename = 'output',
    width = 1080,
    height = 1920,
    fps = 30,
    bgColor = '#1a1a2e'
  } = options

  await mkdir(outputDir, { recursive: true })
  const workDir = join(outputDir, 'tmp')
  await mkdir(workDir, { recursive: true })

  try {
    // 1. Create concat file for images
    let concatContent = ''
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const media = mediaFiles[i]
      if (!media?.localPath) continue

      const duration = scene.duration || 3
      concatContent += `file '${media.localPath}'\n`
      concatContent += `duration ${duration}\n`
    }

    // Repeat last frame (ffmpeg concat requirement)
    if (mediaFiles.length > 0) {
      const lastMedia = mediaFiles.filter(m => m?.localPath).pop()
      if (lastMedia) {
        concatContent += `file '${lastMedia.localPath}'\n`
      }
    }

    const concatPath = join(workDir, 'concat.txt')
    await writeFile(concatPath, concatContent)

    // 2. Build video from images
    const videoOnlyPath = join(workDir, 'video-only.mp4')
    await execAsync([
      'ffmpeg', '-y',
      '-f', 'concat', '-safe', '0', '-i', concatPath,
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${bgColor}`,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-r', String(fps),
      '-preset', 'fast',
      videoOnlyPath
    ].join(' '))

    // 3. Merge audio if available
    const hasAudio = audioFiles.some(a => a)
    const outputPath = join(outputDir, `${filename}.mp4`)

    if (hasAudio) {
      // Create audio concat
      let audioConcat = ''
      for (let i = 0; i < audioFiles.length; i++) {
        if (audioFiles[i]) {
          audioConcat += `file '${audioFiles[i]}'\n`
        }
      }
      const audioConcatPath = join(workDir, 'audio-concat.txt')
      await writeFile(audioConcatPath, audioConcat)

      // Concat audio
      const audioAllPath = join(workDir, 'audio-all.wav')
      await execAsync([
        'ffmpeg', '-y',
        '-f', 'concat', '-safe', '0', '-i', audioConcatPath,
        '-c:a', 'pcm_s16le',
        audioAllPath
      ].join(' '))

      // Merge video + audio
      await execAsync([
        'ffmpeg', '-y',
        '-i', videoOnlyPath,
        '-i', audioAllPath,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        outputPath
      ].join(' '))
    } else {
      // Just video, no audio
      await execAsync(`cp "${videoOnlyPath}" "${outputPath}"`)
    }

    // 4. Add captions (SRT burn-in) if available
    if (options.srtContent) {
      const srtPath = join(workDir, 'captions.srt')
      await writeFile(srtPath, options.srtContent)

      const finalPath = join(outputDir, `${filename}-subtitled.mp4`)
      await execAsync([
        'ffmpeg', '-y',
        '-i', outputPath,
        '-vf', `subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,MarginV=50'`,
        '-c:a', 'copy',
        finalPath
      ].join(' '))

      // Clean up and rename
      await unlink(outputPath).catch(() => {})
      return finalPath
    }

    return outputPath

  } finally {
    // Cleanup temp files
    await execAsync(`rm -rf "${workDir}"`).catch(() => {})
  }
}

// Quick concat multiple video clips
export async function concatClips(clipPaths, outputPath) {
  const concatContent = clipPaths.map(p => `file '${p}'`).join('\n')
  const tmpFile = outputPath + '.concat.txt'

  await writeFile(tmpFile, concatContent)

  try {
    await execAsync([
      'ffmpeg', '-y',
      '-f', 'concat', '-safe', '0', '-i', tmpFile,
      '-c', 'copy',
      outputPath
    ].join(' '))
  } finally {
    await unlink(tmpFile).catch(() => {})
  }

  return outputPath
}

// Get video duration in seconds
export async function getDuration(filepath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filepath}"`
    )
    return parseFloat(stdout.trim())
  } catch {
    return 0
  }
}
