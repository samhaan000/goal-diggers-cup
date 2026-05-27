const SHARE_TABLE_ASSETS = {
  goalLogo: 'assets/goalhero-01.png',
  societyLogo: 'assets/SOCIETY%20HERO-01-01.png',
  sponsors: [
    'assets/AN.sponsor-01.png',
    'assets/BML.sponsor-01.png',
    'assets/Daimyo.sponsor-01.png',
    'assets/doozi.sponsor-01.png',
    'assets/dynamic%20foundation.sponsor-01.png',
    'assets/police.sponsor-01.png',
    'assets/teddy.sponsor-01.png',
    'assets/skate.sponsor-01.png'
  ]
};

function getLeagueRowsForShare() {
  return [...document.querySelectorAll('#standingsList .league-row')].map(row => {
    const cells = [...row.children];
    return {
      pos: cells[0]?.textContent?.trim() || '',
      team: row.querySelector('.team-cell strong')?.textContent?.trim() || cells[1]?.textContent?.trim() || '',
      pl: cells[2]?.textContent?.trim() || '',
      w: cells[3]?.textContent?.trim() || '',
      gd: cells[4]?.textContent?.trim() || '',
      pts: row.querySelector('b')?.textContent?.trim() || cells[5]?.textContent?.trim() || '',
      top: row.classList.contains('top-two')
    };
  });
}

function imageTag(src, alt = '') {
  return `<img src="${src}" alt="${alt}" crossorigin="anonymous" decoding="async">`;
}

function preloadShareImages(target) {
  const images = [...target.querySelectorAll('img')];
  return Promise.all(images.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
}

async function shareLeagueTableImage() {
  const btn = document.getElementById('shareTableBtn');
  const target = document.getElementById('storyShareCanvas');
  const rows = getLeagueRowsForShare();

  if (!target || !rows.length) return;

  target.innerHTML = `
    <div class="story-share-bg-orb story-share-bg-orb-one"></div>
    <div class="story-share-bg-orb story-share-bg-orb-two"></div>
    <div class="story-share-frame">
      <header class="story-share-header">
        <div class="story-share-brand-logo story-share-goal-logo">
          ${imageTag(SHARE_TABLE_ASSETS.goalLogo, 'Goal Diggers Cup logo')}
        </div>
        <div class="story-share-title">
          <span>Official League Table</span>
          <h1>Goal Diggers<br>Cup 2026</h1>
        </div>
        <div class="story-share-brand-logo story-share-society-logo">
          ${imageTag(SHARE_TABLE_ASSETS.societyLogo, 'Society for Youth Enhancement logo')}
        </div>
      </header>

      <section class="story-share-table-wrap">
        <div class="story-share-table-kicker">Standings</div>
        <div class="story-share-table">
          <div class="story-share-head">
            <span>POS</span><span>TEAM</span><span>PL</span><span>W</span><span>GD</span><span>PTS</span>
          </div>
          ${rows.map(r => `
            <div class="story-share-row ${r.top ? 'top-two' : ''}">
              <span>${r.pos}</span>
              <span>${r.team}</span>
              <span>${r.pl}</span>
              <span>${r.w}</span>
              <span>${r.gd}</span>
              <span>${r.pts}</span>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="story-share-sponsors" aria-label="Sponsors">
        <div class="story-share-sponsor-title">Proudly supported by our sponsors</div>
        <div class="story-share-sponsor-grid">
          ${SHARE_TABLE_ASSETS.sponsors.map((src, index) => `<div class="story-share-sponsor-logo">${imageTag(src, `Sponsor ${index + 1}`)}</div>`).join('')}
        </div>
      </section>

      <footer class="story-share-footer">
        <span>Organized by</span>
        <strong>Society for Youth Enhancement</strong>
      </footer>
    </div>
  `;

  try {
    if (btn) btn.textContent = 'Preparing...';
    await preloadShareImages(target);

    const canvas = await html2canvas(target, {
      backgroundColor: null,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      width: 1080,
      height: 1920,
      windowWidth: 1080,
      windowHeight: 1920
    });

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
    const file = new File([blob], 'goal-diggers-cup-table.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Goal Diggers Cup 2026 League Table',
        text: 'Goal Diggers Cup 2026 League Table'
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'goal-diggers-cup-table.png';
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error(err);
    alert('Could not create image. Please try again.');
  } finally {
    if (btn) btn.textContent = 'Share Table';
  }
}

document.getElementById('shareTableBtn')?.addEventListener('click', shareLeagueTableImage);
