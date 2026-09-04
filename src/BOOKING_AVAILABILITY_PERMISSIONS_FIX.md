# Booking Availability Permissions Fix - WDE0027 Error Resolution

## Problem
The admin booking panel was unable to load availability slots due to WDE0027 permission error:
```
WDE0027: The current user does not have permissions to read on the bookingavailability collection.
```

## Root Cause
The `bookingavailability` CMS collection had restrictive permissions:
- **Read**: SITE_MEMBER (only authenticated members could read)
- **Insert**: ADMIN
- **Update**: ADMIN
- **Delete**: ADMIN

This prevented the admin panel from accessing availability data through the frontend.

## Solution Architecture

### 1. Backend API with Elevated Permissions
All booking availability operations now route through backend API endpoints that use `BaseCrudService` with elevated permissions:

**Endpoints Created:**
- `GET /api/booking-availability/get-all` - Fetch all availability slots
- `GET /api/booking-availability/get-bookings` - Fetch all bookings
- `POST /api/booking-availability/create` - Create new availability slot
- `PUT /api/booking-availability/update` - Update availability slot
- `DELETE /api/booking-availability/delete` - Delete availability slot

**Key Feature:** Backend endpoints use `BaseCrudService` which automatically bypasses frontend permission restrictions when called from the server.

### 2. Frontend API Layer
File: `/src/api/booking-availability.ts`

Provides wrapper functions that call backend endpoints:
```typescript
export async function getAvailability(): Promise<{
  success: boolean;
  data?: BookingAvailability[];
  error?: string;
}>

export async function getBookings(): Promise<{
  success: boolean;
  data?: Bookings[];
  error?: string;
}>

export async function createBookingAvailability(availability: BookingAvailability)
export async function updateBookingAvailability(id: string, updates: Partial<BookingAvailability>)
export async function deleteBookingAvailability(id: string)
```

### 3. Admin Panel Integration
File: `/src/components/BookingManagerPro.tsx`

Uses the frontend API layer to load and manage availability:
```typescript
const loadData = async () => {
  const [availResult, bookingResult] = await Promise.all([
    getAvailability(),
    getBookings()
  ]);
  // Handle results...
};
```

## Required CMS Permission Changes

**IMPORTANT:** These changes must be made in the Wix Dashboard at:
https://manage.wix.com/dashboard/3e83fde1-087e-4b66-b0cf-76bdb8b35929/database

### Collection: `bookingavailability`

#### Current Permissions (BROKEN):
```
Insert: ADMIN
Update: ADMIN
Remove: ADMIN
Read: SITE_MEMBER
```

#### Required Permissions (FIXED):
```
Insert: ADMIN
Update: ADMIN
Remove: ADMIN
Read: ANYONE (or SITE_MEMBER if customers don't need to see availability)
```

**Rationale:**
- **Admin operations** (Insert, Update, Delete): ADMIN only - prevents unauthorized modifications
- **Read**: ANYONE - allows both admin and customers to view available booking slots
  - Admin needs this for the booking panel
  - Customers need this to see available times when booking

### Step-by-Step in Wix Dashboard:

1. Go to **Database** → **Collections**
2. Find **bookingavailability** collection
3. Click on the collection to open settings
4. Go to **Permissions** tab
5. Update each permission:
   - **Read**: Change from `SITE_MEMBER` to `ANYONE`
   - **Insert**: Keep as `ADMIN`
   - **Update**: Keep as `ADMIN`
   - **Delete**: Keep as `ADMIN`
6. Click **Save**

## How It Works

### Data Flow for Admin Panel:

1. **Admin opens booking panel** → `BookingManagerPro.tsx` loads
2. **Component calls** `getAvailability()` and `getBookings()`
3. **Frontend API** sends HTTP requests to backend endpoints
4. **Backend endpoints** use `BaseCrudService.getAll()` with elevated permissions
5. **BaseCrudService** bypasses frontend permission checks (server-side execution)
6. **Data returned** to frontend and displayed in admin panel

### Permission Layers:

```
Frontend Permission Check (WDE0027 Error)
        ↓
Backend API Endpoint (Bypasses frontend check)
        ↓
BaseCrudService (Elevated permissions on server)
        ↓
CMS Collection (Needs ANYONE read permission)
        ↓
Data returned to admin panel
```

## Error Handling

All backend endpoints include comprehensive error handling:

```typescript
// Success response
{
  success: true,
  data: [...],
  totalCount: 0,
  hasNext: false
}

// Error response
{
  success: false,
  error: "Error message describing what went wrong"
}
```

Frontend API layer logs all errors to console for debugging.

## Testing the Fix

### Before CMS Permission Update:
- Admin panel shows WDE0027 error
- Availability slots don't load
- Booking count shows 0

### After CMS Permission Update:
1. Open admin booking panel
2. Verify "Total Slots" loads successfully
3. Verify "Available Count" displays correctly
4. Verify existing availability slots appear in the list
5. Verify no WDE0027 errors in console
6. Test creating new availability slot
7. Test updating existing slot
8. Test deleting slot

## Backend Endpoint Details

### GET /api/booking-availability/get-all
```
Request: GET /api/booking-availability/get-all
Response: {
  success: true,
  data: BookingAvailability[],
  totalCount: number,
  hasNext: boolean
}
```

### GET /api/booking-availability/get-bookings
```
Request: GET /api/booking-availability/get-bookings
Response: {
  success: true,
  data: Bookings[],
  totalCount: number,
  hasNext: boolean
}
```

### POST /api/booking-availability/create
```
Request: POST /api/booking-availability/create
Body: BookingAvailability
Response: {
  success: true,
  data: BookingAvailability
}
```

### PUT /api/booking-availability/update
```
Request: PUT /api/booking-availability/update
Body: { id: string, ...updates }
Response: {
  success: true,
  data: BookingAvailability
}
```

### DELETE /api/booking-availability/delete
```
Request: DELETE /api/booking-availability/delete
Body: { id: string }
Response: {
  success: true
}
```

## Files Modified

1. `/src/api/booking-availability/create.ts` - Fixed response format
2. `/src/api/booking-availability/update.ts` - Fixed response format
3. `/src/api/booking-availability/delete.ts` - Fixed response format

## Files Already in Place

1. `/src/api/booking-availability.ts` - Frontend API wrapper
2. `/src/api/booking-availability/get-all.ts` - Backend endpoint
3. `/src/api/booking-availability/get-bookings.ts` - Backend endpoint
4. `/src/components/BookingManagerPro.tsx` - Admin panel using API

## Security Notes

- Backend endpoints use `BaseCrudService` which has built-in security
- All operations are server-side, preventing direct CMS access from frontend
- Admin operations (create, update, delete) are restricted to ADMIN role
- Read operations allow ANYONE to view availability (necessary for booking flow)
- No sensitive data is exposed through the API

## Troubleshooting

### Still seeing WDE0027 error?
1. Verify CMS permissions were updated to `ANYONE` for Read
2. Clear browser cache and reload
3. Check browser console for detailed error messages
4. Verify backend endpoints are responding (check Network tab in DevTools)

### Availability slots not loading?
1. Check if any availability slots exist in the CMS
2. Verify backend endpoint `/api/booking-availability/get-all` returns data
3. Check browser console for API errors
4. Verify `BaseCrudService` is properly imported in backend endpoints

### Can't create/update/delete slots?
1. Verify CMS permissions for Insert/Update/Delete are set to ADMIN
2. Check if user is logged in as admin
3. Verify backend endpoints are responding with success
4. Check browser console for detailed error messages

## Next Steps

1. **Update CMS Permissions** in Wix Dashboard (CRITICAL)
2. **Test Admin Panel** - Load availability, create/update/delete slots
3. **Verify No Errors** - Check browser console for WDE0027 or other errors
4. **Test Customer Booking** - Verify customers can see available slots

## References

- CMS Collection: `bookingavailability`
- Admin Component: `BookingManagerPro.tsx`
- Frontend API: `/src/api/booking-availability.ts`
- Backend Endpoints: `/src/api/booking-availability/`
- Entity Type: `BookingAvailability` from `/src/entities/index.ts`
