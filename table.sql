-- ============================================================
--  GooDoc — Schéma PostgreSQL (fichier racine, aligné sur sql/schema.sql)
-- ============================================================

CREATE DATABASE goodoc;
\c goodoc;

-- Types énumérés
CREATE TYPE statut_rdv    AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'TERMINE');
CREATE TYPE statut_consult AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINEE');
CREATE TYPE type_notif    AS ENUM ('RAPPEL', 'CONFIRMATION', 'ANNULATION', 'INFO');

-- Utilisateur (table parente)
CREATE TABLE utilisateur (
  id           SERIAL PRIMARY KEY,
  nom          VARCHAR(50)  NOT NULL,
  prenom       VARCHAR(50)  NOT NULL,
  email        VARCHAR(100) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  telephone    VARCHAR(15),
  role         VARCHAR(10)  NOT NULL CHECK (role IN ('patient', 'medecin')),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Patient
CREATE TABLE patient (
  id              SERIAL PRIMARY KEY,
  utilisateur_id  INT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  date_naissance  DATE,
  adresse         TEXT,
  numero_ss       VARCHAR(15),
  groupe_sanguin  VARCHAR(3)
);

-- Médecin  (PK = id, cohérent avec toutes les FK)
CREATE TABLE medecin (
  id                 SERIAL PRIMARY KEY,
  utilisateur_id     INT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  specialite         TEXT,
  cabinet            TEXT,
  numero_ordre       VARCHAR(20),
  tarif_consultation DECIMAL(10,2) DEFAULT 25.00
);

-- Dossier médical
CREATE TABLE dossier_medical (
  id            SERIAL PRIMARY KEY,
  patient_id    INT NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  date_creation DATE DEFAULT CURRENT_DATE,
  antecedents   TEXT,
  allergies     TEXT
);

-- Créneau de disponibilité
CREATE TABLE creneau (
  id          SERIAL PRIMARY KEY,
  medecin_id  INT NOT NULL REFERENCES medecin(id) ON DELETE CASCADE,
  heure_debut TIME NOT NULL,
  heure_fin   TIME NOT NULL,
  disponible  BOOLEAN DEFAULT TRUE,
  date        DATE    -- NULL = créneau récurrent, valeur = créneau ponctuel
);

-- Rendez-vous
CREATE TABLE rendez_vous (
  id         SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patient(id),
  medecin_id INT NOT NULL REFERENCES medecin(id),
  creneau_id INT  REFERENCES creneau(id),
  date       DATE NOT NULL,
  motif      TEXT,
  statut     statut_rdv DEFAULT 'EN_ATTENTE',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Consultation vidéo  (utilise statut_consult, pas statut_rdv)
CREATE TABLE consultation_video (
  id             SERIAL PRIMARY KEY,
  rendez_vous_id INT NOT NULL REFERENCES rendez_vous(id) ON DELETE CASCADE,
  url_video      TEXT,
  duree          INT,
  statut         statut_consult DEFAULT 'EN_ATTENTE',
  started_at     TIMESTAMP,
  ended_at       TIMESTAMP
);

-- Ordonnance  (inclut medecin_id, rdv_id, instructions)
CREATE TABLE ordonnance (
  id            SERIAL PRIMARY KEY,
  dossier_id    INT NOT NULL REFERENCES dossier_medical(id),
  medecin_id    INT NOT NULL REFERENCES medecin(id),
  rdv_id        INT REFERENCES rendez_vous(id),
  date_emission DATE DEFAULT CURRENT_DATE,
  medicaments   TEXT[],
  instructions  TEXT
);

-- Notification
CREATE TABLE notification (
  id             SERIAL PRIMARY KEY,
  utilisateur_id INT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  message        TEXT NOT NULL,
  type           type_notif DEFAULT 'INFO',
  lue            BOOLEAN DEFAULT FALSE,
  date_envoi     TIMESTAMP DEFAULT NOW()
);
