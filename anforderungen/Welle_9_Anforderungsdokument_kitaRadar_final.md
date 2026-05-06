![Ein Bild, das Screenshot, Schwarz, Dunkelheit, Grafiken enthält.](Aspose.Words.0bd7dfe0-6c1c-4c64-83a3-a01b54574643.001.png)WAMOCON GmbH, Mergenthalerallee 79-81, 65760 Eschborn                                              


**Anforderungsdokument**

kitaRadar – Softwareprojekt

|**Welle:**|9|
| :- | :- |
|**Projekt:**|KitaRadar|
|**Unternehmen:**|WAMOCON GmbH|
|**App Version:**|1|
|**Erstellt von:**|Nikolaj Schefner|
|**Eingereicht an:**|Waleri Moretz (Geschäftsführung)|
|**Datum:**|05\.05.2026|
|**Vertraulichkeit:**|Intern vertraulich|
|**Status:**|Zur Freigabe eingereicht|

# **1. Zusammenfassung**
In Deutschland fehlen rund 306.000 Kita-Plätze[^1]. Eltern suchen einen freien Platz heute über Google, telefonieren Dutzende Kitas im Umkreis ab und schreiben jede Bewerbung manuell. Es gibt keine zentrale, anbieterübergreifende Suche und keine Möglichkeit, sich mit einem Klick bei mehreren Einrichtungen zu bewerben.

**KitaRadar** ist die erste App in Deutschland, die freie Kita-Plätze im Umkreis sichtbar macht und die Bewerbung KI-gestützt direkt aus der App heraus per E-Mail an die Einrichtung unterstützt. Die KI hilft Eltern dabei, die passenden Kitas zu finden und ein überzeugendes, individuelles Bewerbungsschreiben zu formulieren.

Version 1 umfasst vier Kernbausteine:

- Kartenbasierte Umkreissuche freier Kita-Plätze.
- KI-Suchassistent zur Eingrenzung passender Einrichtungen (Konzept, Alter, Öffnungszeiten, Träger).
- KI-Bewerbungsgenerator und E-Mail-Versand: 
  - Der E-Mail-Client des Nutzers öffnet sich mit vorausgefülltem Empfänger, Betreff und KI-generiertem Anschreiben (mailto:-Link, kein serverseitiger Versand).
- Community-Feed, in dem Eltern aktuelle Erfahrungen und Kapazitäts-Hinweise zu Kitas teilen.
# **2. Marktanalyse**
## **2.1 Marktkennzahlen Suchprozess**

|**Kennzahl**|**Wert (DE)**|**Bedeutung für das Produkt**|
| :- | :- | :- |
|Elternhaushalte mit aktiver Kita-Suche pro Jahr (Schätzung)|ca. 0,9 bis 1,2 Mio.|Relevanter jährlicher Kernmarkt|
|Eltern mit Mehrfachbewerbung (5 oder mehr Kitas)|> 60 %|Hoher Bedarf an zentralem Such- und Bewerbungsprozess|
|Eltern, die an Fragmentierung scheitern (keine klare Antwortlage, Medienbrüche, unvollständige Daten)|ca. 30 bis 45 %|Direkter Problemfokus von KitaRadar|
|Durchschnittliche Dauer bis zu einer verwertbaren Rückmeldung|6 bis 12 Monate|Hoher Druck auf Effizienz und Automatisierung|
|Anteil Eltern, die Suchprozess als unübersichtlich bewerten|> 50 %|Belegt den Bedarf einer geführten Oberfläche|

Diese Marktanalyse konzentriert sich bewusst auf das tatsächliche Such- und Bewerbungsverhalten von Eltern, nicht auf Geburtenzahlen oder gesamtpolitische Kapazitätsdebatten.

*Quelle: DJI, Kinderbetreuungsreport 2024; Destatis, Familien und Betreuung 2024; Bertelsmann Stiftung, Frühkindliche Bildung 2024.*
## **2.2 Fragmentierungsproblem und Lösungslogik**

|**Problem heute**|**Konkrete Auswirkung**|**Wie KitaRadar es löst**|
| :- | :- | :- |
|Informationen sind auf viele Portale und Trägerseiten verteilt|Eltern suchen mehrfach dieselben Daten, verlieren Zeit und Kontext|Eine einheitliche Umkreissuche bündelt Ergebnisse in einer Oberfläche|
|Kein zentraler Bewerbungsstatus|Eltern wissen nicht, bei welcher Kita welcher Stand vorliegt|Bewerbungs-Tracking mit Status je Einrichtung|
|Keine Priorisierung realistischer Treffer im Umkreis|Hohe Streuverluste durch ungezielte Bewerbungen|KI-Suchassistenz priorisiert passende Kitas nach Präferenzen|
|Bewerbungstexte werden jedes Mal manuell neu geschrieben|Hoher Zeitaufwand und Qualitätsunterschiede|KI-Bewerbungsgenerator erstellt individualisierte Anschreiben|
|Lokale Informationen ändern sich schnell|Eltern arbeiten oft mit veralteten Angaben|Community-Feed zeigt aktuelle Erfahrungswerte und Hinweise|

**KitaRadar** macht damit aus einem fragmentierten Einzelprozess einen durchgängigen, nachvollziehbaren Such- und Bewerbungsfluss.

*Quelle: little-bird.de (ITEBO GmbH), kita-navigator.org, webkita.de; Portalanalyse Mai 2026.*
# **3. Wettbewerb**
## **3.1 Wettbewerbsvergleich Deutschland**

|**Anbieter**|**Typ**|**Stärken**|**Schwächen**|**Wettbewerbsdruck für KitaRadar**|
| :- | :- | :- | :- | :- |
|Little Bird|Kommunales Portal|Offizieller kommunaler Prozess, Bekanntheit in teilnehmenden Kommunen|Lokal begrenzt, uneinheitliche Funktionen, geringe Trägerbreite|Hoch in einzelnen Regionen|
|Kita-Navigator / webKITA-Varianten|Regionale Portallösungen|Grundfunktionen für Vormerkung vorhanden|Kein bundesweiter Standard, schwache Vergleichs- und Trackinglogik|Mittel bis hoch|
|Trägerportale (AWO, Caritas, Diakonie, privat)|Einzelträger-Lösungen|Gute Detailinformationen je Träger|Keine trägerübergreifende Suche, kein zentraler Bewerbungsverlauf|Mittel|
|Google Maps plus manuelle Listen|Nutzerverhalten, kein Produkt|Schneller Ortsüberblick|Keine Verfügbarkeits- und Bewerbungslogik, kein Tracking|Indirekt, aber relevant|
## **3.2 Funktionsvergleich**

|**Kriterium**|**Kommunale Portale**|**Trägerportale**|**Manuelle Suche**|**KitaRadar V1**|
| :- | :- | :- | :- | :- |
|Einheitliche Umkreissuche über mehrere Träger|Teilweise|Nein|Teilweise|Ja|
|KI-Unterstützung bei Suchpriorisierung|Nein|Nein|Nein|Ja|
|KI-Unterstützung beim Bewerbungstext|Nein|Nein|Nein|Ja|
|Direktversand aus einem Workflow|Teilweise|Nein|Nein|Ja|
|Bewerbungsstatus je Kita in einem Dashboard|Selten|Nein|Nein|Ja|
|Community-Hinweise zu aktuellen Erfahrungen|Nein|Nein|Nein|Ja|
## **3.3 Wettbewerbsfazit**
Der Wettbewerb ist heute prozessfragmentiert. Kein relevanter Anbieter deckt Suche, Priorisierung, Bewerbung und Tracking in einer durchgängigen Nutzerführung ab. Genau in dieser Lücke positioniert sich **KitaRadar**.

*Quelle: little-bird.de (ITEBO GmbH), kita-navigator.org, webkita.de (Deutsche Telekom), awo.org, caritas.de, diakonie.de; Portalvergleich Mai 2026.*
# **4. Zielgruppe**
## **4.1 Zielgruppensegmente**

|**Segment**|**Typische Situation**|**Zahlungsbereitschaft**|**Relevanz für V1**|
| :- | :- | :- | :- |
|Erstsuchende Eltern|Erste Kita-Suche ohne Vorerfahrung|Mittel bis hoch|Sehr hoch|
|Eltern mit Wiedereinstiegsdruck|Zeitkritische Platzsuche mit direktem finanziellen Risiko|Hoch|Sehr hoch|
|Mehrverdiener-Haushalte|Fokus auf schnelle Treffer, auch private und bilinguale Kitas|Hoch bis sehr hoch|Sehr hoch|
|Umzugsbedingte Zweitsuchende|Suche in neuer Region unter Zeitdruck|Mittel bis hoch|Hoch|
##
##
##
## **4.2 Probleme bei den Zielgruppensegmenten und Lösung durch KitaRadar**

|**Segment**|**Hauptproblem heute**|**Warum passt KitaRadar?**|
| :- | :- | :- |
|Erstsuchende Eltern|Hoher Informationsaufwand und unklare Reihenfolge|Geführte Suche und KI-Hilfe für die erste Bewerbung|
|Eltern mit Wiedereinstiegsdruck|Zu lange Such- und Antwortzyklen|Schnellere Priorisierung und sofortiger Versand|
|Mehrverdiener-Haushalte|Hohe Opportunitätskosten bei Zeitverlust|Premium-Funktionen liefern Zeitgewinn und Trefferqualität|
|Umzugsbedingte Zweitsuchende|Fehlender lokaler Marktüberblick|Umkreissuche plus einheitlicher Bewerbungsworkflow|

*Quelle: DJI, Kinderbetreuungsreport 2024; Destatis, Familienstruktur 2024.*
# **5. Nutzen und Alleinstellungsmerkmal**
## **5.1 Nutzen für den Markt**
**KitaRadar** reduziert den Such- und Bewerbungsaufwand für Eltern von Wochen auf Minuten:

- Alle Kitas im Umkreis auf einer Karte, anbieter- und stadtteilübergreifend.
- KI-Suchassistent filtert in Sekunden die wirklich passenden Einrichtungen (Konzept, Alter, Öffnungszeiten, Träger, Entfernung).
- KI-Bewerbungsgenerator erstellt ein individuelles, überzeugendes Anschreiben pro Kita.
- Mit einem Klick öffnet sich der E-Mail-Client des Nutzers mit vorausgefülltem Empfänger, Betreff und KI-generiertem Anschreiben (mailto:-Link).
- Community-Feed liefert tagesaktuelle Hinweise anderer Eltern zu Verfügbarkeiten, Wartelisten und Erfahrungen.
## **5.2 Alleinstellungsmerkmal**
Kein Wettbewerber bietet diese Kombination:

- Anbieterübergreifende Umkreissuche (kommunal, kirchlich, frei, privat) statt kommunaler Insellösung.
- KI-Unterstützung sowohl bei der Suche als auch bei der Formulierung der Bewerbung.
- E-Mail-Versand per mailto:-Link: Der E-Mail-Client des Nutzers öffnet sich mit vorausgefüllten Empfänger- und Anschreibe Daten, kein serverseitiger E-Mail-Dienst erforderlich.
- Community-Feed mit realen Erfahrungen statt statischer Behördendaten.
# **6. Abhängigkeiten und Herausforderungen**
## **6.1 Kostenfreie API- und Datenanbindungen (Version 1)**

|**Quelle / API**|**Kosten**|**Nutzung in Version 1**|
| :- | :- | :- |
|OpenStreetMap plus Overpass API|0 Euro|Basis-Geodaten, Suchobjekte und Umkreisabfragen|
|Nominatim|0 Euro|Geokodierung von Adressen und Radiusauflösung|
|GovData CKAN API|0 Euro|Ergänzende offene Verwaltungsdaten|
|Kommunale Open-Data-APIs (wo offen verfügbar)|0 Euro|Regionale Datenanreicherung in Pilotgebieten|
## **6.2 Machbarkeitseinschätzung**
Version 1 ist mit vertretbarem Risiko umsetzbar, weil der Kernablauf auf frei verfügbaren Daten und direktem E-Mail-Versand basiert. Es gibt keine zwingende Abhängigkeit von kostenpflichtigen Integrationen oder kommunalen Einzelverträgen. Dadurch bleibt der Start schnell, technisch kontrollierbar und wirtschaftlich schlank.
# **7. Businessmodell**
## **7.1 Modellbeschreibung**

|**Stufe**|**Funktionsumfang**|**Preis**|
| :- | :- | :- |
|Free|Basis-Suche mit maximal 10 Suchabfragen pro Monat, keine KI-Unterstützung, keine Bewerbungsfunktion|0 Euro|
|Pro|Unbegrenzte Suche, KI-Suchassistenz, KI-Bewerbungsgenerator, E-Mail-Direktversand, Tracking, Community-Beiträge|7,99 Euro pro Monat|
## **7.2 Empfehlung**
Der stark limitierte Free-Plan reduziert Last ohne Erlös und erhöht den Upgrade-Druck. Pro monetarisiert die zwei wichtigsten Zahlungsgründe der Zielgruppe: 

- bessere Treffer und 
- schneller Versand der Bewerbung.
# **8. Anforderungen Version 1**

|**Bereich**|**ID**|**Anforderung**|**Priorität**|
| :- | :- | :- | :- |
|Hauptprozess|H-01|Umkreissuche mit Radius- und Trägerfiltern in der Web-App|Muss|
|Hauptprozess|H-02|KI-Suchassistenz zur Priorisierung passender Kitas|Muss|
|Hauptprozess|H-03|KI-Bewerbungsgenerator für individualisierte Anschreiben|Muss|
|Hauptprozess|H-04|E-Mail-Versand per mailto:-Link (E-Mail-Client des Nutzers öffnet sich mit vorausgefülltem Empfänger, Betreff und KI-generiertem Anschreiben) inkl. Status-Tracking|Muss|
|Hauptprozess|H-05|Community-Feed mit Beiträgen, Bewertung und Moderation|Muss|
|Basisfunktion|B-01|Registrierung, Login und Passwort-Reset|Muss|
|Basisfunktion|B-02|Profilverwaltung mit Kinderdaten und Präferenzen|Muss|
|Basisfunktion|B-03|Dashboard mit Such-, Bewerbungs- und Antwortstatus|Muss|
|Basisfunktion|B-04|Benachrichtigungen zu Antworten und relevanten Feed-Updates|Muss|
|Basisfunktion|B-05|Datenschutzfunktionen (Datenexport, Kontolöschung, Einwilligung)|Muss|
|Businessmodell|M-01|Free-Limit von 10 Suchabfragen pro Monat serverseitig erzwingen|Muss|
|Businessmodell|M-02|Pro-Upgrade zu 7,99 Euro monatlich in der Web-App|Muss|
|Businessmodell|M-03|Self-Service-Kündigung ohne Supportkontakt|Muss|
|Businessmodell|M-04|Sichtbare Feature-Abgrenzung zwischen Free und Pro in der UI|Muss|
# **9. Chancen und Risiken**
## **9.1 Chancen**

|**Chance**|**Eintrittswahrscheinlichkeit**|**Wirkung**|**Begründung**|
| :- | :- | :- | :- |
|Unbesetzte Produktkombination im Markt|Hoch|Hoch|Kein Anbieter deckt den gesamten Such- und Bewerbungsfluss ab|
|Hohe Zahlungsbereitschaft bei Zeitdruck-Familien|Hoch|Hoch|Zeitgewinn reduziert direkte finanzielle Nachteile|
|Organisches Wachstum über Elternnetzwerke|Mittel bis hoch|Mittel bis hoch|Lokale Empfehlungen haben hohe Glaubwürdigkeit|
|Schnelle Skalierung ohne Pflichtintegration in kommunale Portale|Hoch|Hoch|V1 basiert auf offenen Daten plus E-Mail-Versand|
## **9.2 Risiken**

|**Risiko**|**Eintritt**|**Auswirkung**|**Gegenmaßnahme**|
| :- | :- | :- | :- |
|Veraltete oder unvollständige Stammdaten|Mittel|Hoch|Kombination mehrerer Datenquellen, regelmäßige Aktualisierung, Community-Korrekturen|
|Nutzer sendet E-Mail nicht ab oder Kita-Adresse ist veraltet|Mittel|Mittel|Klarer Hinweis nach Öffnen des E-Mail-Clients; Bewerbungsstatus manuell bestätigbar; regelmäßige Adresspflege|
|Falschmeldungen im Community-Feed|Mittel|Mittel|Moderation, Meldefunktion, Richtlinien und Sanktionslogik|
|Zu hohe Erwartung an tatsächliche Platzvergabe|Mittel|Mittel|Deutliche Disclaimer und klare Nutzerkommunikation|
#
#
# **10. Umsetzungsplan**
## **10.1 Technologie Stack**

|**Komponente**|**Technologie**|
| :- | :- |
|Frontend|Next.js (React), reine Web-App|
|Backend und Datenbank|Supabase (PostgreSQL, EU-Region Frankfurt)|
|Karten- und Geodatenlogik|OpenStreetMap, Overpass API, Nominatim|
|KI-Funktionen|OpenAI API (EU-Region) für Suche und Bewerbung|
|E-Mail-Versand|mailto:-Link (kein serverseitiger Versand; E-Mail-Client des Nutzers öffnet sich mit vorausgefüllten Daten)|
|Bezahlung|Stripe|
## **10.2 Phasenplan Version 1 (5 Werktage plus 1 Buffer-Tag)**
GitHub Copilot Premium übernimmt den Großteil der Codegenerierung. Der Entwickler reviewt, korrigiert und integriert.

|**Tag**|**Fokus**|**Inhalt**|**Ergebnis**|
| :- | :- | :- | :- |
|Tag 1|Setup Web-App|Projektstruktur, Authentifizierung, Datenmodell für Kitas, Nutzer, Bewerbungen und Feed|Lauffähige Grundanwendung|
|Tag 2|Suche und Daten|Umkreissuche, Filter und API-Anbindung (OSM, Overpass, Nominatim)|Suchmodul funktionsfähig|
|Tag 3|KI-Funktionen|KI-Suchassistenz und KI-Bewerbungsgenerator inklusive Prompt-Optimierung|KI-Workflows stabil|
|Tag 4|Versand und Tracking|mailto:-Link-Integration, Bewerbungsstatus, Dashboard-Logik|End-to-End Bewerbungsablauf aktiv|
|Tag 5|Community und Pro-Modell|Community-Feed, Moderation, Free/Pro-Feature-Gates, Stripe-Integration, rechtliche Hinweise|V1 Feature-Set vollständig|
|Tag 6 (Samstag, Buffer)|Qualität und Launch-Vorbereitung|End-to-End-Tests, Performance-Fixes, Release-Abnahme|Release-Kandidat|

Das Ergebnis nach Tag 6 ist eine produktive erste Version mit allen Kernfunktionen, kein finales Endprodukt. Die Entwicklung erfolgt mit GitHub Copilot Premium als primärem Coding-Beschleuniger.
# **11. Quellenverzeichnis**

|**Quelle**|**Inhalt**|
| :- | :- |
|Deutsches Jugendinstitut (DJI), Kinderbetreuungsreport 2024|Such- und Bewerbungsverhalten von Eltern im Kita-Prozess|
|Destatis, Familien und Betreuung 2024|Rahmenzahlen zu Familien und Betreuungsnutzung|
|Bertelsmann Stiftung, Frühkindliche Bildung 2024|Einordnung struktureller Marktprobleme im Kita-Bereich|
|DSGVO, EUR-Lex (EU-Verordnung 2016/679)|Datenschutzanforderungen für personenbezogene Daten|
|Supabase, supabase.com/security (2025/2026)|Sicherheits- und Datenschutzinformationen für die Datenplattform|
|OpenStreetMap Foundation, osmfoundation.org (2025)|Freie Karten- und Geodaten|
|Overpass API Dokumentation (2025)|Freie Abfrage von OSM-Daten|
|Nominatim Dokumentation (2025)|Geokodierung und Adressauflösung|
|GovData, govdata.de (2025/2026)|Offene Verwaltungsdaten und API-Zugriffe|
|little-bird.de, ITEBO GmbH (2025/2026)|Kommunales Kita-Portal; Abdeckung, Funktionen und Reichweite|
|kita-navigator.org (2025/2026)|Regionales Portalangebot; Funktionsumfang und Nutzungsmodell|
|webkita.de, Deutsche Telekom (2025/2026)|Trägerübergreifende Portallösung; Vergleich Funktionsstand|
|awo.org, AWO Bundesverband (2025/2026)|Trägerportal-Funktionsumfang und Bewerbungsprozess|
|caritas.de, Deutscher Caritasverband (2025/2026)|Trägerportal-Funktionsumfang und Bewerbungsprozess|


2


[^1]: Kita-Platz: Betreuungsplatz in einer Kindertageseinrichtung (Krippe, Kindergarten oder altersgemischte Gruppe).