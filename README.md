# Restaurant Admin Web Panel

Trendyol Go-like Food Delivery System – Restaurant Owner Interface

## Project Description

This project is a web-based admin panel for restaurant owners.
The system allows restaurant owners to manage their restaurant profile, menu, and incoming orders.

Customers place orders via the mobile application.
This web interface is only for restaurant management.

## System Requirements

### Functional Requirements

- Restaurant owner authentication (Login / Logout)
- View restaurant profile information
- Edit restaurant details
- Add / Edit / Delete menu items
- Manage categories
- View incoming orders
- Update order status (Preparing, Ready, Cancelled)
- View order history

### Non-Functional Requirements

- Responsive design
- Secure authentication with JWT
- Fast page loading
- Role-based access (Restaurant Owner only)
- API integration with backend services

## Possible Interfaces

### Login Page

- Email
- Password
- Login button

### Dashboard

- Total Orders Today
- Active Orders
- Revenue Summary

### Menu Management Page

- List of menu items
- Add new item button
- Edit / Delete options
- Category filter

### Order Management Page

- List of active orders
- Order details view
- Status update buttons

### Restaurant Settings Page

- Restaurant name
- Address
- Working hours
- Open / Closed toggle

## Tech Stack

- Angular
- TypeScript
- REST API integration
- Azure DevOps (version control planning)

## Development

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.1.

### Development server

```bash
ng serve
```

Open `http://localhost:4200/` in your browser.

### Build

```bash
ng build
```

Build artifacts are generated in `dist/`.

### Unit tests

```bash
ng test
```

### End-to-end tests

```bash
ng e2e
```

Angular CLI does not include an e2e framework by default.

## Team Members

- Adile Büşra Kaban
- Şehed Fatih
