import { Platform, Share } from 'react-native';

/**
 * 3-tier share helper.
 * 1. Web Share API (navigator.share)
 * 2. Clipboard + window.alert
 * 3. Textarea execCommand('copy') fallback
 * On native, delegates to React Native's Share.share.
 */
export async function shareContent(opts: {
  title: string;
  text: string;
}) {
  const { title, text } = opts;

  if (Platform.OS !== 'web') {
    await Share.share({ title, message: text }).catch(() => {});
    return;
  }

  // Tier 1: Web Share API
  try {
    if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
      await (navigator as any).share({ title, text });
      return;
    }
  } catch {
    /* user cancelled or share API failed */
  }

  // Tier 2: Clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      if (typeof window !== 'undefined') window.alert('¡Copiado al portapapeles!');
      return;
    }
  } catch {
    /* clipboard failed */
  }

  // Tier 3: textarea copy
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (typeof window !== 'undefined') window.alert('¡Copiado al portapapeles!');
  } catch {
    /* nothing to do */
  }
}
