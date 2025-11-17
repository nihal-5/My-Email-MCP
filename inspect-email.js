#!/usr/bin/env node
/**
 * Inspect email #6 (Gen AI Specialist from Shubham)
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.GMAIL_USER || process.env.FROM_EMAIL || '',
  password: process.env.GMAIL_APP
