CREATE TABLE utilisateur (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(20),
  prenom VARCHAR(20),
  email VARCHAR(50) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  telephone VARCHAR(15)
);

CREATE TABLE patient (
  id SERIAL PRIMARY KEY,
  utilisateur_id INT REFERENCES utilisateur(id) ON DELETE CASCADE,
  date_naissance DATE,
  adresse TEXT,
  numero_ss VARCHAR(15),
  groupe_sanguin VARCHAR(3)
);

CREATE TABLE medecin (
  medecin_id SERIAL PRIMARY KEY,
  utilisateur_id INT REFERENCES utilisateur(id) ON DELETE CASCADE,
  specialite TEXT,
  cabinet TEXT,              
  numero_ordre VARCHAR(20),  
  tarif_consultation DECIMAL(10, 2)
);

CREATE TABLE dossier_medical (  
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patient(id) ON DELETE CASCADE,
  date_creation DATE DEFAULT CURRENT_DATE,
  antecedents TEXT,
  allergies TEXT
);

CREATE TYPE statut_rdv AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'TERMINE');

CREATE TABLE rendez_vous (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patient(id),
  medecin_id INT REFERENCES medecin(medecin_id),
  date DATE,
  motif TEXT,
  statut statut_rdv DEFAULT 'EN_ATTENTE'
);

CREATE TABLE consultation_video (
  id SERIAL PRIMARY KEY,
  rendez_vous_id INT REFERENCES rendez_vous(id),
  url_video TEXT,
  duree INT,               
  statut statut_rdv         
);

CREATE TABLE ordonnance (
  id SERIAL PRIMARY KEY,
  date_emission DATE DEFAULT CURRENT_DATE,
  medicaments TEXT[],       
  patient_id INT REFERENCES patient(id),
  dossier_id INT REFERENCES dossier_medical(id)
);

CREATE TABLE creneau (
  id SERIAL PRIMARY KEY,
  medecin_id INT REFERENCES medecin(medecin_id),
  disponible BOOLEAN DEFAULT TRUE,
  heure_debut TIME,
  heure_fin TIME
);

CREATE TABLE notification (
  id SERIAL PRIMARY KEY,
  utilisateur_id INT REFERENCES utilisateur(id),
  message TEXT,
  date_envoi TIMESTAMP DEFAULT NOW() 
);