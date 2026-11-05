# Sidebar Manager

**0.1.9 · Home Assistant ≥ 2026.10.3 · DE / EN / FR · MIT**

Version 0.1.8 ergänzt eigene Links in **Seitenleiste bearbeiten**, mit Farben/Transparenz, Auge und Ziehgriff. Die Beschriftung lautet **Link** beziehungsweise **ext. Link**. Der Anwender hat die erfolgreiche Funktionsprüfung am 02.11.2026 bestätigt; 70 automatische Tests sind erfolgreich.

Ordner, Farben, Transparenz und eigene Links direkt in „Seitenleiste bearbeiten“. Haupteinträge und Ordner gemeinsam am nativen Ziehgriff sortieren. Keine HA-Systemdateien werden ersetzt.

[English](../README.md) · [Français](README.fr.md) · [Dokumentation](https://opensource.ugso-software.de/projects/sidebar-manager/) · [Downloads](https://github.com/rockbaer2007/ha-sidebar-manager/releases/latest)

## HA-2026.11-Kompatibilität — 0.1.9

Die Farbanwendung im nativen Bearbeitungsdialog unterstützt sowohl `ha-md-list-item` als auch das neue `ha-list-item-button`. Vorhandene Farben, Transparenz und Speicherschlüssel bleiben erhalten; keine Migration nötig. Mindestversion weiterhin HA 2026.10.3.

Auf .177 (Port 80), Core 2026.11.0 / Frontend 20261028.4 geprüft: Text-/Iconfarben der Einträge und Gruppen, Transparenz, Abbrechen, Speichern, Theme-Rücksetzung und vollständiges Browser-Neuladen. Eigene Testgruppe/-verknüpfung entfernt; exportiertes Layout entspricht der Sicherung vor dem Test. 72 automatische Tests bestehen. Nur das verwendete Paket aktualisieren; Colors und Manager nicht gleichzeitig laden.

## Neu in 0.1.8: Links im Seitenleisten-Editor

> **Prüfstand vom 02.11.2026**
> **0.1.8: Funktionsprüfung vom Anwender am 02.11.2026 erfolgreich bestätigt.** Links, Farben, Verschieben und die Kennzeichnung „Link“/„ext. Link“ funktionieren. Syntaxprüfung, Build und **70 automatische Tests** sind ebenfalls erfolgreich. Die bisherigen Bilder zeigen frühere Prüfstände. Für diese Version wurde kein zusätzlicher eigenständiger HA-Laufzeittest durch Codex durchgeführt; Host und HA-Version der Anwenderprüfung wurden nicht gesondert angegeben.

Eigene interne und externe Links erscheinen jetzt ebenfalls in **Seitenleiste bearbeiten**. Ohne gespeicherte Position stehen sie zunächst ganz unten; eine vorhandene Reihenfolge wird berücksichtigt. Auch ausgeblendete Links bleiben zum Bearbeiten sichtbar.

- **Farbfeld:** derselbe Farbwähler mit Transparenz wie bei HA-Einträgen. „Theme-Farbe“ entfernt die eigene Farbe. Gespeicherte Link-Farben werden beim Aufbau der Seitenleiste sofort angewendet.
- **Link-Typ:** statt des Gruppennamens zeigt der Einstellungsbutton **Link** für interne Ziele und **ext. Link** für externe HTTP(S)-Ziele. Ein Klick öffnet die Einstellungen dieses Links. Seine Gruppenzuordnung bleibt erhalten und steht zusätzlich im Tooltip.
- **Ziehgriff:** Links zwischen den anderen Einträgen einsortieren, auch innerhalb ihrer zugewiesenen Gruppe. Ziehen allein ändert die Gruppenzuordnung nicht; sie wird weiterhin in den Link-Einstellungen gewählt. Die Tastatursortierung bleibt verfügbar.
- **Auge:** Links ausblenden und wieder einblenden. Das entfernt weder den Link noch seine Einstellungen.
- **Speichern/Abbrechen:** Farbe, Sichtbarkeit und Reihenfolge werden über den HA-Bearbeitungsdialog übernommen beziehungsweise verworfen. Die allgemeinen Link-Einstellungen werden weiterhin im Manager gespeichert.

Link-Reihenfolge und -Sichtbarkeit bleiben im Manager-Datensatz `ugso_sidebar_manager_v1`, die Farben im vorhandenen Datensatz `ugso_sidebar_colors_v1`. Eigene Link-IDs werden nicht in HAs native Panel-Reihenfolge geschrieben. Bestehende Einstellungen, Öffnungsarten und fehlende Panels bleiben erhalten.

Die lokalen Prüfungen decken das gebaute JavaScript-Paket mit simuliertem HA-Speicher, die Beschriftungen in DE/EN/FR, Farbauswahl, Speichern/Abbrechen, Sortierung, gespeicherte Gruppenzuordnung und die Wiederherstellung nach fehlgeschlagenem Speichern ab. Die erfolgreiche Funktionsprüfung wurde am 02.11.2026 vom Anwender bestätigt; dies ist getrennt von den automatischen Tests dokumentiert.

## HACS / Marketplace

Frontend-Plugin, keine Supervisor-App und keine Dashboard-Karte. `https://github.com/rockbaer2007/ha-sidebar-manager` als benutzerdefiniertes HACS-Repository in Kategorie **Dashboard** (`plugin`) hinzufügen und herunterladen. Veröffentlichung bedeutet keine Aufnahme in den Standardkatalog. HACS-kompatible Paketstruktur für Marketplace; noch kein eigener Marketplace-Laufzeittest.

Vorher HA-Vollbackup erstellen. Im bestehenden `frontend:`-Abschnitt der `configuration.yaml` ergänzen; Themes und andere Module erhalten:

```yaml
frontend:
  extra_module_url:
    - /hacsfiles/ha-sidebar-manager/ha-sidebar-manager.js
```

Alte Moduleinträge für Sidebar Colors und Sidebar Organizer deaktivieren, nur Sidebar Manager laden. Konfiguration prüfen, HA neu starten und Browser neu laden. Nur eine Dashboard-Ressource genügt für den seitenübergreifenden Einsatz nicht.

## Manuelle Installation

`ha-sidebar-manager.js` aus dem Release nach `/config/www/ha-sidebar-manager/ha-sidebar-manager.js` kopieren und stattdessen `/local/ha-sidebar-manager/ha-sidebar-manager.js` als Moduladresse verwenden. HACS- und manuelle Kopie nicht gleichzeitig laden. Das ZIP enthält Bundle, Konfigurationsbeispiele, Lizenz und DE/EN/FR-Anleitungen. Bestehende versionierte lokale Pfade wie `/local/ugso-sidebar-manager/0.1.7/ha-sidebar-manager.js` dürfen bleiben, wenn die Datei dort liegt. Bei Updates den gewählten Pfad erhalten und Browser neu laden.

## Webseiten rechts in HA

Links in einem neuen Tab benötigen keine weitere Einrichtung. Für **Rechts anzeigen (iframe)** zusätzlich diesen Eintrag in `configuration.yaml` bzw. die vorhandene `panel_custom`-Liste übernehmen:

```yaml
panel_custom:
  - name: ugso-sidebar-web
    url_path: ugso-sidebar-web
    module_url: /hacsfiles/ha-sidebar-manager/ha-sidebar-manager.js
    embed_iframe: false
    require_admin: false
```

Bei manueller Installation `module_url` auf `/local/ha-sidebar-manager/ha-sidebar-manager.js` ändern. Die Adresse muss mit dem Frontend-Modul übereinstimmen. Prüfen und HA neu starten. Ohne `sidebar_title` entsteht kein zusätzlicher Menüeintrag. Beispiele: `panel-custom.example.yaml` und `panel-custom.manual.example.yaml` im ZIP.

Die Zielseite muss Einbettung erlauben. CSP/X-Frame-Options, HTTPS-zu-HTTP oder die eigene Anmeldung der Zielseite können die Anzeige verhindern. „In neuem Tab öffnen“ bleibt als Alternative verfügbar. Keine HA-Tokens werden an Webseiten übergeben; HA-Zugriffsrechte bleiben wirksam.

## Bedienung

Den Seitenleistenkopf länger gedrückt halten. Farbfelder, Augen und Ziehgriffe bleiben im HA-Dialog; „Gruppen und Links verwalten“ öffnet den Manager. DE/EN/FR folgen der HA-Sprache, Englisch dient als Rückfall.

- Farben und Deckkraft je Eintrag; „Theme-Farbe“ entfernt die eigene Farbe. Das Schachbrett kennzeichnet Transparenz.
- Ordner mit Namen, MDI-Icon, Farbe und anfänglichem Ein-/Ausklappen. Bestehende Menüeinträge und eigene Links zuordnen; „Hauptmenü“ verschiebt sie zurück.
- Ordner zwischen Haupteinträge ziehen. Ordner und Inhalt wandern als Block; Alt+Auf/Ab unterstützt die Tastaturbedienung.
- Unten angeheftete Ordner stehen auch im Editor unten. Verschieben vor einen normalen Menüblock hebt die untere Anheftung auf. Abbrechen erhält Position und Anheftung.
- Trennlinie **0–4 px**, 0 = Aus. Nur ausgeklappt sichtbar, am Ende des Untermenüs, in Icon-Farbe/Transparenz, mit jeweils 1 px Abstand oben und unten.
- Logs, Automationen und Zustände mit auswählbarem Ordner hinzufügen. Vorhandene passende Links werden wiederverwendet; Namen und Icons bleiben änderbar.
- Eigene interne Links sind in den Einstellungen hellgelb, externe HTTP(S)-Links hellblau. Extern: neuer Tab oder iframe. Alte Links behalten ihre bisherige Öffnungsart bis zur Änderung. Eigene Seitenleistenfarben bleiben erhalten.
- Speichern im Manager übernimmt dessen Organisation. Farben/native Reihenfolge im darunterliegenden HA-Dialog dort separat speichern. Abbrechen verwirft den jeweiligen Entwurf.

Einstellungen, Profil und Benachrichtigungen bleiben nativ. Ausblenden und Gruppieren ändern keine Zugriffsrechte.

## Bilder und Prüfstand

![Farbwähler](images/farbwaehler-177.png)

![Linkoptionen](images/web-link-016-177.png)

![Ordnerposition in 0.1.7](images/ordnerposition-017-177.png)

![Eingeklappter Ordner ohne Trennlinie](images/trennlinie-eingeklappt-017-177.png)

![Webseite rechts innerhalb von HA](images/web-panel-016-177.png)

0.1.7 auf HA **2026.10.4**, Port 80 geprüft: Speichern/Abbrechen, angehefteten Testordner verschieben, Neuladen, Gruppenzuordnung und Trennlinien nur bei ausgeklapptem Menü. Frühere Prüfungen decken Farben, Transparenz, Links, iframe/neuen Tab und Export/Import ab. Daten und Testdashboard erhalten, eigene Testobjekte entfernt. **60 automatische Tests erfolgreich.** Bilder der Farb-/Linkfunktionen aus 0.1.6 zeigen weiter gültige Funktionen. [Prüfbericht](TESTING.md).

2026.10.3 ist die vorgesehene Mindestversion, keine separat live geprüfte Installation. Keine pauschale Kompatibilitätszusage für alle Webseiten oder Marketplace-Versionen.

## Einstellungen erhalten und umsteigen

1. Vollbackup erstellen und vorhandene Organizer-Einstellungen sowie Manager-/Farbsicherungen exportieren.
2. Alte Sidebar-Module deaktivieren; Dateien und Benutzereinstellungen erhalten. Nur eine Manager-Kopie installieren.
3. Sidebar-Colors-Farben bleiben unter `ugso_sidebar_colors_v1`, Manager-Organisation unter `ugso_sidebar_manager_v1`, pro HA-Benutzer auf dem Server synchronisiert.
4. **Kein automatischer Organizer-YAML-/Layoutimport.** Export aufbewahren und gewünschte Gruppen/Links manuell anlegen.

Fehlende Panels bleiben gespeichert. Ladefehler/unbekannte Formate überschreiben keine Einstellungen. Vor Änderungen wird der vorherige Organisationsstand im Browser gesichert; gesperrte Ablage verhindert das Speichern. Konflikte werden vorab geprüft, unklare Bestätigungen nachgelesen. Ein enges gleichzeitiges Schreibfenster bleibt ohne atomaren Serververgleich möglich.

JSON-Export/Import betrifft Gruppen, Links, Namen, Icons, Sichtbarkeit, Anheftung, Reihenfolge und Trennlinien; keine Zugangsdaten oder nativen HA-Einstellungen. Eintragsfarben haben eine getrennte Sicherung. Zurücksetzen wirkt zunächst nur auf den Entwurf. Für Rückkehr alten Moduleintrag wiederherstellen, HA neu starten und Browser neu laden; Benutzerdaten behalten.

## Entwicklung und Grenzen

Node ≥22: `npm ci`, `npm run check`, `npm run build`, `npm test`. Tags bauen JS und ZIP automatisch. Interne HA-Dialoge können sich mit Frontend-Updates ändern. Keine gerätespezifischen Layouts, freien CSS-/Template-Aktionen, automatische Organizer-Migration oder Kopf-/Breiteneinstellungen.

Eigene UGSo-Implementierung auf Basis von Sidebar Colors. [Sidebar Organizer von Viet Ngoc](https://github.com/ngocjohn/sidebar-organizer) dient als Funktionsreferenz; kein Organizer-Quellcode eingebettet. MIT-Lizenz im Repository.
