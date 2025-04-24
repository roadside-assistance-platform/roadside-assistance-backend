# Notification System Sequence Diagram (PlantUML)

```plantuml
@startuml
actor Client
actor Provider
participant "Backend API" as API
participant "RabbitMQ Exchange" as Exchange
participant "Provider Queue" as Queue

Client -> API: Create Service Request
API -> Exchange: Publish Notification (category)
Exchange -> Queue: Deliver Notification
Provider -> Queue: Consume Notification
@enduml
```

**Description:**
- Shows the flow from service creation to provider notification delivery.
- Providers must have their queue bound to the exchange to receive notifications.
