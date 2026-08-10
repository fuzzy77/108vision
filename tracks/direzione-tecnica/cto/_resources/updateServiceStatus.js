//update multiplo stato servizi
db.subscriptions.updateMany(
  {
    "billingContainers.serviceGroups.services.id": {
      $in: [
        UUID("6a57d0c2-27e4-4a3f-a95f-8c9d8d9b4f4e"),
        UUID("ee2a0e44-42d5-4b9d-8e7b-c633950bb1f6"),
        UUID("74e449d5-3a2c-4850-995c-1823a8a044fd"),
        UUID("6fea8e89-84bf-4eb8-b3e8-677985feb41c"),
        UUID("7caad548-a258-49fc-bcc0-75af8b9ee1e7")
      ]
    }
  },
  {
    $set: {
      "billingContainers.serviceGroups.services.status": "Suspended"
    }
  }
);