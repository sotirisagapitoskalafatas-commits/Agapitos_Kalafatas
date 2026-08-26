"use client";

export default function WebServicesSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-3">
            Ψηφιακες Λυσεις Υψηλων Προδιαγραφων
          </h2>
          <h3 className="text-4xl font-extrabold text-slate-900 mb-6">
            Δεν χτίζουμε απλά eshop & sites.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-500">
              Δημιουργούμε κερδοφόρες επιχειρήσεις.
            </span>
          </h3>
          <p className="text-lg text-slate-500">
            Εστιάζουμε στη στρατηγική, το σύγχρονο design και την εμπειρία χρήστη, προσφέροντας custom ψηφιακές εμπειρίες που αυξάνουν τις πωλήσεις σας.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center mb-6 text-2xl"> </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">Κατασκευή E-shop</h4>
            <p className="text-slate-500 text-sm mb-4">
              Σχεδιάζουμε eshop φτιαγμένα για να πουλάνε, με SEO, ταχύτητα και άριστο UX/UI.
            </p>
            <div className="inline-block bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Από €1.400
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-6 text-2xl"> </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">Custom Ιστοσελίδες</h4>
            <p className="text-slate-500 text-sm mb-4">
              Η ψηφιακή σας βιτρίνα. Αξιόπιστες, γρήγορες, φιλικές προς κινητά και σχεδιασμένες για conversions.
            </p>
          </div>

          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-6 text-2xl"> </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">Software Development</h4>
            <p className="text-slate-500 text-sm mb-4">
              Ανάπτυξη web εφαρμογών (SaaS), CRM, portals και λύσεων AI κομμένων στα μέτρα της επιχείρησής σας.
            </p>
          </div>

          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-6 text-2xl"> </div>
            <h4 className="text-xl font-bold text-slate-900 mb-3">Website Management</h4>
            <p className="text-slate-500 text-sm mb-4">
              Τεχνική υποστήριξη, αναβαθμίσεις, hosting και ασφάλεια. Εσείς εστιάστε στην επιχείρησή σας.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-brand-900 rounded-3xl p-10 md:p-14 text-white flex flex-col md:flex-row items-center justify-between">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold mb-4">Γιατί να μας επιλέξετε;</h3>
            <ul className="space-y-3 mb-6 md:mb-0">
              <li className="flex items-center">
                <span className="text-brand-400 mr-3">✔</span> Custom σχεδίαση με μετρήσιμα αποτελέσματα
              </li>
              <li className="flex items-center">
                <span className="text-brand-400 mr-3">✔</span> Ξεχάστε τα απρόσωπα tickets – Άμεση & προσωπική επαφή
              </li>
              <li className="flex items-center">
                <span className="text-brand-400 mr-3">✔</span> Διαφάνεια, συνέπεια & εμπιστοσύνη που διαρκεί στον χρόνο
              </li>
            </ul>
          </div>
          <a href="#contact" className="bg-white text-brand-900 hover:bg-slate-50 font-bold py-4 px-8 rounded-xl transition duration-200 whitespace-nowrap shadow-lg">
            Ζήτα προσφορά τώρα
          </a>
        </div>
      </div>
    </section>
  );
}
