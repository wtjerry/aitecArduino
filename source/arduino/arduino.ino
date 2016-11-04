#include <SPI.h>
#include <Ethernet.h>

#define SENSOR1_PIN 1
#define SENSOR2_PIN 2

// Newer Ethernet shields have a MAC address printed on a sticker on the shield
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };

IPAddress server(192,168,2,205);  // IP of the webserver to reach (use host ip if used in virtualbox)

IPAddress ip(192,168,2,200);      // IP of the arduino device (can be set to your needs)

// Initialize the Ethernet client library
// with the IP address and port of the server 
// that you want to connect to (port 80 is default for HTTP):
EthernetClient client;


boolean requestOngoing = false;
int sensorIsOccupied = 1;
long initialStartTime = -1;
int firstStartDelay = 1000; 
int periodicDelay = 500;
long lastMillis = -1;
int serverCallDelay = 30000;
long lastTimeServerWasCalled = -1;

enum {
  IS_OCCUPIED = 1,
  IS_RESERVED = 2
};
int parkingLotState = 0;

void setup() {
  pinMode(SENSOR1_PIN, INPUT);
  pinMode(SENSOR2_PIN, INPUT);
  
 // Open serial communications and wait for port to open:
  Serial.begin(9600);

  Serial.println("Started");
  Ethernet.begin(mac, ip);
    
  // give the Ethernet shield a second to initialize:
  delay(1000);
  
  Serial.println("connecting...");
}


int sendHttpRequest(int sensor1Value, int sensor2Value, bool isOccupied) {
  requestOngoing = true;

  if (client.connect(server, 1337)) {
    Serial.println("connected");
    char buf[100];
    sprintf(buf, "{\"sSensor1\":%d}",sensor1Value);
    sprintf(buf, "{\"sSensor2\":%d}",sensor2Value);
    sprintf(buf, "{\"sIsOccupied\":%d}",isOccupied);
    
    // Make a HTTP request:
    client.println("POST /rest-example/pushServer.php HTTP/1.1");
    client.println("Host: 192.168.2.205");
    client.println("Connection: close");
    client.println("Content-Type: application/json");
    client.println("Content-Length: 14");
    client.println();                                              // This empty line is needed as request body is always separated by an empty line
    client.println(buf);

    char c = client.read();
    Serial.print(c);
    return c;                    
  } 
  else {
    Serial.println("connection failed");
  }
  
  return -1;
}

void setParkingLotState(bool areBothSensorsOccupied) {
    if(areBothSensorsOccupied == false && parkingLotState & IS_OCCUPIED)
    parkingLotState -= IS_OCCUPIED;
  else if (areBothSensorsOccupied == true && (parkingLotState & IS_OCCUPIED) == false)
    parkingLotState += IS_OCCUPIED;
}

bool computeAndSetOccupiedState(int sensor1Value, int sensor2Value)
{
  bool areBothSensorsOccupied = sensor1Value >= sensorIsOccupied && sensor2Value >= sensorIsOccupied;
  return areBothSensorsOccupied;
}

void displayParkingLotState() {
  char color[10];
  if(parkingLotState & IS_OCCUPIED)
    sprintf(color, "red");
  else if(parkingLotState & IS_RESERVED)
    sprintf(color, "yellow");
  else
    sprintf(color, "green");
}

void updateParkingLotState(long currentMillis)
{
  int sensor1Value = analogRead(SENSOR1_PIN);
  int sensor2Value = analogRead(SENSOR2_PIN);
  bool isOccupied = computeAndSetOccupiedState(sensor1Value, sensor2Value);
  setParkingLotState(isOccupied);

  if(currentMillis - lastTimeServerWasCalled >= serverCallDelay) {
    int serverParkingLotState = sendHttpRequest(sensor1Value, sensor2Value, isOccupied);
    if(serverParkingLotState != -1)
      parkingLotState = serverParkingLotState;  

    lastTimeServerWasCalled = millis();
  }

  displayParkingLotState();
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
  
    if(lastMillis == -1 && lastTimeServerWasCalled == -1) {
      lastMillis = millis();
      lastTimeServerWasCalled = lastMillis;
    }

    if(currentMillis - lastMillis >= periodicDelay) {
      updateParkingLotState(currentMillis);
      lastMillis = millis();
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
