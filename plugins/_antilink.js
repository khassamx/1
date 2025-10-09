const groupLinkRegex = /chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i;
const channelLinkRegex = /whatsapp\.com\/channel\/([0-9A-Za-z]+)/i;

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m || !m.text || !m.isGroup || (m.isBaileys && m.fromMe)) return !0;

  const chat = global.db?.data?.chats?.[m.chat];
  if (!chat?.antiLink) return !0;

  const isGroupLink = groupLinkRegex.test(m.text);
  const isChannelLink = channelLinkRegex.test(m.text);

  // Si no contiene enlaces, salir
  if (!isGroupLink && !isChannelLink) return !0;

  // Permitir si es admin
  if (isAdmin) return !0;

  // Si el bot no es admin
  if (!isBotAdmin) {
    await conn.reply(m.chat, `⚠️ No puedo eliminar enlaces porque no soy administrador.`, m);
    return !0;
  }

  try {
    const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`;
    if (isGroupLink && m.text.includes(linkThisGroup)) return !0;

    await conn.reply(
      m.chat,
      `> 🚫 *Anti-Link activado*\n@${m.sender.split`@`[0]} fue eliminado por compartir un enlace de ${isChannelLink ? 'canal' : 'otro grupo'}.\n\nEvita enviar links no autorizados.`,
      null,
      { mentions: [m.sender] }
    );

    await conn.sendMessage(m.chat, { delete: m.key });
    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
    console.log(`[ANTI-LINK] Usuario ${m.sender} eliminado de ${m.chat}`);
  } catch (error) {
    console.error("[ERROR ANTI-LINK]", error);
    await conn.reply(m.chat, `⚠️ Ocurrió un error al intentar eliminar al usuario.`, m);
  }

  return !0;
}