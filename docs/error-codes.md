# Error Codes Documentation

This document describes all possible error codes and their meanings in the Roadside Assistance API.

## Error Types

### Validation Errors (400)
- **Code**: `VALIDATION_ERROR`
- **Description**: Occurs when request data fails validation rules
- **Common Cases**:
  - Missing required fields
  - Invalid field formats
  - Invalid field values
  - Duplicate unique fields

### Authentication Errors (401)
- **Code**: `AUTHENTICATION_ERROR`
- **Description**: Occurs when authentication fails
- **Common Cases**:
  - Invalid credentials
  - Invalid or expired token
  - Missing authentication token

### Authorization Errors (403)
- **Code**: `AUTHORIZATION_ERROR`
- **Description**: Occurs when user lacks permission
- **Common Cases**:
  - Insufficient role/permissions
  - Resource ownership mismatch
  - Account restrictions

### Not Found Errors (404)
- **Code**: `NOT_FOUND_ERROR`
- **Description**: Occurs when requested resource doesn't exist
- **Common Cases**:
  - Invalid resource ID
  - Deleted resource
  - Non-existent endpoint

### Database Errors (500)
- **Code**: `DATABASE_ERROR`
- **Description**: Occurs when database operations fail
- **Common Cases**:
  - Connection issues
  - Query failures
  - Constraint violations

### Network Errors (500)
- **Code**: `NETWORK_ERROR`
- **Description**: Occurs during network operations
- **Common Cases**:
  - External service unavailable
  - Timeout
  - Connection issues

## Prisma Error Codes

### P2002 - Unique Constraint
- **Description**: Unique constraint violation
- **Response**: Validation error with field name
- **Example**: "Duplicate value for email. Please use a unique value."

### P2025 - Record Not Found
- **Description**: Record to modify not found
- **Response**: Not found error with model name
- **Example**: "User not found"

### P2003 - Foreign Key Constraint
- **Description**: Foreign key constraint failed
- **Response**: Validation error
- **Example**: "Invalid relationship data provided"

### P2014 - Required Relation
- **Description**: Required relation violation
- **Response**: Validation error
- **Example**: "Invalid data provided. The operation would violate required relations"

## Error Response Format

### Development Environment
```json
{
  "status": "fail|error",
  "code": "ERROR_CODE",
  "message": "Detailed error message",
  "requestId": "unique-request-id",
  "error": {
    // Full error details
  },
  "stack": "Error stack trace",
  "prismaError": {
    // If applicable
    "code": "PRISMA_ERROR_CODE",
    "meta": {}
  }
}
```

### Production Environment
```json
{
  "status": "fail|error",
  "code": "ERROR_CODE",
  "message": "User-friendly error message",
  "requestId": "unique-request-id"
}
```
