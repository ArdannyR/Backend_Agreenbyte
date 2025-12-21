#include <WiFi.h>
#include <HTTPClient.h>

// 1. TUS CREDENCIALES DE WIFI
const char* ssid = "Netlife-Flia Rodriguez";
const char* password = "@ardannyrv@";

// 2. LA DIRECCIÓN DE TU SERVIDOR (OJO: No uses localhost)
// Debes buscar la IP local de tu computadora (ej. 192.168.1.15)
// Asegúrate de poner el puerto correcto (tu backend dice 4000 en index.js)
const char* serverUrl = "http://192.168.100.96:4000/api/huertos/actualizar-datos";

// 3. EL CÓDIGO DE TU DISPOSITIVO (Debe coincidir con el que registraste en la web)
String codigoDispositivo = "SENSOR-ESP32-001";

// Variables simuladas (aquí leerías tus sensores reales DHT11/DHT22)
float temperatura = 0.0;
float humedad = 0.0;

void setup() {
  Serial.begin(115200);

  // Conectar al WiFi
  WiFi.begin(ssid, password);
  Serial.println("Conectando a WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("¡WiFi conectado!");
  Serial.println("IP del dispositivo: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Simulación de datos (esto subirá poco a poco)
  temperatura = 20.0 + (random(0, 100) / 10.0); 
  humedad = 50.0 + (random(0, 100) / 10.0);

  // Verificar conexión WiFi antes de enviar
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // Iniciar conexión al destino
    http.begin(serverUrl);
    
    // Especificar cabeceras
    http.addHeader("Content-Type", "application/json");

    // Crear el JSON (Payload) manualmente
    // OJO: Las comillas dentro del string deben escaparse con \"
    String requestBody = "{\"codigoDispositivo\":\"" + codigoDispositivo + "\",\"temperatura\":" + String(temperatura) + ",\"humedad\":" + String(humedad) + "}";

    Serial.println("Enviando datos: " + requestBody);

    // Enviar petición POST
    int httpResponseCode = http.POST(requestBody);

    if(httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Código de respuesta: " + String(httpResponseCode));
      Serial.println("Respuesta del servidor: " + response);
    } else {
      Serial.print("Error enviando POST: ");
      Serial.println(httpResponseCode);
    }

    // Liberar recursos
    http.end();
  } else {
    Serial.println("WiFi Desconectado");
  }

  // Esperar 10 segundos antes del próximo envío
  delay(10000);
}