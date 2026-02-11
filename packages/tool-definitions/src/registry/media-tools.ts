/**
 * Media Tools Registry
 * Category: Media
 * Subcategories: Image, Video, Audio, Document, Archive, File, Font, PDF
 */

import type { ToolMetadata } from '../types';

export const mediaTools: ToolMetadata[] = [
  // =====================================================
  // IMAGE TOOLS
  // =====================================================

  {
    id: 'raster-to-raster', name: 'Raster ⇄ Raster', description: 'Convert PNG, JPG, BMP, TIFF, GIF', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPEG' }, { value: 'webp', label: 'WebP' }, { value: 'bmp', label: 'BMP' }, { value: 'tiff', label: 'TIFF' }, { value: 'gif', label: 'GIF' }], defaultValue: 'png' },
      { name: 'quality', type: 'range', label: 'Quality', min: 1, max: 100, defaultValue: 85 },
      { name: 'colorProfile', type: 'select', label: 'Color Profile', options: [{ value: 'srgb', label: 'sRGB' }, { value: 'preserve', label: 'Preserve Original' }], defaultValue: 'srgb' },
      { name: 'dpi', type: 'number', label: 'DPI / Resolution', min: 72, max: 600, defaultValue: 72 }
    ]
  },
  {
    id: 'heic-convert', name: 'HEIC / HEIF → Standard', description: 'Convert HEIC to standard formats', category: 'Media', subcategory: 'Image', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'jpg', label: 'JPEG' }, { value: 'png', label: 'PNG' }, { value: 'webp', label: 'WebP' }], defaultValue: 'jpg' },
      { name: 'quality', type: 'range', label: 'Quality', min: 1, max: 100, defaultValue: 90 },
      { name: 'hdrHandling', type: 'select', label: 'HDR Handling', options: [{ value: 'tonemap', label: 'Tone Map' }, { value: 'flatten', label: 'Flatten' }], defaultValue: 'tonemap' }
    ]
  },
  {
    id: 'camera-raw-convert', name: 'Camera RAW → Standard', description: 'Convert RAW camera images', category: 'Media', subcategory: 'Image', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'whiteBalance', type: 'select', label: 'White Balance', options: [{ value: 'auto', label: 'Auto' }, { value: 'daylight', label: 'Daylight' }, { value: 'cloudy', label: 'Cloudy' }, { value: 'tungsten', label: 'Tungsten' }, { value: 'fluorescent', label: 'Fluorescent' }, { value: 'custom', label: 'Custom' }], defaultValue: 'auto' },
      { name: 'exposureCompensation', type: 'range', label: 'Exposure Compensation', min: -3, max: 3, step: 0.1, defaultValue: 0 },
      { name: 'colorSpace', type: 'select', label: 'Color Space', options: [{ value: 'srgb', label: 'sRGB' }, { value: 'adobergb', label: 'Adobe RGB' }, { value: 'prophoto', label: 'ProPhoto RGB' }], defaultValue: 'srgb' },
      { name: 'bitDepth', type: 'select', label: 'Output Bit Depth', options: [{ value: '8', label: '8-bit' }, { value: '16', label: '16-bit' }], defaultValue: '8' }
    ]
  },
  {
    id: 'psd-convert', name: 'PSD / PSB → Standard', description: 'Convert PSD to standard formats', category: 'Media', subcategory: 'Image', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'layerHandling', type: 'select', label: 'Layer Handling', options: [{ value: 'flatten', label: 'Flatten All' }, { value: 'export', label: 'Export Layers Separately' }], defaultValue: 'flatten' },
      { name: 'colorProfile', type: 'select', label: 'Color Profile', options: [{ value: 'srgb', label: 'sRGB' }, { value: 'preserve', label: 'Preserve Original' }], defaultValue: 'srgb' },
      { name: 'transparency', type: 'checkbox', label: 'Preserve Transparency', defaultValue: true }
    ]
  },
  {
    id: 'ai-eps-convert', name: 'AI / EPS → Raster & Vector', description: 'Convert AI/EPS files', category: 'Media', subcategory: 'Image', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'outputType', type: 'select', label: 'Output Type', options: [{ value: 'raster', label: 'Raster (PNG/JPEG)' }, { value: 'svg', label: 'SVG' }, { value: 'pdf', label: 'PDF' }], defaultValue: 'raster' },
      { name: 'rasterDpi', type: 'number', label: 'Raster DPI', min: 72, max: 1200, defaultValue: 300 },
      { name: 'artboardSelection', type: 'select', label: 'Artboard Selection', options: [{ value: 'all', label: 'All Artboards' }, { value: 'first', label: 'First Only' }, { value: 'range', label: 'Specify Range' }], defaultValue: 'all' }
    ]
  },
  {
    id: 'svg-convert', name: 'SVG → Raster & Vector', description: 'Convert SVG files', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'targetFormat', type: 'select', label: 'Target Format', options: [{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPEG' }, { value: 'webp', label: 'WebP' }, { value: 'pdf', label: 'PDF' }], defaultValue: 'png' },
      { name: 'viewportWidth', type: 'number', label: 'Viewport Width', min: 16, max: 8192, defaultValue: 1024 },
      { name: 'viewportHeight', type: 'number', label: 'Viewport Height', min: 16, max: 8192, defaultValue: 1024 },
      { name: 'scaleFactor', type: 'number', label: 'Scale Factor', min: 0.1, max: 10, step: 0.1, defaultValue: 1 },
      { name: 'fontHandling', type: 'select', label: 'Font Handling', options: [{ value: 'embed', label: 'Embed Fonts' }, { value: 'outline', label: 'Convert to Outlines' }], defaultValue: 'embed' }
    ]
  },
  {
    id: 'image-to-base64', name: 'Image ⇄ Base64', description: 'Convert image to/from Base64', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'client', inputType: 'file', outputType: 'text',
    options: [
      { name: 'encodingVariant', type: 'select', label: 'Encoding Variant', options: [{ value: 'standard', label: 'Standard Base64' }, { value: 'datauri', label: 'Data URI' }], defaultValue: 'datauri' },
      { name: 'lineWrapping', type: 'select', label: 'Line Wrapping', options: [{ value: 'none', label: 'No Wrapping' }, { value: '76', label: '76 Characters' }, { value: '64', label: '64 Characters' }], defaultValue: 'none' }
    ]
  },
  {
    id: 'image-to-ascii', name: 'Image → ASCII Art', description: 'Convert image to ASCII art', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'text',
    options: [
      { name: 'characterSet', type: 'select', label: 'Character Set', options: [{ value: 'standard', label: 'Standard (@#%*+=-:. )' }, { value: 'blocks', label: 'Block Characters (█▓▒░)' }, { value: 'simple', label: 'Simple (#. )' }], defaultValue: 'standard' },
      { name: 'outputWidth', type: 'number', label: 'Output Width (chars)', min: 20, max: 200, defaultValue: 80 },
      { name: 'invertBrightness', type: 'checkbox', label: 'Invert Brightness', defaultValue: false },
      { name: 'colorMode', type: 'select', label: 'Color Mode', options: [{ value: 'mono', label: 'Monochrome' }, { value: 'ansi', label: 'ANSI Colors' }], defaultValue: 'mono' }
    ]
  },
  {
    id: 'image-resize', name: 'Image: Resize', description: 'Resize images', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'width', type: 'number', label: 'Width (px)', min: 1, max: 10000, defaultValue: 800 },
      { name: 'height', type: 'number', label: 'Height (px)', min: 1, max: 10000, defaultValue: 600 },
      { name: 'aspectRatioLock', type: 'checkbox', label: 'Lock Aspect Ratio', defaultValue: true },
      { name: 'resamplingMethod', type: 'select', label: 'Resampling Method', options: [{ value: 'lanczos', label: 'Lanczos (Best)' }, { value: 'bicubic', label: 'Bicubic' }, { value: 'bilinear', label: 'Bilinear' }, { value: 'nearest', label: 'Nearest Neighbor' }], defaultValue: 'lanczos' }
    ]
  },
  {
    id: 'image-crop', name: 'Image: Crop', description: 'Crop images', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'cropArea', type: 'select', label: 'Crop Area', options: [{ value: 'manual', label: 'Manual (specify dimensions)' }, { value: '1:1', label: 'Square (1:1)' }, { value: '4:3', label: '4:3' }, { value: '16:9', label: '16:9' }, { value: '3:2', label: '3:2' }], defaultValue: 'manual' },
      { name: 'anchorPoint', type: 'select', label: 'Anchor Point', options: [{ value: 'center', label: 'Center' }, { value: 'top-left', label: 'Top Left' }, { value: 'top-right', label: 'Top Right' }, { value: 'bottom-left', label: 'Bottom Left' }, { value: 'bottom-right', label: 'Bottom Right' }], defaultValue: 'center' }
    ]
  },
  {
    id: 'image-rotate', name: 'Image: Rotate', description: 'Rotate images', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'angle', type: 'select', label: 'Angle', options: [{ value: '90', label: '90° Clockwise' }, { value: '180', label: '180°' }, { value: '270', label: '90° Counter-clockwise' }, { value: 'custom', label: 'Custom Angle' }], defaultValue: '90' },
      { name: 'customAngle', type: 'number', label: 'Custom Angle (°)', min: -360, max: 360, defaultValue: 0 },
      { name: 'autoCorrect', type: 'checkbox', label: 'Auto-correct Orientation (EXIF)', defaultValue: true }
    ]
  },
  {
    id: 'image-flip', name: 'Image: Flip', description: 'Flip images horizontally/vertically', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'direction', type: 'select', label: 'Direction', options: [{ value: 'horizontal', label: 'Horizontal (Mirror)' }, { value: 'vertical', label: 'Vertical' }, { value: 'both', label: 'Both' }], defaultValue: 'horizontal' }
    ]
  },
  {
    id: 'image-canvas-resize', name: 'Image: Canvas Resize', description: 'Resize canvas with padding', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'canvasWidth', type: 'number', label: 'Canvas Width (px)', min: 1, max: 10000, defaultValue: 1200 },
      { name: 'canvasHeight', type: 'number', label: 'Canvas Height (px)', min: 1, max: 10000, defaultValue: 800 },
      { name: 'backgroundColor', type: 'color', label: 'Background Color', defaultValue: '#ffffff' },
      { name: 'anchorPosition', type: 'select', label: 'Anchor Position', options: [{ value: 'center', label: 'Center' }, { value: 'top-left', label: 'Top Left' }, { value: 'top-center', label: 'Top Center' }, { value: 'top-right', label: 'Top Right' }, { value: 'middle-left', label: 'Middle Left' }, { value: 'middle-right', label: 'Middle Right' }, { value: 'bottom-left', label: 'Bottom Left' }, { value: 'bottom-center', label: 'Bottom Center' }, { value: 'bottom-right', label: 'Bottom Right' }], defaultValue: 'center' }
    ]
  },
  {
    id: 'image-color-mode', name: 'Image: Color Mode', description: 'Convert RGB/CMYK/Grayscale', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'targetMode', type: 'select', label: 'Target Mode', options: [{ value: 'rgb', label: 'RGB' }, { value: 'cmyk', label: 'CMYK' }, { value: 'grayscale', label: 'Grayscale' }, { value: 'indexed', label: 'Indexed (256 colors)' }], defaultValue: 'rgb' },
      { name: 'iccProfileHandling', type: 'select', label: 'ICC Profile Handling', options: [{ value: 'convert', label: 'Convert to Profile' }, { value: 'preserve', label: 'Preserve Original' }, { value: 'remove', label: 'Remove Profile' }], defaultValue: 'convert' },
      { name: 'blackPointCompensation', type: 'checkbox', label: 'Black Point Compensation', defaultValue: true }
    ]
  },
  {
    id: 'image-batch-filters', name: 'Image: Batch Filters', description: 'Brightness, Contrast, Saturation', category: 'Media', subcategory: 'Image', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'brightness', type: 'range', label: 'Brightness', min: -100, max: 100, defaultValue: 0 },
      { name: 'contrast', type: 'range', label: 'Contrast', min: -100, max: 100, defaultValue: 0 },
      { name: 'saturation', type: 'range', label: 'Saturation', min: -100, max: 100, defaultValue: 0 },
      { name: 'applyOrder', type: 'select', label: 'Apply Order', options: [{ value: 'bcs', label: 'Brightness → Contrast → Saturation' }, { value: 'cbs', label: 'Contrast → Brightness → Saturation' }, { value: 'scb', label: 'Saturation → Contrast → Brightness' }], defaultValue: 'bcs' }
    ]
  },

  // =====================================================
  // VIDEO TOOLS
  // =====================================================

  {
    id: 'video-convert', name: 'Video ⇄ Video', description: 'Convert video formats', category: 'Media', subcategory: 'Video', tier: 'pro', costType: 'coin', coinCost: 10, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'mp4', label: 'MP4 (H.264)' }, { value: 'webm', label: 'WebM (VP9)' }, { value: 'mov', label: 'MOV' }, { value: 'avi', label: 'AVI' }, { value: 'mkv', label: 'MKV' }], defaultValue: 'mp4' },
      { name: 'videoCodec', type: 'select', label: 'Video Codec', options: [{ value: 'h264', label: 'H.264' }, { value: 'h265', label: 'H.265/HEVC' }, { value: 'vp9', label: 'VP9' }, { value: 'av1', label: 'AV1' }], defaultValue: 'h264' },
      { name: 'resolution', type: 'select', label: 'Resolution', options: [{ value: 'original', label: 'Original' }, { value: '4k', label: '4K (3840x2160)' }, { value: '1080p', label: '1080p' }, { value: '720p', label: '720p' }, { value: '480p', label: '480p' }], defaultValue: 'original' },
      { name: 'frameRate', type: 'select', label: 'Frame Rate', options: [{ value: 'original', label: 'Original' }, { value: '60', label: '60 fps' }, { value: '30', label: '30 fps' }, { value: '24', label: '24 fps' }], defaultValue: 'original' },
      { name: 'audioCodec', type: 'select', label: 'Audio Codec', options: [{ value: 'aac', label: 'AAC' }, { value: 'mp3', label: 'MP3' }, { value: 'opus', label: 'Opus' }, { value: 'none', label: 'No Audio' }], defaultValue: 'aac' }
    ]
  },
  {
    id: 'video-compress', name: 'Video Compressor / Resizer', description: 'Compress and resize video', category: 'Media', subcategory: 'Video', tier: 'pro', costType: 'coin', coinCost: 10, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'targetSizeMb', type: 'number', label: 'Target Size (MB)', min: 1, max: 500, defaultValue: 25 },
      { name: 'quality', type: 'select', label: 'Quality Preset', options: [{ value: 'high', label: 'High (slower)' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low (faster)' }], defaultValue: 'medium' },
      { name: 'resolution', type: 'select', label: 'Resolution', options: [{ value: 'original', label: 'Original' }, { value: '1080p', label: '1080p' }, { value: '720p', label: '720p' }, { value: '480p', label: '480p' }], defaultValue: 'original' },
      { name: 'twoPassEncoding', type: 'checkbox', label: 'Two-Pass Encoding (Better Quality)', defaultValue: false }
    ]
  },
  {
    id: 'video-to-gif', name: 'Video ⇄ GIF', description: 'Convert video to/from GIF', category: 'Media', subcategory: 'Video', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'startTime', type: 'string', label: 'Start Time (HH:MM:SS)', placeholder: '00:00:00', defaultValue: '00:00:00' },
      { name: 'duration', type: 'number', label: 'Duration (seconds)', min: 1, max: 30, defaultValue: 5 },
      { name: 'fps', type: 'select', label: 'Frame Rate', options: [{ value: '10', label: '10 fps' }, { value: '15', label: '15 fps' }, { value: '20', label: '20 fps' }, { value: '25', label: '25 fps' }], defaultValue: '15' },
      { name: 'width', type: 'number', label: 'Width (px)', min: 100, max: 1280, defaultValue: 480 },
      { name: 'loopCount', type: 'select', label: 'Loop Count', options: [{ value: '0', label: 'Infinite' }, { value: '1', label: 'Once' }, { value: '3', label: '3 times' }], defaultValue: '0' }
    ]
  },
  {
    id: 'extract-audio', name: 'Extract Audio from Video', description: 'Extract audio track from video', category: 'Media', subcategory: 'Video', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'mp3', label: 'MP3' }, { value: 'aac', label: 'AAC' }, { value: 'wav', label: 'WAV' }, { value: 'flac', label: 'FLAC' }, { value: 'ogg', label: 'OGG' }], defaultValue: 'mp3' },
      { name: 'bitrate', type: 'select', label: 'Bitrate', options: [{ value: '128', label: '128 kbps' }, { value: '192', label: '192 kbps' }, { value: '256', label: '256 kbps' }, { value: '320', label: '320 kbps' }], defaultValue: '192' },
      { name: 'normalizeAudio', type: 'checkbox', label: 'Normalize Audio', defaultValue: false }
    ]
  },

  // =====================================================
  // AUDIO TOOLS
  // =====================================================

  {
    id: 'audio-convert', name: 'Audio ⇄ Audio', description: 'Convert audio formats', category: 'Media', subcategory: 'Audio', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'mp3', label: 'MP3' }, { value: 'aac', label: 'AAC' }, { value: 'wav', label: 'WAV' }, { value: 'flac', label: 'FLAC' }, { value: 'ogg', label: 'OGG' }, { value: 'm4a', label: 'M4A' }], defaultValue: 'mp3' },
      { name: 'bitrate', type: 'select', label: 'Bitrate', options: [{ value: '128', label: '128 kbps' }, { value: '192', label: '192 kbps' }, { value: '256', label: '256 kbps' }, { value: '320', label: '320 kbps' }], defaultValue: '192' },
      { name: 'sampleRate', type: 'select', label: 'Sample Rate', options: [{ value: 'original', label: 'Original' }, { value: '44100', label: '44.1 kHz' }, { value: '48000', label: '48 kHz' }, { value: '96000', label: '96 kHz' }], defaultValue: 'original' },
      { name: 'channels', type: 'select', label: 'Channels', options: [{ value: 'original', label: 'Original' }, { value: 'stereo', label: 'Stereo' }, { value: 'mono', label: 'Mono' }], defaultValue: 'original' }
    ]
  },
  {
    id: 'audio-cutter', name: 'Audio Cutter / Trimmer', description: 'Cut and trim audio files', category: 'Media', subcategory: 'Audio', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'startTime', type: 'string', label: 'Start Time (HH:MM:SS)', placeholder: '00:00:00', defaultValue: '00:00:00' },
      { name: 'endTime', type: 'string', label: 'End Time (HH:MM:SS)', placeholder: '00:01:00', defaultValue: '00:01:00' },
      { name: 'fadeIn', type: 'number', label: 'Fade In (seconds)', min: 0, max: 10, defaultValue: 0 },
      { name: 'fadeOut', type: 'number', label: 'Fade Out (seconds)', min: 0, max: 10, defaultValue: 0 }
    ]
  },
  {
    id: 'speech-to-text', name: 'Audio → Text (STT)', description: 'Speech to text conversion', category: 'Media', subcategory: 'Audio', tier: 'pro', costType: 'coin', coinCost: 10, execution: 'server', inputType: 'file', outputType: 'text',
    options: [
      { name: 'language', type: 'select', label: 'Language', options: [{ value: 'auto', label: 'Auto-detect' }, { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }, { value: 'ar', label: 'Arabic' }, { value: 'zh', label: 'Chinese' }, { value: 'ja', label: 'Japanese' }], defaultValue: 'auto' },
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'txt', label: 'Plain Text' }, { value: 'srt', label: 'SRT Subtitles' }, { value: 'vtt', label: 'WebVTT' }], defaultValue: 'txt' },
      { name: 'timestamps', type: 'checkbox', label: 'Include Timestamps', defaultValue: false },
      { name: 'speakerDiarization', type: 'checkbox', label: 'Speaker Diarization', defaultValue: false }
    ]
  },
  {
    id: 'speech-to-text-2', name: 'Audio → Text (STT) 2', description: 'Alternative STT service', category: 'Media', subcategory: 'Audio', tier: 'pro', costType: 'coin', coinCost: 10, execution: 'server', inputType: 'file', outputType: 'text',
    options: [
      { name: 'language', type: 'select', label: 'Language', options: [{ value: 'auto', label: 'Auto-detect' }, { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }, { value: 'ar', label: 'Arabic' }], defaultValue: 'auto' },
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'txt', label: 'Plain Text' }, { value: 'srt', label: 'SRT Subtitles' }, { value: 'vtt', label: 'WebVTT' }], defaultValue: 'txt' }
    ]
  },

  // =====================================================
  // DOCUMENT TOOLS
  // =====================================================

  {
    id: 'txt-to-pdf', name: 'TXT ⇄ PDF', description: 'Convert TXT to/from PDF', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'fontFamily', type: 'select', label: 'Font Family', options: [{ value: 'courier', label: 'Courier' }, { value: 'helvetica', label: 'Helvetica' }, { value: 'times', label: 'Times New Roman' }], defaultValue: 'courier' },
      { name: 'fontSize', type: 'number', label: 'Font Size (pt)', min: 8, max: 24, defaultValue: 12 },
      { name: 'pageSize', type: 'select', label: 'Page Size', options: [{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'Letter' }, { value: 'legal', label: 'Legal' }], defaultValue: 'a4' },
      { name: 'lineSpacing', type: 'select', label: 'Line Spacing', options: [{ value: '1', label: 'Single' }, { value: '1.5', label: '1.5' }, { value: '2', label: 'Double' }], defaultValue: '1' }
    ]
  },
  {
    id: 'txt-to-docx', name: 'TXT ⇄ DOCX', description: 'Convert TXT to/from DOCX', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'fontFamily', type: 'select', label: 'Font Family', options: [{ value: 'calibri', label: 'Calibri' }, { value: 'arial', label: 'Arial' }, { value: 'times', label: 'Times New Roman' }], defaultValue: 'calibri' },
      { name: 'fontSize', type: 'number', label: 'Font Size (pt)', min: 8, max: 24, defaultValue: 11 },
      { name: 'pageSize', type: 'select', label: 'Page Size', options: [{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'Letter' }], defaultValue: 'a4' }
    ]
  },
  {
    id: 'docx-to-pdf', name: 'DOCX ⇄ PDF', description: 'Convert DOCX to/from PDF', category: 'Media', subcategory: 'Document', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'preserveFormatting', type: 'checkbox', label: 'Preserve Formatting', defaultValue: true },
      { name: 'embedFonts', type: 'checkbox', label: 'Embed Fonts', defaultValue: true },
      { name: 'pdfVersion', type: 'select', label: 'PDF Version', options: [{ value: '1.4', label: 'PDF 1.4' }, { value: '1.5', label: 'PDF 1.5' }, { value: '1.7', label: 'PDF 1.7' }, { value: '2.0', label: 'PDF 2.0' }], defaultValue: '1.7' }
    ]
  },
  {
    id: 'docx-to-odt', name: 'DOCX ⇄ ODT', description: 'Convert DOCX to/from ODT', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'preserveStyles', type: 'checkbox', label: 'Preserve Styles', defaultValue: true },
      { name: 'preserveImages', type: 'checkbox', label: 'Preserve Images', defaultValue: true }
    ]
  },
  {
    id: 'docx-to-rtf', name: 'DOCX ⇄ RTF', description: 'Convert DOCX to/from RTF', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'preserveFormatting', type: 'checkbox', label: 'Preserve Formatting', defaultValue: true },
      { name: 'preserveImages', type: 'checkbox', label: 'Preserve Images', defaultValue: true }
    ]
  },
  {
    id: 'pptx-to-pdf', name: 'PPTX ⇄ PDF', description: 'Convert PPTX to/from PDF', category: 'Media', subcategory: 'Document', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'slideRange', type: 'string', label: 'Slide Range', placeholder: 'e.g., 1-5, 8, 10-12', defaultValue: '' },
      { name: 'preserveAnimations', type: 'checkbox', label: 'Preserve Animations (as images)', defaultValue: false },
      { name: 'includeNotes', type: 'checkbox', label: 'Include Speaker Notes', defaultValue: false }
    ]
  },
  {
    id: 'odp-to-pptx', name: 'ODP ⇄ PPTX', description: 'Convert ODP to/from PPTX', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'preserveStyles', type: 'checkbox', label: 'Preserve Styles', defaultValue: true },
      { name: 'preserveTransitions', type: 'checkbox', label: 'Preserve Transitions', defaultValue: true }
    ]
  },
  {
    id: 'epub-to-pdf', name: 'EPUB ⇄ PDF', description: 'Convert EPUB to/from PDF', category: 'Media', subcategory: 'Document', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'pageSize', type: 'select', label: 'Page Size', options: [{ value: 'a4', label: 'A4' }, { value: 'a5', label: 'A5' }, { value: 'letter', label: 'Letter' }, { value: '6x9', label: '6x9 inch' }], defaultValue: 'a4' },
      { name: 'preserveCover', type: 'checkbox', label: 'Preserve Cover', defaultValue: true },
      { name: 'includeToc', type: 'checkbox', label: 'Include Table of Contents', defaultValue: true }
    ]
  },
  {
    id: 'epub-to-mobi', name: 'EPUB ⇄ MOBI', description: 'Convert EPUB to/from MOBI', category: 'Media', subcategory: 'Document', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'preserveCover', type: 'checkbox', label: 'Preserve Cover', defaultValue: true },
      { name: 'generateThumbnail', type: 'checkbox', label: 'Generate Thumbnail', defaultValue: true }
    ]
  },
  {
    id: 'epub-to-azw3', name: 'EPUB ⇄ AZW3', description: 'Convert EPUB to/from AZW3', category: 'Media', subcategory: 'Document', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'preserveCover', type: 'checkbox', label: 'Preserve Cover', defaultValue: true },
      { name: 'optimizeForKindle', type: 'checkbox', label: 'Optimize for Kindle', defaultValue: true }
    ]
  },
  {
    id: 'markdown-to-pdf', name: 'Markdown → PDF', description: 'Convert Markdown to PDF', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'server', inputType: 'text', outputType: 'file',
    options: [
      { name: 'theme', type: 'select', label: 'Theme', options: [{ value: 'github', label: 'GitHub' }, { value: 'academic', label: 'Academic' }, { value: 'minimal', label: 'Minimal' }], defaultValue: 'github' },
      { name: 'pageSize', type: 'select', label: 'Page Size', options: [{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'Letter' }], defaultValue: 'a4' },
      { name: 'syntaxHighlight', type: 'checkbox', label: 'Syntax Highlighting', defaultValue: true },
      { name: 'includeToc', type: 'checkbox', label: 'Include Table of Contents', defaultValue: false }
    ]
  },
  {
    id: 'markdown-to-html', name: 'Markdown ⇄ HTML', description: 'Convert Markdown to HTML', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'client', inputType: 'text', outputType: 'text',
    options: [
      { name: 'flavor', type: 'select', label: 'Markdown Flavor', options: [{ value: 'gfm', label: 'GitHub Flavored' }, { value: 'commonmark', label: 'CommonMark' }, { value: 'markdown-it', label: 'Markdown-it' }], defaultValue: 'gfm' },
      { name: 'sanitize', type: 'checkbox', label: 'Sanitize HTML Output', defaultValue: true },
      { name: 'syntaxHighlight', type: 'checkbox', label: 'Syntax Highlighting', defaultValue: true }
    ]
  },
  {
    id: 'pdf-to-html', name: 'PDF → HTML', description: 'Convert PDF to HTML', category: 'Media', subcategory: 'Document', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'layoutMode', type: 'select', label: 'Layout Mode', options: [{ value: 'continuous', label: 'Continuous Flow' }, { value: 'paged', label: 'Page-by-Page' }], defaultValue: 'continuous' },
      { name: 'extractImages', type: 'checkbox', label: 'Extract Images', defaultValue: true },
      { name: 'preserveFonts', type: 'checkbox', label: 'Preserve Fonts', defaultValue: false }
    ]
  },
  {
    id: 'xlsx-to-csv', name: 'XLSX ⇄ CSV', description: 'Convert XLSX to CSV', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'sheetIndex', type: 'number', label: 'Sheet Index (0-based)', min: 0, max: 100, defaultValue: 0 },
      { name: 'delimiter', type: 'select', label: 'Delimiter', options: [{ value: ',', label: 'Comma' }, { value: ';', label: 'Semicolon' }, { value: '\t', label: 'Tab' }], defaultValue: ',' },
      { name: 'includeHeaders', type: 'checkbox', label: 'Include Headers', defaultValue: true }
    ]
  },
  {
    id: 'xls-to-csv', name: 'XLS ⇄ CSV', description: 'Convert XLS to CSV', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'sheetIndex', type: 'number', label: 'Sheet Index (0-based)', min: 0, max: 100, defaultValue: 0 },
      { name: 'delimiter', type: 'select', label: 'Delimiter', options: [{ value: ',', label: 'Comma' }, { value: ';', label: 'Semicolon' }, { value: '\t', label: 'Tab' }], defaultValue: ',' },
      { name: 'includeHeaders', type: 'checkbox', label: 'Include Headers', defaultValue: true }
    ]
  },
  {
    id: 'ods-to-xlsx', name: 'ODS ⇄ XLSX', description: 'Convert ODS to XLSX', category: 'Media', subcategory: 'Document', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'preserveFormulas', type: 'checkbox', label: 'Preserve Formulas', defaultValue: true },
      { name: 'preserveStyles', type: 'checkbox', label: 'Preserve Styles', defaultValue: true }
    ]
  },

  // =====================================================
  // ARCHIVE TOOLS
  // =====================================================

  {
    id: 'zip-tool', name: 'ZIP Compression', description: 'ZIP compress/decompress', category: 'Media', subcategory: 'Archive', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'operation', type: 'select', label: 'Operation', options: [{ value: 'compress', label: 'Compress' }, { value: 'decompress', label: 'Decompress' }], defaultValue: 'compress' },
      { name: 'compressionLevel', type: 'range', label: 'Compression Level', min: 0, max: 9, defaultValue: 6 },
      { name: 'password', type: 'string', label: 'Password (optional)', placeholder: 'Enter password' }
    ]
  },
  {
    id: 'rar-tool', name: 'RAR Compression', description: 'RAR compress/decompress', category: 'Media', subcategory: 'Archive', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'operation', type: 'select', label: 'Operation', options: [{ value: 'compress', label: 'Compress' }, { value: 'decompress', label: 'Decompress' }], defaultValue: 'compress' },
      { name: 'compressionLevel', type: 'select', label: 'Compression Level', options: [{ value: 'store', label: 'Store (no compression)' }, { value: 'fast', label: 'Fast' }, { value: 'normal', label: 'Normal' }, { value: 'best', label: 'Best' }], defaultValue: 'normal' },
      { name: 'recoveryRecord', type: 'checkbox', label: 'Add Recovery Record', defaultValue: false },
      { name: 'password', type: 'string', label: 'Password (optional)', placeholder: 'Enter password' }
    ]
  },
  {
    id: '7z-tool', name: '7z Compression', description: '7z compress/decompress', category: 'Media', subcategory: 'Archive', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'operation', type: 'select', label: 'Operation', options: [{ value: 'compress', label: 'Compress' }, { value: 'decompress', label: 'Decompress' }], defaultValue: 'compress' },
      { name: 'compressionLevel', type: 'range', label: 'Compression Level', min: 0, max: 9, defaultValue: 5 },
      { name: 'compressionMethod', type: 'select', label: 'Compression Method', options: [{ value: 'lzma2', label: 'LZMA2' }, { value: 'lzma', label: 'LZMA' }, { value: 'bzip2', label: 'BZip2' }, { value: 'ppmd', label: 'PPMd' }], defaultValue: 'lzma2' },
      { name: 'solidArchive', type: 'checkbox', label: 'Create Solid Archive', defaultValue: true },
      { name: 'password', type: 'string', label: 'Password (optional)', placeholder: 'Enter password' }
    ]
  },
  {
    id: 'tar-tool', name: 'TAR Archive Tools', description: 'TAR archive/extract', category: 'Media', subcategory: 'Archive', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'operation', type: 'select', label: 'Operation', options: [{ value: 'archive', label: 'Create Archive' }, { value: 'extract', label: 'Extract' }], defaultValue: 'archive' },
      { name: 'preservePermissions', type: 'checkbox', label: 'Preserve Permissions', defaultValue: true }
    ]
  },
  {
    id: 'gz-tool', name: 'GZ Archive Tools', description: 'GZIP compress/decompress', category: 'Media', subcategory: 'Archive', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'operation', type: 'select', label: 'Operation', options: [{ value: 'compress', label: 'Compress' }, { value: 'decompress', label: 'Decompress' }], defaultValue: 'compress' },
      { name: 'compressionLevel', type: 'range', label: 'Compression Level', min: 1, max: 9, defaultValue: 6 },
      { name: 'keepOriginal', type: 'checkbox', label: 'Keep Original File', defaultValue: false }
    ]
  },
  {
    id: 'tgz-tool', name: 'TGZ Archive Tools', description: 'TGZ archive/extract', category: 'Media', subcategory: 'Archive', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'operation', type: 'select', label: 'Operation', options: [{ value: 'archive', label: 'Create Archive' }, { value: 'extract', label: 'Extract' }], defaultValue: 'archive' },
      { name: 'compressionLevel', type: 'range', label: 'Compression Level', min: 1, max: 9, defaultValue: 6 },
      { name: 'preservePermissions', type: 'checkbox', label: 'Preserve Permissions', defaultValue: true }
    ]
  },
  {
    id: 'bz2-tool', name: 'BZ2 Archive Tools', description: 'BZ2 compress/decompress', category: 'Media', subcategory: 'Archive', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'operation', type: 'select', label: 'Operation', options: [{ value: 'compress', label: 'Compress' }, { value: 'decompress', label: 'Decompress' }], defaultValue: 'compress' },
      { name: 'blockSize', type: 'range', label: 'Block Size (100k units)', min: 1, max: 9, defaultValue: 9 },
      { name: 'keepOriginal', type: 'checkbox', label: 'Keep Original File', defaultValue: false }
    ]
  },
  {
    id: 'xz-tool', name: 'XZ Archive Tools', description: 'XZ compress/decompress', category: 'Media', subcategory: 'Archive', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'operation', type: 'select', label: 'Operation', options: [{ value: 'compress', label: 'Compress' }, { value: 'decompress', label: 'Decompress' }], defaultValue: 'compress' },
      { name: 'compressionLevel', type: 'range', label: 'Compression Level', min: 0, max: 9, defaultValue: 6 },
      { name: 'extreme', type: 'checkbox', label: 'Extreme Compression (slower)', defaultValue: false },
      { name: 'keepOriginal', type: 'checkbox', label: 'Keep Original File', defaultValue: false }
    ]
  },

  // =====================================================
  // FILE TOOLS
  // =====================================================

  {
    id: 'bulk-rename', name: 'Rename files in bulk', description: 'Batch rename files', category: 'Media', subcategory: 'File', tier: 'free', costType: 'free', execution: 'server', inputType: 'multiple', outputType: 'file',
    options: [
      { name: 'pattern', type: 'string', label: 'Rename Pattern', placeholder: 'file_{n}', defaultValue: 'file_{n}' },
      { name: 'startNumber', type: 'number', label: 'Start Number', min: 0, max: 10000, defaultValue: 1 },
      { name: 'caseSensitive', type: 'select', label: 'Case Transform', options: [{ value: 'none', label: 'No Change' }, { value: 'lower', label: 'Lowercase' }, { value: 'upper', label: 'Uppercase' }, { value: 'title', label: 'Title Case' }], defaultValue: 'none' },
      { name: 'replaceSpaces', type: 'checkbox', label: 'Replace Spaces with Underscores', defaultValue: false }
    ]
  },
  {
    id: 'batch-extension', name: 'Change file extensions', description: 'Batch change extensions', category: 'Media', subcategory: 'File', tier: 'free', costType: 'free', execution: 'server', inputType: 'multiple', outputType: 'file',
    options: [
      { name: 'newExtension', type: 'string', label: 'New Extension', placeholder: '.txt', defaultValue: '.txt' },
      { name: 'removeOldExtension', type: 'checkbox', label: 'Remove Old Extension', defaultValue: true }
    ]
  },
  {
    id: 'flatten-folder', name: 'Flatten folder hierarchy', description: 'Flatten/merge folders', category: 'Media', subcategory: 'File', tier: 'free', costType: 'free', execution: 'server', inputType: 'multiple', outputType: 'file',
    options: [
      { name: 'separator', type: 'select', label: 'Path Separator', options: [{ value: '_', label: 'Underscore (_)' }, { value: '-', label: 'Hyphen (-)' }, { value: '.', label: 'Dot (.)' }], defaultValue: '_' },
      { name: 'includeRootFolder', type: 'checkbox', label: 'Include Root Folder Name', defaultValue: false },
      { name: 'handleDuplicates', type: 'select', label: 'Handle Duplicates', options: [{ value: 'rename', label: 'Rename with suffix' }, { value: 'skip', label: 'Skip' }, { value: 'overwrite', label: 'Overwrite' }], defaultValue: 'rename' }
    ]
  },
  {
    id: 'file-hash-generator', name: 'File Hash Generator', description: 'MD5/SHA256/SHA512 hashes', category: 'Media', subcategory: 'File', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'json',
    options: [
      { name: 'algorithms', type: 'select', label: 'Hash Algorithms', options: [{ value: 'all', label: 'All (MD5, SHA1, SHA256, SHA512)' }, { value: 'md5', label: 'MD5 Only' }, { value: 'sha256', label: 'SHA256 Only' }, { value: 'sha512', label: 'SHA512 Only' }], defaultValue: 'all' },
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'hex', label: 'Hexadecimal' }, { value: 'base64', label: 'Base64' }], defaultValue: 'hex' }
    ]
  },
  {
    id: 'metadata-viewer', name: 'Metadata Viewer & Editor', description: 'EXIF/XMP/IPTC metadata', category: 'Media', subcategory: 'File', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'json',
    options: [
      { name: 'mode', type: 'select', label: 'Mode', options: [{ value: 'view', label: 'View Only' }, { value: 'edit', label: 'Edit' }, { value: 'strip', label: 'Strip All Metadata' }], defaultValue: 'view' },
      { name: 'includeTypes', type: 'select', label: 'Metadata Types', options: [{ value: 'all', label: 'All Types' }, { value: 'exif', label: 'EXIF Only' }, { value: 'xmp', label: 'XMP Only' }, { value: 'iptc', label: 'IPTC Only' }], defaultValue: 'all' }
    ]
  },

  // =====================================================
  // FONT TOOLS
  // =====================================================

  {
    id: 'font-to-ttf', name: 'Font ⇄ TTF', description: 'Convert fonts to TTF', category: 'Media', subcategory: 'Font', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'hinting', type: 'select', label: 'Hinting', options: [{ value: 'keep', label: 'Keep Original' }, { value: 'auto', label: 'Auto-hint' }, { value: 'remove', label: 'Remove' }], defaultValue: 'keep' },
      { name: 'subsetGlyphs', type: 'checkbox', label: 'Subset Glyphs (Latin only)', defaultValue: false }
    ]
  },
  {
    id: 'font-to-otf', name: 'Font ⇄ OTF', description: 'Convert fonts to OTF', category: 'Media', subcategory: 'Font', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'preserveOpenTypeFeatures', type: 'checkbox', label: 'Preserve OpenType Features', defaultValue: true },
      { name: 'subsetGlyphs', type: 'checkbox', label: 'Subset Glyphs (Latin only)', defaultValue: false }
    ]
  },
  {
    id: 'font-to-woff', name: 'Font ⇄ WOFF', description: 'Convert fonts to WOFF', category: 'Media', subcategory: 'Font', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'compressionLevel', type: 'range', label: 'Compression Level', min: 1, max: 9, defaultValue: 6 },
      { name: 'includeMetadata', type: 'checkbox', label: 'Include Metadata', defaultValue: true }
    ]
  },
  {
    id: 'font-to-woff2', name: 'Font ⇄ WOFF2', description: 'Convert fonts to WOFF2 with Brotli', category: 'Media', subcategory: 'Font', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'compressionLevel', type: 'range', label: 'Brotli Compression Level', min: 1, max: 11, defaultValue: 6 },
      { name: 'includeMetadata', type: 'checkbox', label: 'Include Metadata', defaultValue: true }
    ]
  },

  // =====================================================
  // PDF TOOLS
  // =====================================================

  {
    id: 'pdf-merge', name: 'PDF Page: Merge', description: 'Merge multiple PDFs', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'multiple', outputType: 'file',
    options: [
      { name: 'addBookmarks', type: 'checkbox', label: 'Add Bookmarks for Each Source', defaultValue: true },
      { name: 'preserveMetadata', type: 'select', label: 'Preserve Metadata From', options: [{ value: 'first', label: 'First Document' }, { value: 'last', label: 'Last Document' }, { value: 'none', label: 'None' }], defaultValue: 'first' }
    ]
  },
  {
    id: 'pdf-split', name: 'PDF Page: Split', description: 'Split PDF into pages', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'splitMode', type: 'select', label: 'Split Mode', options: [{ value: 'each', label: 'Each Page' }, { value: 'range', label: 'By Range' }, { value: 'size', label: 'By File Size' }, { value: 'bookmarks', label: 'By Bookmarks' }], defaultValue: 'each' },
      { name: 'pageRange', type: 'string', label: 'Page Range', placeholder: 'e.g., 1-5, 6-10', defaultValue: '' },
      { name: 'maxSizeMb', type: 'number', label: 'Max Size per File (MB)', min: 1, max: 100, defaultValue: 10 }
    ]
  },
  {
    id: 'pdf-extract', name: 'PDF Page: Extract', description: 'Extract specific pages', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'pageRange', type: 'string', label: 'Page Range', placeholder: 'e.g., 1-5, 8, 10-12', required: true },
      { name: 'outputMode', type: 'select', label: 'Output Mode', options: [{ value: 'single', label: 'Single PDF' }, { value: 'separate', label: 'Separate Files' }], defaultValue: 'single' }
    ]
  },
  {
    id: 'pdf-delete', name: 'PDF Page: Delete', description: 'Delete pages from PDF', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'pagesToDelete', type: 'string', label: 'Pages to Delete', placeholder: 'e.g., 1, 3-5, 10', required: true }
    ]
  },
  {
    id: 'pdf-reorder', name: 'PDF Page: Reorder', description: 'Reorder PDF pages', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'newOrder', type: 'string', label: 'New Page Order', placeholder: 'e.g., 3, 1, 2, 5, 4', required: true },
      { name: 'reverse', type: 'checkbox', label: 'Reverse All Pages', defaultValue: false }
    ]
  },
  {
    id: 'pdf-rotate', name: 'PDF Page: Rotate', description: 'Rotate PDF pages', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'angle', type: 'select', label: 'Rotation Angle', options: [{ value: '90', label: '90° Clockwise' }, { value: '180', label: '180°' }, { value: '270', label: '90° Counter-clockwise' }], defaultValue: '90' },
      { name: 'pageRange', type: 'string', label: 'Page Range (empty for all)', placeholder: 'e.g., 1-5, 8', defaultValue: '' }
    ]
  },
  {
    id: 'pdf-crop', name: 'PDF Page: Crop', description: 'Crop PDF pages', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'cropMode', type: 'select', label: 'Crop Mode', options: [{ value: 'margins', label: 'By Margins' }, { value: 'box', label: 'By Crop Box' }, { value: 'auto', label: 'Auto-detect' }], defaultValue: 'margins' },
      { name: 'marginTop', type: 'number', label: 'Top Margin (pt)', min: 0, max: 500, defaultValue: 0 },
      { name: 'marginBottom', type: 'number', label: 'Bottom Margin (pt)', min: 0, max: 500, defaultValue: 0 },
      { name: 'marginLeft', type: 'number', label: 'Left Margin (pt)', min: 0, max: 500, defaultValue: 0 },
      { name: 'marginRight', type: 'number', label: 'Right Margin (pt)', min: 0, max: 500, defaultValue: 0 }
    ]
  },
  {
    id: 'pdf-resize', name: 'PDF Page: Resize', description: 'Resize PDF pages', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'targetSize', type: 'select', label: 'Target Size', options: [{ value: 'a4', label: 'A4' }, { value: 'a5', label: 'A5' }, { value: 'letter', label: 'Letter' }, { value: 'legal', label: 'Legal' }, { value: 'custom', label: 'Custom' }], defaultValue: 'a4' },
      { name: 'customWidth', type: 'number', label: 'Custom Width (pt)', min: 72, max: 3000, defaultValue: 612 },
      { name: 'customHeight', type: 'number', label: 'Custom Height (pt)', min: 72, max: 3000, defaultValue: 792 },
      { name: 'scaleContent', type: 'checkbox', label: 'Scale Content to Fit', defaultValue: true }
    ]
  },
  {
    id: 'pdf-nup', name: 'PDF Page: N-Up', description: 'Multiple pages per sheet', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'pagesPerSheet', type: 'select', label: 'Pages per Sheet', options: [{ value: '2', label: '2-up' }, { value: '4', label: '4-up' }, { value: '6', label: '6-up' }, { value: '9', label: '9-up' }, { value: '16', label: '16-up' }], defaultValue: '2' },
      { name: 'pageOrder', type: 'select', label: 'Page Order', options: [{ value: 'horizontal', label: 'Left to Right' }, { value: 'vertical', label: 'Top to Bottom' }], defaultValue: 'horizontal' },
      { name: 'addBorder', type: 'checkbox', label: 'Add Border Around Pages', defaultValue: false }
    ]
  },
  {
    id: 'pdf-mix', name: 'PDF Page: Alternate Mix', description: 'Interleave PDF pages', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'multiple', outputType: 'file',
    options: [
      { name: 'mixMode', type: 'select', label: 'Mix Mode', options: [{ value: 'alternate', label: 'Alternate (1A, 1B, 2A, 2B)' }, { value: 'reverse-second', label: 'Alternate (Second Reversed)' }], defaultValue: 'alternate' }
    ]
  },
  {
    id: 'pdf-compress', name: 'PDF: Compress', description: 'Compress PDF file', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'compressionLevel', type: 'select', label: 'Compression Level', options: [{ value: 'low', label: 'Low (Better Quality)' }, { value: 'medium', label: 'Medium (Balanced)' }, { value: 'high', label: 'High (Smaller Size)' }, { value: 'extreme', label: 'Extreme (May Reduce Quality)' }], defaultValue: 'medium' },
      { name: 'imageQuality', type: 'range', label: 'Image Quality', min: 10, max: 100, defaultValue: 75 },
      { name: 'downsampleImages', type: 'checkbox', label: 'Downsample Images to 150 DPI', defaultValue: true }
    ]
  },
  {
    id: 'pdf-grayscale', name: 'PDF: Grayscale', description: 'Convert PDF to grayscale', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'preserveBlacks', type: 'checkbox', label: 'Preserve Pure Blacks', defaultValue: true }
    ]
  },
  {
    id: 'pdf-flatten', name: 'PDF: Flatten', description: 'Flatten PDF layers', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'flattenFormFields', type: 'checkbox', label: 'Flatten Form Fields', defaultValue: true },
      { name: 'flattenAnnotations', type: 'checkbox', label: 'Flatten Annotations', defaultValue: true }
    ]
  },
  {
    id: 'pdf-deskew', name: 'PDF: Deskew', description: 'Straighten scanned PDFs', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'autoDetect', type: 'checkbox', label: 'Auto-detect Skew Angle', defaultValue: true },
      { name: 'manualAngle', type: 'number', label: 'Manual Angle (°)', min: -45, max: 45, step: 0.1, defaultValue: 0 }
    ]
  },
  {
    id: 'pdf-edit-metadata', name: 'PDF: Edit Metadata', description: 'Edit PDF metadata', category: 'Media', subcategory: 'PDF', tier: 'free', costType: 'free', execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'title', type: 'string', label: 'Title', placeholder: 'Document title' },
      { name: 'author', type: 'string', label: 'Author', placeholder: 'Author name' },
      { name: 'subject', type: 'string', label: 'Subject', placeholder: 'Document subject' },
      { name: 'keywords', type: 'string', label: 'Keywords', placeholder: 'keyword1, keyword2' }
    ]
  },
  {
    id: 'pdf-rename-content', name: 'PDF: Rename by Content', description: 'Rename based on content', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'extractFrom', type: 'select', label: 'Extract Name From', options: [{ value: 'firstLine', label: 'First Line' }, { value: 'title', label: 'Metadata Title' }, { value: 'pattern', label: 'Regex Pattern' }], defaultValue: 'firstLine' },
      { name: 'pattern', type: 'string', label: 'Regex Pattern', placeholder: 'e.g., Invoice #(\\d+)' },
      { name: 'maxLength', type: 'number', label: 'Max Filename Length', min: 10, max: 255, defaultValue: 50 }
    ]
  },
  {
    id: 'pdf-extract-images', name: 'PDF: Extract Images', description: 'Extract all images', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'outputFormat', type: 'select', label: 'Output Format', options: [{ value: 'original', label: 'Original Format' }, { value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPEG' }], defaultValue: 'original' },
      { name: 'minWidth', type: 'number', label: 'Min Width (px)', min: 0, max: 1000, defaultValue: 50 },
      { name: 'minHeight', type: 'number', label: 'Min Height (px)', min: 0, max: 1000, defaultValue: 50 }
    ]
  },
  {
    id: 'pdf-header-footer', name: 'PDF: Header & Footer', description: 'Add headers/footers', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'headerLeft', type: 'string', label: 'Header Left', placeholder: 'Left header text' },
      { name: 'headerCenter', type: 'string', label: 'Header Center', placeholder: 'Center header text' },
      { name: 'headerRight', type: 'string', label: 'Header Right', placeholder: 'Right header text' },
      { name: 'footerLeft', type: 'string', label: 'Footer Left', placeholder: 'Left footer text' },
      { name: 'footerCenter', type: 'string', label: 'Footer Center', placeholder: '{page} of {total}' },
      { name: 'footerRight', type: 'string', label: 'Footer Right', placeholder: 'Right footer text' }
    ]
  },
  {
    id: 'pdf-page-numbers', name: 'PDF: Page Numbers', description: 'Add page numbers', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'position', type: 'select', label: 'Position', options: [{ value: 'bottom-center', label: 'Bottom Center' }, { value: 'bottom-right', label: 'Bottom Right' }, { value: 'bottom-left', label: 'Bottom Left' }, { value: 'top-center', label: 'Top Center' }, { value: 'top-right', label: 'Top Right' }, { value: 'top-left', label: 'Top Left' }], defaultValue: 'bottom-center' },
      { name: 'format', type: 'select', label: 'Format', options: [{ value: 'page', label: 'Page X' }, { value: 'pageOfTotal', label: 'Page X of Y' }, { value: 'number', label: 'X' }], defaultValue: 'pageOfTotal' },
      { name: 'startNumber', type: 'number', label: 'Start Number', min: 1, max: 10000, defaultValue: 1 },
      { name: 'skipFirstPage', type: 'checkbox', label: 'Skip First Page', defaultValue: false }
    ]
  },
  {
    id: 'pdf-watermark', name: 'PDF: Watermark', description: 'Add watermark to PDF', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'watermarkType', type: 'select', label: 'Watermark Type', options: [{ value: 'text', label: 'Text' }, { value: 'image', label: 'Image' }], defaultValue: 'text' },
      { name: 'text', type: 'string', label: 'Watermark Text', placeholder: 'CONFIDENTIAL', defaultValue: 'CONFIDENTIAL' },
      { name: 'opacity', type: 'range', label: 'Opacity', min: 10, max: 100, defaultValue: 30 },
      { name: 'rotation', type: 'number', label: 'Rotation (°)', min: -90, max: 90, defaultValue: -45 },
      { name: 'position', type: 'select', label: 'Position', options: [{ value: 'center', label: 'Center' }, { value: 'tile', label: 'Tile' }], defaultValue: 'center' }
    ]
  },
  {
    id: 'pdf-bates', name: 'PDF: Bates Numbering', description: 'Add Bates numbers', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'prefix', type: 'string', label: 'Prefix', placeholder: 'DOC-', defaultValue: '' },
      { name: 'suffix', type: 'string', label: 'Suffix', placeholder: '', defaultValue: '' },
      { name: 'startNumber', type: 'number', label: 'Start Number', min: 1, max: 999999999, defaultValue: 1 },
      { name: 'digits', type: 'number', label: 'Number of Digits', min: 3, max: 12, defaultValue: 6 },
      { name: 'position', type: 'select', label: 'Position', options: [{ value: 'bottom-right', label: 'Bottom Right' }, { value: 'bottom-left', label: 'Bottom Left' }, { value: 'top-right', label: 'Top Right' }, { value: 'top-left', label: 'Top Left' }], defaultValue: 'bottom-right' }
    ]
  },
  {
    id: 'pdf-remove-annotations', name: 'PDF: Remove Annotations', description: 'Strip annotations', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 2, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'removeComments', type: 'checkbox', label: 'Remove Comments', defaultValue: true },
      { name: 'removeHighlights', type: 'checkbox', label: 'Remove Highlights', defaultValue: true },
      { name: 'removeStamps', type: 'checkbox', label: 'Remove Stamps', defaultValue: true },
      { name: 'removeLinks', type: 'checkbox', label: 'Remove Links', defaultValue: false }
    ]
  },
  {
    id: 'pdf-protect', name: 'PDF: Protect', description: 'Password protect PDF', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 3, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'userPassword', type: 'string', label: 'User Password (to open)', placeholder: 'Password to open document' },
      { name: 'ownerPassword', type: 'string', label: 'Owner Password (to edit)', placeholder: 'Password to edit permissions' },
      { name: 'allowPrinting', type: 'checkbox', label: 'Allow Printing', defaultValue: true },
      { name: 'allowCopying', type: 'checkbox', label: 'Allow Copying', defaultValue: false },
      { name: 'allowEditing', type: 'checkbox', label: 'Allow Editing', defaultValue: false }
    ]
  },
  {
    id: 'pdf-unlock', name: 'PDF: Unlock', description: 'Remove PDF password', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'password', type: 'string', label: 'Current Password', placeholder: 'Enter current password', required: true }
    ]
  },
  {
    id: 'pdf-redact', name: 'PDF: Redact', description: 'Redact sensitive content', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'redactMode', type: 'select', label: 'Redact Mode', options: [{ value: 'text', label: 'Search Text' }, { value: 'pattern', label: 'Regex Pattern' }, { value: 'area', label: 'Area Selection' }], defaultValue: 'text' },
      { name: 'searchText', type: 'string', label: 'Text to Redact', placeholder: 'SSN, email, etc.' },
      { name: 'redactColor', type: 'color', label: 'Redaction Color', defaultValue: '#000000' },
      { name: 'replaceWith', type: 'string', label: 'Replace With Text (optional)', placeholder: '[REDACTED]' }
    ]
  },
  {
    id: 'pdf-repair', name: 'PDF: Repair', description: 'Repair corrupted PDF', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'repairLevel', type: 'select', label: 'Repair Level', options: [{ value: 'basic', label: 'Basic (Quick)' }, { value: 'full', label: 'Full (Thorough)' }], defaultValue: 'basic' },
      { name: 'recoverImages', type: 'checkbox', label: 'Attempt Image Recovery', defaultValue: true }
    ]
  },
  {
    id: 'pdf-to-pdfa', name: 'PDF: PDF → PDF/A', description: 'Convert to PDF/A archive', category: 'Media', subcategory: 'PDF', tier: 'pro', costType: 'coin', coinCost: 5, execution: 'server', inputType: 'file', outputType: 'file',
    options: [
      { name: 'pdfaVersion', type: 'select', label: 'PDF/A Version', options: [{ value: '1b', label: 'PDF/A-1b (Basic)' }, { value: '2b', label: 'PDF/A-2b (Recommended)' }, { value: '3b', label: 'PDF/A-3b (With Attachments)' }], defaultValue: '2b' },
      { name: 'embedFonts', type: 'checkbox', label: 'Embed All Fonts', defaultValue: true },
      { name: 'convertColors', type: 'checkbox', label: 'Convert Colors to sRGB', defaultValue: true }
    ]
  },
];
