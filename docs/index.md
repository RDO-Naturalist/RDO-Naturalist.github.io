# Connexion

<div id="authOverlay">
  <div id="authCard">
    <h2>Connexion</h2>
    <div id="authTabs">
      <button id="tabLogin" class="tab" aria-selected="true">Se connecter</button>
      <button id="tabSignup" class="tab" aria-selected="false">Créer un compte</button>
    </div>
    <div id="authForm">
      <input id="authEmail" type="email" placeholder="Email" autocomplete="email" />
      <input id="authPassword" type="password" placeholder="Mot de passe" autocomplete="current-password" />
      <button id="authSubmit">Se connecter</button>
      <div id="authActions">
        <button id="forgotBtn" class="btn-outline" type="button">Mot de passe oublié ?</button>
        <div id="authMsg"></div>
      </div>
    </div>
  </div>
</div>

<div id="resetOverlay" hidden>
  <div id="resetCard" role="dialog" aria-modal="true">
    <h3>Définir un nouveau mot de passe</h3>
    <div id="resetForm">
      <input id="newPass" type="password" placeholder="Nouveau mot de passe" autocomplete="new-password" />
      <input id="newPass2" type="password" placeholder="Confirmer le mot de passe" autocomplete="new-password" />
      <button id="resetSubmit">Mettre à jour</button>
      <div id="resetMsg"></div>
    </div>
  </div>
</div>
