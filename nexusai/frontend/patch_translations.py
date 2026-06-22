import json
import re

file_path = r'c:\Users\Prince\Downloads\NexusAi\nexusai\frontend\src\locales\translations.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

en_landing = """
    // Landing Page
    "landing.nav.howItWorks": "How it works",
    "landing.nav.features": "Features",
    "landing.nav.pricing": "Pricing",
    "landing.nav.experts": "Experts",
    "landing.nav.login": "Log in",
    "landing.nav.getStarted": "Get Started →",
    "landing.hero.badge": "NexusAI v2 is now live",
    "landing.hero.title1": "Behind every answer:",
    "landing.hero.title2": "your documents",
    "landing.hero.subtitle": "Upload any document. Ask anything in plain\\nEnglish. Get answers backed by numbered citations\\nfrom the exact source passages.",
    "landing.hero.startFree": "Start Free",
    "landing.hero.login": "Log in",
    "landing.hero.noSetup": "No setup. No API key. Works in 60 seconds.",
    "landing.hero.stat1.value": "28%",
    "landing.hero.stat1.label": "reduction in agentic time",
    "landing.hero.stat2.value": "5",
    "landing.hero.stat2.label": "expert AI agents",
    "landing.hero.stat3.value": "< 3s",
    "landing.hero.stat3.label": "average response time",
"""

es_landing = """
    // Landing Page
    "landing.nav.howItWorks": "Cómo funciona",
    "landing.nav.features": "Características",
    "landing.nav.pricing": "Precios",
    "landing.nav.experts": "Expertos",
    "landing.nav.login": "Iniciar sesión",
    "landing.nav.getStarted": "Empezar →",
    "landing.hero.badge": "NexusAI v2 ya está disponible",
    "landing.hero.title1": "Detrás de cada respuesta:",
    "landing.hero.title2": "tus documentos",
    "landing.hero.subtitle": "Sube cualquier documento. Pregunta en\\nlenguaje natural. Obtén respuestas respaldadas por citas\\nnumeradas de los pasajes de origen exactos.",
    "landing.hero.startFree": "Comenzar Gratis",
    "landing.hero.login": "Iniciar sesión",
    "landing.hero.noSetup": "Sin configuración. Sin claves API. Funciona en 60 segundos.",
    "landing.hero.stat1.value": "28%",
    "landing.hero.stat1.label": "reducción en tiempo",
    "landing.hero.stat2.value": "5",
    "landing.hero.stat2.label": "agentes expertos de IA",
    "landing.hero.stat3.value": "< 3s",
    "landing.hero.stat3.label": "tiempo promedio de respuesta",
"""

fr_landing = """
    // Landing Page
    "landing.nav.howItWorks": "Comment ça marche",
    "landing.nav.features": "Fonctionnalités",
    "landing.nav.pricing": "Tarifs",
    "landing.nav.experts": "Experts",
    "landing.nav.login": "Connexion",
    "landing.nav.getStarted": "Démarrer →",
    "landing.hero.badge": "NexusAI v2 est en ligne",
    "landing.hero.title1": "Derrière chaque réponse :",
    "landing.hero.title2": "vos documents",
    "landing.hero.subtitle": "Importez tout document. Posez des questions\\nen langage naturel. Obtenez des réponses avec des citations\\nnumérotées des passages sources exacts.",
    "landing.hero.startFree": "Commencer",
    "landing.hero.login": "Connexion",
    "landing.hero.noSetup": "Aucune configuration. Prêt en 60 secondes.",
    "landing.hero.stat1.value": "28%",
    "landing.hero.stat1.label": "réduction du temps",
    "landing.hero.stat2.value": "5",
    "landing.hero.stat2.label": "agents IA experts",
    "landing.hero.stat3.value": "< 3s",
    "landing.hero.stat3.label": "temps de réponse moyen",
"""

de_landing = """
    // Landing Page
    "landing.nav.howItWorks": "Wie es funktioniert",
    "landing.nav.features": "Funktionen",
    "landing.nav.pricing": "Preise",
    "landing.nav.experts": "Experten",
    "landing.nav.login": "Anmelden",
    "landing.nav.getStarted": "Loslegen →",
    "landing.hero.badge": "NexusAI v2 ist jetzt live",
    "landing.hero.title1": "Hinter jeder Antwort:",
    "landing.hero.title2": "Ihre Dokumente",
    "landing.hero.subtitle": "Laden Sie jedes Dokument hoch. Fragen Sie alles\\nin natürlicher Sprache. Erhalten Sie Antworten mit\\nnummerierten Zitaten aus den genauen Quellpassagen.",
    "landing.hero.startFree": "Kostenlos Starten",
    "landing.hero.login": "Anmelden",
    "landing.hero.noSetup": "Kein Setup. Läuft in 60 Sekunden.",
    "landing.hero.stat1.value": "28%",
    "landing.hero.stat1.label": "Reduzierung der Zeit",
    "landing.hero.stat2.value": "5",
    "landing.hero.stat2.label": "Experten-KI-Agenten",
    "landing.hero.stat3.value": "< 3s",
    "landing.hero.stat3.label": "durchschnittliche Antwortzeit",
"""

content = content.replace('en: {', 'en: {' + en_landing)
content = content.replace('es: {', 'es: {' + es_landing)
content = content.replace('fr: {', 'fr: {' + fr_landing)
content = content.replace('de: {', 'de: {' + de_landing)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patched successfully!')
