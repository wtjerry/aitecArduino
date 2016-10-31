#include <SPI.h>
#include <Ethernet.h>

#define BUTTON_PIN 6    // Button on Pin D6
#define LIGHT_PIN A0

// Newer Ethernet shields have a MAC address printed on a sticker on the shield
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };

IPAddress server(192,168,2,205);  // IP of the webserver to reach (use host ip if used in virtualbox)

IPAddress ip(192,168,2,200);      // IP of the arduino device (can be set to your needs)

// Initialize the Ethernet client library
// with the IP address and port of the server 
// that you want to connect to (port 80 is default for HTTP):
EthernetClient client;


boolean requestOngoing = false;
int buttonState = LOW;
long initialStartTime = -1;
int firstStartDelay = 150; // Light sensor init time
int periodicDelay = 500;
long lastMillis = -1;

void setup() {
  pinMode(BUTTON_PIN, INPUT);
  
 // Open serial communications and wait for port to open:
  Serial.begin(9600);

  Serial.println("Started");
  Ethernet.begin(mac, ip);
    
  // give the Ethernet shield a second to initialize:
  delay(1000);
  
  Serial.println("connecting...");
  sendHttpRequest(0);
}


void sendHttpRequest(int value) {
  requestOngoing = true;

  if (client.connect(server, 1337)) {
    Serial.println("connected");
    char buf[100];
    sprintf(buf, "{\"sValue\":%d}",value);
    
    // Make a HTTP request:
    client.println("POST /rest-example/pushServer.php HTTP/1.1");
    client.println("Host: 192.168.2.205");
    client.println("Connection: close");
    client.println("Content-Type: application/json");
    client.println("Content-Length: 14");
    client.println();                                              // This empty line is needed as request body is always separated by an empty line
    client.println(buf);                              
  } 
  else {
    Serial.println("connection failed");
  }
}

void loop()
{
    // Get current timestamp
  unsigned long currentMillis = millis();
  
  if(initialStartTime == -1) {
    initialStartTime = currentMillis;
  } else if(currentMillis - initialStartTime <= firstStartDelay) {
    // loop for the initial delay time
    
  } else {
  
    if(lastMillis == -1 || currentMillis - lastMillis >= periodicDelay) {
        int sensorValue = analogRead(LIGHT_PIN);
        sendHttpRequest(sensorValue);
        lastMillis = millis();
    }   
    
    
    // Do not send multiple requests at the same time
    if(!requestOngoing) {
      buttonState = digitalRead(BUTTON_PIN);
      if(buttonState == HIGH) {
        int sensorValue = analogRead(LIGHT_PIN);
        sendHttpRequest(sensorValue);
      }
    }
  
    // Read server response and print it to the serial port
    if (client.available()) {
      char c = client.read();
      Serial.print(c);
    }

    // if the server's disconnected, stop the client and unblock requests
    if (requestOngoing && !client.connected()) {
      Serial.println();
      Serial.println("disconnecting.");
      client.stop();
      requestOngoing = false;
    }
  }
  
  delay(1); // Stability
}
