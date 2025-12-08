#!/usr/bin/env node

/**
 * Decode Watermark Script
 * 
 * Extracts user information from watermarked question text
 * 
 * Usage:
 *   npm run decode-watermark "watermarked text here"
 *   or
 *   node scripts/decode-watermark.ts "watermarked text here"
 */

import { decodeWatermark } from '../src/services/watermarkService';

const text = process.argv[2];

if (!text) {
  console.error('❌ Error: No text provided');
  console.log('\nUsage:');
  console.log('  npm run decode-watermark "watermarked text here"');
  console.log('  or');
  console.log('  node scripts/decode-watermark.ts "watermarked text here"');
  process.exit(1);
}

console.log('🔍 Decoding watermark from text...\n');
console.log('Input text length:', text.length, 'characters\n');

const decoded = decodeWatermark(text);

if (decoded) {
  console.log('✅ Watermark found!\n');
  console.log('Decoded Information:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('User ID:    ', decoded.userId);
  console.log('Email:      ', decoded.email);
  console.log('Date:       ', decoded.date);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  This user may have leaked the question content.');
} else {
  console.log('❌ No watermark found in text.');
  console.log('   This could mean:');
  console.log('   - Text was not watermarked');
  console.log('   - Watermark was removed');
  console.log('   - Text is from a different source\n');
}

process.exit(decoded ? 0 : 1);

