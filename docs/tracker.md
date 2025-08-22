# Progression Animaux Légendaires

<div id="app">

  <!-- CONFLICT MODAL -->
  <div id="conflictOverlay" hidden>
    <div id="conflictCard" role="dialog" aria-modal="true">
      <h3>Conflit de données</h3>
      <p>Les données locales et celles du cloud sont différentes. Que voulez-vous faire&nbsp;?</p>
      <div class="counts">
        <span id="localCount">Local&nbsp;: 0 actions cochées</span>
        <span id="cloudCount">Cloud&nbsp;: 0 actions cochées</span>
      </div>
      <div class="btn-row">
        <button id="keepLocalBtn" class="btn-primary">Conserver les données locales</button>
        <button id="useCloudBtn" class="btn-ghost">Utiliser les données du cloud</button>
      </div>
    </div>
  </div>

  <header class="app-header">
    <div class="wrap">
      <h1><img src="assets/img/favicon.png" alt="Logo" class="logo"> Progression Animaux Légendaires RDO</h1>
      <div class="sub">Cartes optimisées iPhone • Sauvegarde locale + Cloud • Thème clair/sombre</div>

      <div class="controls controls--compact">
        <input id="q" class="input" type="search" placeholder="Rechercher (animal, lieu, condition)…" inputmode="search"/>
        <button id="filtersToggle" class="btn-outline" aria-controls="filtersPanel">🔎 Filtres</button>
        <button id="themeBtn" title="Basculer clair/sombre">🌓</button>
      </div>

      <div class="bar bar--thin" aria-label="Progression globale">
        <div class="fill warn" id="gFill"></div>
      </div>
      <div class="stats stats--mini">
        <strong>Global</strong>
        <div class="pct" id="gPct">0%</div>
        <div class="small" id="gCount">0 / 0 actions</div>
      </div>

      <details id="filtersPanel">
        <summary>Filtres & Outils</summary>

        <div class="grid-filters">
          <select id="fMission"></select>
          <select id="fTag"></select>
          <button id="checkAll">Cocher visibles</button>
          <button id="uncheckAll">Décocher visibles</button>
          <button id="resetAll">Réinitialiser</button>
          <button id="clearLS" title="Effacer le stockage local">🗑️ Effacer stockage</button>
          <button id="signOutBtn" class="btn-outline" style="display:none">Se déconnecter</button>
        </div>

        <div class="legend" id="legendChips"></div>
        <div class="hint">Astuce : tap sur un chip = (dé)cocher cette action pour toutes les cartes visibles.</div>
      </details>
    </div>
  </header>

  <main>
    <section id="groups" class="grid"></section>
  </main>

  </div>

