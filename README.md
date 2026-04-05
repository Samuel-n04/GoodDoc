# GooDoc — Gestion de rendez-vous médicaux

Plateforme web de prise de rendez-vous médicaux avec espace patient, espace médecin, dossier médical électronique et génération d'ordonnances en PDF.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | HTML / CSS / JavaScript (vanilla) |
| Backend API | Node.js / Express |
| Base de données | PostgreSQL |
| Authentification | JWT (jsonwebtoken) + bcrypt |
| Serveur de dev PHP | PHP built-in server (`php -S`) |

---

## Prérequis

- Node.js >= 18
- PHP >= 8.0 avec l'extension `pdo_pgsql` et `curl` activées
- PostgreSQL >= 14

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/samuel-n04/gooddoc.git
cd gooddoc
```

### 2. Installer les dépendances Node.js

```bash
cd backend
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp backend/.env.example backend/.env
```

Ouvrir `backend/.env` et renseigner les valeurs :

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=goodoc
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET=une_chaine_secrete_longue_et_aleatoire
JWT_EXPIRES_IN=24h
```

Ouvrir `frontend/config.php` et ajuster le fallback du mot de passe si nécessaire (pour le serveur de dev PHP uniquement) :

```php
$pass = getenv('DB_PASSWORD') ?: 'votre_mot_de_passe';
```

### 4. Créer la base de données

```bash
createdb goodoc
```

Puis appliquer le schéma :

```bash
psql -U postgres -d goodoc -f table.sql
```

---

## Lancement

Le projet nécessite deux serveurs lancés en parallele, chacun dans un terminal distinct.

### Terminal 1 — API Node.js

```bash
cd backend
node server.js
```

Le serveur doit afficher :

```
GooDoc API demarree sur http://localhost:3000
Connecte a PostgreSQL
```

### Terminal 2 — Frontend PHP

```bash
cd frontend
php -S localhost:8000
```

Ouvrir ensuite [http://localhost:8000](http://localhost:8000) dans le navigateur.

---

## Utilisation

### Inscription et connexion

Se rendre sur `http://localhost:8000/register.php` pour creer un compte patient ou medecin, puis se connecter via `login.php`.

### Espace patient

- **Tableau de bord** : prochains rendez-vous et statistiques, rafraichissement automatique toutes les 30 secondes.
- **Mes rendez-vous** : prise de rendez-vous, annulation, acces a la consultation video.
- **Dossier medical** : antecedents, allergies, groupe sanguin, ordonnances avec export PDF.
- **Mon profil** : modification des informations personnelles et medicales.

### Espace medecin

- **Rendez-vous** : validation ou refus des demandes, demarrage de la consultation video, redaction d'ordonnances.
- **Creneaux** : ajout et gestion des creneaux de disponibilite.

---

## Structure du projet

```
gooddoc/
├── backend/
│   ├── routes/
│   │   ├── auth.js           # Authentification JWT
│   │   ├── patient.js        # Profil et donnees patient
│   │   ├── medecin.js        # Profil, creneaux et donnees medecin
│   │   ├── rdv.js            # Gestion des rendez-vous
│   │   ├── dossier.js        # Dossier medical et ordonnances
│   │   ├── consultation.js   # Sessions de consultation video
│   │   └── notification.js   # Notifications
│   ├── middleware/
│   │   └── auth.js           # Verification du token JWT
│   ├── db.js                 # Connexion PostgreSQL
│   ├── server.js             # Point d'entree Express
│   └── .env.example          # Template des variables d'environnement
├── frontend/
│   ├── pages/
│   │   ├── dashboard.html
│   │   ├── rdv.html
│   │   ├── dossier.html
│   │   ├── medecin.html
│   │   ├── medecins.html
│   │   └── profil.html
│   ├── js/
│   │   └── api.js            # Client HTTP et gestion de session
│   ├── css/
│   ├── config.php            # Connexion PDO PostgreSQL
│   ├── login.php
│   ├── register.php
│   └── logout.php
├── table.sql                 # Schema de la base de donnees
└── README.md
```

---

## Notes de developpement

- Le fichier `backend/.env` est exclu du depot via `.gitignore`. Ne jamais le commiter.
- Le frontend est servi par PHP uniquement pour la gestion des sessions d'authentification (login/register). Toutes les pages applicatives sont des fichiers HTML statiques qui communiquent avec l'API Node.js via `fetch`.
- Le CORS est configure pour autoriser les origines `localhost` et `localhost:8000`. Si le port PHP est different, mettre a jour `backend/server.js`.
