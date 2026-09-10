// ============================================================
// ESP32 SMART ANIMAL MONITORING SYSTEM
// MASTITIS RISK + RFID + MPU6050 + DHT22 + MILK EC + pH + HX711
// WIFI AP + /data JSON API + POST telemetry to laptop server
// ============================================================

#include <Wire.h>
#include <SPI.h>
#include <MFRC522.h>
#include <DHT.h>
#include "HX711.h"
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>

// ============================================================
// PIN CONFIGURATION
// ============================================================

// MPU6050
#define SDA_PIN 21
#define SCL_PIN 22
#define MPU6050_ADDR 0x68

// RC522
#define SS_PIN   5
#define RST_PIN  27
#define SCK_PIN  18
#define MISO_PIN 19
#define MOSI_PIN 23

// DHT22
#define DHT_PIN 4
#define DHT_TYPE DHT22

// Milk conductivity
#define CONDUCTIVITY_PIN 34

// Milk pH
#define PH_SENSOR_PIN 35

// HX711
#define HX711_DOUT 13
#define HX711_SCK  14

// LED + buzzer
#define LED_PIN 15
#define BUZZER_PIN 2

// ============================================================
// WIFI CONFIG
// ============================================================

const char* WIFI_SSID = "MooTracker-ESP32";
const char* WIFI_PASSWORD = "MooTracker123";

IPAddress AP_IP(192, 168, 4, 1);
IPAddress AP_GATEWAY(192, 168, 4, 1);
IPAddress AP_SUBNET(255, 255, 255, 0);

const char* LAPTOP_IP = "192.168.4.2";
const uint16_t LAPTOP_PORT = 3000;
const char* LAPTOP_TELEMETRY_PATH = "/api/esp32/telemetry";

WebServer server(80);

// ============================================================
// OBJECTS
// ============================================================

MFRC522 rfid(SS_PIN, RST_PIN);
DHT dht(DHT_PIN, DHT_TYPE);
HX711 scale;

// ============================================================
// RFID
// ============================================================

byte cow1UID[] = {0xE3, 0x99, 0x55, 0x56};
bool cowScanned = false;
String currentCow = "";

// ============================================================
// HX711
// ============================================================

float calibration_factor = 1.0;

// ============================================================
// ADC
// ============================================================

#define ADC_MAX 4095.0
#define ADC_VOLTAGE 3.3

// ============================================================
// MILK EC CALIBRATION
// ============================================================

const float EC_CAL_V1 = 1.00;
const float EC_CAL_EC1 = 4.00;

const float EC_CAL_V2 = 1.70;
const float EC_CAL_EC2 = 6.58;

float voltageToEC(float voltage)
{
  float slope = (EC_CAL_EC2 - EC_CAL_EC1) /
                (EC_CAL_V2 - EC_CAL_V1);

  float offset = EC_CAL_EC1 - (slope * EC_CAL_V1);

  float ec = (slope * voltage) + offset;

  if (ec < 0)
    ec = 0;

  return ec;
}

// ============================================================
// DATASET RANGES
// ============================================================

// Conductivity (mS/cm)
const float EC_NORMAL_MAX = 5.23;
const float EC_RISK_MAX = 6.86;

// Milk temperature
const float MILK_TEMP_RISK_MIN = 36.99;
const float MILK_TEMP_HIGH_MIN = 38.00;

// Milk pH
const float PH_RISK_MIN = 6.70;
const float PH_HIGH_MIN = 7.00;

// Body temperature
const float BODY_TEMP_RISK_MIN = 38.49;
const float BODY_TEMP_HIGH_MIN = 39.14;

// Activity score
const float ACTIVITY_MEAN = 71.64;
const float ACTIVITY_HIGH_RISK = 49.20;

// Rumination
const float RUMINATION_MEAN = 401.68;
const float RUMINATION_HIGH_RISK = 264.80;

// Feeding
const float FEEDING_MEAN = 148.28;
const float FEEDING_HIGH_RISK = 108.00;

// Milk yield
const float MILK_YIELD_MEAN = 13.79;
const float MILK_YIELD_HIGH_RISK = 4.63;

// ============================================================
// LIVE SENSOR DATA
// ============================================================

float ax = 0;
float ay = 0;
float az = 0;

float gx = 0;
float gy = 0;
float gz = 0;

float mpuTemperature = NAN;

float bodyTemperature = NAN;
float humidity = NAN;

float milkConductivity = NAN;
String conductivityStatus = "UNAVAILABLE";

float milkPH = NAN;
String phStatus = "UNAVAILABLE";

float animalWeight = NAN;
float milkTemperature = NAN;
long somaticCellCount = 75000;
float somaticCellScore = 2.9;
float activityScore = NAN;
float ruminationMinutes = NAN;
float feedingMinutes = NAN;
float milkYieldLiters = NAN;

String mastitisRisk = "LOW";
int riskScore = 0;

// ============================================================
// TIMING
// ============================================================

unsigned long lastSensorRead = 0;
unsigned long lastTelemetryPost = 0;

const unsigned long SENSOR_INTERVAL_MS = 2000;
const unsigned long TELEMETRY_INTERVAL_MS = 2000;

// ============================================================
// ALARM VARIABLES
// HIGH RISK = ONLY 3 BLINKS
// ============================================================

int alarmCount = 0;

bool alarmRunning = false;
bool alarmState = false;

bool lastHighRisk = false;

unsigned long alarmTimer = 0;

const unsigned long ALARM_ON_TIME = 300;
const unsigned long ALARM_OFF_TIME = 300;

// ============================================================
// HELPERS
// ============================================================

String jsonNumber(float value, int decimals)
{
  if (isnan(value))
    return "null";

  return String(value, decimals);
}

void addCorsHeaders()
{
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );
}

// ============================================================
// RFID
// ============================================================

bool checkRFID()
{
  if (!rfid.PICC_IsNewCardPresent())
    return false;

  if (!rfid.PICC_ReadCardSerial())
    return false;

  bool cow1 = true;

  if (rfid.uid.size != 4)
  {
    cow1 = false;
  }
  else
  {
    for (byte i = 0; i < 4; i++)
    {
      if (rfid.uid.uidByte[i] != cow1UID[i])
      {
        cow1 = false;
        break;
      }
    }
  }

  if (cow1)
  {
    currentCow = "COW 1";
    cowScanned = true;

    Serial.println("COW 1 VERIFIED");
    Serial.println("Cow ID      : COW_001");
    Serial.println("RFID Status : VERIFIED");
  }
  else
  {
    cowScanned = false;
    currentCow = "";

    Serial.println("UNKNOWN RFID");
    Serial.println("RFID Status : NOT REGISTERED");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  return cow1;
}

// ============================================================
// MPU6050
// ============================================================

bool readMPU6050(
  float &outAx,
  float &outAy,
  float &outAz,
  float &outGx,
  float &outGy,
  float &outGz,
  float &outTemp
)
{
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B);

  byte error = Wire.endTransmission(false);

  if (error != 0)
    return false;

  Wire.requestFrom(MPU6050_ADDR, 14, true);

  if (Wire.available() != 14)
    return false;

  int16_t AcX = Wire.read() << 8 | Wire.read();
  int16_t AcY = Wire.read() << 8 | Wire.read();
  int16_t AcZ = Wire.read() << 8 | Wire.read();

  int16_t Temp = Wire.read() << 8 | Wire.read();

  int16_t GyX = Wire.read() << 8 | Wire.read();
  int16_t GyY = Wire.read() << 8 | Wire.read();
  int16_t GyZ = Wire.read() << 8 | Wire.read();

  outAx = AcX / 16384.0;
  outAy = AcY / 16384.0;
  outAz = AcZ / 16384.0;

  outGx = GyX / 131.0;
  outGy = GyY / 131.0;
  outGz = GyZ / 131.0;

  outTemp = (Temp / 340.0) + 36.53;

  return true;
}

// ============================================================
// MILK CONDUCTIVITY
// ============================================================

float readMilkConductivity()
{
  long total = 0;

  for (int i = 0; i < 20; i++)
  {
    total += analogRead(CONDUCTIVITY_PIN);
    delay(5);
  }

  float adcValue = total / 20.0;

  float voltage =
    (adcValue / ADC_MAX) * ADC_VOLTAGE;

  return voltageToEC(voltage);
}

String getMilkStatus(float conductivity)
{
  if (isnan(conductivity))
    return "UNAVAILABLE";

  if (conductivity < EC_NORMAL_MAX)
    return "LOW";

  else if (conductivity <= EC_RISK_MAX)
    return "MODERATE";

  return "HIGH";
}

// ============================================================
// MILK pH
// ============================================================

float readPH()
{
  long total = 0;

  for (int i = 0; i < 20; i++)
  {
    total += analogRead(PH_SENSOR_PIN);
    delay(5);
  }

  float adcValue = total / 20.0;

  float voltage =
    (adcValue / ADC_MAX) * ADC_VOLTAGE;

  float pH =
    7.0 + ((2.50 - voltage) / 0.18);

  if (pH < 0)
    pH = 0;

  if (pH > 14)
    pH = 14;

  return pH;
}

String getPHStatus(float pH)
{
  if (isnan(pH))
    return "UNAVAILABLE";

  if (pH < PH_RISK_MIN)
    return "LOW";

  else if (pH <= PH_HIGH_MIN)
    return "MODERATE";

  return "HIGH";
}

// ============================================================
// WEIGHT
// ============================================================

float readWeight()
{
  if (!scale.is_ready())
    return NAN;

  scale.set_scale(calibration_factor);

  return scale.get_units(1);
}

// ============================================================
// SOMATIC CELL COUNT (SCC) & SCORE (SCS) ESTIMATION
// ============================================================

long computeSCC(float ec, float pH, float milkTemp)
{
  if (isnan(ec) || ec <= 0) return 75000;

  float scs = 3.0;
  if (ec > 5.0) {
    scs += 1.8 * (ec - 5.0);
  }
  if (!isnan(pH) && pH > 6.65) {
    scs += 2.2 * (pH - 6.65);
  }
  if (!isnan(milkTemp) && milkTemp > 38.5) {
    scs += 1.2 * (milkTemp - 38.5);
  }

  if (scs < 1.5) scs = 1.5;
  if (scs > 9.5) scs = 9.5;

  long scc = (long)(100000.0 * pow(2.0, scs - 3.0));
  if (scc < 25000) scc = 25000;
  if (scc > 5000000) scc = 5000000;
  return scc;
}

float computeSCS(long scc)
{
  if (scc <= 12500) return 1.5;
  return 3.0 + (log((float)scc / 100000.0) / log(2.0));
}

// ============================================================
// RISK SCORING
// ============================================================

String predictMastitisRisk(
  float conductivity,
  float milkTemp,
  float pH,
  float bodyTemp,
  float activity,
  float rumination,
  float feeding,
  float milkYield,
  long scc,
  int &score
)
{
  score = 0;

  int availableFeatures = 0;

  // Somatic Cell Count (SCC)
  if (scc > 500000)
  {
    availableFeatures++;
    score += 2;
  }
  else if (scc > 200000)
  {
    availableFeatures++;
    score += 1;
  }

  // Conductivity
  if (!isnan(conductivity))
  {
    availableFeatures++;

    if (conductivity > EC_RISK_MAX)
      score += 2;

    else if (conductivity >= EC_NORMAL_MAX)
      score += 1;
  }

  // Milk temperature
  if (!isnan(milkTemp))
  {
    availableFeatures++;

    if (milkTemp >= MILK_TEMP_HIGH_MIN)
      score += 2;

    else if (milkTemp >= MILK_TEMP_RISK_MIN)
      score += 1;
  }

  // Milk pH
  if (!isnan(pH))
  {
    availableFeatures++;

    if (pH > PH_HIGH_MIN)
      score += 2;

    else if (pH >= PH_RISK_MIN)
      score += 1;
  }

  // Body temperature
  if (!isnan(bodyTemp))
  {
    availableFeatures++;

    if (bodyTemp > BODY_TEMP_HIGH_MIN)
      score += 2;

    else if (bodyTemp >= BODY_TEMP_RISK_MIN)
      score += 1;
  }

  // Activity
  if (!isnan(activity))
  {
    availableFeatures++;

    if (activity < ACTIVITY_HIGH_RISK)
      score += 2;

    else if (activity < ACTIVITY_MEAN)
      score += 1;
  }

  // Rumination
  if (!isnan(rumination))
  {
    availableFeatures++;

    if (rumination < RUMINATION_HIGH_RISK)
      score += 2;

    else if (rumination < RUMINATION_MEAN)
      score += 1;
  }

  // Feeding
  if (!isnan(feeding))
  {
    availableFeatures++;

    if (feeding < FEEDING_HIGH_RISK)
      score += 2;

    else if (feeding < FEEDING_MEAN)
      score += 1;
  }

  // Milk yield
  if (!isnan(milkYield))
  {
    availableFeatures++;

    if (milkYield < MILK_YIELD_HIGH_RISK)
      score += 2;

    else if (milkYield < MILK_YIELD_MEAN)
      score += 1;
  }

  if (availableFeatures == 0)
    return "LOW";

  if (score >= 4 || scc > 500000)
    return "HIGH";

  if (score >= 2 || scc > 200000)
    return "MODERATE";

  return "LOW";
}

// ============================================================
// ALARM
// HIGH RISK = 3 BLINKS ONLY
// ============================================================

void updateAlarm(String risk)
{
  // ----------------------------------------------------------
  // HIGH RISK DETECTED FOR THE FIRST TIME
  // ----------------------------------------------------------

  if (risk == "HIGH" && !lastHighRisk)
  {
    alarmRunning = true;

    alarmCount = 0;

    alarmState = false;

    alarmTimer = millis();

    lastHighRisk = true;

    Serial.println();
    Serial.println("!!! HIGH MASTITIS RISK !!!");
    Serial.println("Alarm started: 3 blinks");
  }

  // ----------------------------------------------------------
  // IF RISK IS NO LONGER HIGH
  // RESET ALARM
  // ----------------------------------------------------------

  if (risk != "HIGH")
  {
    lastHighRisk = false;

    alarmRunning = false;

    alarmCount = 0;

    alarmState = false;

    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);

    return;
  }

  // ----------------------------------------------------------
  // RUN 3-BLINK ALARM
  // ----------------------------------------------------------

  if (alarmRunning)
  {
    unsigned long now = millis();

    // Turn ON
    if (!alarmState &&
        (now - alarmTimer >= ALARM_OFF_TIME))
    {
      alarmTimer = now;

      alarmState = true;

      digitalWrite(LED_PIN, HIGH);
      digitalWrite(BUZZER_PIN, HIGH);
    }

    // Turn OFF
    else if (alarmState &&
             (now - alarmTimer >= ALARM_ON_TIME))
    {
      alarmTimer = now;

      alarmState = false;

      digitalWrite(LED_PIN, LOW);
      digitalWrite(BUZZER_PIN, LOW);

      alarmCount++;

      Serial.print("Alarm blink: ");
      Serial.println(alarmCount);

      // ------------------------------------------------------
      // STOP AFTER 3 BLINKS
      // ------------------------------------------------------

      if (alarmCount >= 3)
      {
        alarmRunning = false;

        digitalWrite(LED_PIN, LOW);
        digitalWrite(BUZZER_PIN, LOW);

        Serial.println("Alarm completed: 3 blinks");
        Serial.println("LED and buzzer OFF");
      }
    }
  }
}

// ============================================================
// JSON BUILDER
// ============================================================

String buildJSON()
{
  String json = "{";

  json += "\"cow_id\":\"COW_001\"";

  json += ",\"cow_name\":\"" +
          (currentCow.length() ? currentCow : "COW 1") +
          "\"";

  json += ",\"rfid_status\":\"" +
          String(cowScanned ? "VERIFIED" : "NOT_VERIFIED") +
          "\"";

  json += ",\"cowScanned\":" +
          String(cowScanned ? "true" : "false");

  json += ",\"rfidTag\":\"0xE3995556\"";

  // MPU
  json += ",\"acceleration_x\":" +
          jsonNumber(ax, 2);

  json += ",\"acceleration_y\":" +
          jsonNumber(ay, 2);

  json += ",\"acceleration_z\":" +
          jsonNumber(az, 2);

  json += ",\"gyroscope_x\":" +
          jsonNumber(gx, 2);

  json += ",\"gyroscope_y\":" +
          jsonNumber(gy, 2);

  json += ",\"gyroscope_z\":" +
          jsonNumber(gz, 2);

  json += ",\"mpu_temperature\":" +
          jsonNumber(mpuTemperature, 2);

  // Body / environment
  json += ",\"body_temperature\":" +
          jsonNumber(bodyTemperature, 2);

  json += ",\"temperature\":" +
          jsonNumber(bodyTemperature, 2);

  json += ",\"humidity\":" +
          jsonNumber(humidity, 2);

  // Milk measurements
  json += ",\"milk_temperature\":" +
          jsonNumber(milkTemperature, 2);

  json += ",\"milk_conductivity\":" +
          jsonNumber(milkConductivity, 2);

  json += ",\"milk_conductivity_unit\":\"mS/cm\"";

  json += ",\"conductivity_status\":\"" +
          conductivityStatus +
          "\"";

  json += ",\"milk_ph\":" +
          jsonNumber(milkPH, 2);

  json += ",\"ph_status\":\"" +
          phStatus +
          "\"";

  // Somatic Cell Count
  json += ",\"somatic_cell_count\":" +
          String(somaticCellCount);

  json += ",\"scc\":" +
          String(somaticCellCount);

  json += ",\"somatic_cell_score\":" +
          jsonNumber(somaticCellScore, 2);

  // Other features
  json += ",\"activity_score\":" +
          jsonNumber(activityScore, 2);

  json += ",\"rumination_min_per_day\":" +
          jsonNumber(ruminationMinutes, 2);

  json += ",\"feeding_min_per_day\":" +
          jsonNumber(feedingMinutes, 2);

  json += ",\"milk_yield_liters\":" +
          jsonNumber(milkYieldLiters, 2);

  // Weight
  json += ",\"weight\":" +
          jsonNumber(animalWeight, 2);

  json += ",\"weight_unit\":\"kg\"";

  // Risk
  json += ",\"mastitis_risk\":\"" +
          mastitisRisk +
          "\"";

  json += ",\"mastitis_risk_score\":" +
          String(riskScore);

  // Alarm
  json += ",\"red_led\":\"" +
          String(
            mastitisRisk == "HIGH"
            ? "3_BLINKS"
            : "OFF"
          ) +
          "\"";

  json += ",\"buzzer\":\"" +
          String(
            mastitisRisk == "HIGH"
            ? "3_BEEPS"
            : "OFF"
          ) +
          "\"";

  // WiFi
  json += ",\"esp32_ip\":\"" +
          WiFi.softAPIP().toString() +
          "\"";

  json += ",\"wifi_ssid\":\"" +
          String(WIFI_SSID) +
          "\"";

  json += ",\"timestamp_ms\":" +
          String(millis());

  json += "}";

  return json;
}

// ============================================================
// READ ALL SENSORS
// ============================================================

bool readSensors()
{
  if (!readMPU6050(
        ax,
        ay,
        az,
        gx,
        gy,
        gz,
        mpuTemperature))
  {
    Serial.println("ERROR: MPU6050 READ FAILED");

    return false;
  }

  // DHT22
  bodyTemperature = dht.readTemperature();

  humidity = dht.readHumidity();

  if (isnan(bodyTemperature) ||
      isnan(humidity))
  {
    Serial.println("ERROR: DHT22 READ FAILED");

    bodyTemperature = NAN;
    humidity = NAN;
  }

  // Conductivity
  milkConductivity =
    readMilkConductivity();

  conductivityStatus =
    getMilkStatus(milkConductivity);

  // pH
  milkPH = readPH();

  phStatus =
    getPHStatus(milkPH);

  // Weight
  animalWeight =
    readWeight();

  // Somatic Cell Count & Score calculation
  somaticCellCount =
    computeSCC(milkConductivity, milkPH, milkTemperature);

  somaticCellScore =
    computeSCS(somaticCellCount);

  // Risk prediction
  mastitisRisk =
    predictMastitisRisk(
      milkConductivity,
      milkTemperature,
      milkPH,
      bodyTemperature,
      activityScore,
      ruminationMinutes,
      feedingMinutes,
      milkYieldLiters,
      somaticCellCount,
      riskScore
    );

  // Update alarm
  updateAlarm(mastitisRisk);

  return true;
}

// ============================================================
// HTTP: GET /data
// ============================================================

void handleData()
{
  addCorsHeaders();

  String payload =
    buildJSON();

  server.send(
    200,
    "application/json",
    payload
  );
}

// ============================================================
// HTTP: GET /health
// ============================================================

void handleHealth()
{
  addCorsHeaders();

  server.send(
    200,
    "application/json",
    "{\"status\":\"ok\",\"device\":\"ESP32\",\"service\":\"MooTracker\"}"
  );
}

// ============================================================
// HTTP: GET /reset
// ============================================================

void handleReset()
{
  cowScanned = false;

  currentCow = "";

  updateAlarm("LOW");

  addCorsHeaders();

  server.send(
    200,
    "application/json",
    "{\"status\":\"reset\"}"
  );
}

// ============================================================
// HTTP: OPTIONS
// ============================================================

void handleOptions()
{
  addCorsHeaders();

  server.send(204);
}

// ============================================================
// POST TELEMETRY TO LAPTOP
// ============================================================

void postTelemetry()
{
  if (
    String(LAPTOP_IP).length() == 0 ||
    String(LAPTOP_IP) == "0.0.0.0"
  )
  {
    return;
  }

  if (WiFi.softAPgetStationNum() <= 0)
  {
    return;
  }

  HTTPClient http;

  String url =
    "http://" +
    String(LAPTOP_IP) +
    ":" +
    String(LAPTOP_PORT) +
    String(LAPTOP_TELEMETRY_PATH);

  http.begin(url);

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  String payload =
    buildJSON();

  int httpCode =
    http.POST(payload);

  Serial.print("Laptop POST -> ");

  Serial.print(url);

  Serial.print(" | HTTP ");

  Serial.println(httpCode);

  if (httpCode > 0)
  {
    String response =
      http.getString();

    Serial.println(
      "Server response: " +
      response
    );
  }

  http.end();
}

// ============================================================
// WIFI SETUP
// ============================================================

void setupWiFi()
{
  WiFi.mode(WIFI_AP);

  WiFi.softAPConfig(
    AP_IP,
    AP_GATEWAY,
    AP_SUBNET
  );

  bool apStarted =
    WiFi.softAP(
      WIFI_SSID,
      WIFI_PASSWORD
    );

  Serial.println();

  Serial.println(
    "========== ESP32 WIFI =========="
  );

  if (apStarted)
    Serial.println(
      "WiFi AP      : STARTED"
    );
  else
    Serial.println(
      "WiFi AP      : ERROR"
    );

  Serial.print("SSID         : ");

  Serial.println(WIFI_SSID);

  Serial.print("Password     : ");

  Serial.println(WIFI_PASSWORD);

  Serial.print("ESP32 IP     : ");

  Serial.println(
    WiFi.softAPIP()
  );

  Serial.print("Laptop IP    : ");

  Serial.println(LAPTOP_IP);

  Serial.println(
    "App API      : http://192.168.4.1/data"
  );

  Serial.println(
    "Health       : http://192.168.4.1/health"
  );

  Serial.println(
    "================================"
  );
}

// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  delay(1500);

  Serial.println();

  Serial.println(
    "======================================================"
  );

  Serial.println(
    "       ESP32 SMART ANIMAL MONITORING SYSTEM"
  );

  Serial.println(
    "             MASTITIS RISK VERSION"
  );

  Serial.println(
    "======================================================"
  );

  // ----------------------------------------------------------
  // LED + BUZZER
  // ----------------------------------------------------------

  pinMode(
    LED_PIN,
    OUTPUT
  );

  pinMode(
    BUZZER_PIN,
    OUTPUT
  );

  digitalWrite(
    LED_PIN,
    LOW
  );

  digitalWrite(
    BUZZER_PIN,
    LOW
  );

  // ----------------------------------------------------------
  // MPU6050
  // ----------------------------------------------------------

  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );

  Wire.setClock(100000);

  Wire.beginTransmission(
    MPU6050_ADDR
  );

  Wire.write(0x6B);

  Wire.write(0x00);

  byte mpuError =
    Wire.endTransmission();

  Serial.println(
    mpuError == 0
      ? "MPU6050       : CONNECTED"
      : "MPU6050       : ERROR"
  );

  // ----------------------------------------------------------
  // RC522
  // ----------------------------------------------------------

  SPI.begin(
    SCK_PIN,
    MISO_PIN,
    MOSI_PIN,
    SS_PIN
  );

  rfid.PCD_Init();

  delay(100);

  Serial.println(
    "RC522         : INITIALIZED"
  );

  // ----------------------------------------------------------
  // DHT22
  // ----------------------------------------------------------

  dht.begin();

  Serial.println(
    "DHT22         : INITIALIZED"
  );

  // ----------------------------------------------------------
  // ADC
  // ----------------------------------------------------------

  analogReadResolution(12);

  Serial.println(
    "Conductivity  : GPIO 34"
  );

  Serial.println(
    "Milk pH       : GPIO 35"
  );

  // ----------------------------------------------------------
  // HX711
  // ----------------------------------------------------------

  scale.begin(
    HX711_DOUT,
    HX711_SCK
  );

  if (
    scale.wait_ready_timeout(3000)
  )
  {
    Serial.println(
      "HX711         : CONNECTED"
    );

    delay(1000);

    scale.tare(10);

    Serial.println(
      "HX711 TARE    : COMPLETE"
    );
  }
  else
  {
    Serial.println(
      "HX711         : NOT FOUND"
    );

    Serial.println(
      "DT -> GPIO 13"
    );

    Serial.println(
      "SCK -> GPIO 14"
    );
  }

  // ----------------------------------------------------------
  // WIFI
  // ----------------------------------------------------------

  setupWiFi();

  // ----------------------------------------------------------
  // HTTP ROUTES
  // ----------------------------------------------------------

  server.on(
    "/data",
    HTTP_GET,
    handleData
  );

  server.on(
    "/health",
    HTTP_GET,
    handleHealth
  );

  server.on(
    "/reset",
    HTTP_GET,
    handleReset
  );

  server.on(
    "/data",
    HTTP_OPTIONS,
    handleOptions
  );

  server.on(
    "/health",
    HTTP_OPTIONS,
    handleOptions
  );

  server.on(
    "/reset",
    HTTP_OPTIONS,
    handleOptions
  );

  server.begin();

  Serial.println();

  Serial.println(
    "HTTP SERVER  : STARTED"
  );

  Serial.println(
    "Waiting for Cow RFID card..."
  );

  Serial.println();
}

// ============================================================
// MAIN LOOP
// ============================================================

void loop()
{
  // Handle web server
  server.handleClient();

  // ----------------------------------------------------------
  // RFID MUST BE SCANNED FIRST
  // ----------------------------------------------------------

  if (!cowScanned)
  {
    checkRFID();

    // Keep alarm OFF before RFID verification
    digitalWrite(
      LED_PIN,
      LOW
    );

    digitalWrite(
      BUZZER_PIN,
      LOW
    );

    delay(20);

    return;
  }

  unsigned long now =
    millis();

  // ----------------------------------------------------------
  // SENSOR UPDATE
  // ----------------------------------------------------------

  if (
    now - lastSensorRead >=
    SENSOR_INTERVAL_MS
  )
  {
    lastSensorRead = now;

    if (readSensors())
    {
      String payload =
        buildJSON();

      Serial.println();

      Serial.println(
        "======================================================"
      );

      Serial.println(
        "              COW MASTITIS MONITOR"
      );

      Serial.println(
        "======================================================"
      );

      Serial.println(
        "Cow ID       : COW_001"
      );

      Serial.println(
        "Cow Name     : " +
        currentCow
      );

      Serial.print(
        "Body Temp    : "
      );

      Serial.println(
        jsonNumber(
          bodyTemperature,
          2
        ) + " C"
      );

      Serial.print(
        "Milk EC      : "
      );

      Serial.println(
        jsonNumber(
          milkConductivity,
          2
        ) + " mS/cm"
      );

      Serial.print(
        "EC Status    : "
      );

      Serial.println(
        conductivityStatus
      );

      Serial.print(
        "Milk pH      : "
      );

      Serial.println(
        jsonNumber(
          milkPH,
          2
        )
      );

      Serial.print(
        "pH Status    : "
      );

      Serial.println(
        phStatus
      );

      Serial.print(
        "Weight       : "
      );

      Serial.println(
        jsonNumber(
          animalWeight,
          2
        ) + " kg"
      );

      Serial.print(
        "Risk Score   : "
      );

      Serial.println(
        riskScore
      );

      Serial.print(
        "Risk Level   : "
      );

      Serial.println(
        mastitisRisk
      );

      Serial.print(
        "Alarm        : "
      );

      if (mastitisRisk == "HIGH")
      {
        Serial.println(
          "3 BLINKS + 3 BEEPS"
        );
      }
      else
      {
        Serial.println(
          "OFF"
        );
      }

      Serial.println(
        "JSON:"
      );

      Serial.println(
        payload
      );

      Serial.println(
        "======================================================"
      );
    }
  }

  // ----------------------------------------------------------
  // PUSH TELEMETRY TO LAPTOP
  // ----------------------------------------------------------

  if (
    now - lastTelemetryPost >=
    TELEMETRY_INTERVAL_MS
  )
  {
    lastTelemetryPost = now;

    postTelemetry();
  }

  // ----------------------------------------------------------
  // KEEP ALARM SEQUENCE RUNNING
  // ----------------------------------------------------------

  updateAlarm(mastitisRisk);

  delay(5);
}
