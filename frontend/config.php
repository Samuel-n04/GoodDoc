<?php
// frontend/config.php — Connexion PostgreSQL via PDO
// Les credentials sont lus depuis les variables d'environnement.
// Définir DB_HOST, DB_NAME, DB_USER, DB_PASSWORD dans l'env du serveur
// (ou dans le .env du projet pour le développement local).
define('INTERNAL_SECRET', 'goodoc_internal_mint_2025');

$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'goodoc';
$user = getenv('DB_USER') ?: 'postgres';
$pass = getenv('DB_PASSWORD') ?: 'najeda93';

try {
  $pdo = new PDO("pgsql:host=$host;dbname=$db", $user, $pass);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
  die(json_encode(['erreur' => 'Connexion BDD impossible : ' . $e->getMessage()]));
}
