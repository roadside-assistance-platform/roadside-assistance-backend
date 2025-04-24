# Notification System Guide for Kotlin Frontend

This guide explains how the notification system works in the backend and what you need to implement on the frontend (Kotlin) to receive notifications reliably.

---

## 1. Overview
- The backend uses **RabbitMQ** with **fanout exchanges** for real-time provider notifications.
- Each service category (e.g., `towing`, `flat_tire`, etc.) has its own exchange: `<category>-notifications-exchange`.
- When a new service request is created, the backend publishes a notification to the relevant category exchange(s).
  - If the category is `other`, notifications are sent to **all** category exchanges.

## 2. Queues and Exchanges
- **Exchanges:**
  - Named as `<category>-notifications-exchange` (e.g., `towing-notifications-exchange`).
  - Use the **fanout** type: all bound queues receive every message.
- **Queues:**
  - Each provider (or frontend instance) should create and bind its own queue to the relevant exchange(s).
  - **Recommended:** Use a durable, named queue for each provider to ensure messages are not missed if the frontend is offline.
  - If you use a temporary (exclusive, auto-delete) queue, you will only receive messages while online.

## 3. What the Frontend Must Do
- **Connect to RabbitMQ:**
  - Use a RabbitMQ client library compatible with Kotlin (e.g., [RabbitMQ Java Client](https://www.rabbitmq.com/java-client.html)).
- **Queue Declaration:**
  - Declare a durable, uniquely named queue for each provider (e.g., `provider-<providerId>-queue`).
    - Durable: true
    - Auto-delete: false
    - Exclusive: false
- **Bind to Exchanges:**
  - For each service category the provider supports, bind the queue to `<category>-notifications-exchange`.
  - If the provider supports all categories, bind to all exchanges.
- **Consume Messages:**
  - Listen for messages on the queue.
  - Parse the notification payload (JSON format; see integration docs for structure).
- **Message Acknowledgement:**
  - Acknowledge messages after successful processing to ensure reliable delivery.

## 4. Example Flow
1. Frontend authenticates and determines provider's supported categories.
2. Frontend connects to RabbitMQ and declares a durable queue (e.g., `provider-123-queue`).
3. Frontend binds this queue to all relevant exchanges (e.g., `towing-notifications-exchange`).
4. Frontend listens for and processes messages.

## 5. Important Notes
- **Offline Handling:**
  - Durable queues ensure notifications sent while the frontend is offline are delivered when it reconnects.
- **Security:**
  - Use secure credentials and TLS for RabbitMQ connections.
- **Error Handling:**
  - Log and handle connection/message errors gracefully.

## 6. Useful Resources
- [RabbitMQ Java Client Documentation](https://www.rabbitmq.com/java-client.html)
- [Backend Integration Guide](./frontend-backend-integration.md)

---

For questions or help, contact the backend team.
