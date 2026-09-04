# Portfolio 30-Slot Gallery Implementation

## Overview
Implemented a deterministic 30-slot gallery management system for the portfolio/work section. The system ensures consistent ordering, self-healing initialization, and direct CMS integration.

## Key Features

### 1. **30-Slot Deterministic Gallery**
- Fixed 30 image slots (Slot 1-30)
- Each slot maps to a CMS item with `displayOrder` field
- Order persists across page refreshes
- Slots are numbered 1-30 and displayed in grid order

### 2. **Self-Healing Initialization**
When the Admin Panel "Work" tab opens:
1. Queries `portfolioimages` collection for all items
2. Maps existing items by `displayOrder` (1-30)
3. For any missing slots (1-30), automatically creates new CMS records
4. Each new record gets a valid `_id` (UUID) and `displayOrder`
5. All 30 slots are guaranteed to exist after initialization

### 3. **Upload Flow**
- Click any slot (empty or populated) to upload
- `ImageUploadManager` handles file upload via `buildWixMediaUrl()`
- Uploaded image URL is saved to the CMS item's `image` field
- Local state updates immediately for responsive UX
- Delete button removes image from slot (clears `image` field)

### 4. **CMS Integration**
- Uses `BaseCrudService` for all CRUD operations
- Collection: `portfolioimages`
- Fields used:
  - `_id`: Unique item identifier (UUID)
  - `displayOrder`: Slot number (1-30)
  - `image`: Image URL (wix:image:// format)
  - `caption`: Optional caption
  - `altText`: Optional alt text

### 5. **Portfolio Page Ordering**
- Fetches all portfolio images from CMS
- Sorts by `displayOrder` ascending
- Displays in Slot 1-30 order
- Maintains order across page refreshes

## Implementation Details

### AdminPanel.tsx Changes

**New State Variables:**
```typescript
const [gallerySlots, setGallerySlots] = useState<GallerySlot[]>([]);
const [isInitializingGallery, setIsInitializingGallery] = useState(false);
const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
```

**New Interface:**
```typescript
interface GallerySlot {
  slotNumber: number; // 1-30
  itemId: string; // CMS item _id
  image?: string; // Image URL
  caption?: string;
  altText?: string;
}
```

**Gallery Initialization Function:**
```typescript
const initializeGallery = useCallback(async () => {
  // 1. Fetch all existing portfolio items
  // 2. Map by displayOrder
  // 3. Create missing slots (1-30)
  // 4. Update state with all 30 slots
}, []);
```

**Work Tab UI:**
- 5-column grid layout (responsive)
- Each slot shows:
  - Empty state: Upload icon + "Slot N"
  - Populated: Image thumbnail with "Replace" hover text
  - Delete button (red X, top-right corner)
- Click slot to open `ImageUploadManager`
- Upload updates CMS and local state

### PortfolioPage.tsx Changes

**Sorting Logic:**
```typescript
// Sort by displayOrder to maintain 30-slot gallery order (Slot 1-30)
const sortedImages = validImages.sort((a, b) => {
  const orderA = a.displayOrder || 999;
  const orderB = b.displayOrder || 999;
  return orderA - orderB;
});
```

- Images with `displayOrder` 1-30 appear first in order
- Images without `displayOrder` appear last (fallback to 999)
- Ensures consistent gallery layout

## Data Flow

### Upload Flow
```
User clicks slot
  ↓
setUploadingSlot(slotNumber)
  ↓
ImageUploadManager opens
  ↓
User selects file
  ↓
buildWixMediaUrl() generates wix:image:// URL
  ↓
BaseCrudService.update() saves to CMS
  ↓
Local state updates
  ↓
UI re-renders with new image
```

### Initialization Flow
```
Work tab opens
  ↓
initializeGallery() called
  ↓
Fetch all portfolioimages items
  ↓
For each slot 1-30:
  - If exists: add to slots array
  - If missing: create new CMS item, add to slots array
  ↓
setGallerySlots() with all 30 slots
  ↓
UI renders 30-slot grid
```

### Display Flow
```
PortfolioPage loads
  ↓
Fetch all portfolioimages items
  ↓
Filter valid images
  ↓
Sort by displayOrder (1-30)
  ↓
Load image dimensions
  ↓
Render in carousel/grid
```

## CMS Schema

**Collection:** `portfolioimages`

**Fields:**
- `_id` (TEXT, system): Unique identifier
- `displayOrder` (NUMBER): Slot position (1-30)
- `image` (IMAGE): Image URL
- `caption` (TEXT): Optional caption
- `altText` (TEXT): Optional alt text
- `_createdDate` (DATETIME, system): Creation timestamp
- `_updatedDate` (DATETIME, system): Update timestamp

## Benefits

1. **Deterministic Ordering**: Gallery order is always 1-30, never random
2. **Self-Healing**: Missing slots are automatically created
3. **Persistent**: Order survives page refreshes and admin panel reopens
4. **Direct CMS Integration**: No intermediate data structures
5. **Responsive UI**: Immediate feedback on uploads/deletes
6. **Scalable**: Fixed 30-slot design prevents unbounded growth

## Testing Checklist

- [ ] Open Admin Panel → Work tab
- [ ] Verify all 30 slots appear in grid
- [ ] Click empty slot → upload image
- [ ] Verify image appears in slot
- [ ] Click populated slot → replace image
- [ ] Verify new image replaces old
- [ ] Click delete button → image removed
- [ ] Refresh page → order persists
- [ ] Check PortfolioPage → images appear in Slot 1-30 order
- [ ] Verify `buildWixMediaUrl()` generates valid wix:image:// URLs

## Notes

- Gallery initialization happens only when Work tab is opened
- Each slot gets a unique `_id` (UUID) for CMS tracking
- Images are stored as wix:image:// URLs (not static URLs)
- The `displayOrder` field is critical for maintaining order
- Empty slots have no `image` value (undefined/null)
- Deletion clears the `image` field but keeps the CMS item

## Future Enhancements

- Drag-and-drop reordering between slots
- Bulk upload multiple images
- Caption/alt text editing in admin panel
- Image preview with dimensions
- Slot status indicators (empty/filled)
