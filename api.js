async function handleBugSend(chatId, selectedBug) {
  const res = await fetch(`https://cella-why.mydigital-store.me/permen?chatId=${encodeURIComponent(chatId)}&type=${selectedBug}`);
  if (!res.ok) throw new Error("Gagal menghubungi server");
  return await res.json();
}
