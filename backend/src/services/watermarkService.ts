import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

// Zero-width Unicode characters for invisible watermarking
const ZERO_WIDTH_SPACE = '\u200B';      // U+200B
const ZERO_WIDTH_NON_JOINER = '\u200C'; // U+200C
const ZERO_WIDTH_JOINER = '\u200D';     // U+200D
const ZERO_WIDTH_NO_BREAK_SPACE = '\uFEFF'; // U+FEFF

/**
 * Encode user information into invisible zero-width characters
 * @param text Original text to watermark
 * @param userId User ID
 * @param email User email
 * @param date Date in format YYYY-MM-DD
 * @returns Text with invisible watermark embedded
 */
export function encodeInvisibleWatermark(
  text: string,
  userId: string,
  email: string,
  date: string
): string {
  // Create payload: userId|email|date
  const payload = `${userId}|${email}|${date}`;
  
  // Convert payload to binary string
  const binary = payload
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');

  // Map binary digits to zero-width characters
  // 0 -> ZERO_WIDTH_SPACE
  // 1 -> ZERO_WIDTH_NON_JOINER
  // Separator -> ZERO_WIDTH_JOINER
  let watermark = '';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '0') {
      watermark += ZERO_WIDTH_SPACE;
    } else if (binary[i] === '1') {
      watermark += ZERO_WIDTH_NON_JOINER;
    }
  }

  // Insert watermark at multiple strategic positions
  // Position 1: Beginning of text
  // Position 2: After first word
  // Position 3: Middle of text
  // Position 4: End of text
  
  const words = text.split(/\s+/);
  const firstWordEnd = words[0] ? words[0].length : 0;
  const middlePos = Math.floor(text.length / 2);
  const endPos = text.length;

  // Insert markers using ZERO_WIDTH_JOINER as separators
  const marker = ZERO_WIDTH_JOINER + watermark + ZERO_WIDTH_JOINER;
  
  let watermarkedText = text;
  
  // Insert at beginning
  watermarkedText = marker + watermarkedText;
  
  // Insert after first word (if exists)
  if (firstWordEnd > 0 && firstWordEnd < text.length) {
    watermarkedText = 
      watermarkedText.slice(0, firstWordEnd + marker.length) + 
      marker + 
      watermarkedText.slice(firstWordEnd + marker.length);
  }
  
  // Insert at middle
  if (middlePos > 0 && middlePos < watermarkedText.length) {
    watermarkedText = 
      watermarkedText.slice(0, middlePos) + 
      marker + 
      watermarkedText.slice(middlePos);
  }
  
  // Insert at end
  watermarkedText = watermarkedText + marker;

  return watermarkedText;
}

/**
 * Decode invisible watermark from text
 * @param text Text that may contain watermark
 * @returns Decoded user information or null if no watermark found
 */
export function decodeWatermark(
  text: string
): { userId: string; email: string; date: string } | null {
  try {
    // Extract all zero-width characters
    const zeroWidthRegex = /[\u200B\u200C\u200D\uFEFF]/g;
    const matches = text.match(zeroWidthRegex);
    
    if (!matches || matches.length === 0) {
      return null;
    }

    // Find watermark between ZERO_WIDTH_JOINER markers
    const watermarkPattern = new RegExp(
      `${ZERO_WIDTH_JOINER}([${ZERO_WIDTH_SPACE}${ZERO_WIDTH_NON_JOINER}]+)${ZERO_WIDTH_JOINER}`,
      'g'
    );
    
    const watermarkMatches = text.match(watermarkPattern);
    if (!watermarkMatches || watermarkMatches.length === 0) {
      return null;
    }

    // Use the first watermark found
    const watermark = watermarkMatches[0]
      .replace(new RegExp(ZERO_WIDTH_JOINER, 'g'), '')
      .replace(new RegExp(ZERO_WIDTH_NO_BREAK_SPACE, 'g'), '');

    // Convert zero-width characters back to binary
    let binary = '';
    for (let i = 0; i < watermark.length; i++) {
      const char = watermark[i];
      if (char === ZERO_WIDTH_SPACE) {
        binary += '0';
      } else if (char === ZERO_WIDTH_NON_JOINER) {
        binary += '1';
      }
    }

    // Convert binary to string
    let payload = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.slice(i, i + 8);
      if (byte.length === 8) {
        const charCode = parseInt(byte, 2);
        payload += String.fromCharCode(charCode);
      }
    }

    // Parse payload: userId|email|date
    const parts = payload.split('|');
    if (parts.length === 3) {
      return {
        userId: parts[0],
        email: parts[1],
        date: parts[2],
      };
    }

    return null;
  } catch (error) {
    logger.error('Error decoding watermark:', error);
    return null;
  }
}

/**
 * Apply watermark to question object
 * @param question Question object
 * @param userId User ID
 * @param email User email
 * @returns Watermarked question object
 */
export function applyWatermark(
  question: {
    id: string;
    q_text: string;
    choice_a: string;
    choice_b: string;
    choice_c: string;
    choice_d: string;
    [key: string]: any;
  },
  userId: string,
  email: string
): typeof question {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  return {
    ...question,
    q_text: encodeInvisibleWatermark(question.q_text, userId, email, date),
    choice_a: encodeInvisibleWatermark(question.choice_a, userId, email, date),
    choice_b: encodeInvisibleWatermark(question.choice_b, userId, email, date),
    choice_c: encodeInvisibleWatermark(question.choice_c, userId, email, date),
    choice_d: encodeInvisibleWatermark(question.choice_d, userId, email, date),
  };
}

/**
 * Log question access for audit trail
 * @param userId User ID
 * @param questionId Question ID
 * @param email User email
 * @param ipAddress Optional IP address
 */
export async function logQuestionAccess(
  userId: string,
  questionId: string,
  email: string,
  ipAddress?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('question_accesses')
      .insert({
        user_id: userId,
        question_id: questionId,
        user_email: email,
        ip_address: ipAddress || null,
        accessed_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Error logging question access:', error);
      // Don't throw - logging failure shouldn't break question fetching
    } else {
      logger.debug(`Logged question access: user ${userId} accessed question ${questionId}`);
    }
  } catch (error) {
    logger.error('Error in logQuestionAccess:', error);
    // Don't throw - logging failure shouldn't break question fetching
  }
}

/**
 * Get IP address from request
 * @param req Express request object
 * @returns IP address or undefined
 */
export function getClientIp(req: any): string | undefined {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress
  );
}


