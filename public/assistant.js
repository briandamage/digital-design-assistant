// Digital Design Assist
// https://knowitexperience.com/work/oslo-identity 


import ('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
// import ('https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.1/jspdf.umd.min.js');
import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'); 
import ('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/5.0.2/jspdf.plugin.autotable.min.js');

// --- Start Fetching JSON ---
let tokens = {}; // Initialize tokens as an empty object
let uploadedImage = null; // Variable für das geladene Bild-Objekt
let isImageLoading = false; // Flag, um zu prüfen, ob ein Bild gerade lädt

async function loadTokens() {
  try {
    const response = await fetch('./tokens.json'); // Fetch the JSON file
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    tokens = await response.json(); // Parse the JSON response
    console.log('Tokens loaded:', tokens);
    // Now that tokens are loaded, you might want to enable UI or run initial setup
    // For example, enable the generate button if it starts disabled
    // c('#generate').disabled = false; // If it starts disabled
  } catch (error) {
    console.error("Could not load tokens.json:", error);
    // Handle the error appropriately - maybe show a message to the user
    alert("Error loading configuration. Please try again later.");
  }
}
// --- End Fetching JSON ---

loadTokens();

console.log("tokens", tokens);

// --- Start Image Handling ---
function handleImageUpload(event) {
  const file = event.target.files[0];
  const imagePreview = c('#imagePreview');
  uploadedImage = null; // Reset previous image
  isImageLoading = false;
  imagePreview.style.display = 'none'; // Hide preview initially
  c('#generate').disabled = true; // Disable generate while processing

  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    isImageLoading = true;

    reader.onload = (e) => {
      // Bild-Vorschau anzeigen
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';

      // Image-Objekt für Canvas erstellen
      uploadedImage = new Image();
      uploadedImage.onload = () => {
        console.log('Image loaded successfully for drawing.');
        isImageLoading = false;
        checkIfReadyToGenerate(); // Prüfen, ob Generierung jetzt möglich ist
      };
      uploadedImage.onerror = () => {
        console.error('Error loading image into Image object.');
        alert('Das Bild konnte nicht für die Verarbeitung geladen werden.');
        uploadedImage = null;
        isImageLoading = false;
        checkIfReadyToGenerate(); // Auch bei Fehler prüfen
      };
      uploadedImage.src = e.target.result; // Startet das Laden des Image-Objekts
    };

    reader.onerror = () => {
      console.error('Error reading file.');
      alert('Die Bilddatei konnte nicht gelesen werden.');
      isImageLoading = false;
      checkIfReadyToGenerate();
    };

    reader.readAsDataURL(file); // Liest die Datei als Data URL
  } else if (file) {
    alert('Bitte wählen Sie eine gültige Bilddatei aus.');
    checkIfReadyToGenerate(); // Auch wenn keine gültige Datei gewählt wurde
  } else {
     // Keine Datei ausgewählt (z.B. Dialog abgebrochen)
     checkIfReadyToGenerate();
  }
}
// --- End Image Handling ---

// --- Hilfsfunktionen ---
const c = sel => document.querySelector(sel);
const dpi = window.devicePixelRatio || 1;

function setupCanvas(canvas, w, h) {
  if (!canvas) {
      console.error(`Canvas element not found for setup (w:${w}, h:${h})`);
      return null;
  }
  canvas.width = w * dpi;
  canvas.height = h * dpi;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  // Wichtig: Skalieren, damit Koordinaten wieder den logischen w/h entsprechen
  ctx.scale(dpi, dpi);
  return ctx;
}

// --- Zeichenlogik (erweitert um Bild) ---
function drawLayout(ctx, cfg, image) { // Nimmt jetzt 'image' als Parameter
  const { w, h, theme, t, text, sub } = cfg;

  // 0. Hintergrund
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, h);

  // NEU: Bild zeichnen (Beispiel: Füllt die untere Hälfte)
  if (image && image.complete && image.naturalWidth !== 0) {
    try {
      // Beispiel: Bild in untere Hälfte einpassen, Seitenverhältnis beibehalten (cover)
      const targetRatio = w / (h * 0.5); // Ziel-Ratio (Breite zu halber Höhe)
      const imageRatio = image.naturalWidth / image.naturalHeight;
      let sourceX = 0, sourceY = 0, sourceWidth = image.naturalWidth, sourceHeight = image.naturalHeight;
      let drawX = 0, drawY = h * 0.5, drawWidth = w, drawHeight = h * 0.5;

      if (imageRatio > targetRatio) { // Bild ist breiter als Zielbereich
        sourceWidth = image.naturalHeight * targetRatio;
        sourceX = (image.naturalWidth - sourceWidth) / 2;
      } else { // Bild ist höher als Zielbereich (oder gleich)
        sourceHeight = image.naturalWidth / targetRatio;
        sourceY = (image.naturalHeight - sourceHeight) / 2;
      }
      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, // Source rect
                           drawX, drawY, drawWidth, drawHeight);       // Destination rect
    } catch (e) {
        console.error("Error drawing image:", e);
        // Fallback, falls beim Zeichnen etwas schiefgeht
        ctx.fillStyle = 'rgba(255,0,0,0.5)'; // Roter Hinweis
        ctx.fillRect(0, h * 0.5, w, h * 0.5);
        ctx.fillStyle = 'white';
        ctx.fillText("Bildfehler", 10, h * 0.75);
    }

  } else if (isImageLoading) {
      // Optional: Platzhalter anzeigen, während das Bild lädt
      ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
      ctx.fillRect(0, h * 0.5, w, h * 0.5);
      ctx.fillStyle = 'black';
      ctx.font = `${w*0.03}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText("Bild lädt...", w/2, h * 0.75);
      ctx.textAlign = 'left'; // Reset alignment
  }


  // 1. Dekor-Shape (inspiriert von Oslo-Shapes) - Evtl. über dem Bild?
  ctx.fillStyle = theme.shape;
  // Beispiel: Position leicht angepasst, damit es nicht direkt am Bildrand klebt
  ctx.fillRect(w * 0.05, h * 0.05, w * 0.15, w * 0.15);

  // 2. Titel
  ctx.fillStyle = theme.fg;
  // Fallback-Font, falls tokens.font nicht geladen ist
  const fontName = tokens.font || 'sans-serif';
  ctx.font = `${t.fontSize}px "${fontName}"`;
  // Position evtl. anpassen, wenn Bild vorhanden ist (hier: bleibt gleich)
  ctx.fillText(text, w * 0.1, h * 0.25); // Leicht nach links verschoben

  // 3. Subtitle
  if (sub) {
    ctx.font = `${t.subSize}px "${fontName}"`;
    ctx.fillText(sub, w * 0.1, h * 0.25 + t.fontSize * 1.4); // Leicht nach links verschoben
  }
}

// --- Generierungs- und Download-Funktionen ---
function generate() {
  if (isImageLoading) {
      alert("Bitte warten Sie, bis das Bild vollständig geladen ist.");
      return;
  }
  if (!tokens || Object.keys(tokens).length === 0) {
      alert("Konfiguration (tokens.json) noch nicht geladen. Bitte warten.");
      return;
  }

  const title = c('#title').value || 'Titel';
  const subtitle = c('#subtitle').value;
  const themeKey = c('#theme').value;

  // Sicherer Zugriff auf Theme mit Fallback
  const theme = (tokens.themes && tokens.themes[themeKey])
                 ? tokens.themes[themeKey]
                 : { bg: '#cccccc', fg: '#000000', shape: '#999999' }; // Default theme

  const layouts = [
    { id: 'poster', w: 794, h: 1123 }, // A4 @96 dpi (logische Pixel)
    { id: 'post', w: 1080, h: 1080 }, // IG-Post
    { id: 'banner', w: 1920, h: 1080 } // 16:9
  ];

  layouts.forEach(l => {
    const canvas = c('#' + l.id);
    if (!canvas) {
        console.error(`Canvas mit ID #${l.id} nicht gefunden.`);
        return; // Skip if canvas doesn't exist
    }
    const ctx = setupCanvas(canvas, l.w, l.h);
    if (!ctx) return; // Skip if context couldn't be created

    // Wichtig: Übergebe das 'uploadedImage' an drawLayout
    drawLayout(ctx, {
      ...l, theme,
      t: { fontSize: l.w * 0.08, subSize: l.w * 0.04 },
      text: title, sub: subtitle
    }, uploadedImage); // <--- HIER WIRD DAS BILD ÜBERGEBEN
  });

  c('#download').disabled = false; // Download erst nach Generierung ermöglichen
}

function download() {
  // Sicherstellen, dass die Bibliotheken geladen sind (vereinfachte Prüfung)
  if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
      alert('Download-Bibliotheken sind noch nicht bereit. Bitte kurz warten und erneut versuchen.');
      console.error('html2canvas or jspdf not loaded');
      return;
  }
  const { jsPDF } = jspdf; // Zugriff auf die Klasse über das globale Objekt

  const previewElement = c('#preview');
  if (!previewElement) {
      console.error("Preview element #preview not found.");
      alert("Vorschau-Element für den Download nicht gefunden.");
      return;
  }

  // Optionen für html2canvas (optional, z.B. um Skalierung zu verbessern)
  const options = {
      scale: dpi, // Verwende die Geräte-Pixel-Ratio für bessere Qualität
      useCORS: true // Falls Bilder von anderen Domains geladen werden (hier nicht der Fall)
  };


  html2canvas(previewElement, options).then(canvas => {
    // PNG Download
    const imgData = canvas.toDataURL('image/png');
    const pngLink = document.createElement('a');
    pngLink.href = imgData;
    pngLink.download = 'brand-preview.png';
    pngLink.click();

    // PDF Download
    // Beachte: Die Canvas-Dimensionen sind jetzt durch 'scale' größer
    const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p', // l=landscape, p=portrait
        unit: 'px',
        format: [canvas.width, canvas.height]
    });
    // Füge das Bild hinzu, skaliert auf die PDF-Größe
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('brand-layouts.pdf');

  }).catch(error => {
      console.error("Error during canvas/PDF generation:", error);
      alert("Ein Fehler ist beim Erstellen der Download-Dateien aufgetreten.");
  });
}

// --- Initialisierung und Event Listener ---

// Funktion, um zu prüfen, ob alles bereit ist zum Generieren
function checkIfReadyToGenerate() {
    const generateButton = c('#generate');
    if (!generateButton) return; // Button noch nicht im DOM

    // Bereit, wenn Tokens geladen sind UND kein Bild gerade lädt
    const ready = tokens && Object.keys(tokens).length > 0 && !isImageLoading;
    generateButton.disabled = !ready;
    if (ready) {
        console.log("Ready to generate.");
        // Optional: Automatisch generieren, wenn alles bereit ist
        // generate();
    } else {
        console.log("Not ready to generate yet.", { hasTokens: !!tokens, isImgLoading: isImageLoading });
    }
}


// Warten, bis das HTML geladen ist, bevor Elemente gesucht werden
document.addEventListener('DOMContentLoaded', () => {
    const generateButton = c('#generate');
    const downloadButton = c('#download');
    const imageUploadInput = c('#imageUpload');

    if (generateButton) {
        generateButton.addEventListener('click', generate);
        generateButton.disabled = true; // Starte deaktiviert
    } else {
        console.error("Generate button #generate not found.");
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', download);
        downloadButton.disabled = true; // Starte deaktiviert
    } else {
        console.error("Download button #download not found.");
    }

    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', handleImageUpload);
    } else {
        console.error("Image upload input #imageUpload not found.");
    }

    // Lade die Tokens, nachdem die Listener eingerichtet sind
    loadTokens(); // Startet das Laden der Konfiguration
});