<?php
// frontend/login.php
session_start();
require_once 'config.php';

$erreur = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $email = trim($_POST['email'] ?? '');
  $mdp   = trim($_POST['mot_de_passe'] ?? '');

  if ($email && $mdp) {
    $stmt = $pdo->prepare('SELECT u.*, p.id AS patient_id, m.id AS medecin_id
                           FROM utilisateur u
                           LEFT JOIN patient p ON p.utilisateur_id = u.id
                           LEFT JOIN medecin m ON m.utilisateur_id = u.id
                           WHERE u.email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($mdp, $user['mot_de_passe'])) {
      // Appeler l'API Node.js pour obtenir le JWT
      $ch = curl_init('http://localhost:3000/api/auth/mint');
      curl_setopt($ch, CURLOPT_POST, true);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['user_id' => $user['id']]));
      curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Internal-Secret: ' . INTERNAL_SECRET
      ]);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_TIMEOUT, 5);
      $resp  = curl_exec($ch);
      curl_close($ch);
      $data  = json_decode($resp, true);
      $token = $data['token'] ?? '';

      $_SESSION['user_id']    = $user['id'];
      $_SESSION['nom']        = $user['nom'];
      $_SESSION['prenom']     = $user['prenom'];
      $_SESSION['role']       = $user['role'];
      $_SESSION['patient_id'] = $user['patient_id'];
      $_SESSION['medecin_id'] = $user['medecin_id'];
      $_SESSION['jwt']        = $token;

      if (!$token) {
        $erreur = 'Serveur indisponible, impossible de générer la session. Assurez-vous que le backend est démarré.';
      } else {
        // Stocker token + session dans localStorage via JS puis rediriger
        $session_js = json_encode([
          'user_id'    => $user['id'],
          'nom'        => $user['nom'],
          'prenom'     => $user['prenom'],
          'role'       => $user['role'],
          'patient_id' => $user['patient_id'],
          'medecin_id' => $user['medecin_id'],
        ]);
        $redirect = $user['role'] === 'medecin' ? 'pages/medecin.html' : 'pages/dashboard.html';
        echo "<!DOCTYPE html><html><head><title>Connexion...</title></head><body>
          <script>
            localStorage.setItem('goodoc_token', " . json_encode($token) . ");
            localStorage.setItem('goodoc_session', " . json_encode($session_js) . ");
            window.location.href = '{$redirect}';
          </script>
        </body></html>";
        exit;
      }
    } else {
      $erreur = 'Email ou mot de passe incorrect.';
    }
  } else {
    $erreur = 'Veuillez remplir tous les champs.';
  }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GooDoc — Connexion</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="auth-page">
  <div class="auth-card">
    <div class="auth-logo">
      <span class="logo-icon">🩺</span>
      <h1>GooDoc</h1>
      <p>Gestion de rendez-vous médicaux</p>
    </div>

    <?php if ($erreur): ?>
      <div class="alert alert-error"><?= htmlspecialchars($erreur) ?></div>
    <?php endif; ?>

    <form method="POST" action="login.php">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="votre@email.com" required>
      </div>
      <div class="form-group">
        <label for="mot_de_passe">Mot de passe</label>
        <input type="password" id="mot_de_passe" name="mot_de_passe" placeholder="••••••••" required>
      </div>
      <button type="submit" class="btn-primary btn-full">Se connecter</button>
    </form>

    <p class="auth-link">Pas encore de compte ? <a href="register.php">S'inscrire</a></p>
  </div>
</body>
</html>
