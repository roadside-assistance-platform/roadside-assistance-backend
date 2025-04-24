# Frontend–Backend Integration Guide

This document provides essential information for Kotlin frontend developers to ensure smooth integration with the roadside-assistance-backend platform.

---

## 1. API Communication
- **Base URL:** All API requests should target the backend's base URL (provided by your deployment environment).
- **Authentication:**
  - Supports local and Google OAuth.
  - Use JWT tokens for authenticated requests; include the token in the `Authorization: Bearer <token>` header.
- **User Types:**
  - `Client`, `Provider`, and `Admin` roles. Some endpoints are role-restricted.

## 2. Service Request Flow
- **Creating a Service:**
  - Endpoint: `POST /api/services`
  - Required fields: `serviceCategory` (e.g., towing, flat_tire, fuel_delivery, lockout, emergency, other), location, description, etc.
  - On creation, backend notifies relevant providers via the notification system.

## 3. Notification System
- **Mechanism:**
  - Real-time notifications are delivered using RabbitMQ.
  - Each provider listens to a specific category exchange (e.g., `towing-notifications-exchange`).
  - If the service category is `other`, the backend sends notifications to all category exchanges.
- **Notification Payload Example:**
  ```json
  {
    "providerId": "provider123",
    "data": {
      "id": "service456",
      "clientId": "client789",
      "serviceCategory": "towing",
      "location": "123 Main St",
      "description": "Car won't start",
      "type": "NEW_SERVICE_REQUEST",
      "timestamp": "2025-04-24T15:30:12.000Z"
    }
  }
  ```
- **Offline Providers:**
  - If a provider is offline when a notification is sent, they will NOT receive it later (unless durable queues are implemented).

## 4. Error Handling
- **Standardized error format:**
  ```json
  {
    "status": "error",
    "message": "Description of the error",
    "details": { ... }
  }
  ```
- **Validation:**
  - Backend enforces type checks, required fields, and value constraints.
  - Frontend should handle and display error messages appropriately.

## 5. API Documentation
- **Swagger/OpenAPI:**
  - The backend provides Swagger documentation for all endpoints. Use it for request/response structure and try out endpoints.

## 6. Best Practices
- **Sync Enums:**
  - Use the same service categories as defined in the backend: `towing`, `flat_tire`, `fuel_delivery`, `lockout`, `emergency`, `other`.
- **Timestamps:**
  - All timestamps are in ISO 8601 format (UTC). Parse accordingly in Kotlin.
- **Testing:**
  - Use the test notification publisher (`provider-notification-publisher.ts`) for end-to-end notification flow checks.

---

For any integration issues, consult the backend team or refer to the Swagger documentation.
