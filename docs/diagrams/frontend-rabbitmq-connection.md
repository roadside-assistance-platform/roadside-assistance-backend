# Frontend RabbitMQ Connection Diagram (PlantUML)

```plantuml
@startuml
actor Provider
participant "Kotlin Frontend App" as Frontend
node "RabbitMQ" {
  [Provider Durable Queue]
  [Category Exchange]
}
Provider -> Frontend: Login
Frontend -> RabbitMQ: Connect
Frontend -> Provider Durable Queue: Declare/Bind
Provider Durable Queue -> Category Exchange: Bind
Category Exchange -> Provider Durable Queue: Notification
Frontend -> Provider Durable Queue: Consume
@enduml
```

**Description:**
- Shows how the Kotlin frontend connects to RabbitMQ, declares a durable queue, binds to category exchanges, and consumes notifications.
