-- =============================================
-- SEED KNOWLEDGE BASE for Atlas AI RAG Sub-Agents
-- Run AFTER vector_setup.sql + generate embeddings via /api/admin/seed-knowledge
-- =============================================

-- 1. Web & SaaS Development Knowledge (Agent 1)
INSERT INTO knowledge_base (category, title, content) VALUES
('web_dev', 'E-shop Pricing & Packages', 'Τα custom E-shops ξεκινούν από €1400. Περιλαμβάνουν: πλήρη σχεδίαση UI/UX, WooCommerce/Next.js architecture, διασύνδεση με τράπεζες, γρήγορη φόρτωση (Core Web Vitals), SEO optimization, και εκπαίδευση διαχείρισης. Custom e-commerce λύσεις για υψηλό conversion rate.'),
('web_dev', 'SaaS & Custom Web Development', 'Αναλαμβάνουμε την κατασκευή B2B SaaS πλατφορμών, εταιρικών ιστοσελίδων και custom web εφαρμογών. Stack: Next.js, React, TypeScript, PostgreSQL, Supabase, Stripe payments, Docker, AWS, Azure. Αρχιτεκτονική για κλιμάκωση από 100 έως 100K+ χρήστες.'),
('web_dev', 'Website Management & Security', 'Υπηρεσίες διαχείρισης ιστοσελίδων: τακτικές αναβαθμίσεις, SSL, backup, monitoring, ασφάλεια (WAF, DDoS protection), performance optimization. Τεχνική υποστήριξη χωρίς tickets — άμεση επαφή.'),
('web_dev', 'AI Agents & Neural Systems', 'Κατασκευή custom AI agents με αρχιτεκτονική Agentic RAG: multi-agent routing, vector databases, tool calling, voice integration. Παραδείγματα: Atlas AI, customer service bots, data processing agents, autonomous workflow systems.'),
('web_dev', 'UI/UX Design & Conversion Optimization', 'Custom σχεδίαση που βασίζεται στα data. A/B testing, heatmap analysis, conversion funnel optimization, responsive design, accessibility (WCAG). Every pixel built to sell.');

-- 2. Energy Services Knowledge (Agent 2 - Hlektrismos.gr)
INSERT INTO knowledge_base (category, title, content) VALUES
('energy', 'Προγράμματα Ρεύματος & Αερίου', 'Δωρεάν σύγκριση και μετάβαση στα φθηνότερα προγράμματα ρεύματος και φυσικού αερίου. Εξοικονόμηση έως 40% στους λογαριασμούς ενέργειας. Προγράμματα fixed & variable rate, green energy options, business tariffs.'),
('energy', 'Φωτοβολταϊκά & Αποθήκευση', 'Μελέτη, άδειες και εγκατάσταση φωτοβολταϊκών συστημάτων. Net Metering & Net Billing. Μπαταρίες αποθήκευσης ενέργειας (battery storage). ROI analysis 5-7 ετών. Επιδοτήσεις και χρηματοδοτήσεις.'),
('energy', 'Ηλεκτροκίνηση & EV Charging', 'Πλήρεις υποδομές φόρτισης ηλεκτρικών οχημάτων (EV Chargers). Home chargers (7-22kW), commercial DC fast chargers (50-150kW), hospitality chargers. Διαχείριση charging networks, RFID/payment systems.'),
('energy', 'Εξοικονόμηση Ενέργειας & Audit', 'Ενεργειακό audit κτιρίων. LED αντικαταστάσεις, θερμομόνωση, smart HVAC systems, building automation. Μείωση κατανάλωσης έως 60%. Energy class upgrades (A+ rated buildings).'),
('energy', 'Ηλεκτρική Ενέργεια - Τιμές 2026', 'Οι τιμές ρεύματος κυμαίνονται μεταξύ €0.08/kWh και €0.18/kWh ανάλογα με το πρόγραμμα. Σταθερός τιμολόγηση (fixed rate) προσφέρει σταθερότητα. Μεταβλητός τιμολόγησης (variable) ακολουθεί την αγορά. Πρόγραμμα off-peak μειώνει κόστος 25%.');

-- 3. Insurance Services Knowledge (Agent 3)
INSERT INTO knowledge_base (category, title, content) VALUES
('insurance', 'Ασφάλεια Υγείας & Νοσοκομειακά', 'Ολοκληρωμένα προγράμματα πρωτοβάθμιας και δευτεροβάθμιας περίθαλψης. Ελεύθερη επιλογή νοσοκομείου. Εξετάσεις, χειρουργεία, νοσηλεία, κρεβατοκλίνη, εξοπλισμός. Πρόγραμμα 500€ - 3000€/χρόνο ανάλογα με την κάλυψη.'),
('insurance', 'Ασφάλειες Ζωής & Συνταξιοδοτικά', 'Προστασία οικογένειας: εξασφάλιση σπουδών παιδιών, αποζημίωση σε περίπτωση απώλειας εισοδήματος. Αποταμιευτικά & συνταξιοδοτικά πλάνα. Επενδυτικές ασφάλειες ζωής με κερδοφορία.'),
('insurance', 'Ασφάλιση Οχημάτων', 'Πλήρη πακέτα αυτοκινήτων & μηχανών: Βασική (Τρίτο Μέρος), Πυρός/Κλοπής, Μικτή, Πλήρης. Ασφάλεια drivers under 25, fleet insurance, commercial vehicles. Online υπολογισμός premium σε 2 λεπτά.'),
('insurance', 'Ασφάλιση Ακινήτων & Επιχειρήσεων', 'Ασφάλιση κατοικιών (πυρός, σεισμός, πλημμύρα, κλοπή), εμπορικών κτιρίων, βιομηχανικών χώρων. Business interruption insurance. Προστασία εξοπλισμού & αποθηκευόμενου εμπορεύματος.'),
('insurance', 'Τιμές Ασφαλίσεων 2026', 'Ασφάλεια υγείας: από €50/μήνα (βασική) έως €250/μήνα (premium). Ασφάλεια αυτοκινήτου: από €300/χρόνο (βασική) έως €800/χρόνο (πλήρης). Ασφάλεια ζωής: από €20/μήνα. Προσφορές για νέους πελάτες έως 20% έκπτωση.');
