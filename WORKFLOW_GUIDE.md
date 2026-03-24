# GKIN Church Service Workflow Guide

A plain-language walkthrough of how the church service coordination platform works — from login to service day.

---

## Who Uses This System?

There are seven roles in the system. Each person logs in using a shared passcode for their role — no personal accounts needed.

| Role | What They Do |
|---|---|
| **Liturgy** | Creates all the service documents |
| **Pastor** | Reviews and edits documents, notifies teams |
| **Translation** | Translates lyrics and the sermon |
| **Beamer** | Makes the presentation slides |
| **Music** | Uploads music files |
| **Treasurer** | Uploads the donation QR code |
| **Admin** | Manages the whole system |

---

## How Login Works

1. A user opens the app and picks their role from a list.
2. They type in the passcode for that role.
3. The system gives them access based on that role — they can only see and do what their role allows.
4. Their session is remembered until they log out.

---

## The Big Picture: What Is the Workflow?

Every Sunday service has its own **workflow board** — a checklist of tasks that need to be done before the service happens. Each task belongs to a specific role, and the whole team can see the progress in real time.

The board is organized into three sections:

- **Liturgy Tasks** — handled by the Liturgy Maker
- **Translation Tasks** — handled by the Translation Team
- **Beamer Tasks** — handled by the Beamer Team

---

## Step-by-Step: How a Service Gets Prepared

### 1. Liturgy Maker Starts the Process

The Liturgy Maker is the one who kicks everything off. They work through three documents in order:

**A. Concept Document**
- The Liturgy Maker creates the first draft of the service plan — the "concept."
- They paste a link to the document (e.g., a Google Drive link) into the system.
- Once it's saved, they can send it directly to the **Pastor** and the **Music team** via email from within the app.
- The task shows as ✅ Completed when done.

**B. Sermon Document**
- The Liturgy Maker uploads the sermon document link.
- This becomes available for the Pastor to review and for the Translation team to translate.
- Same as the concept — it can be emailed to the Pastor and Music team directly from the app.

**C. QR Code** *(done by the Treasurer)*
- The Treasurer uploads a link to the donation QR code image.
- Only the Treasurer role can complete this task.
- Once uploaded, it's marked complete.

**D. Final Document**
- After all edits and reviews are done, the Liturgy Maker creates the final version of the service booklet.
- They paste the final document link, and can again send it to Pastor and Music via email.

---

### 2. The Pastor Reviews

Once the concept or final document has been sent, the Pastor:
- Can open and read the document directly from their task card.
- Can **edit** the document link if a corrected version needs to be pointed to.
- Can click **"Notify Teams"** — this sends an email to all relevant teams letting them know the document is ready or updated.

---

### 3. Translation Team Translates

The Translation team has two tasks:

**A. Translate Lyrics**
- They go to the dedicated Lyrics Translation page.
- Songs for the service are listed there.
- They type in the translations and save them.
- Once all lyrics have translations, the task automatically marks itself as ✅ Completed.

**B. Translate Sermon**
- They open the sermon document from within the app.
- They add their translation directly.
- When finished, they mark it as complete.

---

### 4. Beamer Team Prepares Slides & Music

The Beamer team has two tasks:

**A. Create Slides**
- They upload a link to the finished presentation slides.
- Once saved, it shows as ✅ Completed, and the link is viewable by the team.

**B. Upload Music**
- They upload links to the music files for the service (can be multiple songs).
- They can add notes (e.g., "starts at verse 2").
- Once uploaded, the music team and others can view the list of songs.

---

## Real-Time Updates

The board **updates live** — if another team member completes a task, everyone else sees it change immediately without refreshing the page. If the live connection drops, the app checks for updates every 30 seconds automatically.

---

## Email Notifications

Emails can be sent directly from the workflow board — no need to open a separate email client. The system uses the configured SMTP settings to send:

- The concept document link → to Pastor and/or Music team
- The sermon document link → to Pastor and/or Music team
- The final document link → to Pastor and/or Music team
- A "teams notify" email → sent by the Pastor when something is ready

The app remembers who sent what and when, so each task card shows a small indicator if an email has already been sent for that document.

---

## Task Statuses at a Glance

| Status | Meaning |
|---|---|
| ⬜ Pending | Not started yet |
| 🔵 In Progress | Someone has started working on it |
| ✅ Completed | Done — link saved, task finished |
| ⏭ Skipped | Not needed for this service |

---

## Activity Log

Everything that happens — completing a task, uploading a document, sending an email — is recorded in an **activity log**. Admins and users can see a timeline of who did what and when.

---

## Admin Capabilities

The Admin role has access to extra tools that other roles don't:

- **Manage Passcodes** — change the passcode for any role
- **Manage Assignable People** — add/remove names that can be assigned to services
- **Email Settings** — configure the SMTP server used to send all notification emails
- **View Logs** — see all activity across the system
- **System Status** — see server health and usage stats

---

## Summary: The Typical Week

```
Monday–Wednesday
  └─ Liturgy Maker creates the Concept Document and shares it

Wednesday–Thursday
  └─ Pastor reviews and edits
  └─ Liturgy Maker uploads the Sermon Document
  └─ Translation team translates lyrics and sermon

Thursday–Friday
  └─ Beamer team builds slides
  └─ Music team uploads music files
  └─ Treasurer uploads the QR code

Friday–Saturday
  └─ Liturgy Maker finalizes the Final Document
  └─ Pastor sends "Notify Teams" to confirm everything is ready

Sunday
  └─ Service happens 🎉
```

---

*This guide reflects the current state of the GKIN RWDH Dienst Dashboard.*
