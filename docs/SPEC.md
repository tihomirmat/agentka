# Mansa AI — build spec v3 (5 Oct 2026)

> Name decision 9 Oct 2026: the product is called **Agentka** (domain agentka.si). "Mansa AI" below is the old working name.

Replaces v2. Same product, screens, data model and stages. The only change: Mansa AI is built as its own code base and does NOT run on Base44.

## 0. Stack and hosting (new in v3)

- Code lives in one Git repository. `/app` is the web front end, `/server` (from stage 2) is the API, `/docs` holds this spec and the reference screenshot.
- Front end: React 18 + TypeScript + Vite + Tailwind CSS, react-router. Interface language Slovenian.
- Back end (from stage 2): Node + PostgreSQL. Own sign-up and login. Every customer record carries account_id and every API query is scoped to the caller's account on the server.
- Hosting: Tihomir's own server (Coolify), one Docker container for the app plus a PostgreSQL database, in the EU.
- Outside services stay as in v2: ElevenLabs (voice, one platform account), Stripe (subscriptions), Resend (email from Mansa AI's own domain), Google OAuth (customers' calendars).
- Stage 1 has no back end: screens read and write through `src/data/api.ts`, which is backed by sample data in the browser. From stage 2 the same functions call the real API, so screens do not change.
- Wherever v2 below says "Base44 builder", "backend function", "row-level security" or "service role", read: our own API endpoint with server-side account scoping.

---


v2 text follows unchanged. It describes a subscription product: any business can sign up, set up its own AI voice agent for its website, connect its own calendar, set its own notification email, and pay monthly. Tihomir is the maker and platform owner, not a user of the agent.

Written for the Base44 builder. Each stage is sent as one separate, complete instruction. Nothing from a later stage is built early.

## 1. What Mansa AI is

A self-service product for small businesses that want an AI voice agent on their website. The business signs up, enters its website address, and Mansa AI reads the website's text into the agent's knowledge. The business pastes one line of code into its site. Visitors click the widget and talk or type; the agent answers from the website text, offers free appointment slots, books the appointment, and after the conversation both the visitor and the business get an email with what was said and agreed.

The voice (speech recognition, speech, widget, knowledge search) is ElevenLabs Agents, running in ONE ElevenLabs account owned by the platform. Customers never see ElevenLabs and need no ElevenLabs account. Mansa AI adds: sign-up, the setup wizard, website import, calendar, emails, lead list, usage metering, subscription.

## 2. Roles

- Customer (a business): signs up with email + password or Google login. Belongs to exactly one Account. Sees and changes only that Account's data.
- Platform admin (Tihomir): sees all Accounts, their plan, minutes used, cost, errors. Can pause an Account. Does not appear in customers' data.
- Website visitor: never sees Mansa AI, only the widget on the customer's website.
- ElevenLabs: calls Mansa AI's backend functions (two tools during a call, one webhook after it).

## 3. Customer journey

1. Public landing page: what it does, a live demo agent the visitor can talk to, prices, "Začni brezplačno".
2. Sign-up creates an Account on a trial (limited days and limited minutes).
3. Setup wizard, five steps, each can be skipped and finished later:
   1. Spletna stran — enter URL; Mansa AI imports the pages and shows the list; customer switches off pages that should not be used.
   2. Agent — business name, agent name, greeting, voice, language (Slovenian default).
   3. Termini — choose "Povpraševanje" (agent notes the wished time, business confirms by email; works with no calendar) or "Samodejna rezervacija" (connect Google Calendar, set working hours and appointment length).
   4. Obvestila — the email address that receives notifications; switch for the visitor confirmation email.
   5. Preizkus in namestitev — talk to the agent in the test widget, then copy the embed code.
4. After the trial the customer picks a plan and pays by card. Each plan includes a number of conversation minutes per month.
5. Daily use: Pogovori, Kontakti, Rezervacije.

## 4. Visitor flow on the customer's website

1. Visitor clicks the widget. First sentence states it is an AI assistant of that business.
2. Agent answers only from the knowledge base. If the answer is not there, it says so and offers a callback.
3. If the visitor wants a meeting:
   - Povpraševanje mode: agent asks for the preferred day and time and says the business will confirm.
   - Samodejna rezervacija mode: agent calls "check availability", reads out up to three free slots, visitor picks one.
4. Agent asks for the name, then asks the visitor to TYPE email and phone into the widget's text field, and reads them back once.
5. In automatic mode the agent calls "book appointment" and says the appointment is booked only after the function returns success.
6. Conversation ends. ElevenLabs sends the transcript to Mansa AI. Mansa AI saves it, creates the contact, counts the minutes, sends the emails.

## 5. Screens

Reference: Chatbase agent builder (file referenca-chatbase-zaslon-agenta.png): settings in a left column, live widget on the right, "Namesti" top right, left sidebar navigation. Light theme, neutral greys, one accent colour, no gradients, no decorative illustrations. Interface language: Slovenian.

Public:
- Landing page (described in 3.1), Prijava, Registracija, Cenik.

Customer app — sidebar in this order:
1. Pregled — left: cards "Viri znanja" (synced pages, last sync, Sinhroniziraj), "Termini" (mode, calendar status), "Obvestila" (address, on/off), "Navodila agentu" (editable, Save). Right: live test widget. Top: four numbers for the current period: pogovori, kontakti, rezervacije, porabljene minute / vključene minute (with a bar).
2. Viri znanja — tabs Spletna stran (URL, "Uvozi stran", table of pages with naslov, URL, znaki, stanje, zadnja sinhronizacija, include switch per row, auto-sync every N days), Datoteke (PDF/DOCX/TXT), Besedilo (titled entries, used for price list and facts not on the website).
3. Termini — mode switch; Google Calendar connect/disconnect with the connected address shown; calendar picker; working hours per weekday; appointment length; buffer; minimum notice; days ahead.
4. Obvestila — notification address (with "Pošlji testno sporočilo"), visitor email on/off + editable template, business email on/off + editable template, sender display name, reply-to address.
5. Pogovori — table (datum, trajanje, izid: vprašanje / kontakt / rezervacija, ime, povzetek); detail with summary, collected data, transcript as chat bubbles, email delivery status.
6. Kontakti — table (ime, e-pošta, telefon, kaj so želeli, stanje), inline status change, CSV export.
7. Rezervacije — upcoming first, link to conversation and calendar event.
8. Namestitev — embed code in a copy box, allowed domain, widget colour, text input on/off, position, three-step checklist ending with "Zadnji pogovor s te domene: …".
9. Naročnina — current plan, minutes used this period, renewal date, change plan, manage payment (Stripe portal), invoices.
10. Nastavitve — business name, website, language, timezone, team members, delete account.

Platform admin area (only role admin): table of Accounts (ime, paket, stanje naročnine, minute ta mesec, ocenjen strošek, zadnji pogovor, napake), Account detail, pause/resume, plan definitions.

Every list has a one-sentence empty state saying what to do next. Every action that calls ElevenLabs, Google or Stripe shows its real result or the real error text.

## 6. Data model

Every customer record carries account_id. Row-level security on every customer entity: read, update, delete only where data.account_id equals user.data.account_id; platform admin role may read all. The single Setting entity from the first attempt is removed.

- Account: name, website_url, status (trial/active/past_due/paused_limit/cancelled), plan_key, trial_ends_at, period_start, period_end, minutes_included, minutes_used, stripe_customer_id, stripe_subscription_id, language, timezone.
- User (extra fields): account_id, account_role (owner/member).
- Agent: account_id, name, business_name, elevenlabs_agent_id, voice_id, first_message, instructions, status (draft/active/paused/error), allowed_domain, widget_accent_color, widget_text_input, kb_folder_id, crawl_job_id, auto_sync_days, last_sync_at, webhook_token.
- BookingSettings: account_id, agent_id, mode (request/auto), calendar_id, working_hours (mon..sun each {open, from, to}), appointment_length_min, buffer_min, min_notice_hours, max_days_ahead.
- CalendarConnection: account_id, provider (google), connected_email, refresh_token_encrypted, status, connected_at. No user can read this entity; only backend functions with service role.
- NotificationSettings: account_id, notify_email, sender_name, reply_to, visitor_email_enabled, owner_email_enabled, visitor_template, owner_template.
- KnowledgeSource: account_id, agent_id, type (website_page/file/text), title, url, content, file_url, included, status, elevenlabs_doc_id, chars, last_synced_at, error.
- Conversation: account_id, agent_id, elevenlabs_conversation_id (unique), started_at, duration_sec, transcript, summary, outcome, visitor_name, visitor_email, visitor_phone, topic, agreed, visitor_email_status, owner_email_status.
- Lead: account_id, agent_id, name, email, phone, what_they_wanted, conversation_id, status.
- Booking: account_id, agent_id, lead_id, conversation_id, customer_name, customer_email, customer_phone, start, end, topic, mode (request/auto), status (requested/confirmed/cancelled), calendar_event_id.
- EmailLog: account_id, conversation_id, kind, to, subject, status, error, sent_at.
- Plan (admin only write, public read): key, name, price_month_eur, stripe_price_id, minutes_included, max_pages, max_agents.

## 7. Backend functions

Functions called by ElevenLabs have no logged-in user. Each finds the Agent by header X-Mansa-Token (or, for the post-call webhook, by agent_id after signature check), then works strictly inside that Agent's account_id with service role.

- createAgent — at sign-up/wizard: creates the ElevenLabs agent (POST /v1/convai/agents) with language, voice, first message, rules from section 8, the two tools, data-collection fields, allowed domain; stores elevenlabs_agent_id.
- applyAgentConfig — pushes later changes to the ElevenLabs agent.
- syncWebsite — starts an ElevenLabs crawl job for the website (POST /v1/convai/knowledge-base/crawl, max_pages = plan limit, auto sync), writes KnowledgeSource rows, attaches the folder to the agent, removes excluded pages.
- syncSource — sends one file or text entry to the knowledge base.
- googleAuthStart / googleAuthCallback — OAuth with Mansa AI's own Google Cloud client (scope: calendar events + free/busy, offline access). Callback stores the encrypted refresh token in CalendarConnection for the Account. Base44's built-in per-user connector is NOT used, because it can only be read while that user is logged in, and calls from website visitors arrive when nobody is logged in.
- checkAvailability — auto mode only. Reads free/busy with the Account's refresh token, applies working hours, length, buffer, notice, days ahead. Returns at most three slots with ISO start and a spoken Slovenian form.
- bookAppointment — auto mode: re-checks the slot, creates the calendar event with the visitor as attendee, creates Lead and Booking (confirmed). Request mode: creates Lead and Booking (requested), no calendar call. Returns {ok, spoken text} or {ok:false, reason, alternatives}.
- postCall — one ElevenLabs post-call webhook for the whole platform. Verifies the ElevenLabs-Signature HMAC, ignores already stored conversation ids, finds the Agent by agent_id, saves Conversation, creates/updates Lead, adds duration to Account.minutes_used, sends emails, writes EmailLog. Always answers 200 quickly.
- enforceLimits — at 80 % of included minutes: email to the customer. At 100 %, at trial end, or when payment fails: Agent paused (widget answers with one sentence that the assistant is currently unavailable), Account status updated. Resumes automatically on renewal or upgrade.
- stripeWebhook — subscription created/renewed/changed/cancelled/payment failed → updates Account plan, period, status, resets minutes_used at period start.
- sendTestEmail, exportLeadsCsv.

Emails: sent by the platform through Resend from Mansa AI's own verified domain (for example obvestila@<mansa domain>), display name = the customer's business name, Reply-To = the customer's address. The customer only types the address that should receive notifications. Customers' own SMTP is not part of v1.

Secrets (entered by Tihomir in Base44, never in chat): ELEVENLABS_API_KEY, ELEVENLABS_WEBHOOK_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY, RESEND_API_KEY, Stripe keys.

## 8. Agent rules (written into each ElevenLabs agent)

- Speaks the Account's language (Slovenian default), formal address, one or two short sentences per turn, one question at a time.
- Says it is an AI assistant in the first sentence and confirms it if asked.
- Answers only from the knowledge base. No prices, deadlines or promises that are not in it.
- Never says an appointment is booked before bookAppointment returns ok:true; in request mode says the business will confirm.
- Asks the visitor to type email and phone; reads them back once.
- Dates, times and numbers are spoken as words.
- Maximum conversation length set per plan.

## 9. Stages and acceptance checks

Stage 1 — Screens only, sample data: landing, sign-up, wizard, customer app, Naročnina, admin area. No ElevenLabs/Google/Stripe calls.
Check: every screen opens, forms save and reload, wizard can be skipped and resumed. A separate reviewer compares against the reference screenshot.

Stage 2 — Accounts and isolation: sign-up creates Account, row-level security on every entity.
Check (must be able to fail): customer A, logged in, requests customer B's conversations, contacts and calendar connection by id and by list — gets nothing. Admin sees both.

Stage 3 — ElevenLabs: createAgent, website import, sources, Namestitev.
Check: a new Account importing spletnost.si lists its real pages; a question answered only on one page is answered correctly; after excluding that page it is not; the widget refuses to load on a domain that is not the allowed one.

Stage 4 — Appointments: request mode, Google OAuth, checkAvailability, bookAppointment.
Check: request mode creates a "requested" booking with no calendar. Auto mode: a day with a known event does not offer that hour; a booking appears in the customer's calendar; the same slot a second time is refused; it still works when the customer is logged out; a call without the token gets 401.

Stage 5 — After the call: postCall, emails via Resend, minutes.
Check: one real test conversation appears under the right Account only; both emails arrive and match the transcript; the same webhook twice creates one conversation and counts minutes once; a wrong signature is rejected.

Stage 6 — Subscription: plans, Stripe checkout and portal, trial, limits.
Check with Stripe test mode: paying activates the plan; a failed payment pauses the agent; reaching the minute limit pauses the agent and sends the email; renewal resets minutes and resumes.

Stage 7 — Admin area with real numbers; first real customer Account = spletnost.si with the widget on the site.

## 10. Not verified yet

- Whether Tihomir's ElevenLabs plan allows crawl jobs, commercial use for third parties, and enough simultaneous conversations.
- Google's review of the OAuth app for calendar access: how long it takes and what it asks for. Until it is approved, customers see Google's "unverified app" warning and Google caps the number of users.
- That a Base44 backend function can serve as the Google OAuth callback and keep refresh tokens safely (documented pieces exist: public function URLs, service role, secrets; the combination is untested).
- How Base44 + Stripe handles EU VAT and invoices for Slovenian customers.
- How well the agent handles typed email and phone in Slovenian inside the widget.
- What happens to backend functions, connectors and Stripe if the Base44 Builder subscription ends on 12 Jan 2027 as currently scheduled.
