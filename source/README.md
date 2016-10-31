AITEC-Post-Example-Arduino
==========================

Beschreibung
-----------

Arduino Teil
-----------
Arduino Besipiel mit Ethernet-Shield um Daten an einen Server zu pushen.
Das Beispiel sendet alle 500ms (oder beim Drücken des Knopfs) POST-Requests an einen Server mit den Daten des Licht-Sensors.

Server-Teil
-----------
Der Server ist als nodejs/socket.io server realisiert , nimmt POST-Requests entgegen und veröffentlicht das Resultat an alle verbundenen Clients.

Setup
------
- Verbinden Sie das Ethernet-Shield mit dem Base-Shield auf ihrem Arduino.
- Verbinden Sie den Knopf mit dem PIN D6
- Verbinden Sie den Licht-Sensor mit dem PIN A0

- Setzen Sie die IP-Adresse Ihres Rechners fix auf 192.168.2.203
- Konfigurieren Sie Ihre VirtualBox VM, um NAT zu nutzen
- Fügen Sie eine Port-Weiterleitung in den NAT-Einstellungen hinzu
  Port 1337 HOST IP 192.168.2.203 TARGET IP 10.0.2.15
- Starten Sie NodeJS mit der Serverdatei: pushpost.js
  
 Mit diesen Einstellungen werden alle Anfragen an Port 1337 und die IP 192.168.2.203 an die Interne IP der VM (10.0.2.15) weitergeleitet.
 Somit kann eine Applikation in der VM die den Port 1337 abhört auf Anfragen an die Host IP reagieren.