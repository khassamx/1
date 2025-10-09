const linkRegex = /\bhttps?:\/\/[^\s/$.?#].[^\s]*|www\.[^\s/$.?#].[^\s]*/i;

export async function before(m, { conn, isAdmin, isBotAdmin, text }) {
  if (!m || m.isBaileys && m.fromMe) return !0;
  if (!m.isGroup) return !1;

  const chat = global.db?.data?.chats?.[m.chat];
  const bot = global.db?.data?.settings?.[conn.user.jid] || {};
  if (!chat?.antiLink2) return !0;

  const user = `@${m.sender.split`@`[0]}`;
  const isLink = linkRegex.test(m.text || '');

  if (!isLink || isAdmin) return !0;

  if (!isBotAdmin)
    return m.reply('🚫 *No puedo actuar porque no soy administrador del grupo.*');

  try {
    const groupInvite = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`;
    if (m.text.includes(groupInvite)) return !0;

    // Lista de dominios permitidos
    const allowList = ['youtube.com', 'youtu.be'];
    if (allowList.some((url) => m.text.includes(url))) return !0;

    await conn.reply(
      m.chat,
      `*「 𝐀𝐍𝐓𝐈 𝐋𝐈𝐍𝐊𝐒 」*\n🙄 ${user}, rompiste las reglas del grupo enviando un enlace prohibido.\nSerás expulsado...`,
      null,
      { mentions: [m.sender] }
    );

    if (bot.restrict) {
      await conn.sendMessage(m.chat, {
        delete: { remoteJid: m.chat, id: m.key.id, participant: m.key.participant },
      });

      const res = await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
      if (res?.[0]?.status === '404') console.log('[ANTI-LINK] Usuario ya no está en el grupo');
      else console.log(`[ANTI-LINK] Usuario ${m.sender} expulsado por enviar link.`);
    } else {
      m.reply('⚠️ *El propietario no ha activado la función restrict*, no puedo expulsar.');
    }
  } catch (err) {
    console.error('[ERROR ANTI-LINK 2]', err);
    await conn.reply(m.chat, '❌ Hubo un error al ejecutar el anti-link.', m);
  }

  return !0;
}