import bot from '../config/bot.js';

// Telegram MarkdownV1 reserves these for link/emphasis syntax. We only escape
// inside dynamic text fields so user/job data can't break the message layout.
function escapeMd(text) {
  return (text || '').toString().replace(/([_*`\[])/g, '\\$1');
}

export async function sendAlert(chatId, job) {
  const title = escapeMd(job.title);
  const company = escapeMd(job.company);
  const location = escapeMd(job.location);
  const experience = escapeMd(job.experience) || 'Fresher/Not specified';
  const source = escapeMd(job.source);
  const link = job.applyLink || '';

  const message =
    `🚨 *New Job Alert!*\n\n` +
    `💼 *${title}*\n` +
    `🏢 ${company}\n` +
    `📍 ${location}\n` +
    `🎓 ${experience}\n` +
    `🌐 Source: ${source}\n\n` +
    `🔗 [Apply Now](${link})\n\n` +
    `_Powered by FirstApply_`;

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });
    return true;
  } catch (err) {
    console.error(`❌ Failed to send alert to ${chatId}:`, err.message);
    return false;
  }
}

// Plain helper for non-job notifications (welcome message, command replies).
export async function sendMessage(chatId, text, options = {}) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
    return true;
  } catch (err) {
    console.error(`❌ Failed to send message to ${chatId}:`, err.message);
    return false;
  }
}

export default sendAlert;
