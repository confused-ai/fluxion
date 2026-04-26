/**
 * Voice Module Exports
 */

export {
    OpenAIVoiceProvider,
    ElevenLabsVoiceProvider,
    createVoiceProvider,
} from './voice-provider.js';

export type {
    VoiceConfig,
    VoiceProvider,
    TTSResult,
    STTResult,
    OpenAIVoice,
} from './voice-provider.js';
