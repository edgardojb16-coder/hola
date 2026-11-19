import os
import zipfile
import sys

def create_android_zip(output_path="/tmp/algoritmo-zl-android-studio.zip"):
    # Base directory is workspace root
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    android_dir = os.path.join(base_dir, "android")

    if not os.path.exists(android_dir):
        print(f"Error: {android_dir} does not exist", file=sys.stderr)
        sys.exit(1)

    print(f"Creating zip at {output_path} from {android_dir}...")
    
    # We will include:
    # 1. Everything inside /android
    # 2. capacitor.config.ts
    # 3. package.json
    # 4. A comprehensive Spanish instruction guide: INSTRUCCIONES_PUBLICAR_PLAY_STORE.md
    
    guide_content = """# Guía Paso a Paso para Publicar Algoritmo ZL en Google Play Store

¡Felicidades! Este archivo contiene el proyecto completo y nativo de Android Studio para **Algoritmo ZL** (`com.algoritmozl.app`), con toda la interfaz sincronizada y lista para generar tu aplicación.

---

## 📋 Requisitos Previos

1. **Android Studio**: Descárgalo gratis desde [developer.android.com/studio](https://developer.android.com/studio) (para Windows, Mac o Linux).
2. **Cuenta de Desarrollador de Google Play**:
   - Ingresa en [play.google.com/console/signup](https://play.google.com/console/signup).
   - Realiza el pago único de registro ($25 USD) que solicita Google.

---

## 🚀 Paso 1: Abrir el Proyecto en Android Studio

1. Descomprime este archivo `.zip` en tu computadora (por ejemplo en tu carpeta de Documentos o Escritorio).
2. Abre **Android Studio**.
3. Haz clic en **Open** (Abrir) y selecciona la carpeta **`android`** que viene dentro de este archivo descomprimido.
4. Espera a que Android Studio termine de sincronizar los archivos de Gradle (verás una barra de progreso abajo a la derecha).

---

## 📱 Paso 2: Probar la App en tu Celular o Emulador

1. Conecta tu teléfono Android a la computadora con cable USB con la *Depuración USB* activada (o usa el emulador de Android Studio).
2. En la barra superior de Android Studio, haz clic en el botón verde de **Play (Run 'app')** ▶️.
3. ¡La aplicación se instalará y abrirá directamente en tu teléfono!

---

## 🔑 Paso 3: Generar el Archivo para Google Play (.aab)

Google Play Store exige que las aplicaciones se suban en formato **Android App Bundle (.aab)** firmado digitalmente:

1. En el menú superior de Android Studio ve a:
   **Build** > **Generate Signed Bundle / APK...**
2. Selecciona **Android App Bundle** y haz clic en **Next**.
3. En **Key store path**, si es tu primera vez:
   - Haz clic en **Create new...**
   - Elige una ubicación para guardar tu llave secreta (ej. `mi-llave-algoritmo.jks`) y crea una contraseña que recuerdes.
   - Llena tu nombre o alias y haz clic en **OK**.
4. Haz clic en **Next**.
5. Selecciona la variante **release**.
6. Haz clic en **Create** (o Finish).
7. Android Studio compilará tu archivo final `.aab` (quedará guardado en `app/release/app-release.aab`).

---

## 🌐 Paso 4: Subir la App a Google Play Console

1. Entra a [Google Play Console](https://play.google.com/console).
2. Haz clic en el botón **Crear aplicación**.
   - Nombre: **Algoritmo ZL**
   - Idioma predeterminado: Español
   - Tipo de app: Aplicación
   - Gratuita o de pago: Gratuita
3. Completa la ficha de la tienda:
   - **Descripción corta**: Algoritmo ZL y números del día para sorteos SEA, Loto Nica y Tiempos Tica.
   - **Ícono**: Imagen de 512x512 píxeles (PNG).
   - **Gráfico de funciones**: Imagen de 1024x500 píxeles.
   - **Capturas de pantalla**: Toma 2 o 3 fotos de la app funcionando.
4. Ve al menú **Producción** (o Pruebas internas) > **Crear nueva versión**.
5. Sube el archivo `app-release.aab` que generaste en el Paso 3.
6. Haz clic en **Revisar e iniciar lanzamiento a producción**.

¡Listo! En unas horas o pocos días, el equipo de Google Play revisará y aprobará tu aplicación, y estará disponible para millones de personas en Google Play Store.
"""

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Include instructions at root of zip
        zipf.writestr("INSTRUCCIONES_PUBLICAR_PLAY_STORE.md", guide_content)
        
        # Include capacitor.config.ts and package.json if present
        for extra_file in ["capacitor.config.ts", "package.json"]:
            full_p = os.path.join(base_dir, extra_file)
            if os.path.exists(full_p):
                zipf.write(full_p, arcname=extra_file)

        # Walk /android directory
        for root, dirs, files in os.walk(android_dir):
            # Ignore cache, build, .gradle, .idea directories
            dirs[:] = [d for d in dirs if d not in ['.gradle', '.idea', 'build', '.cxx']]
            for file in files:
                if file.endswith(('.hprof', '.log', '.tmp')):
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, base_dir)
                zipf.write(file_path, arcname=rel_path)

    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Zip created successfully: {output_path} ({file_size_mb:.2f} MB)")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/algoritmo-zl-android-studio.zip"
    create_android_zip(out)
