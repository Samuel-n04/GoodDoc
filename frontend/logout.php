<?php
// frontend/logout.php — Déconnexion complète
session_start();
session_destroy();
?>
<!DOCTYPE html>
<html>
<head><title>Déconnexion...</title></head>
<body>
<script>
  localStorage.removeItem('goodoc_token');
  localStorage.removeItem('goodoc_session');
  window.location.href = 'login.php';
</script>
</body>
</html>
