# Medical Appointment Management System with Online Consultation

## Description

This platform is designed to streamline the process of booking medical appointments and enables patients to consult with a doctor via video conferencing. It brings together patients and healthcare providers in a single, secure digital environment — reducing administrative overhead and improving access to care.

---

## Features

### 👤 User Account Management
- Patient and doctor account creation with detailed profiles
- Role-based access (patient, doctor, administrator)
- Secure authentication and profile management

### 📅 Online Appointment Booking
- Real-time availability calendar shared between doctors and patients
- Appointment request, confirmation, and cancellation workflows
- Conflict detection to prevent double bookings

### 🎥 Integrated Video Consultation
- Built-in video conferencing for remote medical consultations
- Secure, encrypted video sessions between patient and doctor
- Session recording options (with consent)

### 📋 Electronic Prescription System
- Doctors can issue digital prescriptions at the end of a consultation
- Prescriptions are stored securely and accessible by the patient
- Exportable in PDF format for pharmacy use

### 🗂️ Medical Records Management
- Complete history of consultations and diagnoses
- Access to past prescriptions and medical notes
- Patient records visible only to authorized healthcare providers

### 🔔 Notifications & Reminders
- Automated email and/or SMS reminders before appointments
- In-app notifications for booking confirmations and updates
- Customizable reminder timing for patients and doctors

---

## Getting Started

### Prerequisites

- Node.js (or the relevant runtime for your stack)
- A database system (e.g., PostgreSQL, MySQL, or MongoDB)
- A video conferencing API (e.g., Twilio, Jitsi, or WebRTC)
- An email/SMS service (e.g., SendGrid, Twilio SMS)

### Installation

```bash
# Clone the repository
git clone https://github.com/Samuel-n04/Genie_log.git

# Navigate into the project directory
cd Genie_log

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database, video API, and notification service credentials

# Run database migrations
npm run migrate

# Start the development server
npm run dev
```

---

## Project Structure

```
Genie_log/
├── src/
│   ├── auth/           # Authentication & authorization
│   ├── users/          # Patient and doctor profiles
│   ├── appointments/   # Appointment booking & calendar
│   ├── consultations/  # Video consultation sessions
│   ├── prescriptions/  # Electronic prescription management
│   ├── records/        # Medical records & history
│   └── notifications/  # Reminders and alerts
├── public/             # Static assets
├── tests/              # Test suites
└── README.md
```

---

## Usage

1. **Register** as a patient or doctor.
2. **Set up your profile** with relevant medical or professional information.
3. **Book an appointment** by browsing doctor availability on the shared calendar.
4. **Join the video consultation** at the scheduled time directly from the platform.
5. **Receive your prescription** electronically after the consultation.
6. **Access your medical records** at any time from your patient dashboard.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact

For questions or suggestions, please open an issue in this repository.