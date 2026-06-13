# Raj Dental & Implant Hospital - Assets System

This directory acts as the central asset repository for the entire **Raj Dental & Implant Hospital** software ecosystem (Public Patient Website & Staff/Doctor Practice Management System).

## 📁 General Folder Layout

The assets directory is structured logically by domain:
1. `/branding`: Logos, favicons, brand guideline documentation.
2. `/doctors`: Portraits, credentials, and achievements of the medical team (scalable for multi-doctor support).
3. `/clinic`: Architectural interior and exterior photos of the facility.
4. `/services`: Informative graphics and icons for all dental treatments.
5. `/patients`: Before/After comparison files and patient profiles.
6. `/gallery`: Public events, camps, and clinic activities portfolio.
7. `/certificates`: Clinic accreditations and awards.
8. `/testimonials`: Written, image, and video testimonial submissions.
9. `/website`: Structural components (hero banners, backgrounds, structural icons, and SEO metadata cards).
10. `/pms`: User Interface assets, empty-state banners, and avatar placeholders for the portal.
11. `/uploads`: Storage bucket for dynamic medical files (X-Rays, invoices, prescriptions, consent forms).

---

## 🏷️ Global Naming Conventions
All asset filenames MUST follow these strict principles:
* **Lowercase only:** No camelCase or capital letters.
* **Hyphen-separated:** Use `-` instead of spaces or underscores.
* **Serial indicators:** Use two-digit trailing numbers (e.g. `-01`, `-02`) for lists of related images.
* **Consistent extensions:** Always prefer `.webp` for compressed web photos and `.svg` for graphic vectors.

### Core Examples:
* **Doctor Profile:** `doctor-profile-01.webp`
* **Clinic Exterior:** `clinic-exterior-01.webp`
* **Before/After Cases:** `implants-before-01.webp` and `implants-after-01.webp`
* **Service Banner:** `service-implant-banner.webp`

---

## 🛠️ Performance & Formats Guide

### 📸 Images (Photographs)
* **Format:** `.webp` (Preferred for fast loading and modern browsers) or `.jpg`/`.jpeg` (Secondary fallback).
* **Compression:** Run photos through a compressor (e.g. TinyPNG or Sharp) before placing.
* **Aspect Ratios:**
  * **Hero/Full Screen:** 16:9 (e.g., 1920x1080px)
  * **General Cards/Content:** 3:2 (e.g., 1200x800px)
  * **Profiles/Avatars:** 1:1 (e.g., 600x600px)

### 📐 Vectors (Graphics & Icons)
* **Format:** `.svg`
* **Optimization:** Clean up excess XML layers and metadata before uploading.

### 🎥 Videos
* **Format:** `.mp4` (Codec: H.264 / AAC)
* **Constraint:** Video assets must be compressed below **20MB** for smooth mobile playback.

### 📄 Documents
* **Format:** `.pdf`
