# Sidebar Manager 0.1.2 — lokale Vorschau

Eigenständige Erweiterung für Home Assistant: Farben und Transparenz, Gruppen, Ein-/Ausklappen, Anheften, eigene Links, Anzeigenamen und MDI-Icons. DE/EN/FR folgen automatisch der HA-Sprache. Noch nicht veröffentlicht.

## Bedienung

Den Kopf der HA-Seitenleiste länger gedrückt halten. Im normalen Dialog „Seitenleiste bearbeiten“ bleiben Farbfelder, Augen und Sortieren erhalten. „Gruppen und Links verwalten“ öffnet den Manager. Dessen Speichern übernimmt die Organisation; Änderungen an Farben oder HA-Reihenfolge im darunterliegenden Dialog müssen dort zusätzlich gespeichert werden. Abbrechen verwirft den jeweiligen Entwurf.

Gruppen lassen sich benennen, anfangs einklappen und unten anordnen. Einträge können Gruppen zugeordnet, für die Anzeige umbenannt, mit MDI-Icons versehen, ausgeblendet und angeheftet werden. Pfeile ändern die eigene Reihenfolge. Gruppenüberschriften bilden Trennlinien und lassen sich per Maus, Touch und Tastatur öffnen. Angeheftete Einträge stehen am Ende der scrollbaren Hauptnavigation, nicht im geschützten HA-Bereich für Profil und Benachrichtigungen. Links erlauben interne Pfade und HTTP(S).

## Daten erhalten

Jeder normale Hauptmenüeintrag zeigt neben seinem Farbfeld den Gruppennamen oder „Hauptmenü“. Ein Klick öffnet direkt die passende Zuordnung. Im Manager wählen Sie unter „Gruppe“ einen Ordner oder „Hauptmenü“ für die Rückkehr. Auch bestehende App- und Dashboard-Einträge sind verschiebbar; das HA-Ziel bleibt gleich. Jede Gruppe hat ein eigenes MDI-Icon, standardmäßig einen Ordner. Die geschützten Einträge Einstellungen, Profil und Benachrichtigungen bleiben nativ.

Bestehende Farben bleiben unter `ugso_sidebar_colors_v1`. Die Organisation wird getrennt unter `ugso_sidebar_manager_v1` pro HA-Benutzer auf dem HA-Server gespeichert und zwischen Clients synchronisiert. Fehlende Menüeinträge bleiben gespeichert. Ladefehler und unbekannte Datenformate überschreiben niemals die Einstellungen mit Standardwerten. Vor jedem Schreiben wird lokal der vorherige Organisationsstand gesichert; bei blockiertem Browserspeicher wird nicht gespeichert. Konflikte werden vor dem Schreiben geprüft, verlorene Bestätigungen nachgelesen. Ein enges Restrisiko gleichzeitiger Schreibvorgänge bleibt ohne serverseitigen Versionsvergleich.

„Sicherung exportieren/importieren“ betrifft die Organisation (Gruppen, Links, Anzeigenamen, Icons, Ausblenden, Anheften, Reihenfolge), keine Zugangsdaten und keine nativen HA-Einstellungen. Die bisherigen Farben behalten ihre eigene Sicherung. „Eigene Darstellung zurücksetzen“ ändert zunächst nur den offenen Entwurf.

## Installation und Rückkehr

Nur ein Modul laden: `/local/ugso-sidebar-manager/0.1.2/ha-sidebar-manager.js`. Das neue Bundle liegt im entsprechenden Unterordner von `/config/www`. Vorhandene Themes und weitere Frontend-Einträge erhalten. Den alten Farbmodul-Eintrag ersetzen, keine zweite `frontend`-Sektion anlegen. Konfiguration prüfen, HA neu starten und Browser neu laden. Sidebar Colors und Sidebar Organizer nicht gleichzeitig mit Sidebar Manager laden.

Ordner besitzen einen eigenen Farbwähler mit Transparenz. Die Farbe gilt für Icon und Gruppennamen. „Theme-Farbe“ entfernt die eigene Farbe; gespeichert wird erst mit dem Speichern im Manager.

Im nativen Dialog „Seitenleiste bearbeiten“ stehen die Ordner zusätzlich unter „Untermenüs“, mit Icon, Farbe, Pfeilen und Ziehgriff. Ziehen ändert die Reihenfolge der Ordner untereinander; Speichern in diesem HA-Dialog übernimmt sie, Abbrechen verwirft sie. Alternativ die Pfeile verwenden oder den Ziehgriff fokussieren und die Pfeiltasten drücken. Vor dem Öffnen der Gruppenverwaltung eine geänderte Ordnerfolge speichern oder abbrechen. Ordner-IDs werden niemals in die native HA-Menüreihenfolge geschrieben.

Für die Rückkehr den gesicherten alten Moduleintrag wiederherstellen und HA neu starten. Manager-Daten bleiben unter ihrem eigenen Schlüssel; die bisherigen Farben und nativen Einstellungen werden nicht verändert.

## Grenzen dieses ersten Stands

0.1.2 auf .177 (HA 2026.10.4) geprüft: Untermenüs per Pfeilen und Mausziehen verschieben, Abbrechen und gespeicherte Reihenfolge nach Neuladen. Eigene Testordner entfernt; Test/Test2, bisherige Farben, native Einstellungen und Test für APP erhalten. 42 automatische Tests erfolgreich. Details in `TESTING.md`.

Mindestziel HA 2026.10.3; echte Prüfung ausschließlich auf .177 mit 2026.10.4. Kein Organizer-YAML-Import, keine gerätespezifischen Layouts, kein eigenes CSS oder Template-Aktionen. Kopf-/Breiteneinstellungen und automatische Organizer-Übernahme sind noch nicht enthalten. HACS-Paketstruktur lokal vorbereitet, keine Veröffentlichung. Details zur Prüfung stehen in `TESTING.md`.
