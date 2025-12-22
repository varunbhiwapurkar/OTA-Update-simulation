****Secure OTA Update System for Autonomous Vehicles
****
Thesis Project – OTA Security using Threat Modelling & Mitigation

**1. Project Overview**

This project demonstrates a secure Over-The-Air (OTA) firmware update system designed for autonomous vehicles.
The primary objective is to identify security threats in the OTA pipeline using threat modelling techniques and apply effective mitigation strategies to ensure integrity, authenticity, and safety of vehicle software updates.
The system is implemented using modern web technologies and follows security principles inspired by the Uptane framework.

**2. Research Focus**

Thesis Title:
Integrating Threat Modelling and Mitigation Strategies for Securing Over-The-Air (OTA) Updates for Autonomous Vehicles

Key Focus Areas:
Secure firmware distribution
Threat identification using STRIDE threat model
Cryptographic protection of firmware updates
Prevention of spoofing, tampering, and rollback attacks
Validation of update integrity at the vehicle client

**3. System Architecture Overview**

The project follows a centralised OTA architecture, consisting of:

OTA Backend Server
  - Hosts firmware files
  - Generates cryptographically signed metadata
  - Manages firmware versions
  - Provides REST APIs for update checks
    
Vehicle Client Application
  - Requests updates from server
  - Verifies metadata signatures
  - Validates firmware hash and version
  - Applies update only if all security checks pass
    
Database (MongoDB)
  - Stores firmware metadata
  - Maintains version history

**4. Technologies Used**
**Backend: **
Node.js
Express.js
MongoDB
JSON-based metadata
Cryptographic hashing and digital signatures

**Frontend / Client:**
JavaScript
Vehicle OTA simulation logic
Security Concepts Implemented
STRIDE Threat Model
Hash verification
Digital signatures
Version validation
Secure metadata hierarchy (inspired by Uptane)
