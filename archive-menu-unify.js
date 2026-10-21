/*
 * AMAZAKI ARCHIVE v1.5.1 — menu parity patch
 * Applies only to archive.html. Reuses the existing shared styles.css.
 * No Supabase, article, or administrator logic is modified.
 */
(() => {
  'use strict';
  const host = document.getElementById('menuItems');
  const nav = document.getElementById('menu');
  const toggle = document.getElementById('menuToggle');
  if (!host || !nav || !toggle) return;

  // Match the MAIN page's five navigation groups and bilingual typography.
  const sections = [
    { en: 'MAIN', ja: 'メイン', href: 'index.html#main' },
    { en: 'CHARACTER', ja: 'キャラクター説明', href: 'index.html#character' },
    { en: 'WORLD', ja: '世界観', href: 'archive.html?section=world' },
    {
      en: 'ARSENAL', ja: '異能道具・能力・使用技',
      children: [
        { ja: '異能道具', section: 'item' },
        { ja: '能力', section: 'ability' },
        { ja: '使用技', section: 'technique' }
      ]
    },
    {
      en: 'ARCHIVE', ja: '関係・都での歴史',
      children: [
        { ja: '関係', section: 'relation' },
        { ja: '都での歴史', section: 'history' }
      ]
    }
  ];

  const formParam = () => new URLSearchParams(location.search).get('form') === 'awakened' ? 'awakened' : 'normal';
  const recordLink = item => {
    const form = ['item', 'ability', 'technique'].includes(item.section);
    return 'archive.html?section=' + item.section + (form ? '&form=' + formParam() : '');
  };

  const fragment = document.createDocumentFragment();
  sections.forEach((item, index) => {
    const group = document.createElement('div');
    group.className = 'menu-group';
    const hasChildren = Array.isArray(item.children);
    const control = document.createElement(hasChildren ? 'button' : 'a');
    control.className = 'menu-link';
    if (hasChildren) {
      control.type = 'button';
      control.setAttribute('aria-expanded', 'false');
      control.setAttribute('aria-controls', 'archive-menu-sub-' + index);
    } else {
      control.href = item.href;
    }
    const label = document.createElement('span');
    label.append(document.createTextNode(item.en + ' '));
    const jp = document.createElement('small');
    jp.textContent = item.ja;
    label.appendChild(jp);
    const symbol = document.createElement('span');
    symbol.textContent = hasChildren ? '＋' : '↗';
    symbol.setAttribute('aria-hidden', 'true');
    control.append(label, symbol);
    group.appendChild(control);

    if (hasChildren) {
      const sub = document.createElement('div');
      sub.className = 'menu-sub';
      sub.id = 'archive-menu-sub-' + index;
      item.children.forEach(child => {
        const link = document.createElement('a');
        link.textContent = child.ja;
        link.href = recordLink(child);
        if (['item', 'ability', 'technique'].includes(child.section)) {
          // Kept compatible with archive-page.js updateURL() on form changes.
          link.dataset.preserveForm = child.section;
        }
        sub.appendChild(link);
      });
      control.addEventListener('click', () => {
        const expanded = group.classList.toggle('expanded');
        control.setAttribute('aria-expanded', String(expanded));
      });
      group.appendChild(sub);
    }
    fragment.appendChild(group);
  });
  host.replaceChildren(fragment);

  // Fix the existing dedicated-page Escape handler's incomplete ARIA/icon reset.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !nav.classList.contains('open')) return;
    nav.classList.remove('open');
    nav.setAttribute('aria-hidden', 'true');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('locked');
    toggle.focus();
  });
})();
