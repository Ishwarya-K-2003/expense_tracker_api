# Expense Tracker API

A REST API for tracking personal expenses, built with Spring Boot, Spring Data JPA and MySQL. It includes a simple web page to add, edit, delete and filter expenses.

## Features

- Add, view, update and delete expenses (CRUD)
- Filter expenses by category and see the total
- Request validation (title required, amount must be positive)
- Simple web frontend served by Spring Boot
- Layered structure: controller, service, repository, entity, dto, exception

## Tech Stack

- Java 17
- Spring Boot, Spring Web, Spring Data JPA, Spring Security
- MySQL
- HTML, CSS, JavaScript
- Maven, Postman, Git

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/expenses | Add an expense |
| GET | /api/expenses | List all expenses |
| GET | /api/expenses/{id} | Get one expense |
| PUT | /api/expenses/{id} | Update an expense |
| DELETE | /api/expenses/{id} | Delete an expense |

Example request body:

```json
{
  "title": "Lunch",
  "amount": 150,
  "category": "Food",
  "date": "2026-11-02"
}
```

## How to Run

1. Clone the repository: