<?php
// frontend/register.php
session_start();
require_once 'config.php';

$erreur = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $nom    = trim($_POST['nom'] ?? '');
  $prenom = trim($_POST['prenom'] ?? '');
  $email  = trim($_POST['email'] ?? '');
  $mdp    = trim($_POST['mot_de_passe'] ?? '');
  $role   = $_POST['role'] ?? 'patient';

  if ($nom && $prenom && $email && $mdp) {
    // Vérifier si email existe déjà
    $check = $pdo->prepare('SELECT id FROM utilisateur WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
      $erreur = 'Cet email est déjà utilisé.';
    } else {
      $hash = password_hash($mdp, PASSWORD_DEFAULT);
      try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare(
          'INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role) VALUES (?,?,?,?,?) RETURNING id'
        );
        $stmt->execute([$nom, $prenom, $email, $hash, $role]);
        $user_id = $stmt->fetchColumn();

        if ($role === 'patient') {
          $pdo->prepare('INSERT INTO patient (utilisateur_id) VALUES (?)')->execute([$user_id]);
          $p = $pdo->prepare('SELECT id FROM patient WHERE utilisateur_id=?');
          $p->execute([$user_id]);
          $pid = $p->fetchColumn();
          $pdo->prepare('INSERT INTO dossier_medical (patient_id) VALUES (?)')->execute([$pid]);
        } else {
          $specialite = trim($_POST['specialite'] ?? '');
          $pdo->prepare('INSERT INTO medecin (utilisateur_id, specialite) VALUES (?,?)')->execute([$user_id, $specialite]);
        }

        $pdo->commit();
        header('Location: login.php?inscrit=1');
        exit;
      } catch (Exception $e) {
        $pdo->rollBack();
        $erreur = 'Erreur lors de la création du compte. Veuillez réessayer.';
      }
    }
  } else {
    $erreur = 'Veuillez remplir tous les champs obligatoires.';
  }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GooDoc — Inscription</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="auth-page">
  <div class="auth-card">
    <div class="auth-logo">
      <span class="logo-icon">🩺</span>
      <h1>GooDoc</h1>
      <p>Créer un compte</p>
    </div>

    <?php if ($erreur): ?>
      <div class="alert alert-error"><?= htmlspecialchars($erreur) ?></div>
    <?php endif; ?>

    <form method="POST" action="register.php">
      <div class="form-row">
        <div class="form-group">
          <label>Nom</label>
          <input type="text" name="nom" placeholder="Dupont" required>
        </div>
        <div class="form-group">
          <label>Prénom</label>
          <input type="text" name="prenom" placeholder="Jean" required>
        </div>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" placeholder="votre@email.com" required>
      </div>
      <div class="form-group">
        <label>Mot de passe</label>
        <input type="password" name="mot_de_passe" placeholder="••••••••" required>
      </div>
      <div class="form-group">
        <label>Je suis</label>
        <select name="role" id="role-select" onchange="toggleSpecialite(this.value)">
          <option value="patient">Patient</option>
          <option value="medecin">Médecin</option>
        </select>
      </div>
      <div class="form-group" id="champ-specialite" style="display:none">
        <label>Spécialité</label>
        <input type="text" name="specialite" placeholder="Généraliste, Cardiologue...">
      </div>
      <button type="submit" class="btn-primary btn-full">Créer mon compte</button>
    </form>

    <p class="auth-link">Déjà un compte ? <a href="login.php">Se connecter</a></p>
  </div>
  <script>
    function toggleSpecialite(role) {
      document.getElementById('champ-specialite').style.display =
        role === 'medecin' ? 'block' : 'none';
    }
  </script>
</body>
</html>
